'use client'

import { useEffect, useState, Suspense } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  MessageSquare, Send, ArrowLeft, RefreshCw, Loader2, CreditCard, CheckCircle2, Clock, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentRequestModal } from '@/components/storefront/payment-request-modal'

interface MessageItem {
  id: string
  inquiry_id: string
  sender_type: 'customer' | 'admin'
  sender_name: string
  message: string
  type?: 'text' | 'payment_request'
  metadata?: any
  created_at: string
}

interface InquiryThread {
  id: string
  name: string
  email: string
  category: string
  status: string
  created_at: string
  last_message_at: string
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<InquiryThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [customerEmail, setCustomerEmail] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Proof Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [activePaymentMessage, setActivePaymentMessage] = useState<MessageItem | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCustomerSession()
  }, [])

  // Real-time listener for incoming admin replies, payment requests, and status confirmations
  useEffect(() => {
    if (!activeThreadId) return

    const channel = supabase
      .channel(`inquiry_thread_${activeThreadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${activeThreadId}`,
        },
        () => {
          selectThread(activeThreadId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeThreadId, supabase])

  const loadCustomerSession = async () => {
    try {
      setLoading(true)
      const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const targetEmail = session.email?.trim().toLowerCase()

      if (!targetEmail) {
        setLoading(false)
        return
      }

      setCustomerEmail(targetEmail)
      fetchThreads(targetEmail)
    } catch (e) {
      console.warn(e)
      setLoading(false)
    }
  }

  const fetchThreads = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .ilike('email', email)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      const threadList = (data || []) as InquiryThread[]
      setThreads(threadList)

      const urlThreadParam = searchParams.get('thread')
      if (urlThreadParam && threadList.some(t => t.id === urlThreadParam)) {
        selectThread(urlThreadParam)
      } else if (threadList.length > 0) {
        selectThread(threadList[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const selectThread = async (id: string) => {
    setActiveThreadId(id)
    const { data } = await supabase
      .from('inquiry_messages')
      .select('*')
      .eq('inquiry_id', id)
      .order('created_at', { ascending: true })

    setMessages((data || []) as MessageItem[])
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThreadId) return

    try {
      setSending(true)
      const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')

      const res = await fetch('/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: activeThreadId,
          name: session.name || 'Customer',
          message: replyText.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to send reply')

      setReplyText('')
      selectThread(activeThreadId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error sending reply'
      alert(message)
    } finally {
      setSending(false)
    }
  }

  // Redirect to Payment/Checkout Gateway Page
  const handleRedirectToPayment = (message: MessageItem) => {
    const amount = Number(message.metadata?.amount || 0)
    const note = encodeURIComponent(message.metadata?.note || 'Custom Order Deposit')
    
    // Redirects to your checkout/payment route with query params attached
    router.push(`/checkout?inquiryId=${activeThreadId}&messageId=${message.id}&amount=${amount}&description=${note}`)
  }

  // Handle Receipt Upload & Message Status Update
  const handlePaymentProofSubmitted = async (reference: string, file: File) => {
    if (!activePaymentMessage || !activeThreadId) return

    try {
      // 1. Upload proof file to Supabase storage
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `inquiry-${activeThreadId}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file, { upsert: false })

      if (uploadErr) throw uploadErr

      const { data: publicUrl } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path)

      const proofUrl = publicUrl?.publicUrl || uploadData.path

      // 2. Update message metadata to 'submitted'
      const updatedMetadata = {
        ...(activePaymentMessage.metadata || {}),
        status: 'submitted',
        reference,
        receipt_url: proofUrl,
        submitted_at: new Date().toISOString(),
      }

      await supabase
        .from('inquiry_messages')
        .update({ metadata: updatedMetadata })
        .eq('id', activePaymentMessage.id)

      // 3. Post confirmation message into conversation
      await fetch('/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: activeThreadId,
          name: 'Customer',
          message: `Receipt uploaded for payment of ₦${Number(activePaymentMessage.metadata?.amount || 0).toLocaleString()} (Ref: ${reference}). Awaiting admin confirmation.`,
        }),
      })

      setShowPaymentModal(false)
      setActivePaymentMessage(null)
      selectThread(activeThreadId)
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment receipt.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D]">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        {customerEmail && (
          <button onClick={() => fetchThreads(customerEmail)} className="text-xs font-bold flex items-center gap-1 text-[#0A2E1D] cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        )}
      </div>

      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-500/20">
        <h1 className="text-2xl sm:text-3xl font-black">Your Support & Payment Hub</h1>
        <p className="text-xs text-emerald-100/80 mt-1">Live customer messaging, instant payment requests, and verified receipts.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" /></div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm space-y-3">
          <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-sm">No Messages Found</h3>
          <p className="text-xs text-gray-500">Send us a message from our Contact Us page to start a conversation.</p>
          <Link href="/contact"><Button className="bg-[#0A2E1D] text-white text-xs font-bold rounded-full px-6 cursor-pointer">Contact Us</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-black text-sm text-[#0A2E1D]">Conversation Thread</span>
            <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Live Connected
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.map((m) => {
              const isAdmin = m.sender_type === 'admin'
              const isPayment = m.type === 'payment_request' || Boolean(m.metadata?.amount)
              const paymentStatus = m.metadata?.status || 'pending'
              const requestedAmount = Number(m.metadata?.amount || 0)

              return (
                <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">{isAdmin ? 'De-echoi Support' : 'You'}</span>
                  
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAdmin ? 'bg-[#0A2E1D] text-white rounded-tl-none' : 'bg-gray-100 text-gray-800 rounded-tr-none'
                  } ${isPayment ? 'p-3' : 'p-4'}`}>
                    
                    {/* Standard Text Bubble (Only shown when not a pure payment request) */}
                    {m.message && <p className="mb-2">{m.message}</p>}

                    {/* DYNAMIC IN-CHAT PAYMENT BUTTON CARD */}
                    {isPayment && (
                      <div className="bg-[#041a11] rounded-2xl p-4 border-2 border-amber-400/40 text-white space-y-3 shadow-md w-full min-w-[260px] sm:min-w-[320px]">
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-500/20 text-[#EAA823] rounded-lg">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">Payment Requested</span>
                              <span className="text-base sm:text-lg font-black text-[#EAA823]">
                                ₦{requestedAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            paymentStatus === 'confirmed'
                              ? 'bg-emerald-500 text-white'
                              : paymentStatus === 'submitted'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-amber-500 text-[#072d1d]'
                          }`}>
                            {paymentStatus === 'confirmed' ? '✓ Paid' : paymentStatus === 'submitted' ? '⏳ Under Review' : 'Action Required'}
                          </span>
                        </div>

                        {m.metadata?.note && (
                          <p className="text-xs text-gray-300 italic bg-white/5 p-2 rounded-xl">
                            &ldquo;{m.metadata.note}&rdquo;
                          </p>
                        )}

                        {/* State 1: Make Payment Button (Redirects to Payment Gateway/Page) */}
                        {paymentStatus === 'pending' && (
                          <div className="space-y-2 pt-1">
                            <Button
                              type="button"
                              onClick={() => handleRedirectToPayment(m)}
                              className="w-full bg-gradient-to-r from-[#EAA823] to-amber-500 hover:from-white hover:to-white text-[#072d1d] font-black text-xs sm:text-sm py-5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95 cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4 text-[#072d1d]" />
                              <span>Make Payment Now (₦{requestedAmount.toLocaleString()})</span>
                              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                            </Button>

                            {/* Secondary Action: Upload Bank Transfer Proof directly */}
                            <button
                              type="button"
                              onClick={() => {
                                setActivePaymentMessage(m)
                                setShowPaymentModal(true)
                              }}
                              className="w-full text-center text-[11px] text-amber-300 hover:underline py-1"
                            >
                              Already paid via bank transfer? Upload Receipt
                            </button>
                          </div>
                        )}

                        {/* State 2: Submitted & Awaiting Confirmation */}
                        {paymentStatus === 'submitted' && (
                          <div className="bg-amber-950/60 border border-amber-500/30 p-3 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                              <Clock className="w-4 h-4 animate-spin text-amber-400" />
                              <span>Payment submitted & under review</span>
                            </div>
                            <p className="text-[11px] text-gray-300 font-mono">
                              Ref: {m.metadata?.reference || 'Pending Confirmation'}
                            </p>
                          </div>
                        )}

                        {/* State 3: Confirmed State */}
                        {paymentStatus === 'confirmed' && (
                          <div className="bg-emerald-950/80 border border-emerald-500/40 p-3.5 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-bold shadow-inner">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <span>Payment Confirmed! Your order is being prepared.</span>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Chat input */}
          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="flex-1 bg-[#FDFBF7] border border-gray-200 text-xs sm:text-sm px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
            />
            <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white font-bold px-6 rounded-xl text-xs cursor-pointer">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Customer Payment Modal Dialog */}
      {showPaymentModal && activePaymentMessage && (
        <PaymentRequestModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setActivePaymentMessage(null)
          }}
          amount={Number(activePaymentMessage.metadata?.amount || 0)}
          inquiryId={activeThreadId || ''}
          onConfirm={handlePaymentProofSubmitted}
        />
      )}
    </div>
  )
}

export default function CustomerMessagesPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      <StorefrontHeader />
      <Suspense fallback={
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
        </div>
      }>
        <MessagesContent />
      </Suspense>
    </div>
  )
}