import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

// Define the structured tool that Gemini can invoke to issue invoices
const paymentTool = {
  name: 'send_payment_request',
  description: 'Issues an in-chat payment invoice and checkout button when a customer specifies their order details or requests payment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_name: {
        type: Type.STRING,
        description: 'Name of the item (e.g., "7-Inch Custom Celebration Cake", "Jumbo Shawarma Combo")',
      },
      category: {
        type: Type.STRING,
        description: 'Category of item: "Cakes", "Meals", "Shawarma", "Academy", or "Catering"',
      },
      size: {
        type: Type.STRING,
        description: 'Size or tier dimension (e.g., "7-inch (2-Layer)", "6-inch", "Jumbo")',
      },
      flavor: {
        type: Type.STRING,
        description: 'Flavor, fillings, or mix (e.g., "Red Velvet & Whipped Vanilla")',
      },
      amount: {
        type: Type.NUMBER,
        description: 'Total amount in Nigerian Naira (₦)',
      },
      delivery_mode: {
        type: Type.STRING,
        description: 'Fulfillment type (e.g., "Doorstep Delivery to Woji, Port Harcourt", "Storefront Pickup")',
      },
      note: {
        type: Type.STRING,
        description: 'Payment note or deposit explanation (e.g., "50% Upfront Commitment Deposit")',
      },
      assistant_message: {
        type: Type.STRING,
        description: 'A message to send alongside the payment card explaining the specifications.',
      },
    },
    required: ['item_name', 'amount', 'assistant_message'],
  },
}

export async function processCustomerMessageWithGemini({
  inquiryId,
  customerName,
  conversationHistory,
  incomingMessage,
}: {
  inquiryId: string
  customerName: string
  conversationHistory: Array<{ sender: 'customer' | 'admin'; text: string }>
  incomingMessage: string
}) {
  const systemInstruction = `
You are the automated Head Chef & Customer Support Representative for "DE-ECHOI LIMITED", a food kitchen, bespoke bakery, and culinary training academy based in Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria.

YOUR BEHAVIOR:
1. Speak with warmth, professionalism, clarity, and authentic hospitality.
2. If the customer asks general questions, answer directly with accurate culinary advice.
3. If the customer is ordering a custom cake, meal pack, or catering, confirm their exact preferences (Size, Flavor, Delivery/Pickup location).
4. When you have enough details to quote a price, or if the customer explicitly asks to pay, invoke the \`send_payment_request\` tool with accurate specifications and pricing in Naira (₦).
   - Custom 6" Tiered Cakes typically cost ₦25,000 - ₦35,000.
   - Custom 7" Tiered Cakes typically cost ₦35,000 - ₦55,000.
   - Jumbo Shawarma combos cost ₦4,500 - ₦8,000.
5. Address the customer as ${customerName}.
`

  // Format history for Gemini multi-turn format
  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.sender === 'admin' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: incomingMessage }],
    },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [paymentTool] }],
    },
  })

  // Check if Gemini decided to invoke the payment tool
  const functionCalls = response.functionCalls
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0]
    if (call.name === 'send_payment_request') {
      const args = call.args as {
        item_name: string
        category?: string
        size?: string
        flavor?: string
        amount: number
        delivery_mode?: string
        note?: string
        assistant_message?: string
      }

      const paymentReference = `AI-DE-${Date.now().toString().slice(-6)}`
      const checkoutParams = new URLSearchParams({
        amount: String(args.amount),
        ref: paymentReference,
        inquiryId,
        item_name: args.item_name,
        size: args.size || 'Standard Tier',
        flavor: args.flavor || 'Custom Recipe',
        category: args.category || 'Custom',
        delivery: args.delivery_mode || 'Pickup / Fast Delivery',
        note: args.note || 'Kitchen Order Payment',
      })

      return {
        type: 'payment_request' as const,
        message: args.assistant_message || `Here is your payment invoice for ${args.item_name}.`,
        metadata: {
          amount: args.amount,
          item_name: args.item_name,
          category: args.category || 'Custom',
          size: args.size || 'Standard Tier',
          flavor: args.flavor || 'Custom Recipe',
          delivery_mode: args.delivery_mode || 'Doorstep Delivery',
          note: args.note || 'Custom Order Payment',
          status: 'pending',
          reference: paymentReference,
          payment_url: `/checkout?${checkoutParams.toString()}`,
          created_at: new Date().toISOString(),
        },
      }
    }
  }

  // Normal text reply
  return {
    type: 'text' as const,
    message: response.text || 'Thank you for your message! Our kitchen team is preparing your request.',
    metadata: null,
  }
}