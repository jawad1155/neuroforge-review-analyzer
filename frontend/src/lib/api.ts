import axios from 'axios'

export interface TopicItem {
  name: string
  percent: number
}

export interface ReviewItem {
  name: string
  text: string
  rating: number
  sentiment: 'Positive' | 'Neutral' | 'Negative' | string
}

export interface AnalysisStats {
  total_reviews: number
  average_length: number
  rating_distribution: Record<string, string>
}

export interface AnalysisResponse {
  success: boolean
  stats: AnalysisStats
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  positive_topics: TopicItem[]
  negative_topics: TopicItem[]
  common_praise: string[]
  common_complaints: string[]
  recommendations: string[]
  summary: string
  reviews: ReviewItem[]
  error?: string
}

export interface AskAIResponse {
  success: boolean
  question?: string
  answer: string
  error?: string
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  headers: { Accept: 'application/json' },
})

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeTopics = (items: unknown): TopicItem[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === 'string') return { name: item, percent: 0 }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      return {
        name: String(record.topic ?? record.name ?? record.label ?? 'Unknown topic'),
        percent: Math.max(0, Math.min(100, Math.round(toNumber(record.percentage ?? record.percent)))),
      }
    })
    .filter((item): item is TopicItem => Boolean(item))
}

const normalizeReviews = (items: unknown): ReviewItem[] => {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      name: String(record.name ?? record.customer ?? record.author ?? `Customer ${index + 1}`),
      text: String(record.text ?? record.review ?? record.comment ?? ''),
      rating: Math.max(0, Math.min(5, toNumber(record.rating))),
      sentiment: String(record.sentiment ?? 'Neutral'),
    }
  })
}

const normalizeAnalysis = (payload: Record<string, unknown>): AnalysisResponse => {
  const rawStats = (payload.stats ?? {}) as Record<string, unknown>
  const rawSentiment = (payload.sentiment ?? {}) as Record<string, unknown>
  const total = toNumber(rawStats.total_reviews ?? payload.total)

  return {
    success: payload.success !== false,
    stats: {
      total_reviews: total,
      average_length: toNumber(rawStats.average_length),
      rating_distribution: (rawStats.rating_distribution ?? {}) as Record<string, string>,
    },
    sentiment: {
      positive: toNumber(rawSentiment.positive),
      neutral: toNumber(rawSentiment.neutral),
      negative: toNumber(rawSentiment.negative),
    },
    positive_topics: normalizeTopics(payload.positive_topics),
    negative_topics: normalizeTopics(payload.negative_topics),
    common_praise: Array.isArray(payload.common_praise) ? payload.common_praise.map(String) : [],
    common_complaints: Array.isArray(payload.common_complaints) ? payload.common_complaints.map(String) : [],
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations.map(String) : [],
    summary: String(payload.summary ?? 'Analysis complete. Review the signals below for the clearest opportunities.'),
    reviews: normalizeReviews(payload.reviews),
    error: payload.error ? String(payload.error) : undefined,
  }
}

export const apiService = {
  async getHealth(): Promise<{ status: string }> {
    const response = await client.get<{ status: string }>('/health')
    return response.data
  },

  async analyzeFile(file: File): Promise<AnalysisResponse> {
    const body = new FormData()
    body.append('file', file)
    const response = await client.post<Record<string, unknown>>('/analyze', body)
    return normalizeAnalysis(response.data)
  },

  async askAI(question: string, reviews: string[]): Promise<AskAIResponse> {
    const response = await client.post<AskAIResponse>('/ask', { question, reviews })
    return response.data
  },
}
