import { useCallback, useEffect, useRef, useState } from 'react'

const getHeaders = () => {
  const token = localStorage.getItem('campushub_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiGet(url) {
  const res = await fetch(url, { headers: getHeaders() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    if (res.status === 409) throw new Error('You have already reviewed this order.')
    throw new Error(data.message || 'Request failed')
  }
  return data
}

// Star rating display (read-only)
function StarDisplay({ rating, size = 'sm' }) {
  const full = Math.round(rating)
  const cls = size === 'lg' ? 'text-2xl' : 'text-base'
  return (
    <span className={cls} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? 'text-amber-400' : 'text-muted-text/30'}>
          ★
        </span>
      ))}
    </span>
  )
}

// Star rating input (interactive)
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className="text-2xl transition-transform hover:scale-110 focus:outline-none cursor-pointer"
          >
            <span
              className={
                star <= (hovered || value)
                  ? 'text-amber-400'
                  : 'text-muted-text/30'
              }
            >
              ★
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Single review card
function ReviewCard({ review }) {
  const name = review.userId?.name || 'Anonymous'
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-text">{name}</p>
          <p className="mt-0.5 text-xs text-muted-text">{date}</p>
        </div>
        <StarDisplay rating={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-6 text-muted-text">{review.comment}</p>
      )}
    </article>
  )
}

// Review form — only shown when completedOrders is non-empty
function ReviewForm({ completedOrders, onSubmitted }) {
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const activeOrderId =
    selectedOrderId && completedOrders.some((order) => order._id === selectedOrderId)
      ? selectedOrderId
      : completedOrders[0]?._id || ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) {
      setError('Please select a star rating.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await apiPost('/api/reviews', { orderId: activeOrderId, rating, comment })
      setSuccess('Review submitted successfully.')
      setRating(0)
      setComment('')
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <h4 className="text-lg font-bold text-text">Write a Review</h4>
      <p className="mt-1 text-sm text-muted-text">
        Only completed orders can be reviewed. One review per order.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="mt-5 space-y-5">
        {completedOrders.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Select Order
            </label>
            <select
              value={activeOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {completedOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderToken} — ₹{order.totalAmount}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Rating <span className="text-danger">*</span>
          </label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Comment <span className="text-muted-text">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Share your experience…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted-text/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-text">
            {comment.length}/500
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}

// Main ShopReviews component
export default function ShopReviews({ shopId, userRole }) {
  const isStudent = userRole === 'student'
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Completed orders for this shop from the current user (for the review form)
  const [completedOrders, setCompletedOrders] = useState([])
  const [totalShopOrdersCount, setTotalShopOrdersCount] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(isStudent)
  const [ordersError, setOrdersError] = useState('')

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadReviewData = useCallback(async () => {
    if (!shopId) return

    try {
      const promises = [apiGet(`/api/reviews/shop/${shopId}`)]
      if (isStudent) {
        promises.push(apiGet('/api/orders?status=completed&limit=100'))
      }

      const results = await Promise.allSettled(promises)
      const reviewsResult = results[0]
      const ordersResult = isStudent ? results[1] : null

      if (!isMountedRef.current) return

      let currentReviews = []
      if (reviewsResult.status === 'fulfilled') {
        currentReviews = reviewsResult.value.reviews || []
        setReviews(currentReviews)
        setAverageRating(reviewsResult.value.averageRating || 0)
        setReviewCount(reviewsResult.value.reviewCount || 0)
        setError('')
      } else {
        setReviews([])
        setAverageRating(0)
        setReviewCount(0)
        setError(reviewsResult.reason?.message || 'Failed to load reviews.')
      }

      if (isStudent && ordersResult) {
        if (ordersResult.status === 'fulfilled') {
          setOrdersError('')
          const reviewedOrderIds = new Set(
            currentReviews.map((r) => String(r.orderId))
          )
          const shopOrders = (ordersResult.value.data || []).filter(
            (o) => String(o.shopId?._id || o.shopId) === String(shopId)
          )
          setTotalShopOrdersCount(shopOrders.length)

          const eligible = shopOrders.filter(
            (o) => !reviewedOrderIds.has(String(o._id))
          )
          setCompletedOrders(eligible)
        } else {
          setCompletedOrders([])
          setTotalShopOrdersCount(0)
          setOrdersError(
            ordersResult.reason?.message || 'Failed to check order review eligibility.'
          )
        }
      } else {
        setCompletedOrders([])
        setTotalShopOrdersCount(0)
        setOrdersError('')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setOrdersLoading(false)
      }
    }
  }, [shopId, isStudent])

  useEffect(() => {
    loadReviewData()
  }, [loadReviewData])

  const handleReviewSubmitted = () => {
    setLoading(true)
    if (isStudent) setOrdersLoading(true)
    setError('')
    setOrdersError('')
    loadReviewData()
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Reviews</h2>
          {!loading && !error && (
            <div className="mt-1 flex items-center gap-3">
              <StarDisplay rating={averageRating} size="lg" />
              <span className="text-lg font-semibold text-text">
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}
              </span>
              <span className="text-sm text-muted-text">
                ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review Form Section (Students only) */}
      {isStudent && (
        <>
          {ordersLoading && (
            <div className="mb-8 flex items-center gap-3 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-sm text-muted-text">Checking order eligibility…</p>
            </div>
          )}

          {!ordersLoading && ordersError && (
            <div className="mb-8 rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <p className="font-semibold">Unable to check review eligibility</p>
              <p className="mt-1 text-xs">{ordersError}</p>
            </div>
          )}

          {!ordersLoading && !ordersError && completedOrders.length > 0 && (
            <div className="mb-8">
              <ReviewForm
                completedOrders={completedOrders}
                onSubmitted={handleReviewSubmitted}
              />
            </div>
          )}

          {!ordersLoading && !ordersError && completedOrders.length === 0 && totalShopOrdersCount > 0 && (
            <div className="mb-8 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
              <p className="text-2xl mb-1">✅</p>
              <h4 className="font-bold text-text">All your completed orders for this shop have been reviewed</h4>
              <p className="mt-1 text-sm text-muted-text">
                Thank you for sharing your feedback!
              </p>
            </div>
          )}

          {!ordersLoading && !ordersError && completedOrders.length === 0 && totalShopOrdersCount === 0 && (
            <div className="mb-8 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-8 text-center">
              <p className="text-2xl mb-1">🛍️</p>
              <h4 className="font-bold text-text">Want to review this shop?</h4>
              <p className="mt-1 text-sm text-muted-text">
                Only customers with a completed order can write a review. Place and complete an order to share your feedback!
              </p>
            </div>
          )}
        </>
      )}

      {/* Reviews List */}
      {loading && (
        <div className="flex items-center gap-3 py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-text">Loading reviews…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
          <p className="text-2xl mb-2">⭐</p>
          <p className="font-semibold text-text">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-text">
            Be the first to review this shop after completing an order.
          </p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}
