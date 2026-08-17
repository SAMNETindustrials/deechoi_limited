'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Mail, 
  ChevronLeft, 
  Loader2, 
  RefreshCw, 
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface MessageItem {
  id: string
  sender_type: 'customer' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

interface InquiryThread {
  id: string
  name: string
  email: string
  phone: string
  category: string
  status: string
  created_at: string
  last_message_at: string
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<InquiryThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()

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
      setActiveMessages(data || [])
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
      const threadList = data || []
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

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThreadId) return

    const currentThread = threads.find(t => t.id === activeThreadId)
    setErrorMessage(null)

    try {
      setSending(true)

      const payload = {
        inquiryId: String(activeThreadId).trim(),
        replyMessage: String(replyText).trim(),
        customerEmail: currentThread?.email ? String(currentThread.email).trim().toLowerCase() : '',
        customerName: currentThread?.name ? String(currentThread.name).trim() : 'Customer',
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

      setReplyText('')
      await selectThread(activeThreadId)
      fetchThreads()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error sending reply'
      console.error('Error sending reply:', message)
      setErrorMessage(message)
      alert(message)
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

  const activeThread = threads.find(t => t.id === activeThreadId)

  return (
    <div className="min-h-screen bg-[#0F1419] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="h-20 bg-gradient-to-r from-[#1a1f2e] to-[#131821] border-b border-[#EAA823]/20 px-4 md:px-8 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon" className="border-[#EAA823]/30 text-[#EAA823] hover:bg-[#EAA823]/20 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#EAA823]" />
              <span>Customer Conversations</span>
            </h1>
            <p className="text-xs text-gray-400">Two-way messaging with customer portal & email sync</p>
          </div>
        </div>

        <Link href="/admin/dashboard">
          <Button className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] text-xs font-black rounded-xl">
            Dashboard
          </Button>
        </Link>
      </header>

      {/* Messenger Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Thread List */}
        <div className="md:col-span-4 bg-[#1a1f2e] border border-[#EAA823]/20 rounded-3xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">All Inquiries ({threads.length})</span>
            <button onClick={fetchThreads} className="text-gray-400 hover:text-[#EAA823]" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[70vh]">
            {threads.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-10">No customer inquiries found</p>
            ) : (
              threads.map((t) => {
                const isSelected = t.id === activeThreadId
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
                      <p className="font-bold text-sm text-white truncate">{t.name}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-400 font-medium truncate">{t.category || 'General Inquiry'}</p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{t.email}</p>
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
                  <h2 className="text-base font-extrabold text-white">{activeThread.name}</h2>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#EAA823]" />{activeThread.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#EAA823]" />{activeThread.phone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(activeThread.phone, activeThread.name)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {errorMessage && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 py-2 max-h-[50vh]">
                {loadingMessages ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#EAA823]" /></div>
                ) : (
                  activeMessages.map((m) => {
                    const isAdmin = m.sender_type === 'admin'
                    return (
                      <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-400 mb-1 px-1">{m.sender_name}</span>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-[#12422C] text-white border border-[#EAA823]/30 rounded-tr-none'
                            : 'bg-[#131821] text-gray-200 border border-white/10 rounded-tl-none'
                        }`}>
                          {m.message}
                        </div>
                        <span className="text-[9px] text-gray-500 mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Reply Input Box */}
              <div className="pt-4 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a response... (Synced to customer dashboard & email)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sending && handleSendReply()}
                  className="flex-1 bg-[#131821] border border-white/10 text-white text-xs sm:text-sm px-4 py-3 rounded-2xl outline-none focus:border-[#EAA823]"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold px-6 py-3 rounded-2xl text-xs gap-1.5 shadow-md cursor-pointer"
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
    </div>
  )
}