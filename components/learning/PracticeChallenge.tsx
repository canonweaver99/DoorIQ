'use client'

import { useRouter } from 'next/navigation'
import { PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChallengeScenario {
  scenario: string
  successCriteria: string[]
  agentId: string // eleven_agent_id
  agentName: string
}

// Map module slugs to challenge scenarios
const challengeScenarios: Record<string, ChallengeScenario> = {
  // Approach modules
  'positioning': {
    scenario: 'Skeptical Susan answers the door with arms crossed and low energy. Use proper positioning and mirroring to get her to engage.',
    successCriteria: [
      'Don\'t mention your product in the first 30 seconds',
      'Match her energy before trying to elevate it',
      'Get her to ask a question or step outside'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick (skeptical)
    agentName: 'Skeptical Susan'
  },
  'pattern-interrupt': {
    scenario: 'Busy Beth opens the door already saying "I\'m not interested" and starts closing it. Use a pattern interrupt to stop her and create curiosity.',
    successCriteria: [
      'Stop the door from closing',
      'Get her to pause and listen',
      'Create a moment of curiosity without mentioning your product'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  'reading-signs': {
    scenario: 'Average Austin answers the door but seems distracted and keeps looking back inside. Read his body language and adjust your approach.',
    successCriteria: [
      'Identify at least 2 non-verbal cues',
      'Adjust your energy to match his state',
      'Get him to focus on the conversation'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'icebreaker': {
    scenario: 'Renter Randy answers the door cautiously. Use an icebreaker to build rapport and make him feel comfortable.',
    successCriteria: [
      'Get him to smile or relax visibly',
      'Build rapport within the first minute',
      'Get him to share something personal'
    ],
    agentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx', // Renter Randy
    agentName: 'Renter Randy'
  },
  'what-not-to-do': {
    scenario: 'Think About It Tina is polite but non-committal. Avoid common mistakes and keep her engaged.',
    successCriteria: [
      'Don\'t rush to your pitch',
      'Avoid sounding scripted',
      'Keep the conversation natural and flowing'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'transition': {
    scenario: 'No Problem Nancy is friendly and engaged. Smoothly transition from rapport-building to your value proposition.',
    successCriteria: [
      'Create a natural bridge from small talk to business',
      'Get permission to continue',
      'Maintain engagement through the transition'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  // Pitch modules
  'value-before-price': {
    scenario: 'Too Expensive Tim immediately asks "How much?" before you\'ve built value. Practice building value before discussing price.',
    successCriteria: [
      'Delay price discussion until value is established',
      'Build at least 3 value points before mentioning cost',
      'Get him to see the value before the price'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  'features-vs-benefits': {
    scenario: 'Average Austin asks technical questions. Translate your features into benefits that matter to him.',
    successCriteria: [
      'Use "which means" to connect features to benefits',
      'Focus on outcomes, not specifications',
      'Get him to see the practical value'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'painting-the-picture': {
    scenario: 'Skeptical Sam doesn\'t see the problem. Paint a vivid picture of what happens if he doesn\'t act.',
    successCriteria: [
      'Create a visual, visceral understanding of the problem',
      'Use specific, concrete examples',
      'Get him to see the future consequences'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick (skeptical)
    agentName: 'Skeptical Sam'
  },
  'keep-ammo': {
    scenario: 'Too Expensive Tim objects to price. Keep value-building ammo in your pocket and continue building value.',
    successCriteria: [
      'Don\'t use all your value points at once',
      'Have additional benefits ready for objections',
      'Continue building value after the first objection'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  'reading-adjusting': {
    scenario: 'Busy Beth shows interest but seems rushed. Read her signals and adjust your pace accordingly.',
    successCriteria: [
      'Identify her engagement level',
      'Adjust your pace to match her energy',
      'Know when to speed up or slow down'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  // Communication modules
  'mirroring': {
    scenario: 'Skeptical Susan has closed body language and low energy. Mirror her posture and energy before elevating.',
    successCriteria: [
      'Match her body language initially',
      'Mirror her energy level',
      'Gradually elevate after establishing rapport'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick
    agentName: 'Skeptical Susan'
  },
  'eye-contact': {
    scenario: 'Average Austin avoids eye contact. Use proper eye contact to build trust and engagement.',
    successCriteria: [
      'Maintain appropriate eye contact (60-70%)',
      'Use eye contact to show you\'re listening',
      'Get him to make eye contact with you'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'paraverbals': {
    scenario: 'Busy Beth seems distracted. Use your voice tone, pace, and volume to capture and maintain her attention.',
    successCriteria: [
      'Vary your tone to emphasize key points',
      'Match your pace to her energy',
      'Use pauses effectively'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  'body-language': {
    scenario: 'Renter Randy seems nervous. Use open, confident body language to make him feel comfortable.',
    successCriteria: [
      'Use open posture (no crossed arms)',
      'Maintain appropriate distance',
      'Use gestures to emphasize points'
    ],
    agentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx', // Renter Randy
    agentName: 'Renter Randy'
  },
  'reading-body-language': {
    scenario: 'Think About It Tina shows mixed signals. Read her body language to understand her true feelings.',
    successCriteria: [
      'Identify at least 3 body language cues',
      'Interpret what they mean',
      'Adjust your approach based on what you see'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'energy-management': {
    scenario: 'No Problem Nancy starts with high energy but drops off. Manage your energy to keep her engaged throughout.',
    successCriteria: [
      'Match her initial energy',
      'Maintain energy when hers drops',
      'Elevate energy at key moments'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  // Closing modules
  'soft-vs-hard': {
    scenario: 'Spouse Check Susan needs to check with her spouse. Use soft closes to build commitment before asking for the sale.',
    successCriteria: [
      'Use at least 2 soft closes',
      'Build commitment before asking for the sale',
      'Get small agreements before the big one'
    ],
    agentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8', // Spouse Check Susan
    agentName: 'Spouse Check Susan'
  },
  'soft-close-types': {
    scenario: 'No Problem Nancy is engaged but hasn\'t committed. Use different types of soft closes to test her interest.',
    successCriteria: [
      'Use at least 3 different soft close types',
      'Get small commitments',
      'Build toward the final close'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  'three-close-rule': {
    scenario: 'Think About It Tina says "I need to think about it." Apply the 3-close rule to overcome her hesitation.',
    successCriteria: [
      'Attempt at least 3 closes',
      'Use different close types',
      'Handle objections between closes'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'assumptive-language': {
    scenario: 'Spouse Check Susan seems ready but needs to check with her spouse. Use assumptive language to move toward commitment.',
    successCriteria: [
      'Use assumptive language throughout',
      'Act as if the sale is happening',
      'Get her to agree to next steps'
    ],
    agentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8', // Spouse Check Susan
    agentName: 'Spouse Check Susan'
  },
  'hard-close-sequence': {
    scenario: 'Too Expensive Tim has heard all your value but still hesitates. Use the hard close sequence to get a decision.',
    successCriteria: [
      'Summarize value before closing',
      'Ask for the sale directly',
      'Handle final objections confidently'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  // Overcome module
  'overcome': {
    scenario: 'DIY Dave thinks he can handle it himself. Use the R.A.C. framework to overcome his objection.',
    successCriteria: [
      'Acknowledge his concern',
      'Reframe the problem',
      'Close with a question'
    ],
    agentId: 'agent_1701k6dvc3nfejmvydkk7r85tqef', // DIY Dave
    agentName: 'DIY Dave'
  }
}

interface PracticeChallengeProps {
  moduleSlug: string
  moduleTitle: string
}

export function PracticeChallenge({ moduleSlug, moduleTitle }: PracticeChallengeProps) {
  const router = useRouter()
  const challenge = challengeScenarios[moduleSlug]

  if (!challenge) {
    return null // Don't show challenge if no scenario is defined
  }

  const handleStartChallenge = () => {
    // Navigate to trainer with the specific agent
    router.push(`/trainer?agent=${encodeURIComponent(challenge.agentId)}`)
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-purple-900/20 border-2 border-purple-500/30 rounded-lg p-6 sm:p-8 mb-6 shadow-[0_4px_16px_rgba(139,92,246,0.3)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <PlayCircle className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 font-space">Practice Challenge</h3>
          <p className="text-sm text-purple-300/80 font-sans">
            Test this skill with an AI homeowner
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-white/90 font-sans mb-4 leading-relaxed">
          <span className="font-semibold text-purple-300">Scenario:</span> {challenge.scenario}
        </p>

        <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-300 mb-3 font-space uppercase tracking-wide">
            Success Criteria:
          </h4>
          <ul className="space-y-2">
            {challenge.successCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2 text-white/80 font-sans text-sm">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handleStartChallenge}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold',
          'bg-purple-600 hover:bg-purple-700 text-white',
          'transition-colors duration-200',
          'font-space text-base'
        )}
      >
        <PlayCircle className="w-5 h-5" />
        Start Challenge →
      </button>
    </div>
  )
}

