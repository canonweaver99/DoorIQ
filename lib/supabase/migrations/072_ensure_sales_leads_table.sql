-- Migration: 072_ensure_sales_leads_table.sql
-- Ensure sales_leads table exists with all required columns
-- Idempotent - safe to run multiple times

DO $$
BEGIN
  -- Create sales_leads table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sales_leads'
  ) THEN
    CREATE TABLE public.sales_leads (
      id uuid default gen_random_uuid() primary key,
      
      -- Contact Information
      full_name text not null,
      work_email text not null,
      phone_number text,
      job_title text not null,
      
      -- Company Details
      company_name text not null,
      industry text not null,
      number_of_reps integer not null check (number_of_reps > 0),
      
      -- Needs Assessment
      primary_use_case text,
      how_did_you_hear text not null,
      
      -- Contact Preferences
      preferred_contact_method text not null default 'email' check (preferred_contact_method in ('email', 'phone', 'video')),
      best_time_to_reach time,
      timezone text not null default 'America/New_York',
      
      -- Additional Information
      additional_comments text,
      
      -- Metadata
      status text not null default 'lead' check (status in ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
      assigned_to uuid references auth.users(id),
      notes text,
      
      -- CRM Fields
      estimated_value DECIMAL(10, 2),
      probability INTEGER CHECK (probability >= 0 AND probability <= 100),
      expected_close_date DATE,
      last_contacted_at TIMESTAMP WITH TIME ZONE,
      
      -- Timestamps
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
      contacted_at timestamp with time zone,
      converted_at timestamp with time zone
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON public.sales_leads(work_email);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_company ON public.sales_leads(company_name);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_status_crm ON public.sales_leads(status);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads(created_at desc);

    -- Enable RLS
    ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    DROP POLICY IF EXISTS "Admin and managers can view sales leads" ON public.sales_leads;
    CREATE POLICY "Admin and managers can view sales leads"
      ON public.sales_leads FOR SELECT
      USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'manager')
        )
      );

    DROP POLICY IF EXISTS "Only admins can manage sales leads" ON public.sales_leads;
    CREATE POLICY "Only admins can manage sales leads"
      ON public.sales_leads FOR ALL
      USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );

    -- Create function to update updated_at timestamp if it doesn't exist
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $function$
    BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
    END;
    $function$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for updated_at
    DROP TRIGGER IF EXISTS handle_sales_leads_updated_at ON public.sales_leads;
    CREATE TRIGGER handle_sales_leads_updated_at
      BEFORE UPDATE ON public.sales_leads
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();

    -- Grant permissions
    GRANT ALL ON public.sales_leads TO authenticated;
    GRANT SELECT ON public.sales_leads TO anon;
  ELSE
    -- Table exists, ensure all columns exist
    -- Add estimated_value if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'estimated_value'
    ) THEN
      ALTER TABLE public.sales_leads ADD COLUMN estimated_value DECIMAL(10, 2);
    END IF;

    -- Add probability if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'probability'
    ) THEN
      ALTER TABLE public.sales_leads ADD COLUMN probability INTEGER CHECK (probability >= 0 AND probability <= 100);
    END IF;

    -- Add expected_close_date if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'expected_close_date'
    ) THEN
      ALTER TABLE public.sales_leads ADD COLUMN expected_close_date DATE;
    END IF;

    -- Add last_contacted_at if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND column_name = 'last_contacted_at'
    ) THEN
      ALTER TABLE public.sales_leads ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Update status constraint if needed
    -- Drop old constraint if it exists
    ALTER TABLE public.sales_leads DROP CONSTRAINT IF EXISTS sales_leads_status_check;
    
    -- Add new constraint with CRM stages
    -- Check if constraint already exists with different name or doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_leads' 
      AND constraint_name = 'sales_leads_status_check'
      AND constraint_type = 'CHECK'
    ) THEN
      ALTER TABLE public.sales_leads 
      ADD CONSTRAINT sales_leads_status_check 
      CHECK (status IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'));
    END IF;
    
    -- Update default status
    ALTER TABLE public.sales_leads ALTER COLUMN status SET DEFAULT 'lead';

    -- Ensure indexes exist
    CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON public.sales_leads(work_email);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_company ON public.sales_leads(company_name);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_status_crm ON public.sales_leads(status);
    CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads(created_at desc);

    -- Ensure RLS is enabled
    ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

    -- Ensure policies exist
    DROP POLICY IF EXISTS "Admin and managers can view sales leads" ON public.sales_leads;
    CREATE POLICY "Admin and managers can view sales leads"
      ON public.sales_leads FOR SELECT
      USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'manager')
        )
      );

    DROP POLICY IF EXISTS "Only admins can manage sales leads" ON public.sales_leads;
    CREATE POLICY "Only admins can manage sales leads"
      ON public.sales_leads FOR ALL
      USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      );

    -- Ensure trigger exists
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $function$
    BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
    END;
    $function$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS handle_sales_leads_updated_at ON public.sales_leads;
    CREATE TRIGGER handle_sales_leads_updated_at
      BEFORE UPDATE ON public.sales_leads
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

