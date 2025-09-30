export const ALLOWED_AGENT_ORDER = [
  'Austin',
  'Tiger Tom',
  'Tiger Tony',
  'Sheep Shelley',
  'Sheep Sam',
  'Sheep Sandy',
  'Bull Brad',
  'Bull Barry',
  'Bull Brenda',
  'Owl Olivia',
  'Owl Oscar',
] as const

export type AllowedAgentName = typeof ALLOWED_AGENT_ORDER[number]

export const ALLOWED_AGENT_SET = new Set<AllowedAgentName>(ALLOWED_AGENT_ORDER)

export const ORDER_LOOKUP = new Map<AllowedAgentName, number>(
  ALLOWED_AGENT_ORDER.map((name, index) => [name, index])
)

type BubbleDifficulty = 'Moderate' | 'Hard' | 'Very Hard' | 'Expert'
type BubbleColorVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary'
  | 'quinary'
  | 'senary'
  | 'septenary'
  | 'octonary'
  | 'nonary'
  | 'denary'
  | 'duodenary'
type CardDifficultyKey = 'moderate' | 'hard' | 'veryHard' | 'expert'

interface PersonaBubbleDetail {
  subtitle: string
  description: string
  difficulty: BubbleDifficulty
  color: BubbleColorVariant
}

interface PersonaCardDetail {
  age: number
  occupation: string
  location: string
  personality: string
  challengeLevel: number
  challengeLabel: string
  difficultyKey: CardDifficultyKey
  traits: string[]
  bestFor: string
  estimatedTime: string
  startingScore: number
  targetScore: number
  avatar: string
  color: string
  recommended?: boolean
  mostChallenging?: boolean
  elevenAgentId?: string
}

interface PersonaMetadata {
  bubble: PersonaBubbleDetail
  card: PersonaCardDetail
}

