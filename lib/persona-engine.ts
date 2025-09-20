import type { Persona } from "./types";

// Advanced persona generation with memory and behavioral patterns
export class PersonaEngine {
  private persona: Persona;
  private conversationMemory: string[] = [];
  private trustLevel: number = 0; // -10 to 10
  private interestLevel: number = 0; // 0 to 10
  private timeInConversation: number = 0;

  constructor(persona: Persona) {
    this.persona = persona;
    this.trustLevel = this.getInitialTrust();
    this.interestLevel = this.getInitialInterest();
  }

  private getInitialTrust(): number {
    // Different personas start with different trust levels for door-to-door sales
    switch (this.persona.role) {
      case "Retired Homeowner": return -3; // More skeptical of door-to-door
      case "Busy Professional": return -1; // Skeptical but open to efficiency
      case "Homeowner": return -2; // Typical skepticism
      default: return -2;
    }
  }

  private getInitialInterest(): number {
    // Interest based on current pain points
    return this.persona.pain.length * 2; // More pain = more potential interest
  }

  // Analyze rep's message and update persona state
  updateFromRepMessage(repMessage: string): void {
    this.timeInConversation++;
    this.conversationMemory.push(`REP: ${repMessage}`);

    const msgLower = repMessage.toLowerCase();

    // Trust building behaviors
    if (msgLower.includes('neighbor') || msgLower.includes('your area')) {
      this.trustLevel += 2; // Local references build trust
    }
    if (msgLower.includes('guarantee') || msgLower.includes('warranty')) {
      this.trustLevel += 1;
    }
    if (msgLower.includes('epa') || msgLower.includes('safe') || msgLower.includes('family')) {
      this.trustLevel += 1; // Safety mentions build trust
    }
    if (msgLower.includes('free inspection') || msgLower.includes('no obligation')) {
      this.trustLevel += 1;
    }

    // Trust damaging behaviors
    if (msgLower.includes('today only') || msgLower.includes('special deal')) {
      this.trustLevel -= 2; // High pressure tactics damage trust
    }
    if (this.hasIgnoredPreviousQuestion()) {
      this.trustLevel -= 1; // Ignoring questions damages trust
    }
    if (msgLower.length > 200 && !msgLower.includes('?')) {
      this.trustLevel -= 1; // Long monologues without questions
    }

    // Interest building
    if (this.addressesSpecificPain(msgLower)) {
      this.interestLevel += 2;
    }
    if (msgLower.includes('prevent') && this.persona.pain.length > 0) {
      this.interestLevel += 1; // Prevention resonates when they have issues
    }

    // Interest damaging
    if (msgLower.includes('everyone needs') || msgLower.includes('all homes')) {
      this.interestLevel -= 1; // Generic pitches reduce interest
    }

    // Bounds
    this.trustLevel = Math.max(-10, Math.min(10, this.trustLevel));
    this.interestLevel = Math.max(0, Math.min(10, this.interestLevel));
  }

  private hasIgnoredPreviousQuestion(): boolean {
    // Check if the last prospect message had a question that wasn't addressed
    const lastProspectMsg = this.conversationMemory
      .filter(msg => msg.startsWith('PROSPECT:'))
      .pop();
    
    if (!lastProspectMsg || !lastProspectMsg.includes('?')) return false;

    const lastRepMsg = this.conversationMemory
      .filter(msg => msg.startsWith('REP:'))
      .pop();

    // Simple heuristic: if prospect asked about safety/chemicals and rep didn't mention it
    if (lastProspectMsg.toLowerCase().includes('safe') || lastProspectMsg.toLowerCase().includes('chemical')) {
      return !lastRepMsg?.toLowerCase().includes('safe') && !lastRepMsg?.toLowerCase().includes('epa');
    }

    return false;
  }

  private addressesSpecificPain(repMessage: string): boolean {
    return this.persona.pain.some(pain => 
      repMessage.includes(pain.toLowerCase())
    );
  }

  // Generate behavioral modifiers based on current state
  getBehavioralContext(): string {
    let context = `Trust Level: ${this.trustLevel}/10, Interest Level: ${this.interestLevel}/10. `;

    if (this.trustLevel < -5) {
      context += "VERY SKEPTICAL - be defensive, ask for credentials, mention bad experiences. ";
    } else if (this.trustLevel < 0) {
      context += "SKEPTICAL - be cautious, ask probing questions, need convincing. ";
    } else if (this.trustLevel > 5) {
      context += "TRUSTING - be more open, share concerns readily, ask helpful questions. ";
    }

    if (this.interestLevel < 3) {
      context += "LOW INTEREST - focus on objections, mention you don't really need this. ";
    } else if (this.interestLevel > 7) {
      context += "HIGH INTEREST - ask detailed questions, show engagement, move toward decision. ";
    }

    if (this.timeInConversation > 8) {
      context += "GETTING IMPATIENT - mention you have other things to do, need to wrap up. ";
    }

    // Persona-specific behaviors
    if (this.persona.role === "Retired Homeowner") {
      context += "Elderly persona: be more cautious about new things, mention fixed income, ask about senior discounts. ";
    } else if (this.persona.role === "Busy Professional") {
      context += "Busy persona: value time highly, want quick solutions, ask about scheduling flexibility. ";
    }

    return context;
  }

