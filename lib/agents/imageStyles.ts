import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 45%',
  scale: 1.6,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Austin': {
    objectPosition: '50% 42%',
    scale: 1.65,
  },
  'Too Expensive Tim': {
    objectPosition: '50% 42%',
    scale: 1.65,
  },
  'Already Got It Alan': {
    objectPosition: '50% 43%',
    scale: 1.6,
  },
  'No Problem Nancy': {
    objectPosition: '50% 45%',
    scale: 1.55,
  },
  'Not Interested Nick': {
    objectPosition: '50% 50%',
    scale: 1.8,
  },
  'Spouse Check Susan': {
    objectPosition: '50% 48%',
    scale: 1.6,
  },
  'Busy Beth': {
    objectPosition: '50% 50%',
    scale: 1.4,
  },
  'Renter Randy': {
    objectPosition: '50% 45%',
    scale: 1.6,
  },
  'Just Treated Jerry': {
    objectPosition: '50% 45%',
    scale: 1.55,
  },
  'DIY Dave': {
    objectPosition: '50% 45%',
    scale: 1.65,
  },
  'Skeptical Sam': {
    objectPosition: '50% 45%',
    scale: 1.6,
  },
  'Think About It Tina': {
    objectPosition: '50% 45%',
    scale: 1.6,
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

