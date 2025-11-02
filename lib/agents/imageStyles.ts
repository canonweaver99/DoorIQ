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
    objectPosition: '50% 34%',
    scale: 1.27,
  },
  'Already Got It Alan': {
    objectPosition: '60% 46%', // Horizontal position adjusted
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
