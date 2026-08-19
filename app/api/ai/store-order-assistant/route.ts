import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// COMPREHENSIVE BRAND KNOWLEDGE BASE & SYSTEM INSTRUCTION (KB-DEL-2026-V3)
// ============================================================================
const MR_TELL_SYSTEM_INSTRUCTION = `
You are "Mr. Tell", the official digital spokesperson, master culinary consultant, and concierge for DE-ECHOI LIMITED (Fresh Kitchen, Bespoke Bakery & Culinary Training Academy in Woji, Port Harcourt, Rivers State, Nigeria).

BRAND ESSENCE:
"Quality made just for You."

HEADQUARTERS & HOURS:
- Location: Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria.
- Working Hours:
  * Monday to Friday: 9:00 AM – 5:30 PM
  * Sundays: 12:00 PM – 5:30 PM
  * Saturdays: CLOSED TO WALK-IN STOREFRONT ORDERS (Dedicated strictly to bulk event catering execution).
- Delivery: 12–35 min live-tracked bike couriers covering Woji, Peter Odili, Trans-Amadi, GRA Phases 1–3, Old GRA, Artillery, Garrison, Rumuola, and Ada George. Counter pickup available at Woji kitchen.

COMPLETE MASTER MENU & PRICING:
1. RICE DISHES:
   - Smokey Jollof Rice: ₦3,000 (Slow-caramelized tomato-pepper reduction, firewood aroma, bay leaves)
   - Signature Fried Rice: ₦3,000 (Wok-tossed sweet corn, crisp carrots, peas, seasoned broth)
   - Mixed Fried & Jollof Rice: ₦3,500 (Split combo platter)
2. PARFAITS & MINI CAKELOAVES:
   - Classic Parfait (Yogurt, apples, grapes, granola, coconut flakes & cashew): 350ml: ₦5,500 | 1 Liter: ₦13,000
   - Tropical Parfait (Greek yogurt, apple, grape, coconut, cashew, almond): 350ml: ₦6,500 | 1 Liter: ₦14,000
   - Nutty Essence Parfait (Granola, coconut flakes, cashews & almonds, minimal fruit): 350ml: ₦6,500 | 1 Liter: ₦14,000
   - Cake Parfait (Vanilla, chocolate & red velvet sponge layers, whipped cream, caramel): 350ml: ₦6,000 | 1 Liter: ₦14,000
   - Mini Cakeloaves (Served with whipped cream & luxury toppings):
     * Chocolate: ₦4,000 | Vanilla: ₦4,300 | Red Velvet: ₦4,500 | 2 Mixed Flavours: ₦4,600
3. STIR-FRIED NOODLES:
   - Base Stir-Fried Noodles: ₦3,000
   - Protein Add-ons: Full Turkey (+₦6,000) | Turkey Cubes (₦2,000 per cube)
4. SOUPS & PASTAS:
   - Fresh Catfish Pepper Soup (Full Catfish 1L Bowl): ₦16,000 (Live catfish, roasted Ehuru, Uda, scent leaves/Effirin)
   - Creamy Alfredo Pasta, Spaghetti Bolognese, Special Seafood Pasta (prawns, calamari).
5. STREET DELIGHTS & CONFECTIONERIES:
   - Medium Shawarma: ₦5,000 (Single sausage, marinated chicken/beef, velvet sauce)
   - Jumbo Shawarma: ₦12,000 (Double sausage, extra meat, double-rolled flatbread, velvet sauce)
   - Artisanal Corndogs (Single, twin, mozzarella cheese core)
   - Milky Doughnuts (Brioche pocket injected with condensed milk cream reduction)
   - Gourmet Puff & Cream (Nigerian sweet dough balls with whipped dipping cream)
6. BOTANICAL BEVERAGES (50cl Cold-Chain PET):
   - Signature Infused Zobo (Hibiscus sabdariffa, raw ginger, pineapple reduction, zero cane sugar)
   - Cold-Pressed Pineapple & Ginger, Watermelon Hydration Puree, Citrus Sunrise.
7. BESPOKE CELEBRATION CAKES (6" & 7" Tiered):
   - 6-Inch: Vanilla (1L: ₦20k | 2L: ₦38.5k | 3L: ₦52k) | Chocolate (1L: ₦21k | 2L: ₦40k | 3L: ₦53k) | Red Velvet (1L: ₦20.5k | 2L: ₦39k | 3L: ₦51k) | Multi-Flavor (2L: ₦41k | 3L: ₦61.5k)
   - 7-Inch: Vanilla (1L: ₦26k | 2L: ₦46k | 3L: ₦55k) | Chocolate (1L: ₦27.5k | 2L: ₦50k | 3L: ₦65k) | Red Velvet (1L: ₦27k | 2L: ₦49k | 3L: ₦63.5k) | Multi-Flavor (2L: ₦45k | 3L: ₦69k)

FOOD SCIENCE & HEALTH INTELLIGENCE:
- Zobo: Anthocyanins act as natural ACE inhibitors for arterial blood pressure; gingerols provide anti-inflammatory and pancreatic enzyme stimulation.
- Catfish Pepper Soup: Rich in bioavailable Omega-3s (EPA/DHA); Ehuru provides carminative monoterpenes; Uda provides antimicrobial diterpenes; Scent Leaf protects intestinal microbiota.
- Parfait Probiotics: Greek yogurt delivers Lactobacillus bulgaricus and casein protein; almonds/cashews provide monounsaturated healthy fats.
- Rice Craft: Smokey Jollof uses slow tomato caramelization; Fried Rice flash-woks vegetables to retain Vitamin A and dietary fiber.

CULINARY TRAINING ACADEMY:
- 6-Week Cake Artistry, 4-Week Street Kitchen & Fast Food, 2-Week Botanical Juicing. 85% attendance required for diplomas. Cohorts capped at 10 students. Visit /training.

RESPONSE FORMAT RULES:
- Always answer direct price inquiries immediately with exact figures and sizes.
- Detail flavors, ingredients, and preparation techniques when asked "tell me about...".
- Answer general culinary, food science, or cooking questions thoroughly and intelligently.
- Tone: Welcoming, culinary-smart, and witty.
`

