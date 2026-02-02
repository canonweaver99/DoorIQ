'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown, Bug, Wifi, DoorOpen, Sun, Home, Globe } from 'lucide-react'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { cn } from '@/lib/utils'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { LeverSwitch } from '@/components/ui/lever-switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import {
  ALLOWED_AGENT_SET,
  ALLOWED_AGENT_ORDER,
  AllowedAgentName,
  PERSONA_METADATA,
} from '@/components/trainer/personas'

type AgentRow = Database['public']['Tables']['agents']['Row']
type IndustryRow = Database['public']['Tables']['industries']['Row']

interface HomeownerAgentDisplay {
  hasClosed?: boolean
  id: string
  name: string
  agentId: string
  subtitle: string
  difficulty: DifficultyKey
  color: keyof typeof COLOR_VARIANTS
  description: string
  image?: string
  sessionCount?: number
  bestScore?: number | null
  avgDuration?: number | null
  isLocked?: boolean
  isMastered?: boolean
  industries?: string[] // Array of industry slugs
}

// Industry icon mapping for Lucide icons
const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pest: Bug,
  fiber: Wifi,
  windows: DoorOpen,
  solar: Sun,
  roofing: Home,
}

// Universal/All Industries icon
const UNIVERSAL_ICON = Globe

// Helper function to get industry icon component
const getIndustryIcon = (industrySlug: string) => {
  return INDUSTRY_ICONS[industrySlug] || null
}

// Universal agent names (agents that belong to all industries)
// Include both old code names and new database names for mapping
const UNIVERSAL_AGENT_NAMES = [
  'Average Austin',
  'Austin Rodriguez', // New database name
  'Not Interested Nick',
  'Nick Patterson', // New database name
  'Too Expensive Tim',
  'Tim Robertson', // New database name
  'Spouse Check Susan',
  'The Karen',
  'Angry Indian',
  'Tag Team Tanya & Tom',
  'Travis "T-Bone" Hendricks',
  'Think About It Tina',
  'Tina Patel', // New database name
  'Skeptical Sam',
  'Sam O\'Brien', // New database name
  'Just Treated Jerry',
  'Jerry Martinez', // New database name
  'Busy Beth',
  'Beth Anderson', // New database name
  'No Problem Nancy',
  'Nancy Williams', // New database name
  'DIY Dave',
  'Dave "Davo" Miller', // New database name
  'Switchover Steve',
  'Steve Mitchell', // New database name
  'Veteran Victor',
  'Victor Martinez', // New database name
  'Renter Randy',
  'Randy Wallace', // New database name (assigned to all except windows, but still universal)
]

// Check if agent belongs to all industries (universal agent)
const isUniversalAgent = (agentName: string, industries?: string[]): boolean => {
  // Check by agent name first (most reliable)
  if (UNIVERSAL_AGENT_NAMES.includes(agentName)) {
    return true
  }
  // Fallback: check if agent belongs to all 5 industries (or 4 for Renter Randy)
  if (industries && (industries.length >= 5 || (industries.length === 4 && agentName === 'Renter Randy'))) {
    return true
  }
  return false
}

// Agent name to real name mapping for personalized display
const AGENT_REAL_NAMES: Record<string, string> = {
  // Core agents (names already in agent name)
  'Average Austin': 'Austin Mitchell',
  'No Problem Nancy': 'Nancy Chen',
  'Switchover Steve': 'Steve Johnson',
  'Not Interested Nick': 'Nick Thompson',
  'DIY Dave': 'Dave Martinez',
  'Too Expensive Tim': 'Tim Wilson',
  'Spouse Check Susan': 'Susan Davis',
  'Busy Beth': 'Beth Rodriguez',
  'Renter Randy': 'Randy Lee',
  'Skeptical Sam': 'Sam Brown',
  'Just Treated Jerry': 'Jerry White',
  'Think About It Tina': 'Tina Garcia',
  'Veteran Victor': 'Victor Anderson',
  
  // Pest control agents
  'I Already Have a Pest Guy': 'Dan Mitchell',
  'I Don\'t Have Any Bugs': 'Rachel Cooper',
  'How Much Is It?': 'James Wilson', // Used for other industries (fiber, solar, windows)
  'What\'s the Price?': 'Vincent "Vinny" Caruso', // Pest-specific agent
  // 'I Need to Talk to My Spouse': Handled by industry-specific logic (Windows only uses Angela White)
  'I\'m Not Interested in Solar': 'Gary Thompson',
  'I\'m Renting/Don\'t Own': 'Tyler Jackson',
  'I Just Spray Myself': 'Greg Wilson',
  'Send Me Information': 'Jennifer Lee',
  'We\'re Selling/Moving Soon': 'Chris Bennett',
  'I Have Pets/Kids - Worried About Chemicals': 'Nicole Rodriguez',
  'Bad Timing - Call Me Back Later': 'Mike Sullivan',
  
  // Fiber/Internet agents
  'I Already Have Internet': 'Daniel Mitchell',
  'I didn\'t sign up for anything': 'Amanda Stevens',
  'I\'m Happy With What I Have': 'Linda Morrison',
  'I Just Signed Up': 'Marcus Johnson',
  'I Don\'t Want to Deal With Switching': 'Kevin Richardson',
  'My Internet Works Fine': 'Tom Henderson',
  'What\'s the Catch?': 'Rob Davis',
  'I\'m Moving Soon': 'Sarah Kim',
  'I Need to Talk to My Spouse': 'Jessica Martinez', // Fiber agent (Windows=Angela White, Roofing=Patricia Wells, Solar=Michelle Torres - handled by agent ID check)
  
  // Roofing agents
  'My Roof is Fine': 'Mark Patterson',
  'I\'m Not Interested': 'Frank Rodriguez', // Roofing-specific
  'How Much Does a Roof Cost?': 'David Kim',
  'I Just Had My Roof Done': 'Carlos Mendez',
  'I\'ll Call You When I Need a Roof': 'Tom Bradley',
  'I Already Have Someone': 'Kevin Anderson',
  'My Insurance Won\'t Cover It': 'Lisa Martinez',
  'I\'m Selling Soon': 'Diane Martinez', // Roofing-specific (changed from Robert Williams)
  'I Don\'t Trust Door-to-Door Roofers': 'Harold Stevens',
  
  // Solar agents
  'I\'m Not Interested in Solar': 'Gary Thompson',
  'Solar is Too Expensive': 'Brian Walsh',
  'How Much Does It Cost?': 'James Porter', // Solar-specific (changed from Kai Shin)
  'My Electric Bill is Too Low': 'Sarah Chen',
  'What If It Doesn\'t Work?': 'David Martinez',
  'My Roof is Too Old': 'Robert Jenkins',
  'I\'ve Heard Bad Things About Solar': 'Linda Morrison',
  'I Don\'t Qualify': 'Terrell Washington', // Changed from Marcus Johnson to Terrell Washington
  'I\'m Selling Soon': 'Jennifer Walsh', // Solar-specific
  
  // Windows agents
  'My Windows Are Fine': 'Robert Lee',
  'That\'s Too Expensive': 'Kellie Adams',
  'How Much Does It Cost?': 'James Porter', // Windows-specific (Solar also uses James Porter)
  'I\'m Going to Get Multiple Quotes': 'Jeffrey Clark',
  'I Just Need One or Two Windows': 'Maria Gonzalez',
  'I\'m Selling/Moving Soon': 'Sherry Green',
  'I\'ll Just Do It Myself': 'Patrick Murphy',
  'What\'s Wrong With My Current Windows?': 'Laura Thompson',
  'I\'m Waiting Until...': 'Jonathan Wright',
  'I Don\'t Trust Window Companies': 'Arron Black',
  'I\'m Not Interested': 'Lewis McArthur', // Windows agent
  'Not the Right Time / Maybe Next Year': 'Steve Harry',
  
  // Special agents
  'The Karen': 'Karen Smith',
  'Angry Indian': 'Raj Patel',
  'Tag Team Tanya & Tom': 'Tanya & Tom',
  'Travis "T-Bone" Hendricks': 'Travis "T-Bone" Hendricks',
}
const COLOR_CYCLE: (keyof typeof COLOR_VARIANTS)[] = [
  'primary',
  'tertiary',
  'quinary',
  'secondary',
  'senary',
  'quaternary',
  'septenary',
  'octonary',
  'nonary',
  'denary',
  'duodenary',
  'undenary',
]
type DifficultyKey = 'Easy' | 'Moderate' | 'Hard' | 'Expert'
const DIFFICULTY_BADGES: Record<DifficultyKey, string> = {
  Easy: 'bg-green-500/20 text-green-300 border border-green-500/30',
  Moderate: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  Expert: 'bg-red-500/20 text-red-300 border border-red-500/30',
}
const sanitizeDescription = (persona?: string | null): string => {
  if (!persona) return 'Dynamic AI homeowner with unique objections and goals'
  return persona.split(/\r?\n|\.|•|-/).map((part) => part.trim()).filter(Boolean)[0] ?? persona
}

