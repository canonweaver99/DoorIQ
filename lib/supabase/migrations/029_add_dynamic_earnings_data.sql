-- Add dynamic earnings data to live_sessions
-- Stores detailed earnings breakdown including deal value, commission, bonuses, etc.

-- 1) Add earnings_data JSONB column for detailed breakdown
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS earnings_data JSONB DEFAULT '{}'::jsonb;

-- 2) Add deal_details JSONB column for product/contract info
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS deal_details JSONB DEFAULT '{}'::jsonb;

-- 3) Add helpful comments
COMMENT ON COLUMN live_sessions.earnings_data IS 'Detailed earnings breakdown: {
  base_amount: number,
  closed_amount: number (extracted from conversation),
  commission_rate: number (0-1),
  commission_earned: number,
  bonus_modifiers: {
    quick_close: number (closed under X minutes),
    upsell: number (added services),
    retention: number (multi-year contract),
    same_day_start: number (starts today/tomorrow),
    referral_secured: number (got referral),
    perfect_pitch: number (90+ overall score)
  },
  total_earned: number (matches virtual_earnings column)
}';

COMMENT ON COLUMN live_sessions.deal_details IS 'Product/contract details extracted from conversation: {
  product_sold: string,
  service_type: string (initial treatment, monthly, quarterly, annual),
  base_price: number (one-time or first payment),
  monthly_value: number,
  contract_length: number (months),
  total_contract_value: number,
  payment_method: string (cash, card, finance),
  add_ons: string[] (additional services),
  start_date: string (today, tomorrow, next_week)
}';

-- 4) Add index for querying by deal value
CREATE INDEX IF NOT EXISTS idx_live_sessions_deal_value 
ON live_sessions ((deal_details->>'total_contract_value'));

-- 5) Create function to extract total earnings from earnings_data
CREATE OR REPLACE FUNCTION extract_total_earnings(earnings_data JSONB)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN COALESCE((earnings_data->>'total_earned')::DECIMAL(10, 2), 0.00);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6) Add a helper view for earnings analysis
CREATE OR REPLACE VIEW session_earnings_breakdown AS
SELECT 
  id as session_id,
  user_id,
  virtual_earnings as total_earned,
  (earnings_data->>'base_amount')::DECIMAL as base_amount,
  (earnings_data->>'closed_amount')::DECIMAL as deal_value,
  (earnings_data->>'commission_rate')::DECIMAL as commission_rate,
  (earnings_data->>'commission_earned')::DECIMAL as commission,
  (earnings_data->'bonus_modifiers'->>'quick_close')::DECIMAL as quick_close_bonus,
  (earnings_data->'bonus_modifiers'->>'upsell')::DECIMAL as upsell_bonus,
  (earnings_data->'bonus_modifiers'->>'retention')::DECIMAL as retention_bonus,
  (earnings_data->'bonus_modifiers'->>'same_day_start')::DECIMAL as same_day_bonus,
  (earnings_data->'bonus_modifiers'->>'referral_secured')::DECIMAL as referral_bonus,
  (earnings_data->'bonus_modifiers'->>'perfect_pitch')::DECIMAL as perfect_pitch_bonus,
  deal_details->>'product_sold' as product_name,
  (deal_details->>'total_contract_value')::DECIMAL as contract_value,
  deal_details->>'service_type' as service_type,
  sale_closed,
  return_appointment,
  created_at,
  ended_at
FROM live_sessions
WHERE virtual_earnings > 0 OR sale_closed = true;

COMMENT ON VIEW session_earnings_breakdown IS 'Detailed view of session earnings showing all bonuses and deal details';

