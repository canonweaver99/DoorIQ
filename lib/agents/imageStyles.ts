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
    objectPosition: '-15% 75%', // Moved up (75%) from 85%
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
  'I Already Have a Pest Guy': {
    objectPosition: '50% 82%', // Moved up a bit from 85%
    scale: 1.7, // Zoomed in on face (reduced from 2.0)
  },
  'I Don\'t Have Any Bugs': {
    objectPosition: '95% 70%', // Moved to the right and down
    scale: 1.7, // Zoomed in on face
  },
  'I\'m Renting/Don\'t Own': {
    objectPosition: '15% 70%', // Moved to the left and down
    scale: 1.5, // Zoomed in
  },
  'I Just Spray Myself': {
    objectPosition: '70% 78%', // Moved to the right and down
    scale: 1.5, // Zoomed in
  },
  'Send Me Information': {
    objectPosition: '120% 65%', // Moved far to the right and down
  },
  'I Have Pets/Kids - Worried About Chemicals': {
    objectPosition: '70% 60%', // Moved to the right and down
  },
  'Bad Timing - Call Me Back Later': {
    objectPosition: '50% 70%', // Moved down
    scale: 1.5, // Zoomed in
  },
  'The Karen': {
    objectPosition: '60% 50%', // Moved to the right
    scale: 1.0, // Zoomed out
  },
  'My Roof is Fine': {
    objectPosition: '50% 72%', // Moved down more from 65% to 72%
    scale: 1.4, // Zoomed in from 1.15 to 1.4
  },
  'I\'m Not Interested': {
    objectPosition: '50% 52%', // Default position
    scale: 1.0, // Zoomed out from default 1.15 to 1.0
  },
  'How Much Does a Roof Cost?': {
    objectPosition: '50% 72%', // Moved down more from 65% to 72%
    scale: 1.4, // Zoomed in from default 1.15 to 1.4
  },
  'I Just Had My Roof Done': {
    objectPosition: '88% 58%', // Moved a tiny bit more to the right (88%) and down (58%)
    scale: 1.15,
  },
  'I\'ll Call You When I Need a Roof': {
    objectPosition: '50% 65%', // Moved down more from 58% to 65%
    scale: 1.4, // Zoomed in from default 1.15 to 1.4
  },
  'I Already Have Someone': {
    objectPosition: '25% 72%', // Moved down more (72%) while keeping left position (25%)
    scale: 1.6, // Zoomed in more from 1.4 to 1.6
  },
  'My Insurance Won\'t Cover It': {
    objectPosition: '90% 65%', // Moved more to the right (90%) and down (65%)
    scale: 1.5, // Zoomed in from default 1.15 to 1.5
  },
  'I\'m Selling Soon': {
    objectPosition: '5% 52%', // Moved more to the left (5%) from 15%
    scale: 1.15,
  },
  'I Don\'t Trust Door-to-Door Roofers': {
    objectPosition: '5% 72%', // Moved down more (72%) from 65%
    scale: 1.5, // Zoomed in from 1.15 to 1.5
  },
  'I\'m Not Interested in Solar': {
    objectPosition: '65% 72%', // Moved down more (72%) from 65% and to the right (65%)
    scale: 1.4, // Zoomed in from 1.15 to 1.4
  },
  'Solar is Too Expensive': {
    objectPosition: '50% 80%', // Moved down a lot (80%) from default 52%
    scale: 1.6, // Zoomed in from default 1.15 to 1.6
  },
  'How Much Does It Cost?': {
    objectPosition: '50% 80%', // Moved down a lot (80%) from default 52%
    scale: 1.6, // Zoomed in from default 1.15 to 1.6
  },
  'My Electric Bill is Too Low': {
    objectPosition: '50% 65%', // Moved down (65%) from default 52%
    scale: 1.6, // Zoomed in from default 1.15 to 1.6
  },
  'What If It Doesn\'t Work?': {
    objectPosition: '5% 68%', // Moved down a little (68%) from 65%
    scale: 1.5, // Zoomed in from default 1.15 to 1.5
  },
  'My Roof is Too Old': {
    objectPosition: '10% 80%', // Moved more to the left (10%) and down a lot (80%)
    scale: 1.7, // Zoomed in a little more from 1.5 to 1.7
  },
  'I\'ve Heard Bad Things About Solar': {
    objectPosition: '58% 58%', // Moved down (58%) and to the right a little (58%) from default 50% 52%
    scale: 1.15,
  },
  'I Don\'t Qualify': {
    objectPosition: '75% 75%', // Moved down more (75%) from 65% and to the right (75%)
    scale: 1.7, // Zoomed in a little more from 1.5 to 1.7
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
