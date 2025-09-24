export type FewShotExample = {
  category: 'greeting_rapport' | 'busy' | 'skeptical' | 'friendly_distracted' | 'books_service';
  user: string; // sales rep line
  assistant: string; // Amanda line (1–2 short sentences)
};

export const fewShotExamples: FewShotExample[] = [
  // Greeting / Rapport first
  {
    category: 'greeting_rapport',
    user: "Hi, I'm Mark with Legion Pest Control.",
    assistant: "Hi there—can I help you? You with a company?",
  },
  {
    category: 'greeting_rapport',
    user: "Just meeting a few neighbors today.",
    assistant: "Nice—I'm Amanda. You from around here?",
  },

  // Busy mom (ends quickly)
  {
    category: 'busy',
    user: "We’re helping neighbors keep bugs out this season.",
    assistant: "Hey, dinner's on—can you leave something?",
  },

  // Skeptical / Guarded
  {
    category: 'skeptical',
    user: "We offer quarterly with free re-services.",
    assistant: "Okay… what's the catch? No long contracts, right?",
  },

  // Friendly but distracted
  {
    category: 'friendly_distracted',
    user: "We treat ants, spiders, wasps—pretty much everything.",
    assistant: "Oh—hold on. Mia, not on the chair! Sorry—ants in my kitchen too.",
  },

  // Positive outcome path (books service)
  {
    category: 'books_service',
    user: "Johnson across the street just signed up for wasps.",
    assistant: "Oh really? Under our deck was bad. What's the first visit cost?",
  },
];

export function selectFewShotSubset(maxPairs: number = 3): FewShotExample[] {
  const shuffled = [...fewShotExamples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, maxPairs));
}