const parseDifficulty = (agentName: string, persona?: string | null): DifficultyKey => {
  // Not Interested Nick is always Expert
  if (agentName === 'Not Interested Nick') return 'Expert'
  
  const personaMeta = PERSONA_METADATA[agentName as AllowedAgentName]
  const fallback = personaMeta?.bubble.difficulty
  
  const match = persona?.match(/(easy|moderate|very hard|hard|expert)/i)?.[1]?.toLowerCase()
  if (match === 'easy') return 'Easy'
  if (match === 'moderate') return 'Moderate'
  if (match === 'very hard' || match === 'veryhard') return 'Expert'
  if (match === 'hard') return 'Hard'
  if (match === 'expert') return 'Expert'
  return (fallback as DifficultyKey) ?? 'Moderate'
}

// Industry-specific image mappings (same as in trainer/page.tsx)
const getIndustrySpecificImage = (agentName: string, elevenAgentId: string, agentIndustries?: string[]): string | undefined => {
  const industryImageMap: Record<string, Record<string, string>> = {
    windows: {
      'I Need to Talk to My Spouse': '/Angela White.png',
      'I\'m Not Interested': '/Lewis McArthur.png',
      'My Windows Are Fine': '/Robert Lee.png',
      'That\'s Too Expensive': '/Kellie Adams.png',
      'How Much Does It Cost?': '/James Porter.png', // Windows-specific (changed from Kai Shin)
      'I\'m Going to Get Multiple Quotes': '/Jeffrey Clark.png',
      'I Just Need One or Two Windows': '/Maria Gonzalez.png',
      'I\'ll Just Do It Myself': '/Patrick Murphy.png',
      'What\'s Wrong With My Current Windows?': '/Laura Thompson.png',
      'I\'m Waiting Until...': '/Jonathan Wright.png',
      'Just Got New Windows': '/Toby Robin.png',
      'I\'m Selling/Moving Soon': '/Sherry Green.png',
      'I Don\'t Trust Window Companies': '/Arron Black.png',
    },
    pest: {
      // 'I Need to Talk to My Spouse': No specific image for pest
    },
    fiber: {
      'I Need to Talk to My Spouse': '/Jessica Martinez.png',
    },
    solar: {
      'I Need to Talk to My Spouse': '/Michelle Torres.png',
      'How Much Does It Cost?': '/James Porter.png',
      'I\'m Selling Soon': '/Jennifer Walsh.png', // Changed from Diane Martinez to Jennifer Walsh
    },
    roofing: {
      'I Need to Talk to My Spouse': '/Patricia Wells.png',
      'I\'m Selling Soon': '/Robert Williams.png',
    },
  }

  // Special handling for "I Need to Talk to My Spouse" - check eleven_agent_id first
  if (agentName === 'I Need to Talk to My Spouse') {
    // Check for Angela White's actual agent ID (Windows)
    if (elevenAgentId === 'agent_3301kg2vydhnf28s2q2b6thzhfa4') {
      return industryImageMap.windows[agentName] // Angela White
    }
    // Check for Jessica Martinez's actual agent ID (Fiber)
    if (elevenAgentId === 'agent_7201kfgssnt8eb2a8a4kghb421vd') {
      return industryImageMap.fiber[agentName] // Jessica Martinez
    }
    // Check for Patricia Wells's actual agent ID (Roofing)
    if (elevenAgentId === 'agent_2001kfgxefjcefk9r6s1m5vkfzxn') {
      return industryImageMap.roofing[agentName] // Patricia Wells
    }
    // Check for Michelle Torres's actual agent ID (Solar)
    if (elevenAgentId === 'agent_9101kfgy6d0jft18a06r0zj19jp1') {
      return industryImageMap.solar[agentName] // Michelle Torres
    }
    // Fallback to placeholder IDs
    if (elevenAgentId?.startsWith('placeholder_windows_')) {
      return industryImageMap.windows[agentName] // Angela White
    }
    if (elevenAgentId?.startsWith('placeholder_fiber_')) {
      return industryImageMap.fiber[agentName] // Jessica Martinez
    }
    if (elevenAgentId?.startsWith('placeholder_solar_')) {
      return industryImageMap.solar[agentName] // Michelle Torres
    }
    if (elevenAgentId?.startsWith('placeholder_roofing_')) {
      return industryImageMap.roofing[agentName] // Patricia Wells
    }
  }

  // Special handling for "How Much Does It Cost?" - check eleven_agent_id to determine industry
  if (agentName === 'How Much Does It Cost?') {
    // Check for James Porter's actual agent ID (Solar)
    if (elevenAgentId === 'agent_5001kfgygawzf3z9prjqkqv1wj85') {
      return industryImageMap.solar[agentName] // James Porter (Solar)
    }
    // Check for James Porter's actual agent ID (Windows)
    if (elevenAgentId === 'agent_6201kg2w5zfxe0dr1cwnb5qp1416') {
      return industryImageMap.windows[agentName] // James Porter (Windows)
    }
  }

  // Special handling for "I'm Selling Soon" - check eleven_agent_id to determine industry
  if (agentName === 'I\'m Selling Soon') {
    // Check for Jennifer Walsh's actual agent ID (Solar)
    // TODO: Replace 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID' with actual Jennifer Walsh agent ID
    if (elevenAgentId === 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID') {
      return industryImageMap.solar[agentName] // Jennifer Walsh (Solar)
    }
    // Check for Diane Martinez's actual agent ID (Roofing)
    if (elevenAgentId === 'agent_2701kg2yvease7b89h6nx6p1eqjy') {
      return industryImageMap.roofing[agentName] // Diane Martinez (Roofing)
    }
    // Check for Robert Williams's actual agent ID (Roofing) - legacy, kept for backward compatibility
    if (elevenAgentId === 'agent_9701kfgy2ptff7x8je2fcca13jp1') {
      return industryImageMap.roofing[agentName] // Robert Williams (Roofing)
    }
  }

  // If agent industries are provided, check them first (prioritizes windows over fiber)
  // This handles the case where the same agent name exists in multiple industries
  if (agentIndustries && agentIndustries.length > 0) {
    // Priority order: windows > fiber > others (windows takes precedence)
    const priorityOrder = ['windows', 'fiber', 'solar', 'roofing', 'pest']
    for (const industry of priorityOrder) {
      if (agentIndustries.includes(industry)) {
        const img = industryImageMap[industry]?.[agentName]
        if (img) return img
      }
    }
  }

  // Fallback: Check for industry-specific image based on eleven_agent_id
  if (elevenAgentId?.startsWith('placeholder_windows_')) {
    const img = industryImageMap.windows[agentName]
    return img || undefined
  } else if (elevenAgentId?.startsWith('placeholder_pest_')) {
    const img = industryImageMap.pest[agentName]
    return img || undefined
  } else if (elevenAgentId?.startsWith('placeholder_fiber_')) {
    const img = industryImageMap.fiber[agentName]
    return img || undefined
  } else if (elevenAgentId?.startsWith('placeholder_solar_')) {
    const img = industryImageMap.solar[agentName]
    return img || undefined
  } else if (elevenAgentId?.startsWith('placeholder_roofing_')) {
    const img = industryImageMap.roofing[agentName]
    return img || undefined
  }
  
  return undefined
}

