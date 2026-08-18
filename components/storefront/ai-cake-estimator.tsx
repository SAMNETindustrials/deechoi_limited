'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calculator, 
  Sparkles, 
  Cake, 
  Layers, 
  CheckCircle2, 
  Wand2, 
  Users, 
  Send, 
  Heart, 
  Gift, 
  Loader2,
  RefreshCw
} from 'lucide-react'

interface AICakeRecipe {
  title: string
  size: '6' | '7' | '8' | '2-tier'
  layers: number
  flavor1: string
  flavor2: string
  frosting: string
  servings: string
  suggestedInscription: string
  aiNote: string
}

const CAKE_FLAVORS = [
  'Vanilla Velvet Cream',
  'Rich Belgian Chocolate',
  'Signature Red Velvet',
  'Strawberry Delight',
  'Caramel Butterscotch',
  'Cookies & Cream',
  'Coconut Pineapple Bliss',
]

const FROSTING_STYLES = [
  'Whipped Buttercream Swirls',
  'Smooth Royal Fondant Finish',
  'Chocolate Ganache Drip & Shards',
  '24k Edible Gold Leaf Accents',
  'Fresh Fruit & Floral Crown',
]

const AI_PRESETS: { label: string; icon: string; recipe: AICakeRecipe }[] = [
  {
    label: 'Wedding Royal Elegance',
    icon: '💍',
    recipe: {
      title: 'Royal White & Gold 2-Tier Masterpiece',
      size: '2-tier',
      layers: 3,
      flavor1: 'Signature Red Velvet',
      flavor2: 'Vanilla Velvet Cream',
      frosting: '24k Edible Gold Leaf Accents',
      servings: '35 - 45 Guests',
      suggestedInscription: 'Forever & Always &bull; 2026',
      aiNote: 'AI Recommendation: Dual-tone moisture balance with vanilla-infused buttercream stabilizes multi-tiered structures in humid Port Harcourt climates.',
    }
  },
  {
    label: 'Birthday Celebration Blast',
    icon: '🎉',
    recipe: {
      title: 'Decadent Chocolate & Caramel Extravaganza',
      size: '7',
      layers: 3,
      flavor1: 'Rich Belgian Chocolate',
      flavor2: 'Caramel Butterscotch',
      frosting: 'Chocolate Ganache Drip & Shards',
      servings: '16 - 20 Guests',
      suggestedInscription: 'Happy Birthday to the Queen!',
      aiNote: 'AI Recommendation: Rich cocoa density complements caramel butterscotch drippings for maximum flavor contrast and photography appeal.',
    }
  },
  {
    label: 'Romantic Anniversary Tier',
    icon: '🌹',
    recipe: {
      title: 'Romantic Red Velvet & Berry Cream',
      size: '6',
      layers: 2,
      flavor1: 'Signature Red Velvet',
      flavor2: 'Strawberry Delight',
      frosting: 'Fresh Fruit & Floral Crown',
      servings: '8 - 12 Guests',
      suggestedInscription: 'Cheers to Our Love &bull; 5 Years',
      aiNote: 'AI Recommendation: Tangy natural strawberry extract balances buttermilk cocoa sponge with a light, velvety mouthfeel.',
    }
  },
]

