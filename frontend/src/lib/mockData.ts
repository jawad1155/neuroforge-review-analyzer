import type { AnalysisResponse } from './api'

export const DEFAULT_INTELLIGENCE: AnalysisResponse = {
  success: true,
  stats: {
    total_reviews: 1248,
    average_length: 154.2,
    rating_distribution: { '5': '55%', '4': '25%', '3': '8%', '2': '7%', '1': '5%' },
  },
  sentiment: { positive: 82, neutral: 7, negative: 11 },
  positive_topics: [
    { name: 'Sound Quality', percent: 34 },
    { name: 'Comfort', percent: 27 },
    { name: 'Design', percent: 19 },
  ],
  negative_topics: [
    { name: 'Battery Life', percent: 31 },
    { name: 'Bluetooth', percent: 18 },
    { name: 'Price', percent: 14 },
  ],
  common_praise: ['Sound quality', 'Comfort', 'Industrial design'],
  common_complaints: ['Battery performance', 'Bluetooth stability', 'Price'],
  recommendations: ['Improve battery consistency', 'Prioritize Bluetooth stability testing'],
  summary:
    "Customers generally value the product's sound quality, comfort and design. Battery performance is the most common complaint, making reliability the clearest improvement opportunity.",
  reviews: [
    { name: 'Aisha', text: 'The sound quality is amazing and very comfortable for long sessions.', rating: 5, sentiment: 'Positive' },
    { name: 'Hamza', text: 'Battery dies much faster than expected. Bluetooth also disconnects sometimes.', rating: 2, sentiment: 'Negative' },
    { name: 'Sara', text: 'Beautiful design, excellent audio and comfortable ear cushions.', rating: 5, sentiment: 'Positive' },
    { name: 'Omar', text: 'Decent for the price, but the carrying case feels a bit cheap.', rating: 3, sentiment: 'Neutral' },
    { name: 'Lina', text: 'Great noise cancelling. The fit gets a little tight after an hour.', rating: 4, sentiment: 'Positive' },
  ],
}
