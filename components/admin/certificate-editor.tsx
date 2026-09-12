'use client'

import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import {
  Move,
  Printer,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  X,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Plus,
  Star,
  Circle,
  MinusSquare,
  Globe,
  Share2,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Palette,
  Video,
  Save,
  Github,
  MessageSquare,
  Send,
  Camera,
  Music,
  Tv,
  Hash,
  Bookmark,
  Code2,
  MessageCircle,
  Disc,
  Shapes,
  ChevronDown
} from 'lucide-react'

export type DesignKey =
  | 'logo'
  | 'title'
  | 'subtitle'
  | 'presented'
  | 'student'
  | 'studentLine'
  | 'course'
  | 'description'
  | 'signature'
  | 'signatureLine'
  | 'stamp'
  | 'serial'
  | 'qr'
  | 'rightTitle'
  | 'rightBody'
  | 'seal'
  | 'date'
  | 'dateLine'
  | string

export interface DesignElement {
  id?: string
  key: DesignKey
  label: string
  type?: 'text' | 'line' | 'star' | 'circle' | 'social' | 'image' | 'icon'
  iconName?: 
    | 'globe' 
    | 'linkedin' 
    | 'twitter' 
    | 'facebook' 
    | 'instagram' 
    | 'youtube' 
    | 'tiktok' 
    | 'email'
    | 'github'
    | 'discord'
    | 'telegram'
    | 'whatsapp'
    | 'twitch'
    | 'slack'
    | 'reddit'
    | 'pinterest'
    | 'snapchat'
    | 'spotify'
    | 'medium'
    | 'dribbble'
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  text?: string
  editable?: boolean
}

export interface CertificateDesignSchema {
  version: string
  updatedAt: string
  elements: DesignElement[]
}

export const DEFAULT_DESIGN: DesignElement[] = [
  {
    key: 'logo',
    label: 'De-echoi Company Logo',
    type: 'image',
    x: 21,
    y: 5.5,
    width: 26,
    height: 13,
  },
  {
    key: 'title',
    label: 'Certificate Title',
    type: 'text',
    x: 6,
    y: 19.5,
    width: 60,
    height: 10,
    fontSize: 44,
    fontFamily: 'serif',
    fontWeight: '800',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#0A2E1D',
    text: 'CERTIFICATE',
    editable: true,
  },
  {
    key: 'subtitle',
    label: 'Certificate Subtitle',
    type: 'text',
    x: 14,
    y: 30,
    width: 44,
    height: 6,
    fontSize: 16,
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#12422C',
    text: 'OF EXCELLENCE & APPRECIATION',
    editable: true,
  },
  {
    key: 'presented',
    label: 'Presented Text',
    type: 'text',
    x: 14,
    y: 39,
    width: 44,
    height: 5,
    fontSize: 11,
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#222222',
    text: 'This official credential is proudly presented to',
    editable: true,
  },
  {
    key: 'student',
    label: 'Recipient Name',
    type: 'text',
    x: 10,
    y: 44.5,
    width: 52,
    height: 9,
    fontSize: 38,
    fontFamily: 'cursive',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    textColor: '#0A2E1D',
    text: 'Name Surname',
    editable: true,
  },
  {
    key: 'studentLine',
    label: 'Recipient Underline',
    type: 'line',
    x: 10,
    y: 54.2,
    width: 52,
    height: 1,
    text: '',
  },
  {
    key: 'course',
    label: 'Company / Course',
    type: 'text',
    x: 16,
    y: 57,
    width: 40,
    height: 5,
    fontSize: 11,
    fontFamily: 'sans-serif',
    fontWeight: '900',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#0A2E1D',
    text: 'DE-ECHOI LIMITED ENTERPRISE',
    editable: true,
  },
  {
    key: 'description',
    label: 'Certificate Description',
    type: 'text',
    x: 8,
    y: 64.5,
    width: 56,
    height: 15,
    fontSize: 10,
    fontFamily: 'sans-serif',
    fontWeight: '500',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#262626',
    text:
      'Awarded in high recognition of outstanding commitment, exceptional leadership, and successful mastery of professional standards at De-echoi Limited. This certification officially acknowledges dedicated performance, creative contribution, and verified excellence throughout the designated programme.',
    editable: true,
  },
  {
    key: 'signature',
    label: 'Signature Text',
    type: 'text',
    x: 21,
    y: 82,
    width: 26,
    height: 6,
    fontSize: 9,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'center',
    textColor: '#0A2E1D',
    text: 'AUTHORIZED EXECUTIVE SIGNATURE',
    editable: true,
  },
  {
    key: 'signatureLine',
    label: 'Signature Underline',
    type: 'line',
    x: 21,
    y: 81,
    width: 26,
    height: 1,
    text: '',
  },
  {
    key: 'stamp',
    label: 'De-echoi Stamp',
    type: 'image',
    x: 49,
    y: 77.5,
    width: 14,
    height: 14,
  },
  {
    key: 'serial',
    label: 'Certificate Serial',
    type: 'text',
    x: 8,
    y: 94,
    width: 32,
    height: 4,
    fontSize: 7,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: '#0A2E1D',
    text: 'DE-ECHOI-2026-REG99',
    editable: true,
  },
  {
    key: 'qr',
    label: 'Verification QR',
    type: 'image',
    x: 75,
    y: 67,
    width: 18,
    height: 22,
  },
  {
    key: 'rightTitle',
    label: 'Right Panel Title',
    type: 'text',
    x: 72,
    y: 57,
    width: 24,
    height: 6,
    fontSize: 12,
    fontFamily: 'sans-serif',
    fontWeight: '900',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: '#EAA823',
    text: 'VERIFIED BRAND AWARD',
    editable: true,
  },
  {
    key: 'rightBody',
    label: 'Right Panel Details',
    type: 'text',
    x: 72,
    y: 64,
    width: 24,
    height: 20,
    fontSize: 8,
    fontFamily: 'sans-serif',
    fontWeight: '500',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: '#f0f4f1',
    text:
      'De-echoi Limited champions corporate excellence, precision engineering, and elite service delivery. This secure credential certifies official validation, authenticity, and verified participation in our premier enterprise curriculum.',
    editable: true,
  },
  {
    key: 'seal',
    label: 'Award Seal',
    type: 'image',
    x: 74,
    y: 32,
    width: 20,
    height: 23,
  },
  {
    key: 'date',
    label: 'Completion Date Text',
    type: 'text',
    x: 75,
    y: 91,
    width: 18,
    height: 4,
    fontSize: 8,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: '#fef9e7',
    text: '11 SEP 2026',
    editable: true,
  },
  {
    key: 'dateLine',
    label: 'Date Underline',
    type: 'line',
    x: 75,
    y: 95.5,
    width: 18,
    height: 1,
    text: '',
  },
  {
    key: 'socialHandles',
    label: 'Social Media Handles',
    type: 'social',
    x: 35,
    y: 95,
    width: 30,
    height: 4,
    fontSize: 7,
    textColor: '#0A2E1D',
    text: '@deechoilimited | www.de-echoi.com',
    editable: true,
  },
]