export function AICakeEstimator({ isMobile = false }: { isMobile?: boolean }) {
  const [size, setSize] = useState<'6' | '7' | '8' | '2-tier'>('7')
  const [layers, setLayers] = useState<number>(2)
  const [flavor1, setFlavor1] = useState(CAKE_FLAVORS[0])
  const [flavor2, setFlavor2] = useState(CAKE_FLAVORS[2])
  const [frosting, setFrosting] = useState(FROSTING_STYLES[0])
  const [inscription, setInscription] = useState('')
  const [eventPrompt, setEventPrompt] = useState('')
  
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiSuggestedInscription, setAiSuggestedInscription] = useState<string | null>(null)

  // Price Calculation Logic
  const calculatePrice = () => {
    let base = 18000
    if (size === '7') base = 25000
    if (size === '8') base = 34000
    if (size === '2-tier') base = 58000

    const layerModifier = (layers - 1) * (size === '6' ? 7000 : size === '7' ? 9000 : 12000)
    let finishExtra = 0
    if (frosting.includes('Gold Leaf')) finishExtra = 6000
    if (frosting.includes('Fruit & Floral')) finishExtra = 4500
    if (frosting.includes('Fondant')) finishExtra = 5000

    return base + layerModifier + finishExtra
  }

  const getServingsEstimate = () => {
    if (size === '6') return '6 - 10 Guests'
    if (size === '7') return '14 - 18 Guests'
    if (size === '8') return '20 - 26 Guests'
    return '35 - 50 Guests'
  }

  const handleApplyPreset = (recipe: AICakeRecipe) => {
    setSize(recipe.size)
    setLayers(recipe.layers)
    setFlavor1(recipe.flavor1)
    setFlavor2(recipe.flavor2)
    setFrosting(recipe.frosting)
    setInscription(recipe.suggestedInscription)
    setAiAnalysis(recipe.aiNote)
    setAiSuggestedInscription(recipe.suggestedInscription)
  }

  const handleRunAICustomization = () => {
    if (!eventPrompt.trim()) {
      handleApplyPreset(AI_PRESETS[Math.floor(Math.random() * AI_PRESETS.length)].recipe)
      return
    }

    setAiGenerating(true)
    setTimeout(() => {
      const lower = eventPrompt.toLowerCase()
      if (lower.includes('wedding') || lower.includes('marriage') || lower.includes('bride')) {
        handleApplyPreset(AI_PRESETS[0].recipe)
      } else if (lower.includes('birth') || lower.includes('age') || lower.includes('party')) {
        handleApplyPreset(AI_PRESETS[1].recipe)
      } else if (lower.includes('anniversary') || lower.includes('love') || lower.includes('val')) {
        handleApplyPreset(AI_PRESETS[2].recipe)
      } else {
        setSize('7')
        setLayers(3)
        setFlavor1('Rich Belgian Chocolate')
        setFlavor2('Vanilla Velvet Cream')
        setFrosting('24k Edible Gold Leaf Accents')
        setInscription(`Celebration: ${eventPrompt}`)
        setAiAnalysis(`AI Custom Pair: Balanced chocolate-vanilla double sponge designed for "${eventPrompt}" with festive 24k gold leaf finishing.`)
      }
      setAiGenerating(false)
    }, 600)
  }

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-200/90 shadow-lg space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl flex-shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-[#0A2E1D]">
                Interactive Cake Price & AI Customizer
              </h2>
              <span className="bg-[#072d1d] text-[#EAA823] text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Engine
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Customize tier sizes, blend sponge flavors, and let AI generate the optimal event recipe.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
          ★ Real-Time Matrix
        </span>
      </div>

      {/* AI Automated Generator Bar */}
      <div className="bg-gradient-to-r from-[#072d1d] via-[#0a3a26] to-[#072d1d] rounded-2xl p-4 sm:p-5 text-white border border-[#EAA823]/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#EAA823] text-xs font-black uppercase tracking-wider">
            <Wand2 className="w-4 h-4" />
            <span>AI Automated Cake Assistant</span>
          </div>
          <span className="text-[10px] text-emerald-200/80">Instant Presets</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Tell AI your event (e.g. 30th Birthday Glamour, 2-Tier Wedding, Luxury Baby Shower)..."
            value={eventPrompt}
            onChange={(e) => setEventPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunAICustomization()}
            className="bg-[#041a11] border-emerald-700/50 text-white placeholder:text-gray-400 text-xs py-2.5 rounded-xl flex-1 focus-visible:ring-[#EAA823]"
          />
          <Button
            onClick={handleRunAICustomization}
            disabled={aiGenerating}
            className="bg-[#EAA823] hover:bg-white text-[#0A2E1D] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer flex-shrink-0"
          >
            {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Auto-Design</span>
          </Button>
        </div>

        {/* 1-Click Quick AI Presets */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] text-gray-300 font-bold flex-shrink-0">Quick AI Styles:</span>
          {AI_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.recipe)}
              className="flex-shrink-0 bg-white/10 hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* AI Insight Note */}
        {aiAnalysis && (
          <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-100 flex items-start gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-[#EAA823] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{aiAnalysis}</p>
          </div>
        )}
      </div>

      {/* Manual Matrix Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Size Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            1. Diameter / Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '6', label: '6-Inch', price: '₦18k' },
              { id: '7', label: '7-Inch', price: '₦25k' },
              { id: '8', label: '8-Inch', price: '₦34k' },
              { id: '2-tier', label: '2-Tier (6"+8")', price: '₦58k' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSize(s.id as any)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  size === s.id
                    ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                    : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:bg-amber-50/50'
                }`}
              >
                <p className="text-xs font-black">{s.label}</p>
                <p className="text-[10px] opacity-80">{s.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Layer Count */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            2. Layer Count
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setLayers(num)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  layers === num
                    ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                    : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:bg-amber-50/50'
                }`}
              >
                <p className="text-xs font-black">{num} Layer{num > 1 ? 's' : ''}</p>
                <p className="text-[9px] opacity-75">{num === 1 ? 'Single' : num === 2 ? 'Double' : 'Tall Tier'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Flavor */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            3. Primary Sponge
          </label>
          <select
            value={flavor1}
            onChange={(e) => setFlavor1(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-gray-200 text-xs font-bold text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
          >
            {CAKE_FLAVORS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Secondary Flavor / Blend */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            4. Layer 2 Blend
          </label>
          <select
            value={flavor2}
            onChange={(e) => setFlavor2(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-gray-200 text-xs font-bold text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
          >
            {CAKE_FLAVORS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Frosting / Finish & Inscription */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            5. Decorative Frosting & Style
          </label>
          <select
            value={frosting}
            onChange={(e) => setFrosting(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-gray-200 text-xs font-bold text-[#0A2E1D] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#0A2E1D]"
          >
            {FROSTING_STYLES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
            6. Greeting Inscription (Piped on Board / Cake)
          </label>
          <Input
            type="text"
            placeholder="e.g. Happy 30th Birthday, Dr. Chioma!"
            value={inscription}
            onChange={(e) => setInscription(e.target.value)}
            className="bg-[#FDFBF7] border-gray-200 text-xs sm:text-sm rounded-xl py-3"
          />
        </div>
      </div>

      {/* Live Calculated Quote Bar */}
      <div className="bg-[#072d1d] text-white p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border border-amber-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#EAA823] uppercase tracking-wider">Calculated Cake Estimate</span>
            <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3 text-[#EAA823]" />
              {getServingsEstimate()}
            </span>
          </div>
          <p className="text-xs text-gray-300">
            {size === '2-tier' ? '2-Tier (6" + 8")' : `${size}" Cake`} &bull; {layers} Layer{layers > 1 ? 's' : ''} &bull; {flavor1} + {flavor2}
          </p>
          {inscription && (
            <p className="text-[11px] text-amber-300 font-semibold italic">
              &ldquo;{inscription}&rdquo;
            </p>
          )}
        </div>

        <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[#EAA823]">
            ₦{calculatePrice().toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-200/80 uppercase font-semibold">
            Freshly Baked in Woji
          </span>
        </div>
      </div>

    </section>
  )
}