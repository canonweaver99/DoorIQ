-- Update sales_leads table to support CRM pipeline stages
-- This migration updates the status field to support proper CRM stages
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
  -- Only proceed if the table exists
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'sales_leads') THEN
    
    -- First, update existing statuses to new CRM stages (only if old statuses exist)
    UPDATE public.sales_leads 
    SET status = CASE 
      WHEN status = 'new' THEN 'lead'
      WHEN status = 'contacted' THEN 'qualified'
      WHEN status = 'qualified' THEN 'qualified'
      WHEN status = 'converted' THEN 'closed_won'
      WHEN status = 'lost' THEN 'closed_lost'
      ELSE status
    END
    WHERE status IN ('new', 'contacted', 'qualified', 'converted', 'lost');
    
    -- Drop the old check constraint if it exists
    ALTER TABLE public.sales_leads 
    DROP CONSTRAINT IF EXISTS sales_leads_status_check;
    
    -- Add new check constraint with CRM stages
    ALTER TABLE public.sales_leads 
    ADD CONSTRAINT sales_leads_status_check 
    CHECK (status IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'));
    
    -- Update the default status
    ALTER TABLE public.sales_leads 
    ALTER COLUMN status SET DEFAULT 'lead';
    
    -- Add index on status for better query performance
    CREATE INDEX IF NOT EXISTS idx_sales_leads_status_crm ON public.sales_leads(status);
    
    -- Add estimated_value column for tracking deal value
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'estimated_value'
    ) THEN
      ALTER TABLE public.sales_leads 
      ADD COLUMN estimated_value DECIMAL(10, 2);
    END IF;
    
    -- Add probability column for tracking deal probability (0-100)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'probability'
    ) THEN
      ALTER TABLE public.sales_leads 
      ADD COLUMN probability INTEGER CHECK (probability >= 0 AND probability <= 100);
    END IF;
    
    -- Add expected_close_date for tracking when deals are expected to close
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'expected_close_date'
    ) THEN
      ALTER TABLE public.sales_leads 
      ADD COLUMN expected_close_date DATE;
    END IF;
    
    -- Add last_contacted_at for tracking last interaction
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'last_contacted_at'
    ) THEN
      ALTER TABLE public.sales_leads 
      ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Update contacted_at to last_contacted_at if it exists and last_contacted_at is null
    UPDATE public.sales_leads 
    SET last_contacted_at = contacted_at 
    WHERE contacted_at IS NOT NULL 
    AND (last_contacted_at IS NULL OR last_contacted_at < contacted_at);
    
  END IF;
END $$;

