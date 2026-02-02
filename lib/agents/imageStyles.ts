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
  'Travis "T-Bone" Hendricks': {
    objectPosition: '50% 65%', // Centered, lowered more to focus on face
    scale: 1.6, // Zoomed in on face
  },
  'How Much Is It?': {
    objectPosition: '0% 65%', // Moved all the way to the left, moved down more
    scale: 1.5, // Zoomed in more on face
  },
  'What\'s the Price?': {
    objectPosition: '50% 75%', // Centered horizontally, moved down more (from 70% to 75%)
    scale: 1.5, // Zoomed in on face
  },
  // Industry-specific positioning for "I Need to Talk to My Spouse" based on elevenAgentId
  // Jessica Martinez (Fiber): agent_7201kfgssnt8eb2a8a4kghb421vd
  // Angela White (Windows): agent_3301kg2vydhnf28s2q2b6thzhfa4
  // Patricia Wells (Roofing): agent_2001kfgxefjcefk9r6s1m5vkfzxn
  // Michelle Torres (Solar): agent_9101kfgy6d0jft18a06r0zj19jp1
  'I Need to Talk to My Spouse': {
    objectPosition: '75% 80%', // Default (Angela White - Windows)
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
    objectPosition: '50% 65%', // Moved up (from 75% to 65%)
    scale: 1.3, // Zoomed out (from 1.7 to 1.3)
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
    objectPosition: '100% 70%', // Moved more to the right (from 95% to 100%)
    scale: 1.5, // Zoomed in a little (from 1.3 to 1.5)
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
    objectPosition: '120% 60%', // Moved up a little (from 65% to 60%)
  },
  'I Have Pets/Kids - Worried About Chemicals': {
    objectPosition: '70% 60%', // Moved to the right and down
  },
  'Bad Timing - Call Me Back Later': {
    objectPosition: '50% 70%', // Moved down
    scale: 1.5, // Zoomed in
  },
  'We\'re Selling/Moving Soon': {
    objectPosition: '50% 80%', // Moved up a little (from 85% to 80%)
    scale: 1.6, // Zoomed out a little (from 1.8 to 1.6)
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
    objectPosition: '80% 52%', // Moved more to the right (from 65% to 80%)
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
    objectPosition: '65% 85%', // Moved down more (from 80% to 85%) and more to the left (from 70% to 65%)
    scale: 1.7, // Zoomed in a little more from 1.5 to 1.7
  },
  'My Windows Are Fine': {
    objectPosition: '80% 80%', // Moved more to the right (from 65% to 80%)
    scale: 1.6, // Zoomed in a little more (from 1.4 to 1.6)
  },
  'That\'s Too Expensive': {
    objectPosition: '0% 75%', // Moved even more to the left (from 15% to 0%) and up more (from 80% to 75%)
    scale: 1.4, // Zoomed in
  },
  'I\'m Going to Get Multiple Quotes': {
    objectPosition: '50% 65%', // Moved up more (from 75% to 65%)
    scale: 1.6, // Zoomed in
  },
  'I Just Need One or Two Windows': {
    objectPosition: '85% 70%', // Moved up (from 80% to 70%) and more to the right (from 75% to 85%)
    scale: 1.4, // Zoomed out a little (from 1.6 to 1.4)
  },
  'I\'ll Just Do It Myself': {
    objectPosition: '80% 70%', // Moved down (from 52% to 70%) and more to the right (from 70% to 80%)
    scale: 1.5, // Zoomed in a little
  },
  'What\'s Wrong With My Current Windows?': {
    objectPosition: '50% 72%', // Moved up a little more (from 75% to 72%)
    scale: 1.4, // Zoomed in
  },
  'I\'m Waiting Until...': {
    objectPosition: '-10% 70%', // Moved more to the left (from -5% to -10%) and up (from 80% to 70%)
    scale: 1.4, // Zoomed in
  },
}

// Industry-specific styles for "I Need to Talk to My Spouse" based on elevenAgentId
const SPOUSE_AGENT_STYLES: Record<string, AgentImageStyle> = {
  'agent_7201kfgssnt8eb2a8a4kghb421vd': { // Jessica Martinez (Fiber)
    objectPosition: '10% 78%', // Moved to the left a lot
    scale: 1.8,
  },
  'agent_3301kg2vydhnf28s2q2b6thzhfa4': { // Angela White (Windows)
    objectPosition: '75% 80%', // Moved to the right
    scale: 1.8,
  },
  'agent_2001kfgxefjcefk9r6s1m5vkfzxn': { // Patricia Wells (Roofing)
    objectPosition: '10% 70%', // Moved up more
    scale: 1.8,
  },
  'agent_9101kfgy6d0jft18a06r0zj19jp1': { // Michelle Torres (Solar)
    objectPosition: '-5% 80%', // Moved down and to the left
    scale: 1.8,
  },
}

// Industry-specific styles for "I'm Selling Soon" based on elevenAgentId
const SELLING_SOON_AGENT_STYLES: Record<string, AgentImageStyle> = {
  // TODO: Replace 'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID' with actual Jennifer Walsh agent ID
  'PLACEHOLDER_JENNIFER_WALSH_AGENT_ID': { // Jennifer Walsh (Solar)
    objectPosition: '95% 60%', // Moved even further to the right
    scale: 1.2, // Zoomed in a tiny bit
  },
  'agent_2701kg2yvease7b89h6nx6p1eqjy': { // Diane Martinez (Roofing)
    objectPosition: '5% 52%', // Keep existing position
    scale: 1.15,
  },
  'agent_9701kfgy2ptff7x8je2fcca13jp1': { // Robert Williams (Roofing) - legacy
    objectPosition: '5% 52%', // Keep existing position
    scale: 1.15,
  },
}

export function getAgentImageStyle(agentName?: string | null, elevenAgentId?: string | null): CSSProperties {
  if (!agentName) {
    return {
      objectPosition: DEFAULT_STYLE.objectPosition,
      transform: `scale(${DEFAULT_STYLE.scale})`,
    }
  }

  // Check for industry-specific positioning for "I Need to Talk to My Spouse"
  if (agentName === 'I Need to Talk to My Spouse' && elevenAgentId) {
    const spouseStyle = SPOUSE_AGENT_STYLES[elevenAgentId]
    if (spouseStyle) {
      return {
        objectPosition: spouseStyle.objectPosition ?? DEFAULT_STYLE.objectPosition,
        transform: `scale(${spouseStyle.scale ?? DEFAULT_STYLE.scale})`,
      }
    }
  }

  // Check for industry-specific positioning for "I'm Selling Soon"
  if (agentName === 'I\'m Selling Soon' && elevenAgentId) {
    const sellingSoonStyle = SELLING_SOON_AGENT_STYLES[elevenAgentId]
    if (sellingSoonStyle) {
      return {
        objectPosition: sellingSoonStyle.objectPosition ?? DEFAULT_STYLE.objectPosition,
        transform: `scale(${sellingSoonStyle.scale ?? DEFAULT_STYLE.scale})`,
      }
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
