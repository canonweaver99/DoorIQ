import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 52%',
  scale: 1.15,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Too Expensive Tim': {
    objectPosition: '50% 49%', // Lowered vertically by 15%
    scale: 1.27,
  },
  'Switchover Steve': {
    objectPosition: '60% 56%', // Lowered vertically by 10% (was 46%, now 56%)
    scale: 1.23,
  },
  'No Problem Nancy': {
    objectPosition: '11% 60%', // Horizontal and vertical position adjusted
    scale: 1.2,
  },
  'Not Interested Nick': {
    objectPosition: '50% 70%', // Lowered vertically
    scale: 1.75, // Made larger
  },
  'Spouse Check Susan': {
    objectPosition: '10% 50%', // Horizontal position adjusted
    scale: 1.15, // Made smaller
  },
  'Busy Beth': {
    objectPosition: '35% 65%', // Raised vertically by 15%
    scale: 1.04, // Reduced by 20% total from 1.28 (10% + 10%)
  },
  'Renter Randy': {
    objectPosition: '50% 54%',
    scale: 1.15,
  },
  'Just Treated Jerry': {
    objectPosition: '40% 52%', // Horizontal position adjusted
    scale: 1.12,
  },
  'Veteran Victor': {
    objectPosition: '73% 55%', // Lowered vertically by 5%
    scale: 1.15,
  },
  'Skeptical Sam': {
    objectPosition: '50% 52%', // Horizontal position adjusted
    scale: 1.15,
  },
  'DIY Dave': {
    objectPosition: '40% 52%', // Moved to the left
    scale: 1.4, // Made bigger
  },
  'Angry Indian': {
    objectPosition: '44% 58%', // Lowered vertically
    scale: 1.15,
  },
  'How Much Is It?': {
    objectPosition: '0% 65%', // Moved all the way to the left, moved down more
    scale: 1.5, // Zoomed in more on face
  },
  'I Need to Talk to My Spouse': {
    objectPosition: '15% 78%', // Moved down more
    scale: 1.8, // Zoomed in more on face
  },
  'I Already Have Internet': {
    objectPosition: '55% 78%', // Moved more down
    scale: 2.0, // Zoomed in even more on face
  },
  'I\'m in a Contract': {
    objectPosition: '25% 75%', // Moved more down and to the left
    scale: 1.5, // Zoomed in more on face
  },
  'I\'m Happy With What I Have': {
    objectPosition: '30% 75%', // Moved more down and to the left
    scale: 1.7, // Zoomed in more on face
  },
  'I Just Signed Up': {
    objectPosition: '85% 72%', // Moved 15% more to the right
    scale: 1.5, // Zoomed in more on face
  },
  'I Don\'t Want to Deal With Switching': {
    objectPosition: '40% 78%', // Moved down more and to the left
    scale: 1.65, // Zoomed in more on face
  },
  'My Internet Works Fine': {
    objectPosition: '65% 65%', // Moved to the right
    scale: 1.7, // Zoomed in more on face
  },
  'What\'s the Catch?': {
    objectPosition: '95% 65%', // Moved to the right
    scale: 1.5, // Zoomed in more on face
  },
  'I\'m Moving Soon': {
    objectPosition: '15% 65%', // Moved to the left
    scale: 1.5, // Zoomed in more on face
  },
}

export function getAgentImageStyle(agentName?: string | null): CSSProperties {
  if (!agentName) {
    return {
      objectPosition: DEFAULT_STYLE.objectPosition,
      transform: `scale(${DEFAULT_STYLE.scale})`,
    }
  }

  const overrides = AGENT_IMAGE_STYLES[agentName] ?? {}

  const objectPosition = overrides.objectPosition ?? DEFAULT_STYLE.objectPosition
  const scale = overrides.scale ?? DEFAULT_STYLE.scale

  return {
    objectPosition: objectPosition as string,
    transform: `scale(${scale})`,
  }
}
