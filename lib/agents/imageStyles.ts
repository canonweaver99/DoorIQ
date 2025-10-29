import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 120%',
  scale: 0.92,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Austin': {
    objectPosition: '50% 120%',
    scale: 0.95,
  },
  'Too Expensive Tim': {
    objectPosition: '50% 120%',
    scale: 0.95,
  },
  'Already Got It Alan': {
    objectPosition: '50% 120%',
    scale: 0.93,
  },
  'No Problem Nancy': {
    objectPosition: '50% 120%',
    scale: 0.9,
  },
  'Not Interested Nick': {
    objectPosition: '50% 120%',
    scale: 0.98,
  },
  'Spouse Check Susan': {
    objectPosition: '50% 120%',
    scale: 0.93,
  },
  'Busy Beth': {
    objectPosition: '50% 120%',
    scale: 0.85,
  },
  'Renter Randy': {
    objectPosition: '50% 120%',
    scale: 0.92,
  },
  'Just Treated Jerry': {
    objectPosition: '50% 120%',
    scale: 0.9,
  },
  'DIY Dave': {
    objectPosition: '50% 120%',
    scale: 0.95,
  },
  'Skeptical Sam': {
    objectPosition: '50% 120%',
    scale: 0.92,
  },
  'Think About It Tina': {
    objectPosition: '50% 120%',
    scale: 0.92,
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

