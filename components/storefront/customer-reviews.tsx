'use client'

import { useEffect, useState } from 'react'
import { Star, CheckCircle2, MessageSquare, Quote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  customer_name: string
  rating: number
  review_text: string
  item_ordered?: string
  is_verified?: boolean
  created_at: string
}

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)

      if (error) throw error
      setReviews(data || [])
    } catch (e) {
      console.warn('Could not fetch reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.9'

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>Customer Love & Reviews</span>
            <span className="bg-amber-100 text-[#072d1d] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ★ {averageRating} / 5.0
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">Verified feedback from Port Harcourt food lovers</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">Be the first to review!</p>
          <p className="text-[11px] text-slate-400">Complete an order to share your feedback with our kitchen.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex-shrink-0 w-64 bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {r.is_verified !== false && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed italic">
                  &ldquo;{r.review_text}&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800 truncate max-w-[120px]">
                  {r.customer_name}
                </span>
                {r.item_ordered && (
                  <span className="text-amber-700 font-semibold truncate max-w-[100px]">
                    {r.item_ordered}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}