const mapAgentToDisplay = (agent: AgentRow, index: number, agentIndustries?: string[]): HomeownerAgentDisplay => {
  const fallback = PERSONA_METADATA[agent.name as AllowedAgentName]
  const difficulty = parseDifficulty(agent.name, agent.persona)
  const subtitle = fallback?.bubble.subtitle ?? 'Homeowner Persona'
  const description = fallback?.bubble.description ?? sanitizeDescription(agent.persona)
  const color = fallback?.bubble.color ?? COLOR_CYCLE[index % COLOR_CYCLE.length]
  
  // Use industry-specific image resolution first, then fallback to metadata
  // For "I Need to Talk to My Spouse", ONLY use industry-specific images (Windows=Angela, Fiber=Jessica)
  // Never use the fallback metadata image for this agent
  // Pass agentIndustries to prioritize fiber industry when agent exists in multiple industries
  const industryImage = getIndustrySpecificImage(agent.name, agent.eleven_agent_id, agentIndustries)
  let image: string | undefined
  if (agent.name === 'I Need to Talk to My Spouse') {
    // Only use industry-specific image, never fallback
    image = industryImage || undefined
  } else {
    // For other agents, use industry-specific first, then fallback to metadata
    image = industryImage !== undefined ? industryImage : fallback?.bubble.image
  }

  return {
    id: agent.id,
    name: agent.name,
    agentId: agent.eleven_agent_id,
    subtitle,
    difficulty,
    color,
    description,
    image: image || undefined,
    industries: agentIndustries || undefined,
  }
}

interface AgentBubbleSelectorProps {
  onSelect?: (agentId: string, agentName: string) => void
  standalone?: boolean
}

