export const typeDefs = `
  type Query {
    customer(id: ID!): Customer
    customers(industry: IndustryType, limit: Int, offset: Int): [Customer!]!
    industryBenchmarks(industry: IndustryType!): IndustryBenchmarks
    industryMetrics(customerId: ID!, industry: IndustryType!): [IndustryMetric!]!
    customerInsights(customerId: ID!): [IndustryInsight!]!
    behavioralPatterns(customerId: ID!, industry: IndustryType): [BehavioralPattern!]!
  }

  type Mutation {
    trackEvent(customerId: ID!, event: EventInput!): EventResponse
    updateCustomerProfile(customerId: ID!, profile: CustomerProfileInput!): Customer
    generateRecommendations(customerId: ID!): [Recommendation!]!
  }

  type Subscription {
    customerAnalyticsUpdated(customerId: ID!): CustomerAnalyticsUpdate
    realTimeMetrics(industry: IndustryType): IndustryMetric
  }

  enum IndustryType {
    COLLEGE_CONSULTING
    SAAS
    ECOMMERCE
    FINTECH
    HEALTHCARE
    MANUFACTURING
    REAL_ESTATE
    EDUCATION
    NONPROFIT
  }

  enum CompanySize {
    STARTUP
    SMALL
    MEDIUM
    LARGE
    ENTERPRISE
  }

  type Customer {
    id: ID!
    industryType: IndustryType!
    companySize: CompanySize!
    profile: CustomerProfile!
    insights: [IndustryInsight!]!
    metrics: [IndustryMetric!]!
    behavioralPatterns: [BehavioralPattern!]!
    recommendations: [Recommendation!]!
    lastUpdated: String!
  }

  type CustomerProfile {
    customerId: String!
    industryType: IndustryType!
    companySize: CompanySize!
    businessModel: String
    seasonality: SeasonalityPattern
    customFields: JSON
  }

  type SeasonalityPattern {
    peakMonths: [Int!]!
    lowMonths: [Int!]!
    cycleDuration: Int!
    intensity: Float!
  }

  type IndustryMetric {
    id: String!
    name: String!
    value: Float!
    unit: String!
    trend: TrendDirection!
    benchmark: Float
    percentile: Float
    confidence: Float!
    industrySpecific: Boolean!
  }

  enum TrendDirection {
    INCREASING
    DECREASING
    STABLE
  }

  type BehavioralPattern {
    id: String!
    name: String!
    pattern: String!
    frequency: Float!
    significance: Float!
    industry: IndustryType!
    context: JSON
  }

  type IndustryInsight {
    id: String!
    industryType: IndustryType!
    category: InsightCategory!
    title: String!
    description: String!
    recommendation: String!
    confidence: Float!
    priority: Priority!
    impactScore: Float!
    timestamp: String!
    metrics: [IndustryMetric!]!
    patterns: [BehavioralPattern!]!
  }

  enum InsightCategory {
    ENGAGEMENT
    CONVERSION
    RETENTION
    REVENUE
    BEHAVIOR
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type Recommendation {
    category: String!
    action: String!
    reasoning: String!
    expectedImpact: String!
    timeframe: String!
    effort: Effort!
  }

  enum Effort {
    LOW
    MEDIUM
    HIGH
  }

  type IndustryBenchmarks {
    industry: IndustryType!
    metrics: JSON!
    lastUpdated: String!
  }

  input EventInput {
    type: String!
    properties: JSON
    timestamp: String
  }

  input CustomerProfileInput {
    industryType: IndustryType!
    companySize: CompanySize!
    businessModel: String
    customFields: JSON
  }

  type EventResponse {
    success: Boolean!
    eventId: String
    message: String
  }

  type CustomerAnalyticsUpdate {
    customerId: String!
    type: String!
    data: JSON!
    timestamp: String!
  }

  scalar JSON
`;

export default typeDefs;
