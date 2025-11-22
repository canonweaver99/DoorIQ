// Feature keys matching the database feature_flags table
// This file contains only constants and can be imported in client components

export const FEATURES = {
  ALL_AGENTS: 'all_agents',
  UNLIMITED_SESSIONS: 'unlimited_sessions',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CALL_RECORDING: 'call_recording',
  EXPORT_REPORTS: 'export_reports',
  CUSTOM_SCENARIOS: 'custom_scenarios',
  TEAM_FEATURES: 'team_features',
  PRIORITY_SUPPORT: 'priority_support',
  BASIC_AGENTS: 'basic_agents',
  BASIC_SESSIONS: 'basic_sessions',
  LEARNING_PAGE: 'learning_page',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