interface CertificateEditorProps {
  studentName?: string
  courseName?: string
  serialNumber?: string
  completionDate?: string
  verificationUrl?: string
  onPrint?: () => void
  design?: DesignElement[]
  setDesign?: React.Dispatch<React.SetStateAction<DesignElement[]>>
  previewMode?: boolean
}

export default function CertificateEditor({
  studentName = 'Name Surname',
  courseName = 'DE-ECHOI LIMITED ENTERPRISE',
  serialNumber = 'DE-ECHOI-2026-REG99',
  completionDate = '11 Sep 2026',
  verificationUrl = 'https://de-echoi.com/verify-certificate',
  onPrint,
  design: externalDesign,
  setDesign: externalSetDesign,
  previewMode = false,
}: CertificateEditorProps) {
  const SCHEMA_STORAGE_KEY = 'de_echoi_certificate_design_schema_v2'

  const [internalDesign, setInternalDesign] = useState<DesignElement[]>(() => {
    if (typeof window !== 'undefined') {
      const savedSchemaRaw = localStorage.getItem(SCHEMA_STORAGE_KEY)
      if (savedSchemaRaw) {
        try {
          const parsedSchema: CertificateDesignSchema = JSON.parse(savedSchemaRaw)
          if (parsedSchema && Array.isArray(parsedSchema.elements)) {
            return parsedSchema.elements
          }
        } catch (e) {
          console.error('Failed to parse certificate design schema from localStorage', e)
        }
      }
    }
    return DEFAULT_DESIGN
  })

  const design = externalDesign || internalDesign
  const setDesign = externalSetDesign || setInternalDesign

  const [editPreview, setEditPreview] = useState(!previewMode)
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Hover/Click Popover States for Base Icons
  const [showSocialDropdown, setShowSocialDropdown] = useState(false)
  const [showShapeDropdown, setShowShapeDropdown] = useState(false)

  const [stampImage, setStampImage] = useState<string | null>(null)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)

  const stampInputRef = useRef<HTMLInputElement | null>(null)
  const signatureInputRef = useRef<HTMLInputElement | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const certificateCanvasRef = useRef<HTMLDivElement | null>(null)

  const draggingRef = useRef<{
    key: string
    startX: number
    startY: number
    startElementX: number
    startElementY: number
  } | null>(null)

  useEffect(() => {
    setEditPreview(!previewMode)
  }, [previewMode])

  // Save layout and elements schema permanently to localStorage
  const saveLayoutSchema = () => {
    if (typeof window !== 'undefined') {
      const schemaData: CertificateDesignSchema = {
        version: '2.0',
        updatedAt: new Date().toISOString(),
        elements: design,
      }
      localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schemaData))
      setSaveStatus('Schema Saved Successfully!')
      setTimeout(() => setSaveStatus(null), 2500)
    }
  }

  useEffect(() => {
    setDesign((current) =>
      current.map((element) => {
        if (element.key === 'student') {
          return { ...element, text: studentName }
        }
        if (element.key === 'course') {
          return { ...element, text: courseName }
        }
        if (element.key === 'serial') {
          return { ...element, text: serialNumber }
        }
        if (element.key === 'date') {
          return { ...element, text: completionDate }
        }
        return element
      })
    )
  }, [studentName, courseName, serialNumber, completionDate, setDesign])

  const updateDesignElement = (
    key: string,
    changes: Partial<DesignElement>
  ) => {
    setDesign((current) =>
      current.map((element) =>
        (element.key === key || element.id === key) ? { ...element, ...changes } : element
      )
    )
  }

  const deleteDesignElement = (key: string) => {
    setDesign((current) => current.filter((element) => element.key !== key && element.id !== key))
    setSelectedElementKey(null)
  }

  const resetDesign = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SCHEMA_STORAGE_KEY)
    }
    setDesign(DEFAULT_DESIGN)
    setSelectedElementKey(null)
    setSaveStatus('Layout Reset to Default!')
    setTimeout(() => setSaveStatus(null), 2500)
  }

  const addCustomElement = (type: 'text' | 'line' | 'star' | 'circle') => {
    const newId = `custom_${Date.now()}`
    const newElement: DesignElement = {
      id: newId,
      key: newId,
      label: `New ${type.toUpperCase()}`,
      type,
      x: 40,
      y: 40,
      width: type === 'line' ? 20 : type === 'text' ? 25 : 8,
      height: type === 'line' ? 1 : type === 'text' ? 5 : 8,
      fontSize: 12,
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      textColor: '#0A2E1D',
      text: type === 'text' ? 'New Text Item' : '',
      editable: true,
    }
    setDesign((current) => [...current, newElement])
    setSelectedElementKey(newId)
    setShowShapeDropdown(false)
  }

  const addSocialIconElement = (
    iconName: DesignElement['iconName'],
    label: string
  ) => {
    const newId = `icon_${Date.now()}`
    const newElement: DesignElement = {
      id: newId,
      key: newId,
      label: `${label} Icon`,
      type: 'icon',
      iconName,
      x: 45,
      y: 90,
      width: 4,
      height: 5,
      editable: true,
    }
    setDesign((current) => [...current, newElement])
    setSelectedElementKey(newId)
    setShowSocialDropdown(false)
  }

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'stamp' | 'signature' | 'logo'
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Please select a valid image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (type === 'stamp') setStampImage(reader.result)
        if (type === 'signature') setSignatureImage(reader.result)
        if (type === 'logo') setLogoImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    element: DesignElement
  ) => {
    if (!editPreview) return
    event.preventDefault()
    event.stopPropagation()

    const identifier = element.id || element.key
    setSelectedElementKey(identifier)

    const canvas = certificateCanvasRef.current
    if (!canvas) return

    draggingRef.current = {
      key: identifier,
      startX: event.clientX,
      startY: event.clientY,
      startElementX: element.x,
      startElementY: element.y,
    }
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = draggingRef.current
      const canvas = certificateCanvasRef.current
      if (!drag || !canvas || !editPreview) return

      const rect = canvas.getBoundingClientRect()
      const deltaX = ((event.clientX - drag.startX) / rect.width) * 100
      const deltaY = ((event.clientY - drag.startY) / rect.height) * 100

      const newX = Math.max(-5, Math.min(98, drag.startElementX + deltaX))
      const newY = Math.max(-5, Math.min(98, drag.startElementY + deltaY))

      updateDesignElement(drag.key, {
        x: Number(newX.toFixed(2)),
        y: Number(newY.toFixed(2)),
      })
    }

    const handlePointerUp = () => {
      draggingRef.current = null
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [editPreview])

  const getElementStyle = (
    element: DesignElement
  ): React.CSSProperties => {
    return {
      left: `${element.x}%`,
      top: `${element.y}%`,
      width: `${element.width}%`,
      height: `${element.height}%`,
    }
  }

  const selectedElement = design.find((el) => (el.id || el.key) === selectedElementKey)

  return (
    <div className="w-full space-y-4">
      {/* ============================================================
          MAIN TOP TOOLBAR & ELEMENTS / SOCIAL ICONS MENU
      ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-900/20 bg-white p-3 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditPreview((current) => !current)
              if (editPreview) setSelectedElementKey(null)
            }}
            className={
              editPreview
                ? 'flex items-center gap-2 rounded-lg bg-[#0A2E1D] px-3 py-2 text-xs font-bold text-white shadow'
                : 'flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-200'
            }
          >
            <Move className="h-3.5 w-3.5" />
            {editPreview ? 'Lock Layout / Editing Active' : 'Enable Drag & Customize'}
          </button>

          <button
            type="button"
            onClick={saveLayoutSchema}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
            title="Save custom layout schema permanently"
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes Schema
          </button>

          {saveStatus && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded animate-pulse">
              {saveStatus}
            </span>
          )}

          <button
            type="button"
            onClick={onPrint || (() => window.print())}
            className="flex items-center gap-2 rounded-lg bg-[#0A2E1D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#12422C]"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Export PDF
          </button>

          <button
            type="button"
            onClick={resetDesign}
            className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </button>

          {/* Add Shapes Base Icon Dropdown (Hover/Click to populate shapes) */}
          <div 
            className="relative"
            onMouseEnter={() => setShowShapeDropdown(true)}
            onMouseLeave={() => setShowShapeDropdown(false)}
          >
            <button
              type="button"
              onClick={() => setShowShapeDropdown(!showShapeDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 shadow-sm"
            >
              <Shapes className="w-4 h-4 text-emerald-700" />
              <span>Shapes</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showShapeDropdown && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-xl border border-emerald-900/20 bg-white p-2 shadow-xl flex flex-col gap-1.5 animate-in fade-in duration-150">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-2 py-0.5 border-b border-neutral-100">Add Shape / Element</span>
                <button
                  type="button"
                  onClick={() => addCustomElement('text')}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/60 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 text-left"
                >
                  <Type className="w-3.5 h-3.5 text-emerald-700" /> Text Item
                </button>
                <button
                  type="button"
                  onClick={() => addCustomElement('line')}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/60 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 text-left"
                >
                  <MinusSquare className="w-3.5 h-3.5 text-emerald-700" /> Line Shape
                </button>
                <button
                  type="button"
                  onClick={() => addCustomElement('star')}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/60 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 text-left"
                >
                  <Star className="w-3.5 h-3.5 text-emerald-700" /> Star Shape
                </button>
                <button
                  type="button"
                  onClick={() => addCustomElement('circle')}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/60 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 text-left"
                >
                  <Circle className="w-3.5 h-3.5 text-emerald-700" /> Circle Shape
                </button>
              </div>
            )}
          </div>

          {/* Social Icons Base Icon Dropdown (Hover/Click to populate 20+ social icons including TikTok) */}
          <div 
            className="relative"
            onMouseEnter={() => setShowSocialDropdown(true)}
            onMouseLeave={() => setShowSocialDropdown(false)}
          >
            <button
              type="button"
              onClick={() => setShowSocialDropdown(!showSocialDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-[#0A2E1D] text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200 shadow-sm"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Social Icons (20+)</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSocialDropdown && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-emerald-900/20 bg-white p-3 shadow-xl grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                <div className="col-span-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 pb-1 border-b border-neutral-100">
                  Select Social Icon to Add
                </div>
                <button type="button" onClick={() => addSocialIconElement('globe', 'Website')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Globe className="w-3.5 h-3.5 text-emerald-700" /> Website</button>
                <button type="button" onClick={() => addSocialIconElement('linkedin', 'LinkedIn')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Linkedin className="w-3.5 h-3.5 text-emerald-700" /> LinkedIn</button>
                <button type="button" onClick={() => addSocialIconElement('twitter', 'Twitter/X')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Twitter className="w-3.5 h-3.5 text-emerald-700" /> Twitter/X</button>
                <button type="button" onClick={() => addSocialIconElement('instagram', 'Instagram')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Instagram className="w-3.5 h-3.5 text-emerald-700" /> Instagram</button>
                <button type="button" onClick={() => addSocialIconElement('facebook', 'Facebook')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Facebook className="w-3.5 h-3.5 text-emerald-700" /> Facebook</button>
                <button type="button" onClick={() => addSocialIconElement('youtube', 'YouTube')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Youtube className="w-3.5 h-3.5 text-emerald-700" /> YouTube</button>
                <button type="button" onClick={() => addSocialIconElement('tiktok', 'TikTok')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Video className="w-3.5 h-3.5 text-emerald-700" /> TikTok</button>
                <button type="button" onClick={() => addSocialIconElement('email', 'Email')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Mail className="w-3.5 h-3.5 text-emerald-700" /> Email</button>
                <button type="button" onClick={() => addSocialIconElement('github', 'GitHub')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Github className="w-3.5 h-3.5 text-emerald-700" /> GitHub</button>
                <button type="button" onClick={() => addSocialIconElement('discord', 'Discord')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> Discord</button>
                <button type="button" onClick={() => addSocialIconElement('telegram', 'Telegram')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Send className="w-3.5 h-3.5 text-emerald-700" /> Telegram</button>
                <button type="button" onClick={() => addSocialIconElement('whatsapp', 'WhatsApp')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><MessageCircle className="w-3.5 h-3.5 text-emerald-700" /> WhatsApp</button>
                <button type="button" onClick={() => addSocialIconElement('twitch', 'Twitch')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Tv className="w-3.5 h-3.5 text-emerald-700" /> Twitch</button>
                <button type="button" onClick={() => addSocialIconElement('slack', 'Slack')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Hash className="w-3.5 h-3.5 text-emerald-700" /> Slack</button>
                <button type="button" onClick={() => addSocialIconElement('reddit', 'Reddit')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Bookmark className="w-3.5 h-3.5 text-emerald-700" /> Reddit</button>
                <button type="button" onClick={() => addSocialIconElement('pinterest', 'Pinterest')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Camera className="w-3.5 h-3.5 text-emerald-700" /> Pinterest</button>
                <button type="button" onClick={() => addSocialIconElement('snapchat', 'Snapchat')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Disc className="w-3.5 h-3.5 text-emerald-700" /> Snapchat</button>
                <button type="button" onClick={() => addSocialIconElement('spotify', 'Spotify')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Music className="w-3.5 h-3.5 text-emerald-700" /> Spotify</button>
                <button type="button" onClick={() => addSocialIconElement('medium', 'Medium')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Type className="w-3.5 h-3.5 text-emerald-700" /> Medium</button>
                <button type="button" onClick={() => addSocialIconElement('dribbble', 'Dribbble')} className="flex items-center gap-2 p-1.5 bg-emerald-50/50 hover:bg-emerald-100 rounded text-xs font-semibold text-[#0A2E1D]"><Code2 className="w-3.5 h-3.5 text-emerald-700" /> Dribbble</button>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
          <input ref={stampInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleImageUpload(e, 'stamp')} className="hidden" />
          <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleImageUpload(e, 'signature')} className="hidden" />

          <button type="button" onClick={() => logoInputRef.current?.click()} className="px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded hover:bg-neutral-200">Logo</button>
          <button type="button" onClick={() => stampInputRef.current?.click()} className="px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded hover:bg-neutral-200">Stamp</button>
          <button type="button" onClick={() => signatureInputRef.current?.click()} className="px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded hover:bg-neutral-200">Signature</button>

          {logoImage && <button type="button" onClick={() => setLogoImage(null)} className="text-red-600 text-[11px] font-bold">Clear Logo</button>}
          {stampImage && <button type="button" onClick={() => setStampImage(null)} className="text-red-600 text-[11px] font-bold">Clear Stamp</button>}
          {signatureImage && <button type="button" onClick={() => setSignatureImage(null)} className="text-red-600 text-[11px] font-bold">Clear Sig</button>}
        </div>
      </div>

      {/* ============================================================
          POPUP INSPECTOR CARD FOR SELECTED ELEMENT (INCLUDING TEXT COLOR)
      ============================================================ */}
      {editPreview && selectedElement && (
        <div className="relative rounded-xl border-2 border-[#0A2E1D] bg-[#f8faf9] p-4 shadow-xl print:hidden space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#0A2E1D]">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Editing Element: <span className="underline">{selectedElement.label}</span></span>
            </div>
            <div className="flex items-center gap-2">
              {selectedElement.id && (
                <button
                  type="button"
                  onClick={() => deleteDesignElement(selectedElement.id || selectedElement.key)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-[11px] font-bold hover:bg-red-200"
                >
                  Delete Item
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedElementKey(null)}
                className="text-gray-400 hover:text-neutral-800 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {selectedElement.text !== undefined && (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">Text Content / Handles:</label>
                <input
                  type="text"
                  value={selectedElement.text}
                  onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { text: e.target.value })}
                  className="w-full bg-white border border-emerald-900/30 rounded-lg px-3 py-1.5 font-medium text-neutral-900 shadow-sm"
                />
              </div>
            )}

            {selectedElement.fontFamily !== undefined && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Font Family:</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { fontFamily: e.target.value })}
                  className="w-full bg-white border border-emerald-900/30 rounded-lg px-3 py-1.5 font-medium text-neutral-900 shadow-sm"
                >
                  <option value="serif">Serif / Classic</option>
                  <option value="sans-serif">Sans-Serif / Clean</option>
                  <option value="cursive">Cursive / Script</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
            )}

            {selectedElement.fontSize !== undefined && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Font Size: <span className="font-mono text-emerald-800 font-bold">{selectedElement.fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="90"
                  value={selectedElement.fontSize}
                  onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { fontSize: Number(e.target.value) })}
                  className="w-full accent-[#0A2E1D]"
                />
              </div>
            )}

            {/* Text Color Picker */}
            {selectedElement.textColor !== undefined && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-emerald-700" /> Text Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.textColor}
                    onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { textColor: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={selectedElement.textColor}
                    onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { textColor: e.target.value })}
                    className="w-20 bg-white border border-emerald-900/30 rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Width Size: <span className="font-mono text-emerald-800 font-bold">{selectedElement.width}%</span>
              </label>
              <input
                type="range"
                min="2"
                max="90"
                value={selectedElement.width}
                onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { width: Number(e.target.value) })}
                className="w-full accent-[#0A2E1D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Height Size: <span className="font-mono text-emerald-800 font-bold">{selectedElement.height}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={selectedElement.height}
                onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { height: Number(e.target.value) })}
                className="w-full accent-[#0A2E1D]"
              />
            </div>

            {selectedElement.fontWeight !== undefined && (
              <div className="flex items-center gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Style:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateDesignElement(selectedElement.key || selectedElement.id!, { fontWeight: selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === '800' || selectedElement.fontWeight === '900' ? 'normal' : 'bold' })}
                      className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1 ${selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === '800' || selectedElement.fontWeight === '900' ? 'bg-[#0A2E1D] text-white border-[#0A2E1D]' : 'bg-white text-neutral-700 border-neutral-300'}`}
                    >
                      <Bold className="w-3.5 h-3.5" /> Bold
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDesignElement(selectedElement.key || selectedElement.id!, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      className={`px-2.5 py-1.5 rounded-lg border italic flex items-center gap-1 ${selectedElement.fontStyle === 'italic' ? 'bg-[#0A2E1D] text-white border-[#0A2E1D]' : 'bg-white text-neutral-700 border-neutral-300'}`}
                    >
                      <Italic className="w-3.5 h-3.5" /> Italic
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Position X: <span className="font-mono text-emerald-800">{selectedElement.x}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="95"
                value={selectedElement.x}
                onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { x: Number(e.target.value) })}
                className="w-full accent-[#0A2E1D]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Position Y: <span className="font-mono text-emerald-800">{selectedElement.y}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="95"
                value={selectedElement.y}
                onChange={(e) => updateDesignElement(selectedElement.key || selectedElement.id!, { y: Number(e.target.value) })}
                className="w-full accent-[#0A2E1D]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CERTIFICATE PREVIEW CANVAS
      ============================================================ */}
      <div className="flex w-full justify-center overflow-auto rounded-xl bg-[#0A2E1D]/20 p-4 sm:p-6 lg:p-8 print:bg-white print:p-0">
        <div
          ref={certificateCanvasRef}
          className="certificate-sheet relative aspect-[1.414/1] w-full max-w-[1120px] overflow-hidden bg-[#fdfcf8] text-neutral-900 shadow-[0_15px_40px_rgba(10,46,29,0.25)] print:max-w-none print:shadow-none"
        >
          {/* Background Layer */}
          <div className="pointer-events-none absolute inset-0 bg-[#fdfcf8]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                'repeating-radial-gradient(ellipse at 20% 20%, transparent 0px, transparent 7px, rgba(10,46,29,.15) 8px, transparent 9px, transparent 15px)',
            }}
          />

          {/* Right Royal Green Panel */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[30%] bg-[#0A2E1D]" />

          {/* Inner Border Frame */}
          <div className="pointer-events-none absolute inset-[2.2%] z-40 border border-[#0A2E1D]/80" />

          {/* Gold Ribbons */}
          <div className="pointer-events-none absolute right-[8.2%] top-0 z-10 h-[37%] w-[1.05%] bg-gradient-to-r from-[#9d6b22] via-[#EAA823] to-[#a87328]" />
          <div className="pointer-events-none absolute right-[13.7%] top-0 z-10 h-[37%] w-[1.05%] bg-gradient-to-r from-[#9d6b22] via-[#EAA823] to-[#a87328]" />
          <div className="pointer-events-none absolute right-[19.1%] top-0 z-10 h-[37%] w-[1.05%] bg-gradient-to-r from-[#9d6b22] via-[#EAA823] to-[#a87328]" />

          {/* ========================================================
              DESIGN ELEMENTS MAPPING
          ======================================================== */}

          {design.map((element) => {
            const positionStyle = getElementStyle(element)
            const identifier = element.id || element.key
            const isSelected = selectedElementKey === identifier

            /* LOGO ELEMENT */
            if (element.key === 'logo') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-25 flex items-center justify-center cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40 shadow-md'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/60 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  {logoImage ? (
                    <img
                      src={logoImage}
                      alt="De-echoi Company Logo"
                      className="h-full w-full object-contain pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 pointer-events-none w-full h-full">
                      <div className="relative h-10 w-10 shrink-0 flex items-center justify-center bg-[#0A2E1D] rounded-full shadow-md">
                        <span className="text-[#EAA823] font-bold text-base">D</span>
                      </div>
                      <div className="leading-tight">
                        <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#0A2E1D]">
                          De-echoi
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#EAA823]">
                          Limited
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            /* STAMP ELEMENT */
            if (element.key === 'stamp') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-30 flex items-center justify-center cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40 shadow-md'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/60 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  {stampImage ? (
                    <img
                      src={stampImage}
                      alt="De-echoi official stamp"
                      className="h-full w-full object-contain opacity-90 pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="relative flex aspect-square w-[85%] items-center justify-center rounded-full border-[3px] border-dashed border-[#0A2E1D]/60 p-1 pointer-events-none">
                      <div className="flex h-[82%] w-[82%] items-center justify-center rounded-full border border-[#0A2E1D]/60 bg-emerald-50/40">
                        <div className="text-center text-[7px] font-extrabold uppercase tracking-[0.08em] text-[#0A2E1D] sm:text-[8px]">
                          <div>DE-ECHOI</div>
                          <div className="mt-0.5 text-[6px] text-[#EAA823]">OFFICIAL</div>
                          <div className="text-[6px]">APPROVED</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            /* QR CODE ELEMENT */
            if (element.key === 'qr') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-30 flex flex-col items-center justify-center bg-white p-2 rounded shadow-sm cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40 shadow-md'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/60 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  <QRCode
                    value={verificationUrl}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#0A2E1D"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxWidth: '100%',
                    }}
                  />
                  <div className="mt-1 text-center text-[6px] font-extrabold uppercase tracking-[0.1em] text-[#0A2E1D]">
                    Scan to Verify
                  </div>
                </div>
              )
            }

            /* AWARD SEAL ELEMENT */
            if (element.key === 'seal') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-25 flex items-center justify-center cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40 shadow-md'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/60 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  <div className="relative flex aspect-square w-[80%] items-center justify-center rounded-full border-[2px] border-[#EAA823] bg-[#0A2E1D] shadow-[0_0_0_3px_#0A2E1D,0_0_0_5px_#EAA823] pointer-events-none">
                    <div className="absolute inset-[6%] rounded-full border border-dashed border-[#EAA823]" />
                    <div className="absolute inset-[13%] rounded-full border-[2px] border-dotted border-[#EAA823] opacity-80" />
                    <div className="relative z-10 flex flex-col items-center text-center text-[#EAA823]">
                      <span className="text-[5px] font-bold tracking-[0.18em]">
                        DE-ECHOI
                      </span>
                      <span className="mt-0.5 font-serif text-[10px] font-extrabold leading-none sm:text-[12px]">
                        BRAND
                      </span>
                      <span className="font-serif text-[10px] font-extrabold leading-none sm:text-[12px]">
                        AWARD
                      </span>
                      <span className="mt-0.5 text-[6px] tracking-widest text-white">
                        ★ ★ ★
                      </span>
                    </div>
                  </div>
                </div>
              )
            }

            /* LINE SHAPES */
            if (element.type === 'line' || element.key.includes('Line')) {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-19 cursor-move transition-all flex items-center ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/40 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  <div className="w-full border-b-2 border-[#0A2E1D]/60 pointer-events-none" />
                </div>
              )
            }

            /* STAR SHAPE */
            if (element.type === 'star') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-22 flex items-center justify-center cursor-move transition-all text-[#EAA823] ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/40 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  <Star className="w-full h-full fill-[#EAA823] pointer-events-none" />
                </div>
              )
            }

            /* CIRCLE SHAPE */
            if (element.type === 'circle') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-22 rounded-full border-2 border-[#0A2E1D] bg-[#0A2E1D]/10 cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/40 hover:bg-emerald-50/20'
                      : ''
                  }`}
                />
              )
            }

            /* SOCIAL ICON ELEMENTS (Includes TikTok and 20+ Icons) */
            if (element.type === 'icon') {
              return (
                <div
                  key={identifier}
                  style={positionStyle}
                  onPointerDown={(event) => handlePointerDown(event, element)}
                  className={`absolute z-24 flex items-center justify-center text-[#0A2E1D] cursor-move transition-all ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/40 hover:bg-emerald-50/20'
                      : ''
                  }`}
                >
                  {element.iconName === 'globe' && <Globe className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'linkedin' && <Linkedin className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'twitter' && <Twitter className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'instagram' && <Instagram className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'facebook' && <Facebook className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'youtube' && <Youtube className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'tiktok' && <Video className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'email' && <Mail className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'github' && <Github className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'discord' && <MessageSquare className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'telegram' && <Send className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'whatsapp' && <MessageCircle className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'twitch' && <Tv className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'slack' && <Hash className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'reddit' && <Bookmark className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'pinterest' && <Camera className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'snapchat' && <Disc className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'spotify' && <Music className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'medium' && <Type className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                  {element.iconName === 'dribbble' && <Code2 className="w-full h-full pointer-events-none text-[#0A2E1D]" />}
                </div>
              )
            }

            /* EDITABLE TEXT & SOCIAL HANDLES */
            const computedFontSize = element.fontSize
              ? `clamp(${Math.max(6, element.fontSize * 0.17)}px, ${element.fontSize * 0.075}vw, ${element.fontSize}px)`
              : undefined

            return (
              <div
                key={identifier}
                style={{
                  ...positionStyle,
                  fontSize: computedFontSize,
                  fontFamily: element.fontFamily === 'serif' ? 'Georgia, serif' : element.fontFamily === 'cursive' ? 'cursive, serif' : element.fontFamily === 'monospace' ? 'monospace' : 'inherit',
                  fontWeight: element.fontWeight || 'normal',
                  fontStyle: element.fontStyle || 'normal',
                  textAlign: element.textAlign || 'left',
                  color: element.textColor || 'inherit',
                }}
                onPointerDown={(event) => handlePointerDown(event, element)}
                className={`
                  absolute z-20 overflow-hidden whitespace-pre-line outline-none cursor-move transition-all
                  ${element.key === 'signature' ? 'flex flex-col justify-end' : ''}
                  ${
                    editPreview
                      ? isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-100/40 shadow-md'
                        : 'ring-1 ring-dashed ring-[#0A2E1D]/60 hover:bg-white/40'
                      : ''
                  }
                `}
              >
                {element.key === 'signature' && signatureImage ? (
                  <div className="relative h-[65%] w-full flex items-end justify-center pointer-events-none">
                    <img
                      src={signatureImage}
                      alt="Authorized Signature"
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ) : null}
                <span className="pointer-events-none">{element.text}</span>
              </div>
            )
          })}

          {/* Right Panel Date Label */}
          <div className="pointer-events-none absolute bottom-[5.2%] right-[20.5%] z-25 text-[6px] font-black uppercase tracking-[0.15em] text-[#EAA823] sm:text-[7px]">
            Date Awarded
          </div>

          {/* Print Styles */}
          <style jsx global>{`
            @media print {
              @page {
                size: A4 landscape;
                margin: 0;
              }
              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              body * {
                visibility: hidden;
              }
              .certificate-sheet,
              .certificate-sheet * {
                visibility: visible;
              }
              .certificate-sheet {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 297mm !important;
                height: 210mm !important;
                max-width: none !important;
                margin: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}