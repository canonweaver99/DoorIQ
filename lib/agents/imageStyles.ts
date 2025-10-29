import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 120%',
  scale: 1.2,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Austin': {
    objectPosition: '50% 120%',
    scale: 1.25,
  },
  'Too Expensive Tim': {
    objectPosition: '50% 120%',
    scale: 1.25,
  },
  'Already Got It Alan': {
    objectPosition: '50% 120%',
    scale: 1.22,
  },
  'No Problem Nancy': {
    objectPosition: '50% 120%',
    scale: 1.18,
  },
  'Not Interested Nick': {
    objectPosition: '50% 120%',
    scale: 1.3,
  },
  'Spouse Check Susan': {
    objectPosition: '50% 120%',
    scale: 1.22,
  },
  'Busy Beth': {
    objectPosition: '50% 120%',
    scale: 1.1,
  },
  'Renter Randy': {
    objectPosition: '50% 120%',
    scale: 1.2,
  },
  'Just Treated Jerry': {
    objectPosition: '50% 120%',
    scale: 1.18,
  },
  'DIY Dave': {
    objectPosition: '50% 120%',
    scale: 1.25,
  },
  'Skeptical Sam': {
    objectPosition: '50% 120%',
    scale: 1.2,
  },
  'Think About It Tina': {
    objectPosition: '50% 120%',
    scale: 1.2,
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

