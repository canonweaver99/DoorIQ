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
    situation: 'Kids napping soon; needs quick, safe answer',
    opening: 'Hey—quickly—Lucas is down for a nap. Is this kid/pet-safe and how long till we can be back in?',
    background: 'Lucas (3) just went down; Sofia (6) home in ~45 min. Wants zero disruption and clear re-entry timing.',
    priorities: ['safety', 'speed', 'clear_pricing', 'text_before_arrival'],
    objections: ['timing_bad', 'no_time_now', 'need_to_check_with_husband'],
    closeThreshold: 'medium'
  },
  {
    id: 'bad_experience',
    name: 'Previous Bad Experience',
    mood: 'skeptical',
    situation: 'Last company was late, vague on price, and used strong-smelling products',
    opening: 'Yes? We had a company last year—communication was awful. How are you different?',
    background: 'Techs showed late, surprise fees, and chemical smell lingered. Trust needs rebuilding.',
    priorities: ['reliability', 'communication', 'transparency', 'safety'],
    objections: ['trust_issues', 'want_references', 'need_guarantees'],
    closeThreshold: 'high'
  },
  {
    id: 'budget_conscious',
    name: 'End-of-Month Budget',
    mood: 'neutral',
    situation: 'Watching spend this month; will consider a clear-value one-time',
    opening: 'Hi. End of the month here—what\'s a one-time price and what exactly is included?',
    background: 'Open to a trial if price is straightforward and there are no surprise fees.',
    priorities: ['price', 'value', 'no_hidden_fees', 'trial_option'],
    objections: ['too_expensive', 'need_payment_plan', 'want_trial'],
    closeThreshold: 'low'
  },
  {
    id: 'dog_owner',
    name: 'Pet Safety Focused',
    mood: 'interested',
    situation: 'Dog spends most of the day in the yard; wants yard-safe plan',
    opening: 'Hello—Bailey is usually in the backyard. Is your treatment pet-safe and how long should she stay inside?',
    background: 'Goldendoodle Bailey often outside. Worried about yard granules/sprays and re-entry timing.',
    priorities: ['pet_safety', 'yard_treatment', 'reentry_time', 'gate_respect'],
    objections: ['dog_health_concerns', 'want_pet_safe_guarantee'],
    closeThreshold: 'medium'
  },
  {
    id: 'new_homeowner',
    name: 'New Move-In Prevention',
    mood: 'interested',
    situation: 'Moved in 2 months ago; wants preventive plan without chaos',
    opening: 'Hi—just moved in. Can you do preventive without tearing the house apart?',
    background: 'Boxes still around; wants light interior and strong exterior start. Open to quarterly if it\'s painless.',
    priorities: ['prevention', 'minimal_disruption', 'long_term_plan', 'text_before_arrival'],
    objections: ['still_settling_in', 'budget_for_moving'],
    closeThreshold: 'low'
  },
  {
    id: 'spider_problem',
    name: 'Spider Webs on Eaves',
    mood: 'frustrated',
    situation: 'Cobweb build-up on eaves and porch lights',
    opening: 'We get spider webs on the eaves constantly—do you actually de-web or just spray?',
    background: 'DIY dusters haven\'t kept up. Wants visible results on eaves, lights, and door frames.',
    priorities: ['effectiveness', 'spider_specific', 'dewebbing', 'guarantee'],
    objections: ['tried_diy_already', 'want_proof_it_works'],
    closeThreshold: 'medium'
  },
  {
    id: 'neighbor_referral',
    name: 'Neighbor Recommended',
    mood: 'interested',
    situation: 'Neighbor had good experience; wants same service and price ballpark',
    opening: 'Oh, hi—Sarah next door said you might stop by. What did you do for her and what would mine run?',
    background: 'Positive neighbor proof lowers skepticism; wants scope match and transparent pricing.',
    priorities: ['scope', 'same_service_as_neighbor', 'pricing', 'reviews_or_neighbors'],
    objections: ['want_same_deal', 'need_to_confirm_details'],
    closeThreshold: 'low'
  },
  {
    id: 'busy_professional',
    name: 'Work Calls All Day',
    mood: 'busy',
    situation: 'Back-to-back calls; needs ultra-concise answers',
    opening: 'I\'m on calls—can you give me the short version: safety, what you treat, time, and price?',
    background: 'Working from home; values tight windows and text-before arrival.',
    priorities: ['speed', 'efficiency', 'time_window', 'text_before_arrival'],
    objections: ['no_time_now', 'email_details'],
    closeThreshold: 'medium'
  },
  {
    id: 'price_shopper',
    name: 'Comparison Shopping',
    mood: 'neutral',
    situation: 'Collecting quotes; wants differentiation',
    opening: 'I\'m getting a few quotes—what makes your service different and what does the first visit include?',
    background: 'Methodical buyer; responds to clear tiering and guarantees more than hype.',
    priorities: ['value_proposition', 'competitive_pricing', 'unique_benefits', 'guarantee'],
    objections: ['need_to_compare', 'other_quotes_lower', 'want_best_deal'],
    closeThreshold: 'medium'
  },
  {
    id: 'ant_invasion',
    name: 'Active Ant Problem',
    mood: 'frustrated',
    situation: 'Ants in kitchen/pantry now; urgency high',
    opening: 'We\'ve got ants in the pantry today—what can you do right away and how fast does it work?',
    background: 'Needs immediate relief + follow-up to break cycles; wants simple prep instructions.',
    priorities: ['urgency', 'immediate_treatment', 'effectiveness', 'follow_up'],
    objections: ['need_immediate_service', 'what_if_it_doesnt_work'],
    closeThreshold: 'low'
  },
  {
    id: 'rain_day',
    name: 'Weather & Reschedules',
    mood: 'neutral',
    situation: 'Worried treatment won\'t stick if it rains',
    opening: 'If it rains this afternoon, does the treatment still work—or do you reschedule?',
    background: 'Wants to avoid wasted visits; appreciates honest policy on weather and guarantees.',
    priorities: ['weather_policy', 'guarantee', 'communication'],
    objections: ['ineffective_in_rain', 'don_t_want_wasted_visit'],
    closeThreshold: 'medium'
  },
  {
    id: 'garage_clutter',
    name: 'Cluttered Garage Access',
    mood: 'neutral',
    situation: 'Garage cluttered; nervous about interior access',
    opening: 'We have a cluttered garage—do you need to get inside or is exterior enough?',
    background: 'Prefers exterior-first with optional interior if needed; wants clear expectations.',
    priorities: ['scope', 'minimal_disruption', 'flexible_access'],
    objections: ['don_t_want_inside_now', 'privacy_concerns'],
    closeThreshold: 'medium'
  },
  {
    id: 'chemical_sensitivity',
    name: 'Sensitivity & Smells',
    mood: 'skeptical',
    situation: 'Sensitive to scents; wants EPA info and re-entry time',
    opening: 'I get headaches from strong smells—are your products EPA-registered and how long till it\'s safe?',
    background: 'Needs plain-English on products and exact dry times; prefers spot-treat interior.',
    priorities: ['safety', 'epa_registered', 'reentry_time', 'plain_english'],
    objections: ['chemical_concerns', 'health_sensitivity'],
    closeThreshold: 'high'
  },
  {
    id: 'holiday_guests',
    name: 'Company Coming',
    mood: 'interested',
    situation: 'Guests arriving this weekend; wants the house guest-ready',
    opening: 'We have family coming Saturday—could you do a quick clean-up service before then?',
    background: 'Looking for visible de-webbing and perimeter knock-down; willing to try one-time if easy.',
    priorities: ['time_window', 'visible_results', 'trial_option', 'text_before_arrival'],
    objections: ['tight_timing', 'not_ready_for_contract'],
    closeThreshold: 'low'
  }
];

export function getRandomScenario(): AmandaScenario {
  return amandaScenarios[Math.floor(Math.random() * amandaScenarios.length)];
}

export function getScenarioById(id: string): AmandaScenario | undefined {
  return amandaScenarios.find(s => s.id === id);
}