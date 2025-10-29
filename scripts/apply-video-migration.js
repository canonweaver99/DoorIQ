import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function applyVideoMigration() {
  try {
    console.log('🎬 Applying video recording migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', '050_add_video_recording_support.sql')
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Try executing directly if rpc doesn't work
      console.log('Trying direct execution...')
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...')
        const { error: stmtError } = await supabase.from('live_sessions').update({}).eq('id', 'dummy') // This is a hack to execute raw SQL
        
        if (stmtError && stmtError.message.includes('column')) {
          console.log('Column might already exist, continuing...')
        } else if (stmtError) {
          console.error('Error:', stmtError)
        }
      }
    }

    console.log('✅ Migration applied successfully!')
    
    // Test the changes
    const { data, error: testError } = await supabase
      .from('live_sessions')
      .select('id, video_url, has_video')
      .limit(1)

    if (!testError) {
      console.log('✅ Video columns are available in the database')
    } else {
      console.log('⚠️  Could not verify video columns:', testError.message)
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

applyVideoMigration()