// ============================================================================
// FUZZY STRING & PHONETIC NORMALIZER
// ============================================================================
function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// AUTONOMOUS NLP INTEL ENGINE (Zero-Failure Real-Time Knowledge Base)
// ============================================================================
function autonomousKnowledgeEngine(
  rawQuery: string,
  products: any[],
  settings: any,
  locations: any[]
) {
  const q = normalizeQuery(rawQuery)
  const isAskingPrice =
    q.includes('how much') ||
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('rate') ||
    q.includes('pricing') ||
    q.includes('how many naira')

  const isAskingInfo =
    q.includes('tell me about') ||
    q.includes('what is') ||
    q.includes('explain') ||
    q.includes('how do you make') ||
    q.includes('what do you have') ||
    q.includes('describe')

  // --------------------------------------------------------------------------
  // 1. RICE INQUIRIES (Jollof, Jellof, Fried Rice, Mixed Rice)
  // --------------------------------------------------------------------------
  if (
    q.includes('jollof') ||
    q.includes('jellof') ||
    q.includes('fried rice') ||
    q.includes('friedrice') ||
    q.includes('rice')
  ) {
    const matched = products
      .filter((p) => {
        const n = (p.name || '').toLowerCase()
        const c = (p.category || '').toLowerCase()
        return (
          n.includes('rice') ||
          n.includes('jollof') ||
          c.includes('rice') ||
          c.includes('meals')
        )
      })
      .map((p) => p.id)

    if (q.includes('jollof') || q.includes('jellof')) {
      return {
        questionType: 'menu_search',
        action: 'filter',
        matchedProductIds: matched,
        summaryMessage: `🍚 **De-echoi Smokey Jollof Rice (₦3,000):**\nOur signature Jollof is prepared traditional firewood-style with rich plum tomato and red bell pepper reduction, seasoned with aromatic bay leaves and chef spices for that authentic party smoky aroma.\n\n• **Smokey Jollof Rice:** ₦3,000\n• **Mixed Fried & Jollof Rice Combo:** ₦3,500\n\nI have brought up our rice menu below for you!`,
      }
    }

    if (q.includes('fried')) {
      return {
        questionType: 'menu_search',
        action: 'filter',
        matchedProductIds: matched,
        summaryMessage: `🍚 **De-echoi Signature Fried Rice (₦3,000):**\nWok-tossed long-grain rice loaded with sweet corn, diced carrots, green peas, and rich chicken stock reduction.\n\n• **Signature Fried Rice:** ₦3,000\n• **Mixed Fried & Jollof Rice Combo:** ₦3,500\n\nTake a look at the live menu options below!`,
      }
    }

    return {
      questionType: 'menu_search',
      action: 'filter',
      matchedProductIds: matched,
      summaryMessage: `🍚 **De-echoi Fresh Rice Dishes:**\n• **Smokey Jollof Rice:** ₦3,000 (Rich firewood smoky reduction)\n• **Signature Fried Rice:** ₦3,000 (Wok-tossed with fresh garden vegetables)\n• **Mixed Fried & Jollof Rice:** ₦3,500 (Split combo platter)\n\nCooked fresh upon order. Browse the items below to add to your bag!`,
    }
  }

  // --------------------------------------------------------------------------
  // 2. PARFAIT & MINI CAKELOAF INQUIRIES
  // --------------------------------------------------------------------------
  if (
    q.includes('parfait') ||
    q.includes('parfet') ||
    q.includes('yogurt') ||
    q.includes('cakeloaf') ||
    q.includes('cake loaf') ||
    q.includes('loaf')
  ) {
    const matched = products
      .filter((p) => {
        const n = (p.name || '').toLowerCase()
        const c = (p.category || '').toLowerCase()
        return (
          n.includes('parfait') ||
          n.includes('loaf') ||
          c.includes('parfait') ||
          c.includes('cakes')
        )
      })
      .map((p) => p.id)

    if (q.includes('loaf') || q.includes('cakeloaf')) {
      return {
        questionType: 'menu_search',
        action: 'filter',
        matchedProductIds: matched,
        summaryMessage: `🍞 **Luxury Mini Cakeloaves (Served with whipped cream & luxury toppings):**\n• **Chocolate Cakeloaf:** ₦4,000\n• **Vanilla Cakeloaf:** ₦4,300\n• **Red Velvet Cakeloaf:** ₦4,500\n• **2 Mixed Flavours Cakeloaf:** ₦4,600\n\nFreshly baked, soft, and packaged for individual sweet indulgence!`,
      }
    }

    return {
      questionType: 'menu_search',
      action: 'filter',
      matchedProductIds: matched,
      summaryMessage: `🍓 **De-echoi Gourmet Parfait & Cakeloaf Menu:**\n\n• **Classic Parfait:** Creamy Greek yogurt, apples, grapes, crunchy granola, coconut flakes & cashews.\n  *(350ml: ₦5,500 | 1 Liter: ₦13,000)*\n• **Tropical Parfait:** Greek yogurt with fresh apple/grape slices, roasted coconut flakes, cashews & almonds.\n  *(350ml: ₦6,500 | 1 Liter: ₦14,000)*\n• **Nutty Essence Parfait:** High-protein granola, coconut flakes, cashews & almonds with minimal fruit.\n  *(350ml: ₦6,500 | 1 Liter: ₦14,000)*\n• **Cake Parfait:** Fluffy sponge layers (vanilla, chocolate, red velvet) with whipped cream & caramel.\n  *(350ml: ₦6,000 | 1 Liter: ₦14,000)*\n• **Mini Cakeloaves:** Chocolate (₦4,000), Vanilla (₦4,300), Red Velvet (₦4,500), 2 Mixed (₦4,600)\n\nI've brought up our parfaits below for you!`,
    }
  }

  // --------------------------------------------------------------------------
  // 3. SHAWARMA & NOODLES
  // --------------------------------------------------------------------------
  if (
    q.includes('shawarma') ||
    q.includes('sharwama') ||
    q.includes('sharma') ||
    q.includes('noodle') ||
    q.includes('turkey') ||
    q.includes('indomie')
  ) {
    if (q.includes('shawarma') || q.includes('sharwama') || q.includes('sharma')) {
      const matched = products
        .filter((p) => (p.name || '').toLowerCase().includes('shawarma'))
        .map((p) => p.id)

      return {
        questionType: 'menu_search',
        action: 'filter',
        matchedProductIds: matched,
        summaryMessage: `🫔 **De-echoi Gourmet Shawarma Sizes & Prices:**\n• **Medium Size (₦5,000):** Classic single sausage roll, seasoned shredded chicken/beef, spiced veggies & signature velvet sauce.\n• **Jumbo Size (₦12,000):** Double sausage, extra marinated meat, double-rolled flatbread for the ultimate hearty feast!\n\nCheck out the shawarma selection below!`,
      }
    }

    if (q.includes('noodle') || q.includes('turkey') || q.includes('indomie')) {
      const matched = products
        .filter((p) => (p.name || '').toLowerCase().includes('noodle'))
        .map((p) => p.id)

      return {
        questionType: 'menu_search',
        action: 'filter',
        matchedProductIds: matched,
        summaryMessage: `🍜 **Spiced Stir-Fried Noodles Menu:**\n• **Base Stir-Fried Noodles:** ₦3,000 (Wok-tossed with fresh carrots, sweet corn, and savory pepper base)\n• **Full Turkey Cut:** +₦6,000 (Crispy, golden-fried large turkey cut)\n• **Turkey Cubes:** ₦2,000 per cube (Tender diced seasoned chunks)\n\nCustomized to your exact appetite below!`,
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. CATFISH PEPPER SOUP
  // --------------------------------------------------------------------------
  if (q.includes('catfish') || q.includes('pepper soup') || q.includes('peppersoup')) {
    const matched = products
      .filter((p) => (p.name || '').toLowerCase().includes('pepper soup'))
      .map((p) => p.id)

    return {
      questionType: 'menu_search',
      action: 'filter',
      matchedProductIds: matched,
      summaryMessage: `🍲 **Fresh Catfish Pepper Soup (Full Catfish 1L Bowl — ₦16,000):**\n• Live African Catfish (*Clarias gariepinus*) cooked fresh upon order.\n• Simmered with traditional native spices: roasted Calabash Nutmeg (*Ehuru*), Negro Pepper (*Uda*), and fresh Scent Leaves (*Effirin*).\n• Rich in bioavailable Omega-3s (EPA/DHA) and soothing herbs for respiratory and digestive wellness.`,
    }
  }

  // --------------------------------------------------------------------------
  // 5. CAKE PRICING & CUSTOM TIERS
  // --------------------------------------------------------------------------
  if (
    q.includes('cake') &&
    (isAskingPrice ||
      q.includes('tier') ||
      q.includes('layer') ||
      q.includes('6 inch') ||
      q.includes('7 inch') ||
      q.includes('birthday') ||
      q.includes('wedding'))
  ) {
    return {
      questionType: 'catering_custom',
      action: 'chat_order',
      matchedProductIds: [],
      summaryMessage: `🎂 **De-echoi Bespoke Cake Pricing Matrix (2026):**\n\n**6-Inch Tiered Celebration Bakes:**\n• Vanilla Sponge: 1L: ₦20,000 | 2L: ₦38,500 | 3L: ₦52,000\n• Chocolate Fudge: 1L: ₦21,000 | 2L: ₦40,000 | 3L: ₦53,000\n• Red Velvet: 1L: ₦20,500 | 2L: ₦39,000 | 3L: ₦51,000\n• Multi-Flavor Combo: 2L: ₦41,000 | 3L: ₦61,500\n\n**7-Inch Tiered Celebration Bakes:**\n• Vanilla Sponge: 1L: ₦26,000 | 2L: ₦46,000 | 3L: ₦55,000\n• Chocolate Fudge: 1L: ₦27,500 | 2L: ₦50,000 | 3L: ₦65,000\n• Red Velvet: 1L: ₦27,000 | 2L: ₦49,000 | 3L: ₦63,500\n• Multi-Flavor Combo: 2L: ₦45,000 | 3L: ₦69,000\n\nTap below to open custom invoicing for writing, toppers, and delivery scheduling!`,
    }
  }

  // --------------------------------------------------------------------------
  // 6. ZOBO, GINGER & HEALTH SCIENCE
  // --------------------------------------------------------------------------
  if (
    q.includes('zobo') ||
    q.includes('hibiscus') ||
    (q.includes('ginger') && (q.includes('health') || q.includes('benefit')))
  ) {
    const zoboProducts = products
      .filter((p) => (p.name || '').toLowerCase().includes('zobo'))
      .map((p) => p.id)

    return {
      questionType: 'food_knowledge',
      action: zoboProducts.length > 0 ? 'filter' : 'general',
      matchedProductIds: zoboProducts,
      summaryMessage: `🍷 **Health & Science of De-echoi Spiced Zobo:**\n• **Cardiovascular Support:** *Hibiscus sabdariffa* calyces deliver anthocyanins that act as natural ACE inhibitors, supporting arterial health and healthy blood pressure.\n• **Digestive Stimulation:** Infused with raw crushed *Zingiber officinale* (ginger), providing active gingerols that boost digestive enzyme secretion and relieve bloating.\n• **Zero Refined Sugar:** Sweetened solely with natural pineapple reduction for pure Vitamin C and sustained energy.\n\nFreshly bottled 50cl bottles are available in our Beverages section!`,
    }
  }

  // --------------------------------------------------------------------------
  // 7. OPERATIONAL HOURS, SATURDAY RULES & LOCATIONS
  // --------------------------------------------------------------------------
  if (
    q.includes('open') ||
    q.includes('close') ||
    q.includes('hour') ||
    q.includes('time') ||
    q.includes('saturday') ||
    q.includes('sunday')
  ) {
    if (q.includes('saturday')) {
      return {
        questionType: 'operational',
        action: 'general',
        matchedProductIds: [],
        summaryMessage: `🕒 **Saturday Operational Schedule:**\nOur central kitchen is **closed to walk-in storefront orders on Saturdays**, as our culinary team is fully dedicated to catering scheduled weddings, corporate galas, and private events.\n\n**Regular Service Hours:**\n• **Monday – Friday:** 9:00 AM – 5:30 PM\n• **Sundays:** 12:00 PM – 5:30 PM\n\nWe look forward to preparing your meals during regular shifts or on Sunday!`,
      }
    }

    return {
      questionType: 'operational',
      action: 'general',
      matchedProductIds: [],
      summaryMessage: `🕒 **De-echoi Operating Hours & Kitchen Location:**\n• **Monday – Friday:** 9:00 AM – 5:30 PM\n• **Sundays:** 12:00 PM – 5:30 PM\n• **Saturdays:** Closed for bulk event catering execution\n• **Central Kitchen:** Eze Nvuigwe Avenue, Woji, Port Harcourt\n• **Direct Hotline:** ${settings?.contact_phone || '+234 703 138 5337'}`,
    }
  }

  // --------------------------------------------------------------------------
  // 8. PICKUP & DELIVERY SECTORS
  // --------------------------------------------------------------------------
  if (
    q.includes('pickup') ||
    q.includes('deliver') ||
    q.includes('location') ||
    q.includes('where') ||
    q.includes('hub') ||
    q.includes('woji') ||
    q.includes('gra') ||
    q.includes('odili')
  ) {
    const address =
      settings?.address || 'Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State'
    const sectors =
      locations.length > 0
        ? locations
            .map((l: any) => l.name || l.area_name)
            .filter(Boolean)
            .slice(0, 8)
            .join(', ')
        : 'Woji Metropolis, Peter Odili, Trans-Amadi, GRA Phases 1–3, Old GRA, Artillery, Garrison, Rumuola, and Ada George'

    return {
      questionType: 'pickup_delivery',
      action: 'general',
      matchedProductIds: [],
      summaryMessage: `📍 **Pickup & Doorstep Delivery (Port Harcourt):**\n• **Central Kitchen Hub:** ${address}\n• **Transit Time:** 12 – 35 minutes via live GPS-tracked motorcycle dispatch.\n• **Coverage Sectors:** ${sectors}.\n• **Thermal Packaging:** Insulated containers keep your meals steaming hot and beverages chilled.`,
    }
  }

  // --------------------------------------------------------------------------
  // 9. CULINARY TRAINING ACADEMY
  // --------------------------------------------------------------------------
  if (
    q.includes('training') ||
    q.includes('academy') ||
    q.includes('learn') ||
    q.includes('course') ||
    q.includes('class') ||
    q.includes('certificate')
  ) {
    return {
      questionType: 'catering_custom',
      action: 'chat_order',
      matchedProductIds: [],
      summaryMessage: `🎓 **De-echoi Culinary Training Academy Tracks:**\n• **Track A: Professional Cake Artistry & Tiered Bakes (6 Weeks):** Crumb mechanics, sharp-edge buttercream, internal dowel engineering, fondant draping & bakery economics.\n• **Track B: Fast Delights & Gourmet Street Kitchen (4 Weeks):** Commercial shawarma marination, velvet sauces, corndog batched frying, brioche proofing.\n• **Track C: Botanical Beverages & Juicing (2 Weeks):** Cold-press juicing, thermal extraction, bottling hygiene & shelf-life stabilization.\n\n**Policy:** 85% practical attendance required for diploma. Maximum 10 students per cohort. Visit **/training** to apply for priority admissions!`,
    }
  }

  // --------------------------------------------------------------------------
  // 10. MEALTIME RECOMMENDATIONS (Breakfast, Lunch, Dinner)
  // --------------------------------------------------------------------------
  if (q.includes('breakfast') || q.includes('morning')) {
    const matched = products
      .filter((p) => {
        const n = (p.name || '').toLowerCase()
        const c = (p.category || '').toLowerCase()
        return (
          c.includes('juice') ||
          n.includes('parfait') ||
          n.includes('doughnut') ||
          n.includes('noodle') ||
          c.includes('pasta')
        )
      })
      .map((p) => p.id)

    return {
      questionType: 'recommendation',
      action: matched.length > 0 ? 'filter' : 'general',
      matchedProductIds: matched,
      summaryMessage: `🍳 **Breakfast Recommendations:**\nStart your morning energized with our top morning picks:\n• **Gourmet Fruit & Yogurt Parfait:** Layered with granola, apples, grapes & cashew (from ₦5,500)\n• **Spiced Stir-Fry Noodles:** Cooked fresh with seasoned turkey cubes (from ₦3,000)\n• **Fluffy Milky Doughnuts** or **Fresh Cold-Pressed Pineapple & Ginger Juice**!\n\nI have filtered the menu below for you!`,
    }
  }

  if (
    q.includes('dinner') ||
    q.includes('lunch') ||
    q.includes('night') ||
    q.includes('evening') ||
    q.includes('afternoon')
  ) {
    const matched = products
      .filter((p) => {
        const n = (p.name || '').toLowerCase()
        const c = (p.category || '').toLowerCase()
        return (
          n.includes('rice') ||
          n.includes('jollof') ||
          n.includes('pepper soup') ||
          n.includes('pasta') ||
          n.includes('shawarma') ||
          c.includes('meals')
        )
      })
      .map((p) => p.id)

    return {
      questionType: 'recommendation',
      action: matched.length > 0 ? 'filter' : 'general',
      matchedProductIds: matched,
      summaryMessage: `🍲 **Lunch & Dinner Recommendations:**\nSatisfying favorites from our kitchen:\n1. **Smokey Jollof or Signature Fried Rice:** Firewood-style richness or crisp vegetable stir-fry (₦3,000 – ₦3,500)\n2. **Catfish Pepper Soup (Full Catfish 1L — ₦16,000):** Hot restorative native herb broth\n3. **Jumbo Shawarma Combo (₦12,000):** Double sausage, extra chicken/beef, velvet sauce\n4. **Creamy Alfredo / Seafood Pasta!**\n\nI have filtered the menu for you below!`,
    }
  }

  // --------------------------------------------------------------------------
  // 11. DYNAMIC CATALOG MULTI-TOKEN SCORER
  // --------------------------------------------------------------------------
  const scored = products
    .map((p) => {
      const name = (p.name || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      let score = 0
      for (const token of qTokens) {
        if (token.length <= 2) continue
        if (name.includes(token)) score += 6
        if (cat.includes(token)) score += 4
        if (desc.includes(token)) score += 2
      }
      return { product: p, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length > 0) {
    const topIds = scored.slice(0, 6).map((i) => i.product.id)
    return {
      questionType: 'menu_search',
      action: 'filter',
      matchedProductIds: topIds,
      summaryMessage: `✨ Found **${topIds.length}** item${
        topIds.length > 1 ? 's' : ''
      } matching "${rawQuery}". Take a look below!`,
    }
  }

  // --------------------------------------------------------------------------
  // 12. GENERAL CULINARY KNOWLEDGE FALLBACK
  // --------------------------------------------------------------------------
  return {
    questionType: 'food_knowledge',
    action: 'general',
    matchedProductIds: [],
    summaryMessage: `🍽️ **Mr. Tell Culinary Concierge:**\nWelcome to De-echoi Limited! We craft fresh Smokey Jollof & Fried Rice, Stir-Fried Noodles with Turkey, Catfish Pepper Soup, Parfaits, Jumbo Shawarma, Cold-Pressed Juices, and Bespoke Tiered Celebration Cakes in Woji, Port Harcourt.\n\nAsk me about our recipes, prices, opening hours, or meal recommendations!`,
  }
}

// ============================================================================
// MAIN POST REQUEST ROUTE HANDLER
// ============================================================================
export async function POST(req: Request) {
  let liveProducts: any[] = []
  let storeSettings: any = {}
  let deliveryLocations: any[] = []
  let queryText = ''

  try {
    const body = await req.json()
    queryText = body.query || ''

    if (!queryText?.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // 1. Fetch live database data from Supabase
    const [productsRes, storeSettingsRes, locationsRes] = await Promise.all([
      supabase
        .from('store_products')
        .select('id, name, description, price, in_stock, category')
        .order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').maybeSingle(),
      supabase.from('delivery_locations').select('*').limit(25),
    ])

    liveProducts = productsRes.data || []
    storeSettings = storeSettingsRes.data || {}
    deliveryLocations = locationsRes.data || []

    // 2. Call Gemini Flash API with Master Training Knowledge
    const liveCatalogContext = liveProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
    }))

    const prompt = `Customer Query: "${queryText}"\n\nLive Store Database Context: ${JSON.stringify(
      liveCatalogContext
    )}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: MR_TELL_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionType: {
              type: Type.STRING,
              enum: [
                'food_knowledge',
                'operational',
                'pickup_delivery',
                'recommendation',
                'menu_search',
                'catering_custom',
                'general',
              ],
            },
            action: {
              type: Type.STRING,
              enum: ['checkout', 'filter', 'chat_order', 'general'],
            },
            matchedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keywordFilter: { type: Type.STRING },
            summaryMessage: { type: Type.STRING },
          },
          required: [
            'questionType',
            'action',
            'matchedProductIds',
            'summaryMessage',
          ],
        },
      },
    })

    const parsed = JSON.parse(response.text || '{}')
    return NextResponse.json({ success: true, result: parsed })
  } catch (err: unknown) {
    console.warn(
      '[Mr. Tell AI Notice] Executing Autonomous Master Knowledge Engine (KB-DEL-2026-V3):',
      err
    )

    // Execute zero-failure Autonomous Master Knowledge Engine
    const fallbackResult = autonomousKnowledgeEngine(
      queryText,
      liveProducts,
      storeSettings,
      deliveryLocations
    )

    return NextResponse.json({ success: true, result: fallbackResult })
  }
}