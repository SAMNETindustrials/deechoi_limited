'use client'

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Save,
} from 'lucide-react'

import CertificateEditor, {
  DEFAULT_DESIGN,
  DesignElement,
} from '@/components/admin/certificate-editor'
/*
 * ================================================================
 * STUDENT TYPE
 * ================================================================
 */

interface Student {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  course: string
  training_date: string | null
  completion_date: string | null
  certificate_serial: string | null
  certificate_issued: boolean
  certificate_issued_at: string | null
  certificate_design?: DesignElement[] | null
  created_at: string
}

/*
 * ================================================================
 * FORM
 * ================================================================
 */

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  course: '',
  training_date: '',
  completion_date: '',
}

/*
 * ================================================================
 * DATE FORMATTER
 * ================================================================
 */

const formatDate = (value: string | null) => {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/*
 * ================================================================
 * CERTIFICATE SERIAL
 * ================================================================
 */

const generateSerial = () => {
  const year = new Date().getFullYear()

  const random = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()

  return `DE-TRN-${year}-${random}`
}

/*
 * ================================================================
 * PAGE
 * ================================================================
 */

export default function AdminTrainingPage() {
  const router = useRouter()
  const supabase = createClient()

  /*
   * ==============================================================
   * STATE
   * ==============================================================
   */

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [students, setStudents] =
    useState<Student[]>([])

  const [searchQuery, setSearchQuery] =
    useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [form, setForm] =
    useState(emptyForm)

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null)

  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  /*
   * Certificate editor state
   */

  const [editPreview, setEditPreview] =
    useState(false)

  const [design, setDesign] =
    useState<DesignElement[]>(DEFAULT_DESIGN)

  const [savingDesign, setSavingDesign] = useState(false)

  /*
   * ==============================================================
   * LOAD STUDENTS
   * ==============================================================
   */

  const loadStudents = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      router.push('/admin/login')
      return
    }

    const { data, error } = await supabase
      .from('training_students')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      setMessage({
        type: 'error',
        text: `Could not load students: ${error.message}`,
      })
    } else {
      setStudents((data || []) as Student[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadStudents()
  }, [])

  /*
   * ==============================================================
   * SEARCH
   * ==============================================================
   */

  const filteredStudents = useMemo(() => {
    const q = searchQuery
      .trim()
      .toLowerCase()

    if (!q) return students

    return students.filter((student) =>
      [
        student.full_name,
        student.email,
        student.phone,
        student.course,
        student.certificate_serial,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [students, searchQuery])

  /*
   * ==============================================================
   * STATISTICS
   * ==============================================================
   */

  const issuedCount = students.filter(
    (student) =>
      student.certificate_issued
  ).length

  const pendingCount =
    students.length - issuedCount

  /*
   * ==============================================================
   * ADD STUDENT
   * ==============================================================
   */

  const handleAddStudent = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setSaving(true)
    setMessage(null)

    const { data, error } =
      await supabase
        .from('training_students')
        .insert({
          full_name:
            form.full_name.trim(),

          email:
            form.email.trim() || null,

          phone:
            form.phone.trim() || null,

          course:
            form.course.trim(),

          training_date:
            form.training_date || null,

          completion_date:
            form.completion_date || null,

          certificate_issued:
            false,
        })
        .select()
        .single()

    setSaving(false)

    if (error) {
      setMessage({
        type: 'error',
        text: `Could not register student: ${error.message}`,
      })

      return
    }

    setStudents((current) => [
      data as Student,
      ...current,
    ])

    setForm(emptyForm)

    setShowForm(false)

    setMessage({
      type: 'success',
      text: `${data.full_name} has been registered.`,
    })
  }

  /*
   * ==============================================================
   * DELETE STUDENT
   * ==============================================================
   */

  const handleDeleteStudent = async (
    student: Student
  ) => {
    const confirmed = confirm(
      `Delete ${student.full_name} from the training records? This cannot be undone.`
    )

    if (!confirmed) return

    const { error } =
      await supabase
        .from('training_students')
        .delete()
        .eq('id', student.id)

    if (error) {
      setMessage({
        type: 'error',
        text: `Could not delete student: ${error.message}`,
      })

      return
    }

    setStudents((current) =>
      current.filter(
        (item) =>
          item.id !== student.id
      )
    )

    if (
      selectedStudent?.id ===
      student.id
    ) {
      setSelectedStudent(null)
    }

    setMessage({
      type: 'success',
      text: `${student.full_name} was deleted.`,
    })
  }

  /*
   * ==============================================================
   * ISSUE CERTIFICATE
   * ==============================================================
   */

  const issueCertificate = async (
    student: Student
  ): Promise<Student | null> => {
    let serial =
      student.certificate_serial

    /*
     * ------------------------------------------------------------
     * No serial yet
     * ------------------------------------------------------------
     */

    if (!serial) {
      serial = generateSerial()

      const { data, error } =
        await supabase
          .from('training_students')
          .update({
            certificate_serial:
              serial,

            certificate_issued:
              true,

            certificate_issued_at:
              new Date().toISOString(),

            completion_date:
              student.completion_date ||
              new Date()
                .toISOString()
                .slice(0, 10),
          })
          .eq('id', student.id)
          .select()
          .single()

      if (error) {
        setMessage({
          type: 'error',
          text: `Could not issue certificate: ${error.message}`,
        })

        return null
      }

      const updatedStudent =
        data as Student

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? updatedStudent
            : item
        )
      )

      student = updatedStudent
    }

    /*
     * ------------------------------------------------------------
     * Serial exists but certificate is pending
     * ------------------------------------------------------------
     */

    else if (
      !student.certificate_issued
    ) {
      const { data, error } =
        await supabase
          .from('training_students')
          .update({
            certificate_issued:
              true,

            certificate_issued_at:
              new Date().toISOString(),

            completion_date:
              student.completion_date ||
              new Date()
                .toISOString()
                .slice(0, 10),
          })
          .eq('id', student.id)
          .select()
          .single()

      if (error) {
        setMessage({
          type: 'error',
          text: `Could not issue certificate: ${error.message}`,
        })

        return null
      }

      const updatedStudent =
        data as Student

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? updatedStudent
            : item
        )
      )

      student = updatedStudent
    }

    /*
     * ------------------------------------------------------------
     * Select student
     * ------------------------------------------------------------
     */

    setSelectedStudent(student)

    /*
     * ------------------------------------------------------------
     * Load saved custom design or fallback to default
     * while keeping student-specific data updated
     * ------------------------------------------------------------
     */

    const baseDesign = student.certificate_design && student.certificate_design.length > 0
      ? student.certificate_design
      : DEFAULT_DESIGN

    setDesign(
      baseDesign.map(
        (element) => {
          if (
            element.key ===
            'student'
          ) {
            return {
              ...element,
              text:
                student.full_name,
            }
          }

          if (
            element.key ===
            'course'
          ) {
            return {
              ...element,
              text:
                student.course,
            }
          }

          if (
            element.key ===
            'serial'
          ) {
            return {
              ...element,
              text:
                student.certificate_serial ||
                '',
            }
          }

          if (
            element.key ===
            'date'
          ) {
            return {
              ...element,
              text:
                formatDate(
                  student.completion_date
                ),
            }
          }

          return {
            ...element,
          }
        }
      )
    )

    setMessage({
      type: 'success',
      text: `Certificate ${student.certificate_serial} is ready for ${student.full_name}.`,
    })

    return student
  }

  /*
   * ==============================================================
   * SAVE CUSTOM CERTIFICATE DESIGN TO DATABASE
   * ==============================================================
   */

  const saveStudentCertificateDesign = async () => {
    if (!selectedStudent) return

    setSavingDesign(true)
    setMessage(null)

    const { data, error } = await supabase
      .from('training_students')
      .update({
        certificate_design: design,
      })
      .eq('id', selectedStudent.id)
      .select()
      .single()

    setSavingDesign(false)

    if (error) {
      setMessage({
        type: 'error',
        text: `Could not save certificate design: ${error.message}`,
      })
      return
    }

    const updatedStudent = data as Student
    setSelectedStudent(updatedStudent)
    setStudents((current) =>
      current.map((item) => (item.id === updatedStudent.id ? updatedStudent : item))
    )

    setMessage({
      type: 'success',
      text: `Custom certificate layout for ${updatedStudent.full_name} saved successfully!`,
    })
  }

  /*
   * ==============================================================
   * OPEN CERTIFICATE PREVIEW
   * ==============================================================
   */

  const openCertificatePreview = async (
    student: Student
  ) => {
    const issuedStudent =
      await issueCertificate(student)

    if (!issuedStudent) return

    setSelectedStudent(
      issuedStudent
    )

    setEditPreview(false)
  }

  /*
   * ==============================================================
   * PRINT
   * ==============================================================
   */

  const printCertificate = () => {
    if (
      !selectedStudent
        ?.certificate_serial
    ) {
      return
    }

    setEditPreview(false)

    setTimeout(() => {
      window.print()
    }, 250)
  }

  /*
   * ==============================================================
   * VERIFICATION URL
   * ==============================================================
   */

  const verificationUrl =
    typeof window !== 'undefined' &&
    selectedStudent?.certificate_serial
      ? `${window.location.origin}/verify-certificate?serial=${encodeURIComponent(
          selectedStudent.certificate_serial
        )}`
      : ''

  /*
   * ==============================================================
   * LOADING SCREEN
   * ==============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2E1D] to-[#072215]">
        <div className="flex flex-col items-center gap-3 text-[#EAA823]">
          <Loader2 className="w-8 h-8 animate-spin" />

          <p className="font-bold text-sm">
            Loading Training Academy...
          </p>
        </div>
      </div>
    )
  }

  /*
   * ==============================================================
   * MAIN PAGE
   * ==============================================================
   */

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      {/* ========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-30 border-b border-[#EAA823]/20 bg-gradient-to-r from-[#1a1f2e] to-[#131821]">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl hover:bg-[#EAA823]/10 text-gray-300 hover:text-[#EAA823] transition"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <h1 className="font-black text-lg truncate">
                Training Academy
              </h1>

              <p className="text-xs text-gray-400 truncate">
                Students, completion records & certificate management
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setShowForm(true)
            }
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#EAA823] to-[#f5d547] px-4 py-2.5 text-xs font-black text-[#0A2E1D] shadow-lg hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" />

            Register Student
          </button>
        </div>
      </header>

      {/* ========================================================
          MAIN
      ========================================================= */}

      <main className="max-w-[1500px] mx-auto px-4 md:px-8 py-8">
        {/* ======================================================
            MESSAGE
        ======================================================= */}

        {message && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm flex items-center justify-between ${
              message.type ===
              'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span>
              {message.text}
            </span>

            <button
              onClick={() =>
                setMessage(null)
              }
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            STATISTICS
        ======================================================= */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Registered */}

          <div className="rounded-3xl p-5 border border-blue-500/20 bg-gradient-to-br from-[#17243b] to-[#131821]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Registered Students
              </span>

              <Users className="w-5 h-5 text-blue-400" />
            </div>

            <p className="text-3xl font-black mt-4">
              {students.length}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              All training records
            </p>
          </div>

          {/* Issued */}

          <div className="rounded-3xl p-5 border border-emerald-500/20 bg-gradient-to-br from-[#13281f] to-[#131821]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Certificates Issued
              </span>

              <Award className="w-5 h-5 text-emerald-400" />
            </div>

            <p className="text-3xl font-black mt-4">
              {issuedCount}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Original De-echoi certificates
            </p>
          </div>

          {/* Pending */}

          <div className="rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-br from-[#2a2416] to-[#131821]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Awaiting Certificate
              </span>

              <ShieldCheck className="w-5 h-5 text-[#EAA823]" />
            </div>

            <p className="text-3xl font-black mt-4">
              {pendingCount}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Students not yet issued
            </p>
          </div>
        </section>

        {/* ======================================================
            STUDENTS
        ======================================================= */}

        <section className="rounded-3xl border border-[#EAA823]/20 bg-gradient-to-br from-[#1a1f2e] to-[#131821] shadow-2xl overflow-hidden">
          <div className="p-5 md:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-base">
                Registered Students
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Manage trainees and generate verifiable certificates.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 w-full md:w-80">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search student, course or serial..."
                className="bg-transparent outline-none text-xs w-full placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-4">
                    Student
                  </th>

                  <th className="px-5 py-4">
                    Course
                  </th>

                  <th className="px-5 py-4">
                    Training
                  </th>

                  <th className="px-5 py-4">
                    Certificate
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredStudents.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-sm text-gray-500"
                    >
                      {students.length ===
                      0
                        ? 'No students registered yet.'
                        : 'No students match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-white/[0.025] transition"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 border border-blue-400/20 flex items-center justify-center font-black text-blue-300">
                              {student.full_name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-bold text-sm">
                                {
                                  student.full_name
                                }
                              </p>

                              <p className="text-[11px] text-gray-500">
                                {student.email ||
                                  student.phone ||
                                  'No contact supplied'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-gray-300">
                          {student.course}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-bold">
                            {formatDate(
                              student.training_date
                            )}
                          </p>

                          <p className="text-[10px] text-gray-500">
                            Completed:{' '}
                            {formatDate(
                              student.completion_date
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {student.certificate_issued ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3 h-3" />

                                Issued
                              </span>

                              <p className="font-mono text-[10px] text-[#EAA823] mt-1">
                                {
                                  student.certificate_serial
                                }
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-1 text-[10px] font-black uppercase">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                openCertificatePreview(
                                  student
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAA823] text-[#0A2E1D] px-3 py-2 text-[10px] font-black hover:bg-amber-300 transition"
                            >
                              {student.certificate_issued ? (
                                <Printer className="w-3.5 h-3.5" />
                              ) : (
                                <Award className="w-3.5 h-3.5" />
                              )}

                              {student.certificate_issued
                                ? 'Preview'
                                : 'Generate'}
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteStudent(
                                  student
                                )
                              }
                              className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition"
                              title="Delete student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======================================================
            INFORMATION
        ======================================================= */}

        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-xs text-blue-200">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />

          <p>
            Every issued certificate receives a unique
            certificate serial number and a square QR
            verification code. The QR code opens the
            public De-echoi certificate verification page
            with the certificate serial number pre-filled.
          </p>
        </div>
      </main>

      {/* ========================================================
          REGISTER STUDENT MODAL
      ========================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#EAA823]/25 bg-[#151b23] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="font-black">
                  Register Training Student
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Create a trainee record before issuing
                  a certificate.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="p-2 rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={handleAddStudent}
              className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Name */}

              <label className="md:col-span-2">
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Full Name *
                </span>

                <input
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                  placeholder="Student full name"
                />
              </label>

              {/* Email */}

              <label>
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Email
                </span>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                  placeholder="student@example.com"
                />
              </label>

              {/* Phone */}

              <label>
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Phone
                </span>

                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                  placeholder="+234..."
                />
              </label>

              {/* Course */}

              <label className="md:col-span-2">
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Training / Course *
                </span>

                <input
                  required
                  value={form.course}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      course:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                  placeholder="e.g. Digital Marketing Fundamentals"
                />
              </label>

              {/* Training date */}

              <label>
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Training Date
                </span>

                <input
                  type="date"
                  value={
                    form.training_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      training_date:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                />
              </label>

              {/* Completion date */}

              <label>
                <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">
                  Completion Date
                </span>

                <input
                  type="date"
                  value={
                    form.completion_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      completion_date:
                        e.target.value,
                    })
                  }
                  className="field w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-xs outline-none focus:border-[#EAA823]"
                />
              </label>

              <div className="md:col-span-2 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#EAA823] px-5 py-2.5 text-xs font-black text-[#0A2E1D] hover:bg-amber-300 transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CERTIFICATE PREVIEW / EDITOR MODAL
      ========================================================= */}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1200px] w-full mx-auto bg-[#151b23] border border-[#EAA823]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1a1f2e]">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#EAA823]" />
                  Certificate Manager: {selectedStudent.full_name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Serial: <span className="font-mono text-[#EAA823]">{selectedStudent.certificate_serial}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={saveStudentCertificateDesign}
                  disabled={savingDesign}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  title="Save current custom layout for this student permanently"
                >
                  {savingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Layout
                </button>

                <button
                  onClick={() => setEditPreview(!editPreview)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold hover:bg-white/10 transition"
                >
                  {editPreview ? 'View Preview' : 'Customize Design'}
                </button>

                <button
                  onClick={printCertificate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAA823] px-4 py-2 text-xs font-black text-[#0A2E1D] hover:bg-amber-300 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Editor Component */}
            <div className="p-6 bg-black/40 flex justify-center overflow-x-auto">
              <CertificateEditor
                design={design}
                setDesign={setDesign}
                previewMode={!editPreview}
                studentName={selectedStudent.full_name}
                courseName={selectedStudent.course}
                serialNumber={selectedStudent.certificate_serial || ''}
                completionDate={formatDate(selectedStudent.completion_date)}
                verificationUrl={verificationUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}