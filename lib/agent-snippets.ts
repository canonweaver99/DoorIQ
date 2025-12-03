/**
 * Fun, engaging sales conversation snippets for each agent
 * Used in the landing page audio snippet component
 */

export const AGENT_SNIPPETS: Record<string, string[]> = {
  'Average Austin': [
    "Look, I appreciate you stopping by, but I've got three kids and two dogs. How do I know your treatment is safe?",
    "Everyone says they're the best. What makes you different from the last guy who was here?",
    "I'm not trying to be rude, but I've heard this pitch before. What's your actual guarantee?",
    "Okay, so you treat the whole yard. But what happens if I still see bugs in two weeks?",
    "I get it, you're trying to sell me something. But honestly, how much is this really going to cost me?",
  ],
  'No Problem Nancy': [
    "Oh, that sounds wonderful! I've been meaning to do something about these ants anyway.",
    "Yes, that would be perfect! When can you get started?",
    "Oh my gosh, yes! My neighbor mentioned you guys. I'd love to hear more!",
    "That sounds great! I'm always looking for ways to keep my home safe for the kids.",
    "Absolutely! I've been wanting to get pest control for a while now.",
  ],
  'Switchover Steve': [
    "I'm already with Terminix, and they've been pretty good to us.",
    "We've been with our current company for about three years now. Why should I switch?",
    "I'm happy with what we have, but I'll listen. What makes you different?",
    "We're under contract with another company. Can you beat their price?",
    "I appreciate you stopping by, but we're pretty satisfied with our current service.",
  ],
  'Not Interested Nick': [
    "Not interested, thanks.",
    "I'm busy, can't talk right now.",
    "No thanks, I'm good.",
    "Not today, man.",
    "I don't have time for this.",
  ],
  'DIY Dave': [
    "I handle my own pest control. I've got spray from Home Depot that works just fine.",
    "Why would I pay you when I can do it myself for twenty bucks?",
    "I'm pretty handy. I've been taking care of this myself for years.",
    "I don't need a service. I've got it covered.",
    "I've been using store-bought stuff. Works fine for me.",
  ],
  'Too Expensive Tim': [
    "How much does this cost? Because I'm not paying a fortune.",
    "That sounds expensive. What's the actual price?",
    "I'm on a budget here. Can you give me a deal?",
    "Everyone's trying to charge me an arm and a leg. What's your best price?",
    "I'm interested, but I need to know the cost upfront.",
  ],
  'Spouse Check Susan': [
    "I'd love to, but I need to check with my husband first.",
    "This sounds good, but let me talk to my wife about it.",
    "I can't make a decision without my spouse. Can you come back?",
    "I need to run this by my partner before I commit to anything.",
    "My husband handles these decisions. Can I get your card?",
  ],
  'Busy Beth': [
    "I only have a minute, so make it quick.",
    "I'm in a rush, but I'll listen for thirty seconds.",
    "Okay, you've got my attention, but I'm really busy.",
    "I'm running late, but tell me what you've got.",
    "Quick version, please. I've got places to be.",
  ],
  'Renter Randy': [
    "I'm just renting, so I'm not sure if I can make that decision.",
    "I'd love to, but I'm not the owner. Should I talk to my landlord?",
    "I'm renting this place. Do I need permission from the owner?",
    "I'm not sure if I can authorize this since I'm just a tenant.",
    "The landlord handles maintenance. Should I give you their number?",
  ],
  'Skeptical Sam': [
    "Prove it. Show me reviews, testimonials, something real.",
    "I don't trust salespeople. What's your actual track record?",
    "Everyone makes promises. What can you actually guarantee?",
    "I need to see proof before I believe anything you're saying.",
    "Show me some real results, not just talk.",
  ],
  'Just Treated Jerry': [
    "We just had pest control done last month, so we're good.",
    "I'm not interested right now. We just got treated.",
    "We had someone out here recently. Maybe next time.",
    "We're all set. Just had service done a few weeks ago.",
    "Thanks, but we just had someone spray the place.",
  ],
  'Think About It Tina': [
    "I need to think about it. Can I get some information to review?",
    "This sounds interesting, but I want to research it first.",
    "I don't make decisions quickly. Can you send me details?",
    "I'll need to compare this with other options before deciding.",
    "Let me think it over and get back to you.",
  ],
  'Veteran Victor': [
    "I appreciate you coming by. What exactly does your service include?",
    "I like to know what I'm getting into. Walk me through the process.",
    "I respect what you're doing. Tell me about your company.",
    "I value structure and clear communication. What's your approach?",
    "I want to understand the full picture before making a decision.",
  ],
  'Tag Team Tanya & Tom': [
    "We both need to be on board with this. Can you explain it to both of us?",
    "I'm interested, but my partner has questions too.",
    "We make decisions together. Can you address both our concerns?",
    "I like it, but let me see what my partner thinks.",
    "We need to discuss this as a couple before we commit.",
  ],
};

/**
 * Get a random snippet for an agent
 */
export function getRandomSnippet(agentName: string): string {
  const snippets = AGENT_SNIPPETS[agentName] || [
    `Hi, I'm ${agentName}. Thanks for listening!`,
  ];
  
  return snippets[Math.floor(Math.random() * snippets.length)];
}

/**
 * Get all snippets for an agent
 */
export function getSnippetsForAgent(agentName: string): string[] {
  return AGENT_SNIPPETS[agentName] || [];
}


