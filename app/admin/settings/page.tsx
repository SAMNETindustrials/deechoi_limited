'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  HelpCircle, 
  MessageSquare, 
  Mail,
  Loader2,
  Save,
  Search
} from 'lucide-react'
import Link from 'next/link'

export default function AdminNotificationSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [settings, setSettings] = useState({
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: true,
    admin_email: 'deechoi01@gmail.com',
    email_enabled: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'notification_settings')
        .single()

      if (data?.value) {
        setSettings(prev => ({ ...prev, ...data.value }))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const sanitizedSettings = {
        ...settings,
        telegram_bot_token: settings.telegram_bot_token.trim(),
        telegram_chat_id: settings.telegram_chat_id.trim(),
      }

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'notification_settings',
          value: sanitizedSettings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      setSettings(sanitizedSettings)
      alert('Notification settings saved successfully!')
    } catch (err: any) {
      console.error('Error saving settings:', err)
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoDetectChatId = async () => {
    if (!settings.telegram_bot_token.trim()) {
      alert('Please enter your Telegram Bot Token first.')
      return
    }

    try {
      setDetecting(true)
      setTestResult(null)

      const res = await fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoDetect: true,
          botToken: settings.telegram_bot_token.trim(),
        }),
      })

      const data = await res.json()
      if (data.success && data.detectedChatId) {
        setSettings(prev => ({ ...prev, telegram_chat_id: data.detectedChatId }))
        setTestResult({
          success: true,
          message: `Found Chat ID: ${data.detectedChatId}! Now click "Test Telegram Alert".`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Could not find messages. Please search for your bot on Telegram and click START first.',
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to auto-detect chat ID.',
      })
    } finally {
      setDetecting(false)
    }
  }

  const handleSendTestNotification = async () => {
    const cleanToken = settings.telegram_bot_token.trim()
    const cleanChatId = settings.telegram_chat_id.trim()

    if (!cleanToken || !cleanChatId) {
      alert('Please enter both your Telegram Bot Token and numeric Chat ID first.')
      return
    }

    try {
      setTesting(true)
      setTestResult(null)

      await supabase
        .from('app_settings')
        .upsert({
          key: 'notification_settings',
          value: {
            ...settings,
            telegram_bot_token: cleanToken,
            telegram_chat_id: cleanChatId,
          },
          updated_at: new Date().toISOString(),
        })

      const res = await fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true }),
      })

      const data = await res.json()
      if (data.telegramSent) {
        setTestResult({
          success: true,
          message: 'Test message delivered to your Telegram successfully! Check your Telegram app.',
        })
      } else {
        setTestResult({
          success: false,
          message: data.telegramError
            ? `Telegram Error: ${data.telegramError}. Did you click START in the chat with your bot?`
            : 'Failed to deliver Telegram message. Check Bot Token & Chat ID.',
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error sending test notification',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-16">
      {/* Header */}
      <div className="bg-[#0A2E1D] text-white p-6 border-b border-[#12422C]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#EAA823]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold">Instant Notification Alerts</h1>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm mt-1">
              Connect your Telegram bot to receive real-time order alerts on your phone.
            </p>
          </div>
          
          {/* Back arrow button returning directly to Dashboard homepage */}
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="gap-2 bg-[#12422C] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] text-xs font-bold border border-[#EAA823]/30">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A2E1D]" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-8">
            
            {/* Telegram Configuration */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#0A2E1D]">Telegram Real-Time Alerts</h2>
                    <p className="text-xs text-gray-500">Receive full customer, address, and receipt details instantly</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegram_enabled}
                    onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A2E1D]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    1. Telegram Bot Token *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 7123456789:AAHkqwe1234..."
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    className="bg-gray-50 font-mono text-xs rounded-xl"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Created via <strong>@BotFather</strong> on Telegram.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      2. Your Telegram Chat ID *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectChatId}
                      disabled={detecting}
                      className="text-[11px] text-[#0088cc] hover:underline font-bold flex items-center gap-1"
                    >
                      {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>Auto-Detect My Chat ID</span>
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="e.g. 584920193"
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    className="bg-gray-50 font-mono text-xs rounded-xl"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Must be numeric (e.g. <code>584920193</code>). You can get this from <strong>@userinfobot</strong> on Telegram.
                  </span>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <HelpCircle className="w-4 h-4 text-[#EAA823]" />
                  <span>Important to avoid &quot;chat not found&quot;:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed text-amber-800/90">
                  <li>Search for your bot's username on Telegram and click the <strong>START</strong> button.</li>
                  <li>Click <strong>Auto-Detect My Chat ID</strong> above or copy your ID from <strong>@userinfobot</strong>.</li>
                  <li>Click <strong>Test Telegram Alert</strong> below to confirm.</li>
                </ol>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTestNotification}
                  disabled={testing}
                  className="rounded-xl border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/10 text-xs font-bold gap-2"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{testing ? 'Sending Test...' : 'Test Telegram Alert'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white rounded-xl text-xs font-extrabold px-6 gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </Button>
              </div>
            </div>

            {/* Email Notification Section */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0A2E1D] flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0A2E1D]">Admin Notification Email</h3>
                    <p className="text-xs text-gray-500">Destination email address for receipt and invoice archives</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_enabled}
                    onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A2E1D]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  className="bg-gray-50 text-xs rounded-xl"
                  placeholder="deechoi01@gmail.com"
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}