  // Check if success criteria are met
  checkSuccessCriteria(conversationHistory: string[]): boolean {
    const allText = conversationHistory.join(' ').toLowerCase();
    const criteria = this.persona.successCriteria;

    if (criteria.requiresScheduling) {
      const hasScheduling = /schedule|appointment|when|time|calendar|book/.test(allText);
      if (!hasScheduling) return false;
    }

    if (criteria.requiresBudgetCheck) {
      const hasBudget = /cost|price|budget|afford|expensive|cheap/.test(allText);
      if (!hasBudget) return false;
    }

    if (criteria.requiresROIQuant) {
      const hasROI = /save|reduce|prevent|worth|value|benefit/.test(allText);
      if (!hasROI) return false;
    }

    // Additional pest control specific criteria
    if (this.persona.pain.some(p => p.includes('safe')) || this.persona.role === "Homeowner") {
      const hasSafety = /safe|epa|family|pet|child|toxic/.test(allText);
      if (!hasSafety) return false;
    }

    return this.trustLevel > 0 && this.interestLevel > 5;
  }

  // Get current state for debugging/monitoring
  getState() {
    return {
      trustLevel: this.trustLevel,
      interestLevel: this.interestLevel,
      timeInConversation: this.timeInConversation,
      persona: this.persona
    };
  }
}

// Factory for creating different homeowner personas
export class PersonaFactory {
  static createRandomPestControlPersona(): Persona {
    const personas: Persona[] = [
      {
        company: "Suburban Family Home",
        vertical: "Residential",
        size: 1,
        role: "Homeowner",
        pain: ["ants in kitchen", "spiders in basement", "mice in garage", "wants prevention"],
        budget: "$100-300/month",
        urgency: "medium",
        objections: [
          "we don't have bugs right now",
          "too expensive", 
          "we use DIY sprays",
          "need to talk to my spouse",
          "had bad experience before",
          "what chemicals do you use"
        ],
        hiddenGoal: "will buy if rep demonstrates value for current pest issues AND offers family-safe treatment",
        successCriteria: { 
          requiresROIQuant: false, 
          requiresScheduling: true,
          requiresBudgetCheck: true
        }
      },
      {
        company: "Elderly Couple Home",
        vertical: "Residential", 
        size: 1,
        role: "Retired Homeowner",
        pain: ["termites concern", "general prevention", "fixed income budget", "health worries"],
        budget: "$50-150/month",
        urgency: "low",
        objections: [
          "on fixed income",
          "don't trust door-to-door sales",
          "need to research first",
          "what chemicals do you use",
          "we're too old for this",
          "is it really necessary"
        ],
        hiddenGoal: "will consider service if rep is patient, explains safety, and offers senior discount",
        successCriteria: {
          requiresROIQuant: false,
          requiresScheduling: true, 
          requiresBudgetCheck: true
        }
      },
      {
        company: "Young Professional Home",
        vertical: "Residential",
        size: 1, 
        role: "Busy Professional",
        pain: ["no time for pest issues", "roaches in apartment", "wants preventive care", "convenience important"],
        budget: "$150-400/month",
        urgency: "high",
        objections: [
          "too busy to deal with this",
          "rent, not own",
          "landlord should handle",
          "need it done quickly",
          "what's included",
          "can you work evenings"
        ],
        hiddenGoal: "will buy if rep offers quick scheduling and comprehensive service",
        successCriteria: {
          requiresROIQuant: false,
          requiresScheduling: true,
          requiresBudgetCheck: false
        }
      },
      {
        company: "New Homeowner",
        vertical: "Residential",
        size: 1,
        role: "First-time Homeowner", 
        pain: ["don't know about pest control", "worried about property damage", "want to do things right"],
        budget: "$75-200/month",
        urgency: "medium",
        objections: [
          "never had pest control before",
          "don't know if we need it",
          "what do other neighbors do",
          "is this normal",
          "how do I know you're legitimate"
        ],
        hiddenGoal: "will buy if rep educates them on prevention and provides social proof",
        successCriteria: {
          requiresROIQuant: false,
          requiresScheduling: true,
          requiresBudgetCheck: true
        }
      },
      {
        company: "Large Family Home",
        vertical: "Residential",
        size: 1,
        role: "Parent of Young Children",
        pain: ["kids' safety paramount", "ants attracted to food", "spiders scare children"],
        budget: "$120-350/month",
        urgency: "high",
        objections: [
          "safe around children",
          "what if kids touch treated areas",
          "natural alternatives",
          "need spouse approval",
          "when can you come when kids aren't home"
        ],
        hiddenGoal: "will buy if rep thoroughly addresses child safety and offers flexible scheduling",
        successCriteria: {
          requiresROIQuant: false,
          requiresScheduling: true,
          requiresBudgetCheck: true
        }
      }
    ];

    return personas[Math.floor(Math.random() * personas.length)];
  }

  static createPersonaByType(type: 'skeptical' | 'interested' | 'budget_conscious' | 'safety_focused'): Persona {
    const basePersonas = this.createRandomPestControlPersona();
    
    switch (type) {
      case 'skeptical':
        return {
          ...basePersonas,
          role: "Skeptical Homeowner",
          objections: [
            ...basePersonas.objections,
            "don't trust door-to-door sales",
            "sounds like a scam",
            "prove you're legitimate"
          ]
        };
      case 'budget_conscious':
        return {
          ...basePersonas,
          budget: "$50-100/month",
          objections: [
            "too expensive",
            "can't afford that",
            "do it myself cheaper",
            "need payment plan"
          ]
        };
      case 'safety_focused':
        return {
          ...basePersonas,
          pain: [...basePersonas.pain, "chemical sensitivity", "organic lifestyle"],
          objections: [
            "what chemicals exactly",
            "safe for organic garden",
            "natural alternatives",
            "chemical-free options"
          ]
        };
      default:
        return basePersonas;
    }
  }
}