const AnimatedGrid = () => (
  <motion.div
    animate={{
      opacity: [0.02, 0.04, 0.02],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="absolute inset-0 pointer-events-none"
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
  </motion.div>
)

export default function AgentBubbleSelector({ onSelect, standalone = false }: AgentBubbleSelectorProps) {
  const router = useRouter()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const supabase = createClient()
  const [agents, setAgents] = useState<HomeownerAgentDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'difficulty' | 'unplayed' | 'struggles'>('all')
  const [sortedAgents, setSortedAgents] = useState<HomeownerAgentDisplay[]>([])
  const [suggestedAgent, setSuggestedAgent] = useState<string | null>(null)
  const [industries, setIndustries] = useState<IndustryRow[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [userIndustry, setUserIndustry] = useState<string | null>(null)
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('challengeModeEnabled') === 'true'
    }
    return false
  })
  const [showFlameEffect, setShowFlameEffect] = useState(false)

  const handleChallengeModeToggle = (enabled: boolean) => {
    const wasEnabled = challengeModeEnabled
    setChallengeModeEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('challengeModeEnabled', enabled.toString())
    }
    // Trigger full-screen flame effect when turning ON
    if (!wasEnabled && enabled) {
      setShowFlameEffect(true)
    }
  }

  // Auto-hide flame effect after 2.5 seconds, or cancel if challenge mode is turned off
  useEffect(() => {
    if (showFlameEffect) {
      // Cancel immediately if challenge mode is turned off
      if (!challengeModeEnabled) {
        setShowFlameEffect(false)
        return
      }
      
      const timer = setTimeout(() => {
        setShowFlameEffect(false)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [showFlameEffect, challengeModeEnabled])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Fetch agents
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching agents:', error)
          setLoading(false)
          return
        }
        
        // Fetch industries
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('*')
          .order('name', { ascending: true })
        
        if (industriesError) {
          console.error('Error fetching industries:', industriesError)
        } else if (industriesData) {
          setIndustries(industriesData)
        }
        
        // Fetch agent-industry mappings
        const { data: agentIndustriesData, error: agentIndustriesError } = await supabase
          .from('agent_industries')
          .select('agent_id, industry_id, industries(slug)')
        
        if (agentIndustriesError) {
          console.error('Error fetching agent industries:', agentIndustriesError)
        }
        
        // Create a map of agent_id -> array of industry slugs
        const agentIndustryMap: Record<string, string[]> = {}
        if (agentIndustriesData) {
          agentIndustriesData.forEach((ai: any) => {
            if (!agentIndustryMap[ai.agent_id]) {
              agentIndustryMap[ai.agent_id] = []
            }
            if (ai.industries?.slug) {
              agentIndustryMap[ai.agent_id].push(ai.industries.slug)
            }
          })
        }
        
        // Stripe/billing removed - no subscription checks needed
        
        // Fetch user's industry
        let userIndustrySlug: string | null = null
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('industry_slug')
            .eq('id', user.id)
            .single()
          if (!userError && userData?.industry_slug) {
            userIndustrySlug = userData.industry_slug
            setUserIndustry(userIndustrySlug)
            // Set as selected industry if user has one
            if (!selectedIndustry) {
              setSelectedIndustry(userIndustrySlug)
            }
          }
        }

        // Fetch user's sessions for stats
        let sessions: any[] = []
        if (user) {
          const { data: sessionData, error: sessionError } = await supabase
            .from('live_sessions')
            .select('agent_name, overall_score, sale_closed')
            .eq('user_id', user.id)
            .order('created_at', { descending: true })
          if (sessionError) {
            console.error('Error fetching sessions:', sessionError)
          } else if (sessionData) {
            sessions = sessionData
          }
        }
        
        if (data) {
          // Map new database names back to old code names for lookup
          const nameMapping: Record<string, AllowedAgentName> = {
            'Austin Rodriguez': 'Average Austin',
            'Tina Patel': 'Think About It Tina',
            'Nick Patterson': 'Not Interested Nick',
            'Sam O\'Brien': 'Skeptical Sam',
            'Tim Robertson': 'Too Expensive Tim',
            'Randy Wallace': 'Renter Randy',
            'Jerry Martinez': 'Just Treated Jerry',
            'Beth Anderson': 'Busy Beth',
            'Nancy Williams': 'No Problem Nancy',
            'Dave "Davo" Miller': 'DIY Dave',
            'Steve Mitchell': 'Switchover Steve',
            'Victor Martinez': 'Veteran Victor',
          }
          
          // Normalize agent names for backward compatibility (Austin -> Average Austin)
          // Also handle new database names mapped back to old code names
          const normalizeAgentName = (name: string): AllowedAgentName | null => {
            // Check if it's a new database name that needs mapping
            if (nameMapping[name]) {
              return nameMapping[name]
            }
            // Handle old backward compatibility
            if (name === 'Austin') return 'Average Austin'
            // Check if it's already a valid allowed agent name
            return ALLOWED_AGENT_SET.has(name as AllowedAgentName) ? (name as AllowedAgentName) : null
          }
          
          const filtered = data.filter((agent: AgentRow) => {
            if (!Boolean(agent.eleven_agent_id)) return false
            const normalizedName = normalizeAgentName(agent.name)
            return normalizedName !== null
          }).map((agent: AgentRow) => {
            // Normalize the name in the agent object for consistent handling
            const normalizedName = normalizeAgentName(agent.name)
            return normalizedName ? { ...agent, name: normalizedName } : agent
          })
          
          const sorted = filtered.sort((a: AgentRow, b: AgentRow) => ALLOWED_AGENT_ORDER.indexOf(a.name as AllowedAgentName) - ALLOWED_AGENT_ORDER.indexOf(b.name as AllowedAgentName))

          const hydrated = sorted.map((agent: AgentRow, index: number) => {
            // Filter sessions by agent name, handling both "Austin" and "Average Austin" for backward compatibility
            const agentSessions = sessions.filter((s: any) => {
              const sessionAgentName = s.agent_name
              const currentAgentName = agent.name
              // Match if names are equal, or if one is "Austin" and the other is "Average Austin"
              return sessionAgentName === currentAgentName || 
                     (sessionAgentName === 'Austin' && currentAgentName === 'Average Austin') ||
                     (sessionAgentName === 'Average Austin' && currentAgentName === 'Austin')
            })
            const completedSessions = agentSessions.filter(s => s.overall_score !== null && s.overall_score > 0)
            const bestScore = completedSessions.length > 0 
              ? Math.max(...completedSessions.map(s => s.overall_score || 0))
              : null
            const hasClosed = agentSessions.some((s: any) => s.sale_closed === true)
            const avgDuration = completedSessions.length > 0
              ? Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completedSessions.length / 60)
              : null
            
            // All agents remain visually available; access is enforced when starting a session
            const isLocked = false
            const isMastered = completedSessions.length >= 5 && bestScore && bestScore >= 80
            
            // Temporarily disable Tanya & Tom
            const isComingSoon = agent.name === 'Tag Team Tanya & Tom'
            
            return {
              ...mapAgentToDisplay(agent as AgentRow, index, agentIndustryMap[agent.id]),
              sessionCount: agentSessions.length,
              bestScore,
              hasClosed,
              avgDuration,
              isLocked: isLocked || isComingSoon, // Treat coming soon as locked
              isMastered,
              industries: agentIndustryMap[agent.id] || []
            }
          })
          setAgents(hydrated)
          setSortedAgents(hydrated)
          
          // Determine suggested agent based on user analytics
          const unplayedAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.sessionCount || a.sessionCount === 0)
          const lowScoreAgents = hydrated.filter((a: HomeownerAgentDisplay) => a.bestScore && a.bestScore < 70).sort((a: HomeownerAgentDisplay, b: HomeownerAgentDisplay) => (a.bestScore || 0) - (b.bestScore || 0))
          const availableAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.isLocked && a.name !== 'Tag Team Tanya & Tom')
          
          if (lowScoreAgents.length > 0) {
            // Suggest the agent with lowest score for improvement
            setSuggestedAgent(lowScoreAgents[0].name)
          } else if (unplayedAgents.length > 0) {
            // Suggest next unplayed agent
            setSuggestedAgent(unplayedAgents[0].name)
          } else if (availableAgents.length > 0) {
            // Suggest random available agent
            setSuggestedAgent(availableAgents[Math.floor(Math.random() * availableAgents.length)].name)
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('Error in fetchAgents:', err)
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])
  
  // Apply filtering (industry + sort)
  useEffect(() => {
    // First filter by industry - use selectedIndustry if set, otherwise use userIndustry
    const industryToFilter = selectedIndustry !== null ? selectedIndustry : userIndustry
    
    let filtered: HomeownerAgentDisplay[]
    if (industryToFilter) {
      // When a specific industry is selected, show ONLY industry-specific agents (exclude universal agents)
      filtered = agents.filter(a => 
        a.industries?.includes(industryToFilter) && 
        !isUniversalAgent(a.name, a.industries)
      )
    } else {
      // When no industry selected (Universal tab), show ONLY universal agents
      // Include "The Karen" even though she has a placeholder ID (she's a universal agent)
      filtered = agents.filter(a => {
        if (!isUniversalAgent(a.name, a.industries)) return false
        // Allow "The Karen" even with placeholder ID
        if (a.name === 'The Karen') return true
        // Exclude other placeholder agents
        return !a.agentId.startsWith('placeholder_')
      })
    }
    
    // Then apply sorting
    switch (filter) {
      case 'difficulty':
        const difficultyOrder = ['Easy', 'Moderate', 'Hard', 'Expert']
        filtered.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty))
        break
      case 'unplayed':
        filtered.sort((a, b) => (a.sessionCount || 0) - (b.sessionCount || 0))
        break
      case 'struggles':
        filtered.sort((a, b) => (a.bestScore || 100) - (b.bestScore || 100))
        break
      default:
        // Keep filtered array as is
        break
    }
    
    setSortedAgents(filtered)
  }, [filter, agents, selectedIndustry, userIndustry])

  const handleRandomAgent = () => {
    if (agents.length === 0) return
    // Filter out Tanya & Tom from random selection
    const availableAgents = agents.filter(a => a.name !== 'Tag Team Tanya & Tom' && !a.isLocked)
    if (availableAgents.length === 0) return
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
    handleSelectAgent(randomAgent.agentId, randomAgent.name)
  }

  const handleSelectAgent = async (agentId: string, agentName: string) => {
    // Temporarily disable Tanya & Tom
    if (agentName === 'Tag Team Tanya & Tom') {
      return // Prevent selection
    }
    
    // Check if user is logged in first
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to sign in page, preserving the intended agent selection
      router.push(`/auth/login?next=/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      return
    }

    // ARCHIVED: All paywall checks removed - software is now free for signed-in users
    // Authenticated users have free access - no subscription checks needed
    
    setSelectedAgent(agentId)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trainer:select-agent', {
        detail: {
          agentId,
          agentName,
        },
      }))
    }
    
    setTimeout(() => {
      if (onSelect) {
        onSelect(agentId, agentName)
      } else if (standalone) {
        router.push(`/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      }
    }, 400)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 text-slate-300 font-space text-lg sm:text-xl font-bold">Loading homeowners…</div>
      </div>
    )
  }

  if (!loading && agents.length === 0) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 text-center text-white/80 space-y-3">
          <p className="text-lg md:text-xl font-bold text-slate-300 drop-shadow-md font-space">No homeowner agents found</p>
          <p className="text-base sm:text-lg text-slate-400 max-w-sm font-space">
            Add active homeowner personas in Supabase with an ElevenLabs agent ID to see them here.
          </p>
        </div>
      </div>
    )
  }

  // Map difficulty to border color, minimal style matching landing page
  const getCardStyle = (difficulty: DifficultyKey): { border: string; bg: string } => {
    return { border: 'border-white/5', bg: 'bg-white/[0.02]' }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      <AnimatedGrid />
      
      {/* Full-screen flame effect overlay */}
      {showFlameEffect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-red-500/15 to-yellow-400/10"
            animate={{
              opacity: [0.3, 0.5, 0.3, 0],
            }}
            transition={{
              duration: 2.5,
              times: [0, 0.1, 0.75, 1],
              ease: "easeInOut"
            }}
          />
          
          {/* Central pulsing flame text */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              times: [0, 0.1, 0.85, 1],
              ease: "easeInOut"
            }}
          >
            <div className="text-center relative">
              {/* Text shadow/outline for better readability */}
              <div className="absolute inset-0 text-3xl sm:text-4xl md:text-5xl font-bold font-space opacity-30 blur-md">
                <div className="text-black">CHALLENGE MODE ACTIVATED!</div>
              </div>
              <motion.div
                className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-4 relative z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  scale: {
                    duration: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  },
                  opacity: {
                    duration: 2.5,
                    times: [0, 0.1, 0.85, 1]
                  },
                  rotate: {
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                🔥
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 font-space relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                initial={{ opacity: 0, scale: 0.5, y: -50 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  scale: 1,
                  y: 0
                }}
                transition={{ 
                  opacity: {
                    duration: 2.5,
                    times: [0, 0.1, 0.85, 1]
                  },
                  scale: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0
                  },
                  y: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0
                  }
                }}
              >
                CHALLENGE MODE ACTIVATED!
              </motion.h2>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Animated gradient orbs matching landing page */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none"
      />

      {/* Mobile Layout */}
      <div className="md:hidden relative z-10 w-full px-4 py-6 pb-24">
        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 pt-4"
        >
          <h1 className="font-space text-3xl tracking-tight text-white font-bold leading-tight mb-2">
            Let's Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Knockin'</span>
          </h1>
          <p className="text-sm text-white/70 font-space">
            Select a homeowner to begin
          </p>
        </motion.div>

        {/* Challenge Mode Toggle - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6 w-full"
        >
          <div className={cn(
            "relative bg-slate-900/60 backdrop-blur-sm border rounded-2xl p-4 overflow-hidden transition-all duration-300",
            challengeModeEnabled 
              ? "border-orange-500/50 shadow-lg shadow-orange-500/20" 
              : "border-white/10"
          )}>
            {/* Fire effect overlay when enabled */}
            {challengeModeEnabled && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Animated fire gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-400/10"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                  }}
                />
              </motion.div>
            )}
            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className={cn(
                  "text-lg font-bold font-space mb-1 transition-colors duration-300",
                  challengeModeEnabled ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400" : "text-white"
                )}>
                  Challenge Mode
                </h3>
                <p className="text-sm text-white/70 font-space leading-relaxed">
                  Get 3 strikes and the session restarts. Tracks filler words and poor objection handling.
                </p>
              </div>
              <LeverSwitch
                checked={challengeModeEnabled}
                onChange={handleChallengeModeToggle}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </motion.div>

        {/* Mobile Industry Filter */}
        {industries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mb-4 flex items-center justify-center"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm font-medium transition-all font-space flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm border min-w-[160px] justify-between",
                    selectedIndustry 
                      ? "text-white border-purple-500/50" 
                      : "text-white/70 border-white/10"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {!selectedIndustry && <Globe className="w-4 h-4" />}
                    {selectedIndustry === 'pest' && <Bug className="w-4 h-4" />}
                    {selectedIndustry === 'fiber' && <Wifi className="w-4 h-4" />}
                    {selectedIndustry === 'windows' && <DoorOpen className="w-4 h-4" />}
                    {selectedIndustry === 'solar' && <Sun className="w-4 h-4" />}
                    {selectedIndustry === 'roofing' && <Home className="w-4 h-4" />}
                    {selectedIndustry 
                      ? industries.find(i => i.slug === selectedIndustry)?.name 
                      : 'Universal'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="bg-slate-900 border-white/10 text-white min-w-[160px]"
              >
                <DropdownMenuItem
                  onClick={() => setSelectedIndustry(null)}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white flex items-center gap-2",
                    !selectedIndustry && "bg-white/10 text-white"
                  )}
                >
                  <Globe className="w-4 h-4" />
                  Universal
                </DropdownMenuItem>
                {industries.map((industry) => (
                  <DropdownMenuItem
                    key={industry.id}
                    onClick={() => setSelectedIndustry(industry.slug)}
                    className={cn(
                      "cursor-pointer focus:bg-white/10 focus:text-white flex items-center gap-2",
                      selectedIndustry === industry.slug && "bg-white/10 text-white"
                    )}
                  >
                    {industry.slug === 'pest' && <Bug className="w-4 h-4" />}
                    {industry.slug === 'fiber' && <Wifi className="w-4 h-4" />}
                    {industry.slug === 'windows' && <DoorOpen className="w-4 h-4" />}
                    {industry.slug === 'solar' && <Sun className="w-4 h-4" />}
                    {industry.slug === 'roofing' && <Home className="w-4 h-4" />}
                    {industry.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}

        {/* Mobile Filter Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex items-center justify-center gap-2"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "px-4 py-2 rounded-2xl text-sm font-medium transition-all font-space flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm text-white/70 border border-white/10 min-w-[120px] justify-between"
                )}
              >
                <span>
                  {filter === 'all' && 'All'}
                  {filter === 'difficulty' && 'By Difficulty'}
                  {filter === 'unplayed' && 'Unplayed First'}
                  {filter === 'struggles' && 'Your Struggles'}
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-slate-900 border-white/10 text-white min-w-[140px]"
            >
              <DropdownMenuItem
                onClick={() => setFilter('all')}
                className={cn(
                  "cursor-pointer focus:bg-white/10 focus:text-white",
                  filter === 'all' && "bg-white/10 text-white"
                )}
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilter('difficulty')}
                className={cn(
                  "cursor-pointer focus:bg-white/10 focus:text-white",
                  filter === 'difficulty' && "bg-white/10 text-white"
                )}
              >
                By Difficulty
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilter('unplayed')}
                className={cn(
                  "cursor-pointer focus:bg-white/10 focus:text-white",
                  filter === 'unplayed' && "bg-white/10 text-white"
                )}
              >
                Unplayed First
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilter('struggles')}
                className={cn(
                  "cursor-pointer focus:bg-white/10 focus:text-white",
                  filter === 'struggles' && "bg-white/10 text-white"
                )}
              >
                Your Struggles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.button
            type="button"
            onClick={handleRandomAgent}
            disabled={loading || agents.length === 0}
            whileHover={loading || agents.length === 0 ? {} : { scale: 1.02 }}
            whileTap={loading || agents.length === 0 ? {} : { scale: 0.98 }}
            className={cn(
              "px-4 py-2 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-purple-500/15",
              loading || agents.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            )}
          >
            🎲 Random
          </motion.button>
        </motion.div>

        {/* Mobile Agent Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {sortedAgents.map((agent, index) => {
            const variantKey = agent.color as keyof typeof COLOR_VARIANTS
            const variantStyles = COLOR_VARIANTS[variantKey]
            const isHovered = hoveredAgent === agent.id
            const isSelected = selectedAgent === agent.agentId
            const cardStyle = getCardStyle(agent.difficulty)

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={cn(
                  "w-full",
                  agent.isLocked || agent.name === 'Tag Team Tanya & Tom' ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )}
                role="button"
                tabIndex={agent.isLocked ? -1 : 0}
                onClick={() => !agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && handleSelectAgent(agent.agentId, agent.name)}
                onKeyDown={(e) => {
                  if (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectAgent(agent.agentId, agent.name)
                  }
                }}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div
                  className={cn(
                    "h-full flex flex-col items-center p-5 relative rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl",
                    "transition-all duration-300",
                    agent.isLocked && "opacity-50"
                  )}
                >
                  {/* Industry Badge - Top Right */}
                  {agent.industries && agent.industries.length > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      {isUniversalAgent(agent.name, agent.industries) ? (
                        // Show single Globe icon for universal agents
                        <div
                          className="bg-black/60 backdrop-blur-sm rounded-full p-1.5 border border-white/20 shadow-lg"
                          title="Universal"
                        >
                          <UNIVERSAL_ICON className="w-3.5 h-3.5 text-white/90" />
                        </div>
                      ) : (
                        // Show individual icons for non-universal agents
                        <div className={cn(
                          "flex flex-wrap gap-1 max-w-[calc(100%-1rem)] justify-end",
                          agent.industries.length > 3 && "gap-0.5" // Tighter spacing for many icons
                        )}>
                          {agent.industries.map((industrySlug) => {
                            const IconComponent = getIndustryIcon(industrySlug)
                            if (!IconComponent) return null
                            const iconSize = agent.industries && agent.industries.length > 4 ? 'w-3 h-3' : 'w-3.5 h-3.5'
                            const padding = agent.industries && agent.industries.length > 4 ? 'p-1' : 'p-1.5'
                            return (
                              <div
                                key={industrySlug}
                                className={cn(
                                  "bg-black/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg",
                                  padding
                                )}
                                title={industrySlug.charAt(0).toUpperCase() + industrySlug.slice(1)}
                              >
                                <IconComponent className={cn(iconSize, "text-white/90")} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Agent Real Name - show for all agents, extract from name if needed */}
                  <div className="mb-2 text-center">
                    <h4 className="text-sm font-semibold text-white/90 font-space tracking-tight">
                      {(() => {
                        // Special handling for "I Need to Talk to My Spouse" - resolve by agent ID
                        if (agent.name === 'I Need to Talk to My Spouse') {
                          if (agent.agentId === 'agent_3301kg2vydhnf28s2q2b6thzhfa4') {
                            return 'Angela White' // Windows
                          }
                          if (agent.agentId === 'agent_7201kfgssnt8eb2a8a4kghb421vd') {
                            return 'Jessica Martinez' // Fiber
                          }
                          if (agent.agentId === 'agent_2001kfgxefjcefk9r6s1m5vkfzxn') {
                            return 'Patricia Wells' // Roofing
                          }
                          if (agent.agentId === 'agent_9101kfgy6d0jft18a06r0zj19jp1') {
                            return 'Michelle Torres' // Solar
                          }
                        }
                        // Special handling for "I'm Selling Soon" - resolve by agent ID
                        if (agent.name === 'I\'m Selling Soon') {
                          // TODO: Replace 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID' with actual Jennifer Walsh agent ID
                          if (agent.agentId === 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID') {
                            return 'Jennifer Walsh' // Solar
                          }
                          if (agent.agentId === 'agent_2701kg2yvease7b89h6nx6p1eqjy') {
                            return 'Diane Martinez' // Roofing
                          }
                          if (agent.agentId === 'agent_9701kfgy2ptff7x8je2fcca13jp1') {
                            return 'Robert Williams' // Roofing (legacy)
                          }
                        }
                        return AGENT_REAL_NAMES[agent.name]
                      })() || (() => {
                        // Extract name from agent names like "Average Austin" -> "Austin Mitchell"
                        const nameMatch = agent.name.match(/(Austin|Nancy|Steve|Nick|Dave|Tim|Susan|Beth|Randy|Sam|Jerry|Tina|Victor)/i)
                        if (nameMatch) {
                          const firstName = nameMatch[1]
                          const lastNames: Record<string, string> = {
                            'Austin': 'Mitchell',
                            'Nancy': 'Chen',
                            'Steve': 'Johnson',
                            'Nick': 'Thompson',
                            'Dave': 'Martinez',
                            'Tim': 'Wilson',
                            'Susan': 'Davis',
                            'Beth': 'Rodriguez',
                            'Randy': 'Lee',
                            'Sam': 'Brown',
                            'Jerry': 'White',
                            'Tina': 'Garcia',
                            'Victor': 'Anderson',
                          }
                          return `${firstName} ${lastNames[firstName] || 'Smith'}`
                        }
                        return agent.name.split(' ')[0] + ' ' + (agent.name.split(' ')[1] || 'Homeowner')
                      })()}
                    </h4>
                  </div>
                  
                  {/* Mobile Agent Avatar */}
                  <motion.button
                    whileHover={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 1.05 } : {}}
                    whileTap={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 0.95 } : {}}
                    disabled={agent.isLocked || agent.name === 'Tag Team Tanya & Tom'}
                    tabIndex={-1}
                    className={cn("relative mb-4 focus:outline-none", (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') && "cursor-not-allowed")}
                  >
                    <div className="relative h-32 w-32 mx-auto">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                            variantStyles.border[i],
                            variantStyles.gradient
                          )}
                          animate={isHovered ? {
                            rotate: 360,
                            scale: 1,
                            opacity: 1,
                          } : {
                            rotate: 360,
                            scale: [1, 1.05, 1],
                            opacity: isSelected ? [1, 1, 1] : [0.7, 0.9, 0.7],
                          }}
                          transition={isHovered ? {
                            rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                            scale: { duration: 0.3 },
                            opacity: { duration: 0.3 },
                          } : {
                            rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                            scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                            opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                          }}
                        >
                            <div
                              className={cn(
                                "absolute inset-0 rounded-full mix-blend-screen",
                                `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                                  "from-",
                                  ""
                                )}/20%,transparent_70%)]`
                              )}
                            />
                        </motion.div>
                      ))}

                      {agent.image && (
                        <motion.div 
                          className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                          animate={isHovered ? {
                            scale: 1,
                          } : {
                            scale: [1, 1.05, 1],
                          }}
                          transition={isHovered ? {
                            duration: 0.3,
                          } : {
                            duration: 4,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: 0,
                          }}
                        >
                          <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl">
                            {(() => {
                              const imageStyle = getAgentImageStyle(agent.name, agent.agentId)
                              const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                              let translateY = '0'
                              const verticalNum = parseFloat(vertical)
                              if (verticalNum !== 50) {
                                const translatePercent = ((verticalNum - 50) / 150) * 100
                                translateY = `${translatePercent}%`
                              }
                              const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                              
                              return (
                                <Image
                                  src={agent.image}
                                  alt={agent.name}
                                  fill
                                  className="object-cover"
                                  style={{
                                    objectPosition: `${horizontal} ${vertical}`,
                                    transform: `scale(${scaleValue}) translateY(${translateY})`,
                                  }}
                                  sizes="256px"
                                  quality={95}
                                  priority={index < 4}
                                />
                              )
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* Coming Soon Overlay */}
                  {agent.name === 'Tag Team Tanya & Tom' && (
                    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/10">
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <span className="text-xs text-white/80 font-medium">🚧 Soon</span>
                      </div>
                    </div>
                  )}

                  {/* Mobile Agent Info */}
                  <div className="text-center w-full mt-auto">
                    {/* Objection below avatar */}
                    <h3 className="text-sm font-medium text-white/80 mb-2 font-space tracking-tight line-clamp-2 leading-tight">
                      {agent.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        agent.difficulty === 'Easy' && "bg-green-400",
                        agent.difficulty === 'Moderate' && "bg-yellow-400",
                        agent.difficulty === 'Hard' && "bg-orange-400",
                        agent.difficulty === 'Expert' && "bg-red-400",
                        !agent.difficulty && "bg-white/40"
                      )} />
                      <span className="text-sm text-white/70 font-space font-bold">
                        {agent.difficulty || 'Unknown'}
                      </span>
                    </div>
                    
                    {/* Session Stats */}
                    {(agent.hasClosed || agent.bestScore) && (
                      <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-white/10">
                        {agent.hasClosed && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                            <span className="text-xs">✅</span>
                            <span className="text-xs text-green-400 font-space font-semibold">Closed</span>
                          </div>
                        )}
                        {agent.bestScore !== null && agent.bestScore !== undefined && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                            <span className="text-xs text-purple-400 font-space font-bold">
                              {agent.bestScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 w-full max-w-7xl mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-bold leading-[1.3] uppercase">
            Let's Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Knockin'</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-300 drop-shadow-md font-space max-w-3xl mx-auto mt-2">
            Select a homeowner to begin your training session
          </p>
        </motion.div>

        {/* Challenge Mode, Difficulty, and Filter Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4"
        >
          {/* Challenge Mode Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:flex-shrink-0 lg:max-w-xs"
          >
            <div className={cn(
              "relative bg-slate-900/60 backdrop-blur-sm border rounded-xl p-3 lg:p-4 overflow-hidden transition-all duration-300",
              challengeModeEnabled 
                ? "border-orange-500/50 shadow-lg shadow-orange-500/20" 
                : "border-white/10"
            )}>
              {/* Fire effect overlay when enabled */}
              {challengeModeEnabled && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Animated fire gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-400/10"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "linear"
                    }}
                  />
                </motion.div>
              )}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm lg:text-base font-bold font-space mb-0.5 transition-colors duration-300",
                    challengeModeEnabled ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400" : "text-white"
                  )}>
                    Challenge Mode
                  </h3>
                  <p className="text-sm lg:text-base text-white/70 font-space leading-tight font-semibold hidden lg:block">
                    3 strikes = restart
                  </p>
                </div>
                <LeverSwitch
                  checked={challengeModeEnabled}
                  onChange={handleChallengeModeToggle}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Difficulty Key/Legend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 hover:bg-slate-900/70 overflow-hidden lg:flex-1"
          >
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-white/70 uppercase tracking-wider font-space">Difficulty:</span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Hard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Expert</span>
              </div>
            </div>
          </div>
          </motion.div>

          {/* Industry Dropdown + Filter Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3 lg:flex-shrink-0"
          >
            {/* Industry Dropdown */}
            {industries.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "px-4 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm border hover:bg-slate-900/70 hover:border-white/20 min-w-[160px] justify-between",
                      selectedIndustry 
                        ? "text-white border-purple-500/50" 
                        : "text-white/80 border-white/10 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!selectedIndustry && <Globe className="w-4 h-4" />}
                      {selectedIndustry === 'pest' && <Bug className="w-4 h-4" />}
                      {selectedIndustry === 'fiber' && <Wifi className="w-4 h-4" />}
                      {selectedIndustry === 'windows' && <DoorOpen className="w-4 h-4" />}
                      {selectedIndustry === 'solar' && <Sun className="w-4 h-4" />}
                      {selectedIndustry === 'roofing' && <Home className="w-4 h-4" />}
                      {selectedIndustry 
                        ? industries.find(i => i.slug === selectedIndustry)?.name 
                        : 'Universal'}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="bg-slate-900 border-white/10 text-white min-w-[160px]"
                >
                  <DropdownMenuItem
                    onClick={() => setSelectedIndustry(null)}
                    className={cn(
                      "cursor-pointer focus:bg-white/10 focus:text-white flex items-center gap-2",
                      !selectedIndustry && "bg-white/10 text-white"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    Universal
                  </DropdownMenuItem>
                  {industries.map((industry) => (
                    <DropdownMenuItem
                      key={industry.id}
                      onClick={() => setSelectedIndustry(industry.slug)}
                      className={cn(
                        "cursor-pointer focus:bg-white/10 focus:text-white flex items-center gap-2",
                        selectedIndustry === industry.slug && "bg-white/10 text-white"
                      )}
                    >
                      {industry.slug === 'pest' && <Bug className="w-4 h-4" />}
                      {industry.slug === 'fiber' && <Wifi className="w-4 h-4" />}
                      {industry.slug === 'windows' && <DoorOpen className="w-4 h-4" />}
                      {industry.slug === 'solar' && <Sun className="w-4 h-4" />}
                      {industry.slug === 'roofing' && <Home className="w-4 h-4" />}
                      {industry.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "px-4 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm text-white/80 border border-white/10 hover:bg-slate-900/70 hover:border-white/20 hover:text-white min-w-[140px] justify-between"
                  )}
                >
                  <span>
                    {filter === 'all' && 'All'}
                    {filter === 'difficulty' && 'By Difficulty'}
                    {filter === 'unplayed' && 'Unplayed First'}
                    {filter === 'struggles' && 'Your Struggles'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-slate-900 border-white/10 text-white min-w-[140px]"
              >
                <DropdownMenuItem
                  onClick={() => setFilter('all')}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white",
                    filter === 'all' && "bg-white/10 text-white"
                  )}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('difficulty')}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white",
                    filter === 'difficulty' && "bg-white/10 text-white"
                  )}
                >
                  By Difficulty
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('unplayed')}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white",
                    filter === 'unplayed' && "bg-white/10 text-white"
                  )}
                >
                  Unplayed First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter('struggles')}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white",
                    filter === 'struggles' && "bg-white/10 text-white"
                  )}
                >
                  Your Struggles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <motion.button
              type="button"
              onClick={handleRandomAgent}
              disabled={loading || agents.length === 0}
              whileHover={loading || agents.length === 0 ? {} : { scale: 1.02 }}
              whileTap={loading || agents.length === 0 ? {} : { scale: 0.98 }}
              className={cn(
                "px-6 py-2.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-md text-sm sm:text-base tracking-tight transition-all font-space shadow-md shadow-purple-500/15",
                loading || agents.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              )}
            >
              <span className="flex items-center gap-2">
                🎲 Surprise Me
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Agent Bubbles Grid - 2 columns on mobile, grid on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 max-w-7xl mx-auto">
          {sortedAgents.map((agent, index) => {
                const variantKey = agent.color as keyof typeof COLOR_VARIANTS
                const variantStyles = COLOR_VARIANTS[variantKey]
                const isHovered = hoveredAgent === agent.id
                const isSelected = selectedAgent === agent.agentId
                const cardStyle = getCardStyle(agent.difficulty)

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={cn(
                      "w-full",
                      agent.isLocked || agent.name === 'Tag Team Tanya & Tom' ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    )}
                    role="button"
                    tabIndex={agent.isLocked ? -1 : 0}
                    onClick={() => !agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && handleSelectAgent(agent.agentId, agent.name)}
                    onKeyDown={(e) => {
                      if (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectAgent(agent.agentId, agent.name)
                      }
                    }}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <div
                      className={cn(
                        "h-full flex flex-col items-center p-3 sm:p-4 md:p-6 relative rounded-lg border",
                        cardStyle.border,
                        cardStyle.bg,
                        "hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300",
                        agent.isLocked && "opacity-50"
                      )}
                    >
                      {/* Industry Badge - Top Right */}
                      <div className="absolute top-2 right-2 sm:top-2 sm:right-2 z-10">
                        {isUniversalAgent(agent.name, agent.industries) ? (
                          // Show single Globe icon for universal agents (always show, even if no industries assigned)
                          <div
                            className="bg-black/60 backdrop-blur-sm rounded-full p-1.5 sm:p-2 border border-white/20 shadow-lg"
                            title="Universal"
                          >
                            <UNIVERSAL_ICON className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" />
                          </div>
                        ) : agent.industries && agent.industries.length > 0 ? (
                          // Show individual icons for non-universal agents
                          <div className={cn(
                            "flex flex-wrap gap-1 max-w-[calc(100%-1rem)] justify-end",
                            agent.industries.length > 3 && "gap-0.5" // Tighter spacing for many icons
                          )}>
                            {agent.industries.map((industrySlug) => {
                              const IconComponent = getIndustryIcon(industrySlug)
                              if (!IconComponent) return null
                              const iconSize = agent.industries && agent.industries.length > 4 
                                ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' 
                                : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
                              const padding = agent.industries && agent.industries.length > 4 ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
                              return (
                                <div
                                  key={industrySlug}
                                  className={cn(
                                    "bg-black/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg",
                                    padding
                                  )}
                                  title={industrySlug.charAt(0).toUpperCase() + industrySlug.slice(1)}
                                >
                                  <IconComponent className={cn(iconSize, "text-white/90")} />
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                      
                    {/* Agent Real Name - show for all agents, extract from name if needed */}
                    <div className="mb-2 sm:mb-3 text-center">
                      <h4 className="text-xs sm:text-sm md:text-base font-semibold text-white/90 font-space tracking-tight">
                        {(() => {
                          // Special handling for "I Need to Talk to My Spouse" - resolve by agent ID
                          if (agent.name === 'I Need to Talk to My Spouse') {
                            if (agent.agentId === 'agent_3301kg2vydhnf28s2q2b6thzhfa4') {
                              return 'Angela White' // Windows
                            }
                            if (agent.agentId === 'agent_7201kfgssnt8eb2a8a4kghb421vd') {
                              return 'Jessica Martinez' // Fiber
                            }
                            if (agent.agentId === 'agent_2001kfgxefjcefk9r6s1m5vkfzxn') {
                              return 'Patricia Wells' // Roofing
                            }
                            if (agent.agentId === 'agent_9101kfgy6d0jft18a06r0zj19jp1') {
                              return 'Michelle Torres' // Solar
                            }
                          }
                          // Special handling for "I'm Selling Soon" - resolve by agent ID
                          if (agent.name === 'I\'m Selling Soon') {
                            if (agent.agentId === 'agent_2701kg2yvease7b89h6nx6p1eqjy') {
                              return 'Diane Martinez' // Solar
                            }
                            if (agent.agentId === 'agent_9701kfgy2ptff7x8je2fcca13jp1') {
                              return 'Robert Williams' // Roofing
                            }
                          }
                          return AGENT_REAL_NAMES[agent.name]
                        })() || (() => {
                          // Extract name from agent names like "Average Austin" -> "Austin Mitchell"
                          const nameMatch = agent.name.match(/(Austin|Nancy|Steve|Nick|Dave|Tim|Susan|Beth|Randy|Sam|Jerry|Tina|Victor)/i)
                          if (nameMatch) {
                            const firstName = nameMatch[1]
                            const lastNames: Record<string, string> = {
                              'Austin': 'Mitchell',
                              'Nancy': 'Chen',
                              'Steve': 'Johnson',
                              'Nick': 'Thompson',
                              'Dave': 'Martinez',
                              'Tim': 'Wilson',
                              'Susan': 'Davis',
                              'Beth': 'Rodriguez',
                              'Randy': 'Lee',
                              'Sam': 'Brown',
                              'Jerry': 'White',
                              'Tina': 'Garcia',
                              'Victor': 'Anderson',
                            }
                            return `${firstName} ${lastNames[firstName] || 'Smith'}`
                          }
                          return agent.name.split(' ')[0] + ' ' + (agent.name.split(' ')[1] || 'Homeowner')
                        })()}
                      </h4>
                    </div>
                    
                    {/* Mobile Agent Card Content - reuse the same structure */}
                    <motion.button
                whileHover={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 1.05 } : {}}
                whileTap={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 0.95 } : {}}
                      disabled={agent.isLocked || agent.name === 'Tag Team Tanya & Tom'}
                      tabIndex={-1}
                      className={cn("relative mb-2 sm:mb-3 focus:outline-none group", (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') && "cursor-not-allowed")}
                    >
                      <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 mx-auto">
                        {/* Concentric circles */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className={cn(
                              "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                              variantStyles.border[i],
                              variantStyles.gradient
                            )}
                            animate={isHovered ? {
                              rotate: 360,
                              scale: 1,
                              opacity: 1,
                            } : {
                              rotate: 360,
                              scale: [1, 1.05, 1],
                              opacity: isSelected ? [1, 1, 1] : [0.7, 0.9, 0.7],
                            }}
                            transition={isHovered ? {
                              rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                              scale: { duration: 0.3 },
                              opacity: { duration: 0.3 },
                            } : {
                              rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                              scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                              opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                            }}
                          >
                            <div
                              className={cn(
                                "absolute inset-0 rounded-full mix-blend-screen",
                                `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                                  "from-",
                                  ""
                                )}/20%,transparent_70%)]`
                              )}
                            />
                          </motion.div>
                        ))}

                        {/* Profile Image */}
                        {agent.image && (
                          <motion.div 
                            className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                            animate={isHovered ? {
                              scale: 1,
                            } : {
                              scale: [1, 1.05, 1],
                            }}
                            transition={isHovered ? {
                              duration: 0.3,
                            } : {
                              duration: 4,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: 0,
                            }}
                          >
                            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                              {(() => {
                                const imageStyle = getAgentImageStyle(agent.name, agent.agentId)
                                const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                                let translateY = '0'
                                const verticalNum = parseFloat(vertical)
                                if (verticalNum !== 50) {
                                  const translatePercent = ((verticalNum - 50) / 150) * 100
                                  translateY = `${translatePercent}%`
                                }
                                const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                                
                                return (
                                  <Image
                                    src={agent.image}
                                    alt={agent.name}
                                    fill
                                    className="object-cover"
                                    style={{
                                      objectPosition: `${horizontal} ${vertical}`,
                                      transform: `scale(${scaleValue}) translateY(${translateY})`,
                                    }}
                                    sizes="320px"
                                    quality={95}
                                    priority={index < 8}
                                  />
                                )
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Coming Soon Badge */}
                    {agent.name === 'Tag Team Tanya & Tom' && (
                      <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                        <div className="bg-white/[0.05] backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 border border-white/10">
                          <span className="text-xs sm:text-sm text-white/80 font-medium font-space">🚧 Coming Soon</span>
                        </div>
                      </div>
                    )}

                    {/* Agent Info */}
                    <div className="text-center w-full mt-auto">
                      {/* Objection below avatar */}
                      <h3 className="text-xs sm:text-sm md:text-base font-medium text-white/80 mb-1 sm:mb-2 font-space tracking-tight line-clamp-2 leading-tight">
                        {agent.name}
                      </h3>
                      {/* Difficulty Dot */}
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
                        <div className={cn(
                          "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0",
                          agent.difficulty === 'Easy' && "bg-green-400",
                          agent.difficulty === 'Moderate' && "bg-yellow-400",
                          agent.difficulty === 'Hard' && "bg-orange-400",
                          agent.difficulty === 'Expert' && "bg-red-400",
                          !agent.difficulty && "bg-white/40"
                        )} />
                        <span className="text-xs sm:text-sm md:text-base text-white/70 font-space font-bold">
                          {agent.difficulty || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Session Stats */}
                      {(agent.hasClosed || agent.bestScore) && (
                        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/10">
                          {agent.hasClosed && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-lg border border-green-500/30">
                              <span className="text-sm sm:text-base">✅</span>
                              <span className="text-sm sm:text-base text-green-400 font-space font-semibold">Closed</span>
                            </div>
                          )}
                          {agent.bestScore !== null && agent.bestScore !== undefined && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                              <span className="text-sm sm:text-base text-purple-400 font-space font-bold">
                                Best: {agent.bestScore}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </motion.div>
                )
              })}
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm sm:text-base text-slate-400 font-space font-bold">
            Hover over a card to see it glow • Click to start your session
          </p>
        </motion.div>
      </div>
    </div>
  )
}
