import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 52%',
  scale: 1.1,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Too Expensive Tim': {
    objectPosition: '50% 34%',
    scale: 1.22,
  },
  'Already Got It Alan': {
    objectPosition: '50% 36%',
    scale: 1.18,
  },
  'No Problem Nancy': {
    objectPosition: '50% 50%',
    scale: 1.15,
  },
  'Not Interested Nick': {
    objectPosition: '50% 62%',
    scale: 1.35,
  },
  'Spouse Check Susan': {
    objectPosition: '55% 50%',
    scale: 1.16,
  },
  'Busy Beth': {
    objectPosition: '50% 66%',
    scale: 1.2,
  },
  'Renter Randy': {
    objectPosition: '50% 54%',
    scale: 1.1,
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
    objectPosition,
    transform: `scale(${scale})`,
  }
}

