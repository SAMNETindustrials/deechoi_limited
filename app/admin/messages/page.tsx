'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Mail, 
  ChevronLeft, 
  Loader2, 
  RefreshCw, 
  MessageCircle,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Wallet,
  X,
  FileText,
  ExternalLink,
  Sparkles,
  Search,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

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
  name?: string
  customer_name?: string
  email?: string
  customer_email?: string
  phone?: string
  category?: string
  status?: string
  created_at?: string
  last_message_at?: string
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<InquiryThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [checkingPaymentId, setCheckingPaymentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // In-chat search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Advanced Payment Request Form State
  const [showPaymentRequestPrompt, setShowPaymentRequestPrompt] = useState(false)
  const [itemName, setItemName] = useState('Custom Celebration Cake')
  const [categoryType, setCategoryType] = useState('Cakes')
  const [itemSize, setItemSize] = useState('7" (2-Layer Tier)')
  const [flavorMix, setFlavorMix] = useState('Red Velvet & Whipped Vanilla')
  const [paymentAmountInput, setPaymentAmountInput] = useState('35000')
  const [deliveryOption, setDeliveryOption] = useState('Doorstep Delivery (Port Harcourt)')
  const [paymentNoteInput, setPaymentNoteInput] = useState('50% Upfront Commitment Deposit')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  const selectThread = useCallback(async (id: string) => {
    if (!id) return
    setActiveThreadId(id)
    setErrorMessage(null)
    try {
      setLoadingMessages(true)
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*')
        .eq('inquiry_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setActiveMessages((data || []) as MessageItem[])
      scrollToBottom()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation'
      console.error('Error loading messages:', message)
      setErrorMessage(message)
    } finally {
      setLoadingMessages(false)
    }
  }, [supabase])

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (error) throw error
      const threadList = (data || []) as InquiryThread[]
      setThreads(threadList)

      if (threadList.length > 0 && !activeThreadId) {
        selectThread(threadList[0].id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load threads'
      console.error('Error loading threads:', message)
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }, [supabase, activeThreadId, selectThread])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  // Deduplicate thread list so each unique customer email/name appears only once
  const deduplicatedThreads = useMemo(() => {
    const seenEmails = new Set<string>()
    return threads.filter((t) => {
      const emailKey = (t.email || t.customer_email || '').trim().toLowerCase()
      const nameKey = (t.name || t.customer_name || '').trim().toLowerCase()
      const uniqueKey = emailKey || nameKey
      if (!uniqueKey) return true
      if (seenEmails.has(uniqueKey)) {
        return false
      }
      seenEmails.add(uniqueKey)
      return true
    })
  }, [threads])

  // Real-time listener for incoming messages & persistence sync
  useEffect(() => {
    if (!activeThreadId) return

    const channel = supabase.channel(`inquiry_chat_${activeThreadId}`, {
      config: { broadcast: { self: true } },
    })

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${activeThreadId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as MessageItem
            setActiveMessages((prev) => {
              const withoutOptimistic = prev.filter(
                (m) => !(m.id.startsWith('temp-') && m.message === newMsg.message)
              )
              if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic
              const combined = [...withoutOptimistic, newMsg]
              return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })
            scrollToBottom()
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as MessageItem
            setActiveMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            )
          }
        }
      )
      .on('broadcast', { event: 'new_chat_message' }, async (payload) => {
        const incomingMsg = payload.payload as MessageItem
        if (incomingMsg && incomingMsg.inquiry_id === activeThreadId) {
          
          setActiveMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev
            const combined = [...prev, incomingMsg]
            return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
          scrollToBottom()

          if (incomingMsg.sender_type === 'customer') {
            try {
              const msgId = incomingMsg.id || `msg-${Date.now()}`
              const { data: existing } = await supabase
                .from('inquiry_messages')
                .select('id')
                .eq('id', msgId)
                .maybeSingle()

              if (!existing) {
                await supabase.from('inquiry_messages').insert({
                  id: msgId,
                  inquiry_id: incomingMsg.inquiry_id,
                  sender_type: 'customer',
                  sender_name: incomingMsg.sender_name || 'Customer',
                  message: incomingMsg.message,
                  type: incomingMsg.type || 'text',
                  metadata: incomingMsg.metadata || {},
                  created_at: incomingMsg.created_at || new Date().toISOString()
                })
                
                await supabase
                  .from('customer_inquiries')
                  .update({ last_message_at: new Date().toISOString() })
                  .eq('id', incomingMsg.inquiry_id)
              }
            } catch (err) {
              console.error('Failed to automatically persist customer message:', err)
            }
          }
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [activeThreadId, supabase])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value)

    if (!channelRef.current) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'admin_typing',
      payload: { isTyping: true, sender: 'admin' },
    })

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'admin_typing',
        payload: { isTyping: false, sender: 'admin' },
      })
    }, 2000)
  }

  const handleSendReply = async (type: 'text' | 'payment_request' = 'text', customMetadata: any = null) => {
    if (type === 'text' && !replyText.trim()) return
    if (!activeThreadId) return

    const currentThread = threads.find((t) => t.id === activeThreadId)
    setErrorMessage(null)

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'admin_typing',
      payload: { isTyping: false, sender: 'admin' },
    })

    const paymentReference = `DE-${Date.now().toString().slice(-6)}`
    
    const checkoutParams = new URLSearchParams({
      amount: String(paymentAmountInput || '0'),
      ref: paymentReference,
      inquiryId: String(activeThreadId),
      item_name: itemName.trim() || 'Custom Kitchen Order',
      size: itemSize.trim(),
      flavor: flavorMix.trim(),
      category: categoryType.trim(),
      delivery: deliveryOption.trim(),
      note: paymentNoteInput.trim(),
    })

    const dynamicCheckoutUrl = `/checkout?${checkoutParams.toString()}`

    const metadataPayload = customMetadata || (type === 'payment_request' ? {
      amount: Number(paymentAmountInput) || 0,
      item_name: itemName.trim() || 'Custom Order',
      category: categoryType.trim(),
      size: itemSize.trim(),
      flavor: flavorMix.trim(),
      delivery_mode: deliveryOption.trim(),
      note: paymentNoteInput.trim(),
      status: 'pending',
      reference: paymentReference,
      payment_url: dynamicCheckoutUrl,
      created_at: new Date().toISOString()
    } : null)

    const textPayload = type === 'payment_request' 
      ? `[PAYMENT_REQUEST:₦${Number(paymentAmountInput).toLocaleString()}] - ${itemName.trim()} (${itemSize.trim()})` 
      : replyText.trim()

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageItem = {
      id: tempId,
      inquiry_id: activeThreadId,
      sender_type: 'admin',
      sender_name: 'De-echoi Support',
      message: textPayload,
      type,
      metadata: metadataPayload,
      created_at: new Date().toISOString(),
    }

    setActiveMessages((prev) => [...prev, optimisticMessage])
    scrollToBottom()

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat_message',
        payload: optimisticMessage,
      })
    }

    setReplyText('')
    setShowPaymentRequestPrompt(false)

    try {
      setSending(true)

      const payload = {
        inquiryId: String(activeThreadId).trim(),
        message: textPayload,
        replyMessage: textPayload,
        to: currentThread?.email || currentThread?.customer_email || '',
        customerEmail: currentThread?.email || currentThread?.customer_email || '',
        customerName: currentThread?.name || currentThread?.customer_name || 'Customer',
        senderName: 'De-echoi Support',
        type,
        metadata: metadataPayload,
      }

      const res = await fetch('/api/admin/messages/reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch reply')
      }

      if (data.data?.id) {
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data.data as MessageItem) : m))
        )
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error sending reply'
      console.error('Error sending reply:', message)
      setErrorMessage(message)
    } finally {
      setSending(false)
    }
  }

  const handleCheckCustomerPayment = async (messageId: string) => {
    try {
      setCheckingPaymentId(messageId)
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (error) throw error

      setActiveMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)))
    } catch (err: any) {
      alert(err.message || 'Failed to check status')
    } finally {
      setCheckingPaymentId(null)
    }
  }

  const handleConfirmCustomerPayment = async (msg: MessageItem) => {
    try {
      setSending(true)
      const updatedMetadata = {
        ...(msg.metadata || {}),
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('inquiry_messages')
        .update({ metadata: updatedMetadata })
        .eq('id', msg.id)

      if (error) throw error

      const { data: newMsg } = await supabase.from('inquiry_messages').insert({
        inquiry_id: activeThreadId,
        sender_type: 'admin',
        sender_name: 'De-echoi Support',
        message: `✅ Payment of ₦${Number(msg.metadata?.amount || 0).toLocaleString()} has been confirmed! Your order is scheduled with the kitchen.`,
        type: 'text',
      }).select('*').single()

      if (channelRef.current && newMsg) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: newMsg,
        })
      }

      await selectThread(activeThreadId!)
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment.')
    } finally {
      setSending(false)
    }
  }

  const handleOpenWhatsApp = (phone: string, customerName: string) => {
    if (!phone) return
    const digits = phone.replace(/\D/g, '')
    const formatted = digits.startsWith('0') 
      ? `234${digits.slice(1)}` 
      : digits.startsWith('234') 
        ? digits 
        : `234${digits}`

    const greeting = encodeURIComponent(`Hello ${customerName}, this is De-echoi Support regarding your inquiry: `)
    const url = `https://wa.me/${formatted}?text=${greeting}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const activeThread = threads.find((t) => t.id === activeThreadId)
  const activeThreadName = activeThread?.name || activeThread?.customer_name || 'Customer'
  const activeThreadEmail = activeThread?.email || activeThread?.customer_email || 'N/A'
  const activeThreadPhone = activeThread?.phone || 'N/A'

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return activeMessages
    const q = searchQuery.toLowerCase().trim()
    return activeMessages.filter((m) => {
      const textMatch = m.message?.toLowerCase().includes(q)
      const nameMatch = m.sender_name?.toLowerCase().includes(q)
      const meta = typeof m.metadata === 'object' ? JSON.stringify(m.metadata).toLowerCase() : ''
      return textMatch || nameMatch || meta.includes(q)
    })
  }, [activeMessages, searchQuery])

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: MessageItem[] }[] = []
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
  }, [filteredMessages])

  return (
    <div className="min-h-screen bg-[#0F1419] text-white font-sans flex flex-col">
      <header className="h-20 bg-gradient-to-r from-[#1a1f2e] to-[#131821] border-b border-[#EAA823]/20 px-4 md:px-8 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon" className="border-[#EAA823]/30 text-[#EAA823] hover:bg-[#EAA823]/20 rounded-xl cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#EAA823]" />
              <span>Customer Conversations</span>
            </h1>
            <p className="text-xs text-gray-400">Custom Payment Invoicing &amp; Two-Way Instant Chat</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Real-Time Reflection Active</span>
          </div>

          <Link href="/admin/dashboard">
            <Button className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] text-xs font-black rounded-xl cursor-pointer shadow-md">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Deduplicated Thread List */}
        <div className="md:col-span-4 bg-[#1a1f2e] border border-[#EAA823]/20 rounded-3xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Unique Customers ({deduplicatedThreads.length})</span>
            <button onClick={fetchThreads} className="text-gray-400 hover:text-[#EAA823] cursor-pointer" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[70vh]">
            {deduplicatedThreads.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-10">No customer inquiries found</p>
            ) : (
              deduplicatedThreads.map((t) => {
                const isSelected = t.id === activeThreadId
                const tName = t.name || t.customer_name || 'Customer'
                const tEmail = t.email || t.customer_email || 'N/A'
                const tTime = t.last_message_at || t.created_at || new Date().toISOString()

                return (
                  <div
                    key={t.id}
                    onClick={() => selectThread(t.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-[#12422C] border-[#EAA823]/60 shadow-md'
                        : 'bg-[#131821] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-white truncate">{tName}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(tTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-400 font-medium truncate">{t.category || 'General Inquiry'}</p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{tEmail}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Active Conversation */}
        <div className="md:col-span-8 bg-[#1a1f2e] border border-[#EAA823]/20 rounded-3xl p-5 flex flex-col shadow-xl min-h-[500px]">
          {activeThread ? (
            <>
              <div className="pb-4 mb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-white">{activeThreadName}</h2>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#EAA823]" />{activeThreadEmail}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#EAA823]" />{activeThreadPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen)
                      if (isSearchOpen) setSearchQuery('')
                    }}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isSearchOpen ? 'bg-[#EAA823] text-[#0A2E1D] border-[#EAA823]' : 'bg-[#131821] text-white border-white/20 hover:bg-white/10'
                    }`}
                    title="Search conversation"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>

                  <Button
                    type="button"
                    onClick={() => setShowPaymentRequestPrompt(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-[#0A2E1D] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Request Custom Payment</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(activeThreadPhone, activeThreadName)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* In-Chat Search Bar Drawer */}
              {isSearchOpen && (
                <div className="mb-3 bg-black/40 border border-amber-400/30 p-2.5 px-4 rounded-xl flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search thread by keywords, references, or amounts..."
                    className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-gray-500 font-medium"
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-xs text-amber-400 hover:underline">Clear</button>
                  )}
                  <button type="button" onClick={() => { setIsSearchOpen(false); setSearchQuery('') }} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Messages Stream Grouped by Date */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-2 max-h-[50vh]">
                {loadingMessages ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#EAA823]" /></div>
                ) : groupedMessages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">No messages found matching your search.</div>
                ) : (
                  groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3.5">
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
                          <Calendar className="w-3 h-3 text-[#EAA823]" />
                          {group.dateLabel}
                        </span>
                      </div>

                      {group.items.map((m) => {
                        const isAdmin = m.sender_type === 'admin'
                        const rawMeta = typeof m.metadata === 'string' ? JSON.parse(m.metadata || '{}') : (m.metadata || {})
                        const isPayment = m.type === 'payment_request' || Boolean(rawMeta?.amount) || (m.message && m.message.includes('[PAYMENT_REQUEST:'))
                        const paymentStatus = rawMeta?.status || 'pending'
                        const requestedAmount = Number(rawMeta?.amount || 0)
                        const hasCustomMessage = Boolean(m.message && !m.message.startsWith('[PAYMENT_REQUEST:'))

                        return (
                          <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-400 mb-1 px-1">{m.sender_name || (isAdmin ? 'De-echoi Support' : 'Customer')}</span>
                            
                            <div className={`max-w-[88%] rounded-2xl text-xs sm:text-sm leading-relaxed ${
                              isAdmin
                                ? 'bg-[#12422C] text-white border border-[#EAA823]/30 rounded-tr-none'
                                : 'bg-[#131821] text-gray-200 border border-white/10 rounded-tl-none'
                            } p-4`}>
                              
                              {hasCustomMessage && <p className="mb-2">{m.message}</p>}

                              {isPayment && (
                                <div className="bg-black/60 rounded-2xl p-4 border border-amber-400/50 space-y-3 w-full min-w-[280px] sm:min-w-[340px]">
                                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                                    <div>
                                      <span className="text-amber-400 font-black text-base flex items-center gap-1.5">
                                        <CreditCard className="w-4 h-4" />
                                        ₦{requestedAmount.toLocaleString()}
                                      </span>
                                      <p className="text-[11px] text-white font-bold mt-0.5">
                                        {rawMeta?.item_name || 'Custom Order'}
                                      </p>
                                    </div>

                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                      paymentStatus === 'confirmed'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : paymentStatus === 'submitted'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-white/10 text-gray-300'
                                    }`}>
                                      {paymentStatus === 'confirmed' ? '✓ CONFIRMED' : paymentStatus === 'submitted' ? '⏳ RECEIPT SUBMITTED' : 'PAYMENT REQUESTED'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-white/5 p-2 rounded-xl border border-white/10">
                                    <div>
                                      <span className="text-gray-400 block">Size / Tier:</span>
                                      <strong className="text-white">{rawMeta?.size || 'Standard Tier'}</strong>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block">Flavor / Style:</span>
                                      <strong className="text-white">{rawMeta?.flavor || 'Custom Recipe'}</strong>
                                    </div>
                                    {rawMeta?.delivery_mode && (
                                      <div className="col-span-2 pt-1 border-t border-white/5">
                                        <span className="text-gray-400 block">Fulfillment:</span>
                                        <strong className="text-amber-300">{rawMeta.delivery_mode}</strong>
                                      </div>
                                    )}
                                  </div>

                                  {rawMeta?.note && (
                                    <p className="text-[11px] text-gray-300 italic">
                                      &ldquo;{rawMeta.note}&rdquo;
                                    </p>
                                  )}

                                  {paymentStatus === 'pending' && (
                                    <Button
                                      type="button"
                                      onClick={() => handleCheckCustomerPayment(m.id)}
                                      disabled={checkingPaymentId === m.id}
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-amber-400/40 text-amber-300 hover:bg-amber-400/10 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${checkingPaymentId === m.id ? 'animate-spin' : ''}`} />
                                      <span>Check If Customer Has Paid</span>
                                    </Button>
                                  )}

                                  {paymentStatus === 'submitted' && (
                                    <Button
                                      type="button"
                                      onClick={() => handleConfirmCustomerPayment(m)}
                                      disabled={sending}
                                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Confirm Payment Received</span>
                                    </Button>
                                  )}

                                  {paymentStatus === 'confirmed' && (
                                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      <span>Payment Verified &amp; Order Approved</span>
                                    </div>
                                  )}

                                </div>
                              )}
                            </div>

                            <span className="text-[9px] text-gray-500 mt-1 px-1">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <div className="pt-4 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a response... (Synced to customer dashboard & email)"
                  value={replyText}
                  onChange={handleTextChange}
                  onKeyDown={(e) => e.key === 'Enter' && !sending && handleSendReply('text')}
                  className="flex-1 bg-[#131821] border border-white/10 text-white text-xs sm:text-sm px-4 py-3 rounded-2xl outline-none focus:border-[#EAA823]"
                />
                <Button
                  onClick={() => handleSendReply('text')}
                  disabled={sending || !replyText.trim()}
                  className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold px-6 py-3 rounded-2xl text-xs gap-1.5 shadow-md cursor-pointer transition"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Reply</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
              Select a conversation thread to view and reply.
            </div>
          )}
        </div>

      </div>

      {/* Advanced Custom Payment Invoicing Modal */}
      {showPaymentRequestPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#1a1f2e] border border-[#EAA823]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentRequestPrompt(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-black text-sm pb-2 border-b border-white/10">
              <Wallet className="w-4 h-4 text-[#EAA823]" />
              <span>Generate Customer Payment Request</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Item Category</label>
                  <select
                    value={categoryType}
                    onChange={(e) => setCategoryType(e.target.value)}
                    className="w-full bg-[#131821] border border-white/10 text-white text-xs p-2.5 rounded-xl outline-none"
                  >
                    <option value="Cakes">Celebration Cakes</option>
                    <option value="Meals">Kitchen Meals &amp; Soups</option>
                    <option value="Shawarma">Shawarma &amp; Fast Food</option>
                    <option value="Academy">Culinary Academy</option>
                    <option value="Catering">Event Catering Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Product / Order Title</label>
                  <Input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. 2-Tier Birthday Cake"
                    className="bg-[#131821] border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Size / Tier Dimension</label>
                  <Input
                    type="text"
                    value={itemSize}
                    onChange={(e) => setItemSize(e.target.value)}
                    placeholder="e.g. 6-inch & 8-inch Tier"
                    className="bg-[#131821] border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Flavor / Mix Recipe</label>
                  <Input
                    type="text"
                    value={flavorMix}
                    onChange={(e) => setFlavorMix(e.target.value)}
                    placeholder="e.g. Red Velvet & Whipped Vanilla"
                    className="bg-[#131821] border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Delivery / Pickup Location</label>
                <Input
                  type="text"
                  value={deliveryOption}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  placeholder="e.g. Doorstep Delivery to Woji, PH"
                  className="bg-[#131821] border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-amber-400 font-bold mb-1">Amount to Charge (₦)</label>
                  <Input
                    type="number"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="e.g. 35000"
                    className="bg-[#131821] border-amber-400/40 text-amber-300 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Payment Type / Note</label>
                  <Input
                    type="text"
                    value={paymentNoteInput}
                    onChange={(e) => setPaymentNoteInput(e.target.value)}
                    placeholder="e.g. 50% Deposit"
                    className="bg-[#131821] border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSendReply('payment_request')}
              disabled={sending || !paymentAmountInput}
              className="w-full bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-black text-xs py-3.5 rounded-xl cursor-pointer shadow-lg mt-2 transition"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invoice & Payment Card to Customer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}