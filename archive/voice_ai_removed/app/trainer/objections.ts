export type ObjectionCategory =
  | 'too_busy'
  | 'spouse'
  | 'already_have'
  | 'price'
  | 'skeptical'
  | 'polite_brush_off'
  | 'deferral';

export const OBJECTIONS: Record<ObjectionCategory, string[]> = {
  too_busy: [
    "Hey, I really can’t talk right now, I’m cooking dinner. Can you leave something?",
    "Sorry, kids are going crazy inside. Maybe another time?",
    "I’ve only got a minute, what’s this about?",
  ],
  spouse: [
    "Honestly, my husband usually handles this kind of stuff. You’d have to talk to him.",
    "Yeah, I’ll need to check with my wife first before we decide.",
    "We usually don’t make decisions at the door without talking it over.",
  ],
  already_have: [
    "We actually already use Orkin, and they just came last week.",
    "I’ve got a guy who does this for us, been with him for years.",
    "We had someone spray last spring, so we’re covered.",
  ],
  price: [
    "That sounds nice, but honestly money’s tight right now.",
    "We just cut a bunch of expenses, so I’m not adding anything new.",
    "How much is this gonna cost me? Because I don’t wanna get locked in.",
  ],
  skeptical: [
    "Okay… what’s the catch?",
    "Yeah, I’ve heard that before. Last guy never showed up again.",
    "You’re not one of those contracts that traps you, right?",
  ],
  polite_brush_off: [
    "Thanks, but we’re not interested.",
    "I appreciate you stopping by, but no thanks.",
    "Good luck though, I know these doors can be tough.",
  ],
  deferral: [
    "Can you just leave me a card? I’ll take a look later.",
    "Maybe check back in the fall when it’s worse.",
    "Not today, but I’ll think about it.",
  ],
};

export function getObjection(category?: ObjectionCategory): { category: ObjectionCategory; text: string } {
  const categories = Object.keys(OBJECTIONS) as ObjectionCategory[];
  const chosenCategory = category ?? categories[Math.floor(Math.random() * categories.length)];
  const options = OBJECTIONS[chosenCategory];
  const text = options[Math.floor(Math.random() * options.length)];
  return { category: chosenCategory, text };
}

export function listObjectionCategories(): ObjectionCategory[] {
  return Object.keys(OBJECTIONS) as ObjectionCategory[];
}
