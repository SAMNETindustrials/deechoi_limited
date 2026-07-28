import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function setupPaymentProofBucket() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === 'payment-proofs')

    if (!bucketExists) {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('payment-proofs', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      })

      if (error) throw error
      console.log('[v0] Created payment-proofs bucket:', data)
    } else {
      console.log('[v0] payment-proofs bucket already exists')
    }
  } catch (error) {
    console.error('[v0] Error setting up storage bucket:', error)
    throw error
  }
}
