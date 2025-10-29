import type { CSSProperties } from 'react'

type AgentImageStyle = {
  objectPosition?: string
  scale?: number
}

const DEFAULT_STYLE: Required<AgentImageStyle> = {
  objectPosition: '50% 50%',
  scale: 1.3,
}

const AGENT_IMAGE_STYLES: Record<string, AgentImageStyle> = {
  'Austin': {
    objectPosition: '50% 38%',
    scale: 1.4,
  },
  'Too Expensive Tim': {
    objectPosition: '50% 38%',
    scale: 1.4,
  },
  'Already Got It Alan': {
    objectPosition: '50% 40%',
    scale: 1.35,
  },
  'No Problem Nancy': {
    objectPosition: '50% 50%',
    scale: 1.3,
  },
  'Not Interested Nick': {
    objectPosition: '50% 48%',
    scale: 1.5,
  },
  'Spouse Check Susan': {
    objectPosition: '50% 50%',
    scale: 1.35,
  },
  'Busy Beth': {
    objectPosition: '50% 48%',
    scale: 1.15,
  },
  'Renter Randy': {
    objectPosition: '50% 50%',
    scale: 1.3,
  },
  'Just Treated Jerry': {
    objectPosition: '50% 48%',
    scale: 1.25,
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

