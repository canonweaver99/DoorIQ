-- Ensure canonweaver@loopline.design is marked as admin
-- Migration: 069_ensure_admin_user.sql

-- Set specific user as admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'canonweaver@loopline.design'
  AND (role IS NULL OR role != 'admin');

-- Verify admin user exists (create if needed)
INSERT INTO public.users (id, email, full_name, rep_id, role)
SELECT 
  auth.uid(),
  'canonweaver@loopline.design',
  'Canon Weaver',
  'ADMIN-001',
  'admin'
FROM auth.users
WHERE auth.users.email = 'canonweaver@loopline.design'
  AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = 'canonweaver@loopline.design'
  )
ON CONFLICT (email) DO UPDATE SET role = 'admin';

