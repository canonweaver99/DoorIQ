// Local scenarios for Amanda with different moods and situations
export interface AmandaScenario {
  id: string;
  name: string;
  mood: 'neutral' | 'skeptical' | 'busy' | 'interested' | 'frustrated';
  situation: string;
  opening: string;
  background: string;
  priorities: string[];
  objections: string[];
  closeThreshold: 'low' | 'medium' | 'high';
}

export const amandaScenarios: AmandaScenario[] = [
  {
    id: 'nap_time',
    name: 'Nap Time Pressure',
    mood: 'busy',
    situation: 'Kids napping soon, needs quick answers',
    opening: 'Hey—quick heads up, my 3-year-old naps soon. Is this safe around kids and the dog?',
    background: 'Just put Lucas down for a nap, Sofia gets home from school in an hour. Very time-sensitive.',
    priorities: ['safety', 'speed', 'clear_pricing'],
    objections: ['need_to_check_with_husband', 'timing_bad'],
    closeThreshold: 'medium'
  },
  {
    id: 'bad_experience',
    name: 'Previous Bad Experience',
    mood: 'skeptical',
    situation: 'Had terrible service before, very wary',
    opening: 'We had a company last year—communication was awful. What\'s different with you?',
    background: 'Previous pest control company was late, overcharged, and used harsh chemicals. Trust needs rebuilding.',
    priorities: ['reliability', 'communication', 'transparency'],
    objections: ['trust_issues', 'want_references', 'need_guarantees'],
    closeThreshold: 'high'
  },
  {
    id: 'budget_conscious',
    name: 'End of Month Budget',
    mood: 'neutral',
    situation: 'Money is tight this month, price-focused',
    opening: 'End of the month here—what\'s the one-time price and what\'s included?',
    background: 'Tight budget this month, needs clear value proposition. Will consider if pricing is transparent.',
    priorities: ['price', 'value', 'no_hidden_fees'],
    objections: ['too_expensive', 'need_payment_plan', 'want_trial'],
    closeThreshold: 'low'
  },
  {
    id: 'dog_owner',
    name: 'Pet Safety Focused',
    mood: 'interested',
    situation: 'Very concerned about dog safety in yard',
    opening: 'Our Goldendoodle lives in the yard—how does that work with treatments?',
    background: 'Bailey spends most time outside. Very protective of pet safety but open to solutions.',
    priorities: ['pet_safety', 'yard_treatment', 'reentry_time'],
    objections: ['dog_health_concerns', 'want_pet_safe_guarantee'],
    closeThreshold: 'medium'
  },
  {
    id: 'new_homeowner',
    name: 'New Move-In',
    mood: 'interested',
    situation: 'Just moved in, wants preventive care',
    opening: 'We just moved in—can you do preventive without tearing the house apart?',
    background: 'Moved in 2 months ago, wants to get ahead of pest issues. Open to service but cautious about disruption.',
    priorities: ['prevention', 'minimal_disruption', 'long_term_plan'],
    objections: ['still_settling_in', 'budget_for_moving'],
    closeThreshold: 'low'
  },
  {
    id: 'spider_problem',
    name: 'Specific Spider Issue',
    mood: 'frustrated',
    situation: 'Ongoing spider problem on eaves',
    opening: 'Spiders collect on the eaves—do you brush webs or just spray?',
    background: 'Constant spider webs on house eaves. Frustrated with DIY solutions failing. Wants effective solution.',
    priorities: ['effectiveness', 'spider_specific', 'guarantee'],
    objections: ['tried_diy_already', 'want_proof_it_works'],
    closeThreshold: 'medium'
  },
  {
    id: 'neighbor_referral',
    name: 'Neighbor Recommended',
    mood: 'interested',
    situation: 'Neighbor had good experience, cautiously optimistic',
    opening: 'My neighbor Sarah said you did great work for her. What exactly do you include?',
    background: 'Neighbor recommended the service. More open but still wants details before committing.',
    priorities: ['scope', 'same_service_as_neighbor', 'pricing'],
    objections: ['want_same_deal', 'need_to_confirm_details'],
    closeThreshold: 'low'
  },
  {
    id: 'busy_professional',
    name: 'Work Call Interruption',
    mood: 'busy',
    situation: 'On work calls all day, very time-pressed',
    opening: 'I\'ve got calls all afternoon—30 seconds, what\'s your pitch?',
    background: 'Working from home, back-to-back meetings. Needs ultra-quick, clear information.',
    priorities: ['speed', 'efficiency', 'can_schedule_later'],
    objections: ['no_time_now', 'call_me_later', 'email_details'],
    closeThreshold: 'medium'
  },
  {
    id: 'price_shopper',
    name: 'Comparison Shopping',
    mood: 'neutral',
    situation: 'Getting quotes from multiple companies',
    opening: 'I\'m getting quotes from three companies. What makes you different?',
    background: 'Methodically comparing pest control options. Wants clear differentiation and competitive pricing.',
    priorities: ['value_proposition', 'competitive_pricing', 'unique_benefits'],
    objections: ['need_to_compare', 'other_quotes_lower', 'want_best_deal'],
    closeThreshold: 'medium'
  },
  {
    id: 'ant_invasion',
    name: 'Active Ant Problem',
    mood: 'frustrated',
    situation: 'Current ant problem in kitchen',
    opening: 'We\'ve got ants in the kitchen right now. How fast can you get here?',
    background: 'Active ant problem, needs immediate solution. Frustrated but motivated to act quickly.',
    priorities: ['urgency', 'immediate_treatment', 'effectiveness'],
    objections: ['need_immediate_service', 'what_if_it_doesnt_work'],
    closeThreshold: 'low'
  }
];

export function getRandomScenario(): AmandaScenario {
  return amandaScenarios[Math.floor(Math.random() * amandaScenarios.length)];
}

export function getScenarioById(id: string): AmandaScenario | undefined {
  return amandaScenarios.find(s => s.id === id);
}
