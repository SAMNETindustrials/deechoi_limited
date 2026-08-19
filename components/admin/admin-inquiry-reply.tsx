'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

interface AdminInquiryReplyProps {
  inquiryId: string
  customerEmail: string
  customerName: string
  onReplySent?: () => void
}

export function AdminInquiryReply({
  inquiryId,
  customerEmail,
  customerName,
  onReplySent,
}: AdminInquiryReplyProps) {
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()
  
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  // Initialize Realtime Channel for broadcasting typing events
  useEffect(() => {
    if (!inquiryId) return

    const channel = supabase.channel(`inquiry_chat_${inquiryId}`)
    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [inquiryId])

  // Broadcast typing status when admin types in the textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setReplyMessage(text)

    if (!channelRef.current) return

    // 1. Broadcast that admin is actively typing
    channelRef.current.send({
      type: 'broadcast',
      event: 'admin_typing',
      payload: { isTyping: true, sender: 'admin' },
    })

    // 2. Debounce: If no keystroke for 2 seconds, broadcast that typing stopped
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'admin_typing',
        payload: { isTyping: false, sender: 'admin' },
      })
    }, 2000)
  }

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim()) return

    setSending(true)

    // Stop typing broadcast immediately on submission
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'admin_typing',
      payload: { isTyping: false, sender: 'admin' },
    })

    try {
      const res = await fetch('/api/admin/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          to: customerEmail,
          customerName,
          message: replyMessage.trim(),
          senderName: 'De-echoi Support Team',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch reply')

      setReplyMessage('')
      if (onReplySent) onReplySent()
    } catch (err: any) {
      alert(err.message || 'Error sending reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSendAdminReply} className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Reply to {customerName}
        </label>
        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Real-time typing sync enabled</span>
        </span>
      </div>

      <Textarea
        rows={3}
        value={replyMessage}
        onChange={handleTextChange}
        placeholder={`Write your response to ${customerName}... (they will see you typing in real time)`}
        className="w-full text-xs sm:text-sm bg-gray-50 border-gray-200 rounded-xl p-3 focus:bg-white"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={sending || !replyMessage.trim()}
          className="bg-[#072d1d] hover:bg-[#EAA823] hover:text-[#072d1d] text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md flex items-center gap-2 cursor-pointer transition"
        >
          {sending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reply</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}