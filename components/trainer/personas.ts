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
  'Veteran Victor',
  'English Second Language Elena',
  'Tag Team Tanya & Tom',
  'Comparing Carl',
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
  image?: string // Selection bubble image
  liveSessionImage?: string // Image shown during active conversation
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
      description: 'Challenges pricing and pressure tactics. Practice trust building.',
      difficulty: 'Moderate',
      color: 'primary',
      image: '/Austin No Backround.png', // Selection bubble (capital N, B)
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
      description: 'Easily agrees. Practice smooth closes and confidence building.',
      difficulty: 'Easy',
      color: 'secondary',
      image: '/Nancy Black No backround.png',
      liveSessionImage: '/No Problem Nancy Black.png',
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
      description: 'Has already been serviced. Practice Competitive positioning.',
      difficulty: 'Hard',
      color: 'tertiary',
      image: '/Already got it Alan no backround 2.png', // Selection bubble
      liveSessionImage: '/Already got it Alan landscape.png', // During live conversation
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
      description: 'Immediately wants to end conversation. Practice pattern interrupts.',
      difficulty: 'Very Hard',
      color: 'quaternary',
      image: '/Not Intersted Nick no backround 2.png',
      liveSessionImage: '/Not Interested Nick.png',
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
      description: 'Prefers DIY solutions. Practice demonstrating professional value.',
      difficulty: 'Hard',
      color: 'quinary',
      image: '/DIY DAVE no backround 2.png', // Selection bubble
      liveSessionImage: '/DIY DAVE.png', // During live conversation
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
      description: 'Objects to pricing. Practice value framing.',
      difficulty: 'Hard',
      color: 'senary',
      image: '/Too Expensive Tim no backround 2.png', // Selection bubble
      liveSessionImage: '/Too Expensive Tim.png', // During live conversation
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
      description: 'Needs partner approval. Practice handling spouse objection.',
      difficulty: 'Moderate',
      color: 'septenary',
      image: '/Spouse check Susan no backround 2.png',
      liveSessionImage: '/Spouse Check Susan.png',
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
      description: 'Always pressed for time. Practice delivering value quickly.',
      difficulty: 'Moderate',
      color: 'octonary',
      image: '/Busy Beth no backround 2.png',
      liveSessionImage: '/Busy Beth.png',
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
      description: 'Renting property. Practice navigating authority objections.',
      difficulty: 'Hard',
      color: 'nonary',
      image: '/Renter randy no backround 2.png',
      liveSessionImage: '/Renter Randy.png',
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
      description: 'Doubts credibility. Practice building trust with proof.',
      difficulty: 'Hard',
      color: 'denary',
      image: '/Skeptical Sam no backround 2.png',
      liveSessionImage: '/Skeptical Sam.png',
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
      description: 'Recently serviced. Practice timing objections and future booking.',
      difficulty: 'Moderate',
      color: 'duodenary',
      image: '/Just treated Jerry no backround 2.png',
      liveSessionImage: '/Just Treated Jerry.png',
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
      description: 'Needs time to decide. Practice creating urgency.',
      difficulty: 'Hard',
      color: 'undenary',
      image: '/Think About It Tina no backround.png',
      liveSessionImage: '/Think About It Tina.png',
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
  'Veteran Victor': {
    bubble: {
      subtitle: 'Military Mindset',
      description: 'Values structure and respect. Practice demonstrating value.',
      difficulty: 'Moderate',
      color: 'primary',
      image: '/Veteran Victor No backround.png',
      liveSessionImage: '/Veteran Victor Landcape.png',
    },
    card: {
      age: 45,
      occupation: 'Retired Military',
      location: 'Suburban home',
      personality: 'Disciplined, values structure and respect, needs clear benefits',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'Appreciates respect and professionalism',
        'Values clear, structured communication',
        'Asks about long-term benefits and guarantees',
        'Responds to service-oriented value propositions',
      ],
      bestFor: 'Building rapport with structured communication and respect',
      estimatedTime: '6-9 min',
      startingScore: 50,
      targetScore: 75,
      avatar: '🎖️',
      color: 'blue',
      elevenAgentId: 'agent_3701k8s40awcf30tbs5mrksskzav',
    },
  },
  'English Second Language Elena': {
    bubble: {
      subtitle: 'Language Barrier',
      description: 'Language barrier present. Practice clear communication.',
      difficulty: 'Moderate',
      color: 'secondary',
      image: '/agents/elena.png', // Add image path when available
      liveSessionImage: '/agents/elena.png',
    },
    card: {
      age: 38,
      occupation: 'Restaurant Manager',
      location: 'Multicultural neighborhood',
      personality: 'Patient but needs simple, clear explanations',
      challengeLevel: 2,
      challengeLabel: 'Moderate',
      difficultyKey: 'moderate',
      traits: [
        'May ask for clarification frequently',
        'Needs simple, clear language',
        'Responds well to visual aids and demonstrations',
        'Appreciates patience and respect',
      ],
      bestFor: 'Practicing clear communication and cultural sensitivity',
      estimatedTime: '7-10 min',
      startingScore: 48,
      targetScore: 76,
      avatar: '🌍',
      color: 'teal',
      elevenAgentId: 'agent_5901k8s3rnrkfp9vky7q1j4t3xhj',
    },
  },
  'Tag Team Tanya & Tom': {
    bubble: {
      subtitle: 'Couple Decision',
      description: 'Multiple decision-makers. Practice building consensus.',
      difficulty: 'Hard',
      color: 'tertiary',
      image: '/agents/tanya-tom.png', // Add image path when available
      liveSessionImage: '/agents/tanya-tom.png',
    },
    card: {
      age: 42,
      occupation: 'Both work full-time',
      location: 'Family home',
      personality: 'Collaborative decision-makers, need both to agree',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Both partners ask different questions',
        'Need to address concerns of both individuals',
        'May disagree with each other during conversation',
        'Requires building consensus and addressing dual objections',
      ],
      bestFor: 'Handling multiple decision-makers and building consensus',
      estimatedTime: '9-13 min',
      startingScore: 44,
      targetScore: 72,
      avatar: '👥',
      color: 'purple',
      elevenAgentId: 'agent_4301k8s3mmvvekqb6fdpyszs9md4',
    },
  },
  'Comparing Carl': {
    bubble: {
      subtitle: 'Price Shopper',
      description: 'Wants to compare options. Practice competitive positioning.',
      difficulty: 'Hard',
      color: 'quaternary',
      image: '/agents/carl.png', // Add image path when available
      liveSessionImage: '/agents/carl.png',
    },
    card: {
      age: 47,
      occupation: 'Purchasing Manager',
      location: 'Budget-conscious household',
      personality: 'Analytical, compares everything, price-focused',
      challengeLevel: 3,
      challengeLabel: 'Hard',
      difficultyKey: 'hard',
      traits: [
        'Says "Let me compare your prices with others"',
        'Wants detailed breakdowns and written quotes',
        'Questions value of premium features',
        'Responds to limited-time offers and competitive positioning',
      ],
      bestFor: 'Handling comparison objections and demonstrating unique value',
      estimatedTime: '8-12 min',
      startingScore: 43,
      targetScore: 73,
      avatar: '⚖️',
      color: 'amber',
      elevenAgentId: 'agent_5301k8s3gw9zf6jsmp2bfw7v7crn',
    },
  },
}