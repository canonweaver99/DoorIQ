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
    opening: 'Hi. What can I help you with? I only have a few minutes.',
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
    opening: 'Yes? What do you need?',
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
    opening: 'Hi there. What\'s this about?',
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
    opening: 'Hello. What can I do for you?',
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
    opening: 'Hi. How can I help you?',
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
    opening: 'Yes? What do you need?',
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
    opening: 'Oh, hi. Sarah mentioned you might stop by.',
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
    opening: 'Hi. I\'m actually on calls all day, so this needs to be quick.',
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
    opening: 'Hello. What company are you with?',
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
    opening: 'Hi. What do you need?',
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
