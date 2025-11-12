const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: { publicUrl } } = supabase.storage
  .from('Demo-Assets')
  .getPublicUrl('public/demo-video-home.mp4')

console.log('Public URL:', publicUrl)

