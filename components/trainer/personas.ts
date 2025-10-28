export const ALLOWED_AGENT_ORDER = [
  'Austin',
  'No Problem Nancy',
  'Already Got It Alan',
  'Not Interested Nick',
  'DIY Dave',
  'Too Expensive Tim',
  'Spouse Check Susan',
  'Busy Beth',
  'Renter Randy',
  'Skeptical Sam',
  'Just Treated Jerry',
  'Think About It Tina',
] as const

export type AllowedAgentName = typeof ALLOWED_AGENT_ORDER[number]

export const ALLOWED_AGENT_SET = new Set<AllowedAgentName>(ALLOWED_AGENT_ORDER)

export const ORDER_LOOKUP = new Map<AllowedAgentName, number>(
  ALLOWED_AGENT_ORDER.map((name, index) => [name, index])
)

type BubbleDifficulty = 'Easy' | 'Moderate' | 'Hard' | 'Very Hard'
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
  | 'undenary'
type CardDifficultyKey = 'easy' | 'moderate' | 'hard' | 'veryHard'

interface PersonaBubbleDetail {
  subtitle: string
  description: string
  difficulty: BubbleDifficulty
  color: BubbleColorVariant
  image?: string
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
      image: '/Austin no backround.png', // Selection bubble
      liveSessionImage: '/Austin Boss.png', // During live conversation
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
  'No Problem Nancy': {
    bubble: {
      subtitle: 'Easy Agreement',
      description: 'Friendly homeowner who agrees quickly. Perfect for building confidence.',
      difficulty: 'Easy',
      color: 'secondary',
      image: '/agents/nancy.png',
    },
    card: {
      age: 42,
      occupation: 'Elementary School Teacher',
      location: 'Suburban neighborhood',
      personality: 'Warm, agreeable, and trusting',
      challengeLevel: 1,
      challengeLabel: 'Easy',
      difficultyKey: 'easy',
      traits: [
        'Agrees to most suggestions without pushback',
        'Appreciates friendly conversation',
        'Makes decisions quickly',
        'Great for practicing smooth closes',
      ],
      bestFor: 'Building confidence and perfecting your pitch flow',
      estimatedTime: '3-5 min',
      startingScore: 60,
      targetScore: 85,
      avatar: '😊',
      color: 'blue',
      recommended: true,
      elevenAgentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m',
    },
  },
  'Already Got It Alan': {
    bubble: {
      subtitle: 'Current Customer',
      description: 'Already has pest control service. Practice competitive positioning.',
      difficulty: 'Hard',
      color: 'tertiary',
      image: '/agents/alan.png',
    },
    card: {
      age: 51,
      occupation: 'Accountant',
      location: 'Established neighborhood',
      personality: 'Loyal to current provider, needs strong reason to switch',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Satisfied with current pest control company',
        'Needs compelling reason to switch',
        'Asks about contract terms and cancellation',
        'Values consistency and reliability',
      ],
      bestFor: 'Competitive positioning and differentiation tactics',
      estimatedTime: '7-10 min',
      startingScore: 45,
      targetScore: 75,
      avatar: '🤝',
      color: 'purple',
      elevenAgentId: 'agent_9901k6dvcv32embbydd7nn0prdgq',
    },
  },
  'Not Interested Nick': {
    bubble: {
      subtitle: 'Quick Dismissal',
      description: 'Wants to end conversation immediately. Master pattern interrupts.',
      difficulty: 'Very Hard',
      color: 'quaternary',
      image: '/agents/nick.png',
    },
    card: {
      age: 35,
      occupation: 'Software Engineer',
      location: 'Urban townhome',
      personality: 'Dismissive, busy, low patience for sales',
      challengeLevel: 4,
      challengeLabel: 'Very Hard',
      difficultyKey: 'veryHard',
      traits: [
        'Says "not interested" within first 10 seconds',
        'Tries to close door quickly',
        'Needs immediate value hook to stay engaged',
        'Responds to pattern interrupts and curiosity',
      ],
      bestFor: 'Mastering opening hooks and pattern interrupts',
      estimatedTime: '2-6 min',
      startingScore: 30,
      targetScore: 65,
      avatar: '🚪',
      color: 'red',
      mostChallenging: true,
      elevenAgentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga',
    },
  },
  'DIY Dave': {
    bubble: {
      subtitle: 'Self-Sufficient',
      description: 'Prefers DIY solutions. Demonstrate professional value.',
      difficulty: 'Hard',
      color: 'quinary',
      image: '/agents/dave.png',
    },
    card: {
      age: 48,
      occupation: 'Contractor',
      location: 'Ranch-style home',
      personality: 'Handy, self-reliant, skeptical of paying for services',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Believes he can handle pest control himself',
        'Knows about store-bought products',
        'Questions the value of professional service',
        'Responds to expertise and time-saving benefits',
      ],
      bestFor: 'Demonstrating professional value over DIY',
      estimatedTime: '6-9 min',
      startingScore: 40,
      targetScore: 70,
      avatar: '🔧',
      color: 'orange',
      elevenAgentId: 'agent_1701k6dvc3nfejmvydkk7r85tqef',
    },
  },
  'Too Expensive Tim': {
    bubble: {
      subtitle: 'Price Objection',
      description: 'Everything costs too much. Perfect for value framing.',
      difficulty: 'Hard',
      color: 'senary',
      image: '/agents/tim.png',
    },
    card: {
      age: 44,
      occupation: 'Retail Manager',
      location: 'Budget-conscious household',
      personality: 'Price-sensitive, needs clear ROI justification',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Immediately asks "How much does it cost?"',
        'Compares to cheapest competitors',
        'Needs value breakdown and ROI explanation',
        'Responds to payment plans and guarantees',
      ],
      bestFor: 'Value framing and handling price objections',
      estimatedTime: '7-11 min',
      startingScore: 42,
      targetScore: 72,
      avatar: '💰',
      color: 'yellow',
      elevenAgentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0',
    },
  },
  'Spouse Check Susan': {
    bubble: {
      subtitle: 'Decision Maker',
      description: 'Needs spouse approval. Handle the spouse objection.',
      difficulty: 'Moderate',
      color: 'septenary',
      image: '/agents/susan.png',
    },
    card: {
      age: 39,
      occupation: 'Marketing Manager',
      location: 'Two-income household',
      personality: 'Collaborative decision-maker, defers to partner',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Says "I need to check with my husband/wife"',
        'Makes joint financial decisions',
        'Needs information to share with spouse',
        'Responds to urgency and limited-time offers',
      ],
      bestFor: 'Overcoming spouse objection and building urgency',
      estimatedTime: '5-8 min',
      startingScore: 48,
      targetScore: 75,
      avatar: '👫',
      color: 'pink',
      elevenAgentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8',
    },
  },
  'Busy Beth': {
    bubble: {
      subtitle: 'Time Crunch',
      description: 'Always in a hurry. Deliver value quickly and respectfully.',
      difficulty: 'Moderate',
      color: 'octonary',
      image: '/agents/beth.png',
    },
    card: {
      age: 33,
      occupation: 'Emergency Room Nurse',
      location: 'Active household',
      personality: 'Rushed, multitasking, values efficiency',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Says "I only have a minute"',
        'Interrupts to speed things up',
        'Appreciates concise, direct communication',
        'Responds to quick value propositions',
      ],
      bestFor: 'Respecting time while delivering value efficiently',
      estimatedTime: '3-6 min',
      startingScore: 52,
      targetScore: 78,
      avatar: '⏰',
      color: 'teal',
      elevenAgentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10',
    },
  },
  'Renter Randy': {
    bubble: {
      subtitle: 'Authority Question',
      description: 'Renting the property. Navigate authority and landlord dynamics.',
      difficulty: 'Hard',
      color: 'nonary',
      image: '/agents/randy.png',
    },
    card: {
      age: 28,
      occupation: 'Graphic Designer',
      location: 'Rental property',
      personality: 'Uncertain about decision-making authority',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Mentions "I\'m just renting"',
        'Unsure if landlord would approve',
        'Concerned about who pays',
        'Needs guidance on renter vs. owner responsibilities',
      ],
      bestFor: 'Navigating authority objections and landlord dynamics',
      estimatedTime: '6-9 min',
      startingScore: 38,
      targetScore: 68,
      avatar: '🏠',
      color: 'cyan',
      elevenAgentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx',
    },
  },
  'Skeptical Sam': {
    bubble: {
      subtitle: 'Proof Needed',
      description: 'Doubts everything. Build credibility through proof.',
      difficulty: 'Hard',
      color: 'denary',
      image: '/agents/sam.png',
    },
    card: {
      age: 55,
      occupation: 'Retired Police Officer',
      location: 'Security-conscious home',
      personality: 'Suspicious, needs evidence and testimonials',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Questions every claim you make',
        'Asks for proof and references',
        'Wants to see reviews and testimonials',
        'Responds to guarantees and certifications',
      ],
      bestFor: 'Building credibility and using social proof',
      estimatedTime: '8-12 min',
      startingScore: 44,
      targetScore: 74,
      avatar: '🔍',
      color: 'indigo',
      elevenAgentId: 'agent_9201k6dts0haecvssk737vwfjy34',
    },
  },
  'Just Treated Jerry': {
    bubble: {
      subtitle: 'Timing Objection',
      description: 'Recently had service done. Practice timing and future booking.',
      difficulty: 'Moderate',
      color: 'duodenary',
      image: '/agents/jerry.png',
    },
    card: {
      age: 46,
      occupation: 'Bank Manager',
      location: 'Well-maintained property',
      personality: 'Organized, plans ahead, timing-focused',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Says "We just had pest control done"',
        'Not looking for immediate service',
        'Open to future scheduling',
        'Responds to pre-booking and seasonal offers',
      ],
      bestFor: 'Overcoming timing objections and future booking',
      estimatedTime: '5-8 min',
      startingScore: 50,
      targetScore: 76,
      avatar: '📅',
      color: 'emerald',
      elevenAgentId: 'agent_8401k6dv9z2kepw86hhe5bvj4djz',
    },
  },
  'Think About It Tina': {
    bubble: {
      subtitle: 'Analysis Paralysis',
      description: 'Needs time to think. Overcome indecision and create urgency.',
      difficulty: 'Hard',
      color: 'undenary',
      image: '/agents/tina.png',
    },
    card: {
      age: 37,
      occupation: 'Research Analyst',
      location: 'Suburban home',
      personality: 'Analytical, overthinks decisions, risk-averse',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Says "Let me think about it"',
        'Wants to research and compare options',
        'Struggles with decision-making',
        'Responds to limited-time offers and risk reversal',
      ],
      bestFor: 'Creating urgency and overcoming analysis paralysis',
      estimatedTime: '7-10 min',
      startingScore: 46,
      targetScore: 73,
      avatar: '🤔',
      color: 'violet',
      elevenAgentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv',
    },
  },
}