export const PERSONA_METADATA: Record<AllowedAgentName, PersonaMetadata> = {
  Austin: {
    bubble: {
      subtitle: 'Skeptical but Fair',
      description: 'Direct communicator who asks tough questions and spots pressure tactics instantly.',
      difficulty: 'Moderate',
      color: 'primary',
    },
    card: {
      age: 38,
      occupation: 'Works from Home',
      location: 'Round Rock, TX',
      personality: 'Skeptical but fair, direct communicator',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Asks direct questions about pricing and guarantees',
        'Detects pressure tactics immediately',
        'Terminates after three pricing deflections',
        'Pets and child safety are top priorities',
      ],
      bestFor: 'Building foundational objection handling and trust',
      estimatedTime: '5-8 min',
      startingScore: 50,
      targetScore: 70,
      avatar: '🏡',
      color: 'green',
      recommended: true,
      elevenAgentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
    },
  },
  'Tiger Tom': {
    bubble: {
      subtitle: 'Competitive Strategist',
      description: 'High-energy neighbor demanding premium performance and measurable wins.',
      difficulty: 'Hard',
      color: 'tertiary',
    },
    card: {
      age: 44,
      occupation: 'Regional Sales Director',
      location: 'Plano, TX',
      personality: 'Hyper-competitive homeowner who loves scoreboard metrics',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Expects performance stats for every service tier',
        'Compares you to last year’s premium vendor',
        'Pushes for bundle discounts with ROI proof',
        'Keeps conversations under seven minutes',
      ],
      bestFor: 'Practicing confident premium closes and value framing',
      estimatedTime: '8-12 min',
      startingScore: 55,
      targetScore: 95,
      avatar: '🐯',
      color: 'orange',
    },
  },
  'Tiger Tony': {
    bubble: {
      subtitle: 'Executive Challenger',
      description: 'Operations executive expecting bulletproof process, documentation, and next steps.',
      difficulty: 'Very Hard',
      color: 'nonary',
    },
    card: {
      age: 52,
      occupation: 'Operations Executive',
      location: 'Downtown corporate high-rise',
      personality: 'Detail-obsessed leader demanding documented precision',
      challengeLevel: 4,
      challengeLabel: 'Very Hard',
      difficultyKey: 'veryHard',
      traits: [
        'Requires implementation timeline with named owners',
        'Wants escalation policy and service-level guarantees',
        'Requests references from enterprise clients',
        'Expects same-day follow-up memo summarizing commitments',
      ],
      bestFor: 'Refining enterprise-level discovery and next steps',
      estimatedTime: '10-15 min',
      startingScore: 58,
      targetScore: 110,
      avatar: '🐯',
      color: 'amber',
    },
  },
  'Sheep Shelley': {
    bubble: {
      subtitle: 'Community Gatekeeper',
      description: 'Warm but cautious neighbor who needs social proof and HOA-aligned scheduling.',
      difficulty: 'Moderate',
      color: 'quinary',
    },
    card: {
      age: 36,
      occupation: 'Community Organizer',
      location: 'Master-planned neighborhood',
      personality: 'Harmony-seeking, heavily influenced by neighbors',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Needs to hear real neighbor success stories',
        'Coordinates everything around HOA quiet hours',
        'Focuses on pet and toddler safety before price',
        'Values polite tone and clear, patient pacing',
      ],
      bestFor: 'Building trust with social proof and empathy',
      estimatedTime: '6-9 min',
      startingScore: 52,
      targetScore: 85,
      avatar: '🐑',
      color: 'teal',
      recommended: true,
    },
  },
  'Sheep Sam': {
    bubble: {
      subtitle: 'Family Planner',
      description: 'Schedule-driven parent balancing HOA, carpool, and safety timelines.',
      difficulty: 'Hard',
      color: 'secondary',
    },
    card: {
      age: 41,
      occupation: 'Middle School Teacher',
      location: 'Family cul-de-sac',
      personality: 'Practical planner who documents every commitment',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Needs calendar alignment with family events',
        'Asks about bundling with two neighbor homes',
        'Wants written pet-safe product list',
        'Checks for satisfaction guarantees before deciding',
      ],
      bestFor: 'Practicing scheduling alignment and safety assurances',
      estimatedTime: '7-10 min',
      startingScore: 54,
      targetScore: 90,
      avatar: '🐑',
      color: 'emerald',
    },
  },
  'Sheep Sandy': {
    bubble: {
      subtitle: 'Risk Auditor',
      description: 'Detail-heavy homeowner demanding policy clarity and documentation.',
      difficulty: 'Very Hard',
      color: 'quaternary',
    },
    card: {
      age: 47,
      occupation: 'Senior Accountant',
      location: 'Quiet suburban street',
      personality: 'Risk-averse, documentation-first decision maker',
      challengeLevel: 4,
      challengeLabel: 'Very Hard',
      difficultyKey: 'veryHard',
      traits: [
        'Requires certificates of insurance and licensing upfront',
        'Cross-checks every claim against printed literature',
        'Needs contingency plan for technician no-shows',
        'Requests written allergy and sensitivity policies',
      ],
      bestFor: 'Handling compliance questions under pressure',
      estimatedTime: '9-13 min',
      startingScore: 57,
      targetScore: 105,
      avatar: '🐑',
      color: 'blue',
    },
  },
  'Bull Brad': {
    bubble: {
      subtitle: 'Budget Enforcer',
      description: 'Retired veteran with an ironclad budget and loyalty to DIY sprays.',
      difficulty: 'Hard',
      color: 'senary',
    },
    card: {
      age: 60,
      occupation: 'Retired Veteran',
      location: 'Single-story ranch home',
      personality: 'Cost-conscious, values loyalty and respect',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Caps monthly spend under $35 without proof of value',
        'Compares everything to discount store sprays',
        'Wants military discount and VAT transparency',
        'Checks for hidden cancellation fees',
      ],
      bestFor: 'Negotiating value and discount positioning',
      estimatedTime: '8-11 min',
      startingScore: 50,
      targetScore: 92,
      avatar: '🐂',
      color: 'crimson',
    },
  },
  'Bull Barry': {
    bubble: {
      subtitle: 'Numbers Investor',
      description: 'Data-obsessed homeowner requiring multi-year ROI before signing.',
      difficulty: 'Very Hard',
      color: 'septenary',
    },
    card: {
      age: 57,
      occupation: 'Investment Broker',
      location: 'Golf course community',
      personality: 'Analytical, blunt, always negotiating terms',
      challengeLevel: 4,
      challengeLabel: 'Very Hard',
      difficultyKey: 'veryHard',
      traits: [
        'Asks for three-year ROI and churn metrics',
        'Demands contractual price-lock clauses',
        'Evaluates add-ons strictly by margin impact',
        'Keeps poker face until the very end',
      ],
      bestFor: 'Quantifying ROI and negotiating assertively',
      estimatedTime: '9-12 min',
      startingScore: 56,
      targetScore: 108,
      avatar: '🐂',
      color: 'maroon',
    },
  },
  'Bull Brenda': {
    bubble: {
      subtitle: 'Commanding Decision Maker',
      description: 'No-nonsense logistics director who expects compliance with her terms.',
      difficulty: 'Expert',
      color: 'octonary',
    },
    card: {
      age: 49,
      occupation: 'Logistics Director',
      location: 'Smart home on a busy corner lot',
      personality: 'Direct, uncompromising, decisive',
      challengeLevel: 5,
      challengeLabel: 'Expert',
      difficultyKey: 'expert',
      traits: [
        'Sets strict service windows and enforces punctuality',
        'Expects escalation contacts and response SLAs',
        'Requires leadership-level recap before signing',
        'Walks if confidence wavers even slightly',
      ],
      bestFor: 'Driving confident asks with assertive closings',
      estimatedTime: '11-15 min',
      startingScore: 60,
      targetScore: 120,
      avatar: '🐂',
      color: 'scarlet',
      mostChallenging: true,
    },
  },
  'Owl Olivia': {
    bubble: {
      subtitle: 'Data-Driven Strategist',
      description: 'Research scientist expecting citations, provenance, and environmental proof.',
      difficulty: 'Expert',
      color: 'denary',
    },
    card: {
      age: 48,
      occupation: 'Research Scientist',
      location: 'Eco-conscious smart home',
      personality: 'Analytical, thoughtful, politely skeptical',
      challengeLevel: 5,
      challengeLabel: 'Expert',
      difficultyKey: 'expert',
      traits: [
        'Demands third-party studies for every chemical',
        'Questions sourcing, supply chain, and sustainability',
        'Needs integration plan for existing monitoring tech',
        'Requests written experiment-style recap at close',
      ],
      bestFor: 'Citing data, compliance, and eco-friendly proof points',
      estimatedTime: '12-16 min',
      startingScore: 62,
      targetScore: 125,
      avatar: '🦉',
      color: 'indigo',
      mostChallenging: true,
    },
  },
  'Owl Oscar': {
    bubble: {
      subtitle: 'Night-Shift Analyst',
      description: 'Cybersecurity analyst evaluating risk matrices and fail-safes.',
      difficulty: 'Very Hard',
      color: 'duodenary',
    },
    card: {
      age: 42,
      occupation: 'Cybersecurity Analyst',
      location: 'Late-night townhome',
      personality: 'Methodical thinker, loves risk mitigation frameworks',
      challengeLevel: 4,
      challengeLabel: 'Very Hard',
      difficultyKey: 'veryHard',
      traits: [
        'Audits vendor security and privacy practices',
        'Requests incident-response plan for technician errors',
        'Wants monitoring dashboards or status alerts',
        'Prefers asynchronous follow-up with detailed notes',
      ],
      bestFor: 'Managing technical objections with calm precision',
      estimatedTime: '9-14 min',
      startingScore: 55,
      targetScore: 112,
      avatar: '🦉',
      color: 'navy',
    },
  },
}

