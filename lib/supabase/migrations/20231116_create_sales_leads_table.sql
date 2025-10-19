-- Create sales_leads table
create table if not exists public.sales_leads (
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
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to uuid references auth.users(id),
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  contacted_at timestamp with time zone,
  converted_at timestamp with time zone
);

-- Create indexes
create index idx_sales_leads_email on public.sales_leads(work_email);
create index idx_sales_leads_company on public.sales_leads(company_name);
create index idx_sales_leads_status on public.sales_leads(status);
create index idx_sales_leads_created_at on public.sales_leads(created_at desc);

-- Enable RLS
alter table public.sales_leads enable row level security;

-- Create RLS policies
-- Only authenticated users with admin or manager role can view sales leads
create policy "Admin and managers can view sales leads"
  on public.sales_leads for select
  using (
    auth.role() = 'authenticated' and 
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('admin', 'manager')
    )
  );

-- Only admins can insert/update/delete sales leads
create policy "Only admins can manage sales leads"
  on public.sales_leads for all
  using (
    auth.role() = 'authenticated' and 
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updated_at
create trigger handle_sales_leads_updated_at
  before update on public.sales_leads
  for each row
  execute function public.handle_updated_at();

-- Grant permissions
grant all on public.sales_leads to authenticated;
grant select on public.sales_leads to anon; -- Allow anonymous form submissions to check for duplicates if needed
