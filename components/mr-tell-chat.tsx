'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader } from 'lucide-react'
import Image from 'next/image'
import { mrTellAI } from '@/lib/services/mr-tell-ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MrTellChatProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode?: boolean
}

export function MrTellChat({ isOpen, onClose, isDarkMode = false }: MrTellChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Mr. Tell, your DEECHOI assistant. What can I help you with today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mrTellAI.initialize()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await mrTellAI.chat(userMessage)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      console.error('Error:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div
        className={`relative w-full md:w-[400px] h-[90vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-[#EAA823]/20 bg-[#131821]' : 'border-gray-200 bg-gradient-to-r from-[#0A2E1D] to-[#072215]'}`}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAA823]">
              <Image
                src="/mr-tell.jpg"
                alt="Mr. Tell"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-white'}`}>
                Mr. Tell
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-emerald-100/70'}`}>
                Always here to help
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition ${
              isDarkMode
                ? 'hover:bg-[#EAA823]/20'
                : 'hover:bg-white/20'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Messages Container */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-[#0F1419]' : 'bg-gray-50'}`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[#0A2E1D] text-white rounded-br-none'
                    : isDarkMode
                      ? 'bg-[#1a1f2e] text-gray-100 border border-[#EAA823]/20 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-2 ${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white border border-gray-200'}`}>
                <Loader className="w-4 h-4 animate-spin text-[#EAA823]" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Thinking...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t p-4 ${isDarkMode ? 'border-[#EAA823]/20 bg-[#131821]' : 'border-gray-200 bg-white'}`}>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mr. Tell..."
              className={`flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition ${
                isDarkMode
                  ? 'bg-[#0F1419] text-white placeholder-gray-500 border border-[#EAA823]/20 focus:border-[#EAA823]/50'
                  : 'bg-gray-100 text-slate-800 placeholder-gray-500 border border-gray-300 focus:border-[#0A2E1D] focus:bg-white'
              }`}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-full bg-[#EAA823] text-[#0A2E1D] hover:bg-[#f5d547] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
