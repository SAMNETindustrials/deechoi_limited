'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  Upload, 
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  FileText,
  Calendar,
  Search,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  inquiry_id: string
  sender_type: 'customer' | 'admin'
  sender_name: string
  message: string
  type?: 'text' | 'payment_request'
  metadata?: any
  created_at: string
}

interface Inquiry {
  id: string
  customer_name?: string
  name?: string
  customer_email?: string
  email?: string
  subject?: string
  status?: string
  last_message_at?: string
  created_at?: string
}

export default function CustomerMessagesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isAdminTyping, setIsAdminTyping] = useState(false)

  // In-chat search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // In-chat receipt submission state
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(null)
  const [receiptRefInput, setReceiptRefInput] = useState('')
  const [receiptFileUrl, setReceiptFileUrl] = useState('')
  const [submittingProof, setSubmittingProof] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isAdminTyping])

  useEffect(() => {
    loadInquiries()
  }, [])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
      const userEmail = (session.email || '').trim().toLowerCase()
      const storedIds: string[] = JSON.parse(localStorage.getItem('deechoi_customer_inquiries') || '[]')

      let fetchedInquiries: Inquiry[] = []

      // 1. Query by user email if available
      if (userEmail) {
        let { data, error } = await supabase
          .from('customer_inquiries')
          .select('*')
          .ilike('customer_email', userEmail)
          .order('last_message_at', { ascending: false })

        if (error || !data || data.length === 0) {
          const fallbackQuery = await supabase
            .from('customer_inquiries')
            .select('*')
            .ilike('email', userEmail)
            .order('created_at', { ascending: false })
          
          if (!fallbackQuery.error && fallbackQuery.data) {
            data = fallbackQuery.data
          }
        }

        if (data && data.length > 0) {
          fetchedInquiries = data
        }
      }

      // 2. Fallback to stored IDs in localStorage
      if (fetchedInquiries.length === 0 && storedIds.length > 0) {
        const { data, error } = await supabase
          .from('customer_inquiries')
          .select('*')
          .in('id', storedIds)
          .order('last_message_at', { ascending: false })

        if (!error && data) {
          fetchedInquiries = data
        }
      }

      setInquiries(fetchedInquiries)

      if (fetchedInquiries.length > 0) {
        const validIds = fetchedInquiries.map((inq) => inq.id)
        localStorage.setItem('deechoi_customer_inquiries', JSON.stringify(validIds))
        setSelectedInquiryId((prev) => prev && validIds.includes(prev) ? prev : validIds[0])
      }
    } catch (err: any) {
      console.warn('[Error loading customer inquiries]:', err?.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedInquiryId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*')
        .eq('inquiry_id', selectedInquiryId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data as Message[])
        scrollToBottom()
      }
    }

    fetchMessages()

    const channel = supabase.channel(`inquiry_chat_${selectedInquiryId}`, {
      config: { broadcast: { self: true } },
    })

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${selectedInquiryId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message
            setMessages((prev) => {
              const withoutOptimistic = prev.filter(
                (m) => !(m.id.startsWith('temp-') && m.message === newMsg.message)
              )
              if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic
              const combined = [...withoutOptimistic, newMsg]
              return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })
            if (newMsg.sender_type === 'admin') {
              setIsAdminTyping(false)
            }
            scrollToBottom()
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            )
          }
        }
      )
      .on('broadcast', { event: 'new_chat_message' }, (payload) => {
        const incomingMsg = payload.payload as Message
        if (incomingMsg && incomingMsg.inquiry_id === selectedInquiryId) {
          if (incomingMsg.sender_type === 'admin') {
            setIsAdminTyping(false)
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev
            const combined = [...prev, incomingMsg]
            return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
          scrollToBottom()
        }
      })
      .on('broadcast', { event: 'admin_typing' }, (payload) => {
        const { isTyping } = payload.payload || {}
        if (isTyping) {
          setIsAdminTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => {
            setIsAdminTyping(false)
          }, 3000)
        } else {
          setIsAdminTyping(false)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedInquiryId, supabase])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiryId || !replyText.trim()) return

    const messageContent = replyText.trim()
    setReplyText('')
    setSending(true)

    const session = JSON.parse(localStorage.getItem('deechoi_customer_session') || '{}')
    const customerName = session.name || 'Customer'

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      inquiry_id: selectedInquiryId,
      sender_type: 'customer',
      sender_name: customerName,
      message: messageContent,
      type: 'text',
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    scrollToBottom()

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat_message',
        payload: optimisticMessage,
      })
    }

    try {
      const { data, error } = await supabase.from('inquiry_messages').insert({
        inquiry_id: selectedInquiryId,
        sender_type: 'customer',
        sender_name: customerName,
        message: messageContent,
        type: 'text',
      }).select('*').single()

      if (error) throw error

      await supabase
        .from('customer_inquiries')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedInquiryId)

      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data as Message) : m))
        )
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error sending message'
      console.error('[Send Message Error]:', errorMsg)
    } finally {
      setSending(false)
    }
  }

  const handleSubmitPaymentProof = async (msg: Message) => {
    if (!receiptRefInput.trim() && !receiptFileUrl.trim()) {
      alert('Please enter your transaction reference number or receipt URL.')
      return
    }

    try {
      setSubmittingProof(true)
      const rawMeta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : (msg.metadata || {})
      const updatedMetadata = {
        ...rawMeta,
        status: 'submitted',
        reference: receiptRefInput.trim(),
        receipt_url: receiptFileUrl.trim(),
        submitted_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('inquiry_messages')
        .update({ metadata: updatedMetadata })
        .eq('id', msg.id)

      if (error) throw error

      const { data: newMsg } = await supabase.from('inquiry_messages').insert({
        inquiry_id: selectedInquiryId,
        sender_type: 'customer',
        sender_name: 'Customer',
        message: `📄 Payment receipt submitted (Ref: #${receiptRefInput.trim() || 'Online Transfer'}). Awaiting confirmation.`,
        type: 'text',
      }).select('*').single()

      if (channelRef.current && newMsg) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: newMsg,
        })
      }

      setUploadingReceiptId(null)
      setReceiptRefInput('')
      setReceiptFileUrl('')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit payment receipt.'
      alert(errorMsg)
    } finally {
      setSubmittingProof(false)
    }
  }

  // Inquiry options for selecting previous chats / dates
  const formattedInquiryOptions = (() => {
    const seenDates = new Set<string>()
    return inquiries.map((inq) => {
      const timeVal = inq.last_message_at || inq.created_at || new Date().toISOString()
      const dateStr = new Date(timeVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const label = `${inq.subject || 'Support Chat'} — ${dateStr}`
      return { id: inq.id, label, dateStr }
    }).filter((item) => {
      if (seenDates.has(item.dateStr)) {
        return false
      }
      seenDates.add(item.dateStr)
      return true
    })
  })()

  // Filter messages based on in-chat keyword search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase().trim()
    return messages.filter((m) => {
      const textMatch = m.message?.toLowerCase().includes(q)
      const nameMatch = m.sender_name?.toLowerCase().includes(q)
      const meta = typeof m.metadata === 'object' ? JSON.stringify(m.metadata).toLowerCase() : ''
      const metaMatch = meta.includes(q)
      return textMatch || nameMatch || metaMatch
    })
  }, [messages, searchQuery])

  // Group filtered messages by date banner
  const groupedMessages = (() => {
    const groups: { dateLabel: string; items: Message[] }[] = []
    let lastDateKey = ''

    filteredMessages.forEach((msg) => {
      const msgDate = new Date(msg.created_at)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)

      let dateLabel = msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      if (msgDate.toDateString() === today.toDateString()) {
        dateLabel = 'Today'
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday'
      }

      if (dateLabel !== lastDateKey) {
        groups.push({ dateLabel, items: [msg] })
        lastDateKey = dateLabel
      } else {
        groups[groups.length - 1].items.push(msg)
      }
    })

    return groups
  })()

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-24">
      <StorefrontHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Navigation Bar */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0A2E1D] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Instant Connection</span>
          </div>
        </div>

        {/* Main Support Chat Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[680px]">
          
          {/* Header */}
          <div className="bg-[#072d1d] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAA823]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAA823] text-[#072d1d] flex items-center justify-center font-black shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base leading-tight truncate">De-echoi Kitchen Support</h2>
                <p className="text-[11px] text-emerald-100/80 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                  <span>Direct Order &amp; Custom Care</span>
                  &bull;
                  <span className="text-[#EAA823] font-semibold">Replies update instantly</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* In-Chat Keyword Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen)
                  if (isSearchOpen) setSearchQuery('')
                }}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isSearchOpen ? 'bg-[#EAA823] text-[#072d1d] border-[#EAA823]' : 'bg-[#041a11] text-white border-white/20 hover:bg-white/10'
                }`}
                title="Search conversation history"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {/* Inquiry Date Selection Dropdown */}
              {formattedInquiryOptions.length > 0 && (
                <div className="flex items-center gap-1 bg-[#041a11] border border-white/20 rounded-xl px-2.5 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#EAA823]" />
                  <select
                    value={selectedInquiryId || ''}
                    onChange={(e) => setSelectedInquiryId(e.target.value)}
                    className="bg-transparent text-white text-xs outline-none font-medium cursor-pointer"
                  >
                    {formattedInquiryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-[#072d1d] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* In-Chat Search Bar Drawer */}
          {isSearchOpen && (
            <div className="bg-amber-50 border-b border-amber-200 p-2.5 px-4 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
              <Search className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by words, order numbers, amounts..."
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#0A2E1D] outline-none placeholder:text-amber-900/40 font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-amber-800 hover:underline px-2"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery('')
                }}
                className="p-1 rounded-full text-amber-900 hover:bg-amber-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Body Grouped by Date */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FDFBF7]/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#EAA823]" />
                <span className="text-xs font-semibold">Connecting to conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="p-3 bg-amber-50 rounded-full text-[#EAA823]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">No active messages yet</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Send an inquiry through our Contact page or message kitchen support below.
                  </p>
                </div>
                <Link href="/contact">
                  <Button className="bg-[#072d1d] hover:bg-[#EAA823] hover:text-[#072d1d] text-white font-bold text-xs rounded-xl py-2 px-4 cursor-pointer shadow-md">
                    Send Inquiry
                  </Button>
                </Link>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-gray-400">
                <Search className="w-8 h-8 opacity-40" />
                <p className="text-xs font-bold text-gray-700">No matching messages found for &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-[#EAA823] hover:underline"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              groupedMessages.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3.5">
                  {/* Date Divider Banner */}
                  <div className="flex items-center justify-center my-3">
                    <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {group.dateLabel}
                    </span>
                  </div>

                  {group.items.map((msg) => {
                    const isAdmin = msg.sender_type === 'admin'
                    
                    const rawMeta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : (msg.metadata || {})
                    const isPayment = msg.type === 'payment_request' || Boolean(rawMeta?.amount) || (msg.message && msg.message.includes('[PAYMENT_REQUEST:'))
                    const paymentStatus = rawMeta?.status || 'pending'
                    const requestedAmount = Number(rawMeta?.amount || 0)
                    const hasCustomMessage = Boolean(msg.message && !msg.message.startsWith('[PAYMENT_REQUEST:'))

                    const checkoutParams = new URLSearchParams({
                      amount: String(requestedAmount || '0'),
                      ref: rawMeta?.reference || `PAY-${msg.id.slice(0, 6)}`,
                      inquiryId: selectedInquiryId || '',
                      item_name: rawMeta?.item_name || 'Custom Kitchen Order',
                      size: rawMeta?.size || '',
                      flavor: rawMeta?.flavor || '',
                      category: rawMeta?.category || 'Custom',
                      delivery: rawMeta?.delivery_mode || '',
                      note: rawMeta?.note || '',
                    })

                    const checkoutUrl = rawMeta?.payment_url || `/checkout?${checkoutParams.toString()}`

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 px-1">
                          <span>{isAdmin ? (msg.sender_name || 'De-echoi Support') : 'You'}</span>
                          <span>&bull;</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                              : 'bg-[#072d1d] text-white rounded-tr-none'
                          }`}
                        >
                          {hasCustomMessage && <p className="whitespace-pre-wrap mb-1">{msg.message}</p>}

                          {isPayment && (
                            <div className="bg-[#041a11] text-white rounded-2xl p-4 border border-[#EAA823]/50 space-y-3 mt-2 shadow-xl">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <div>
                                  <span className="text-[#EAA823] font-black text-base sm:text-lg flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4" />
                                    ₦{requestedAmount.toLocaleString()}
                                  </span>
                                  <p className="text-xs font-extrabold text-white mt-0.5">
                                    {rawMeta?.item_name || 'Custom Order Invoice'}
                                  </p>
                                </div>

                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                  paymentStatus === 'confirmed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : paymentStatus === 'submitted'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-[#EAA823]/20 text-[#EAA823] border border-[#EAA823]/30'
                                }`}>
                                  {paymentStatus === 'confirmed' ? '✓ APPROVED' : paymentStatus === 'submitted' ? '⏳ VERIFYING PROOF' : 'PAYMENT REQUIRED'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <div>
                                  <span className="text-gray-400 block text-[10px]">Size / Dimension:</span>
                                  <strong className="text-white font-bold">{rawMeta?.size || 'Standard Specification'}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[10px]">Flavor / Mix:</span>
                                  <strong className="text-white font-bold">{rawMeta?.flavor || 'Custom Recipe'}</strong>
                                </div>
                                {rawMeta?.delivery_mode && (
                                  <div className="col-span-2 pt-1 border-t border-white/5">
                                    <span className="text-gray-400 block text-[10px]">Fulfillment:</span>
                                    <strong className="text-amber-300 font-bold">{rawMeta.delivery_mode}</strong>
                                  </div>
                                )}
                              </div>

                              {rawMeta?.note && (
                                <p className="text-xs text-gray-300 italic">
                                  &ldquo;{rawMeta.note}&rdquo;
                                </p>
                              )}

                              {paymentStatus === 'pending' && (
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                                  <div className="flex justify-between text-gray-400">
                                    <span>Bank Name:</span>
                                    <strong className="text-white">Access Bank / Moniepoint</strong>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Account Name:</span>
                                    <strong className="text-white">De-echoi Limited</strong>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Account Number:</span>
                                    <strong className="text-[#EAA823] font-mono font-bold tracking-wider">0123456789</strong>
                                  </div>
                                </div>
                              )}

                              {paymentStatus === 'pending' && (
                                <div className="space-y-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => router.push(checkoutUrl)}
                                    className="w-full bg-[#EAA823] hover:bg-white text-[#072d1d] font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition active:scale-95"
                                  >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Proceed to Secure Checkout (₦{requestedAmount.toLocaleString()})</span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                  </button>

                                  {uploadingReceiptId === msg.id ? (
                                    <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-amber-500/30 mt-2">
                                      <input
                                        type="text"
                                        placeholder="Enter Transfer Reference / Session ID..."
                                        value={receiptRefInput}
                                        onChange={(e) => setReceiptRefInput(e.target.value)}
                                        className="w-full bg-[#072d1d] border border-white/20 text-white text-xs px-3 py-2 rounded-lg outline-none"
                                      />
                                      <input
                                        type="url"
                                        placeholder="Paste Screenshot/Receipt URL (Optional)..."
                                        value={receiptFileUrl}
                                        onChange={(e) => setReceiptFileUrl(e.target.value)}
                                        className="w-full bg-[#072d1d] border border-white/20 text-white text-xs px-3 py-2 rounded-lg outline-none"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          onClick={() => handleSubmitPaymentProof(msg)}
                                          disabled={submittingProof}
                                          className="flex-1 bg-[#EAA823] hover:bg-white text-[#072d1d] font-bold text-xs py-2 rounded-lg cursor-pointer"
                                        >
                                          {submittingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Proof'}
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={() => setUploadingReceiptId(null)}
                                          variant="outline"
                                          className="text-xs py-2 rounded-lg border-white/20 text-white hover:bg-white/10"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      onClick={() => setUploadingReceiptId(msg.id)}
                                      variant="outline"
                                      className="w-full border-white/20 text-gray-200 hover:text-white hover:bg-white/10 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>I already transferred (Submit Receipt)</span>
                                    </Button>
                                  )}
                                </div>
                              )}

                              {paymentStatus === 'submitted' && (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                                  <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                                    <span>⏳ Receipt submitted (Ref: #{rawMeta?.reference || 'Transfer'}). The kitchen is confirming your payment.</span>
                                  </p>
                                  {rawMeta?.receipt_url && (
                                    <a
                                      href={rawMeta.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:underline pt-0.5"
                                    >
                                      <FileText className="w-3 h-3 text-amber-400" />
                                      <span>View Uploaded Proof</span>
                                      <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {paymentStatus === 'confirmed' && (
                                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Payment Verified &amp; Order Approved</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}

            {/* REAL-TIME TYPING ANIMATION */}
            {isAdminTyping && (
              <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-[10px] text-[#EAA823] font-bold mb-1 px-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#EAA823]" />
                  <span>Support is typing a response...</span>
                </span>
                
                <div className="bg-white border border-[#EAA823]/40 rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EAA823] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-[#EAA823] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-[#EAA823] animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input Bar */}
          {selectedInquiryId && (
            <form
              onSubmit={handleSendReply}
              className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2"
            >
              <Input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message or follow-up question..."
                className="flex-1 bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-2xl py-3 px-4 focus-visible:ring-[#072d1d]"
              />

              <Button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="bg-[#072d1d] hover:bg-[#EAA823] hover:text-[#072d1d] text-white font-extrabold rounded-2xl px-5 py-3 transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}