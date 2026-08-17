'use client'

import { useEffect, useState, Suspense } from 'react'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  MessageSquare, Send, ArrowLeft, RefreshCw, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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
  category: string
  status: string
  created_at: string
  last_message_at: string
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<InquiryThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [customerEmail, setCustomerEmail] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCustomerSession()
  }, [])

  // Real-time listener for incoming admin replies
  useEffect(() => {
    if (!activeThreadId) return

    const channel = supabase
      .channel(`inquiry_thread_${activeThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
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
      setThreads(data || [])

      const urlThreadParam = searchParams.get('thread')
      if (urlThreadParam && data?.some(t => t.id === urlThreadParam)) {
        selectThread(urlThreadParam)
      } else if (data && data.length > 0) {
        selectThread(data[0].id)
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

    setMessages(data || [])
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

      {/* Hero Header */}
      <div className="mb-8 bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-500/20">
        <h1 className="text-2xl sm:text-3xl font-black">Your Support Messages</h1>
        <p className="text-xs text-emerald-100/80 mt-1">Live customer support and real-time thread updates synced with your email.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" /></div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm space-y-3">
          <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-sm">No Messages Found</h3>
          <p className="text-xs text-gray-500">Send us a message from our Contact Us page to start a thread.</p>
          <Link href="/contact"><Button className="bg-[#0A2E1D] text-white text-xs font-bold rounded-full px-6 cursor-pointer">Contact Us</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-black text-sm text-[#0A2E1D]">Live Support Thread</span>
            <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Real-Time Synced
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {messages.map((m) => {
              const isAdmin = m.sender_type === 'admin'
              return (
                <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">{isAdmin ? 'De-echoi Support' : 'You'}</span>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAdmin ? 'bg-[#0A2E1D] text-white rounded-tl-none' : 'bg-gray-100 text-gray-800 rounded-tr-none'
                  }`}>
                    {m.message}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="flex-1 bg-[#FDFBF7] border border-gray-200 text-xs px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
            />
            <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="bg-[#0A2E1D] text-white font-bold px-6 rounded-xl text-xs cursor-pointer">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
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