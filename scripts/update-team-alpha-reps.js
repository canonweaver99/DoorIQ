/**
 * Update Team Alpha Reps with Real Names and Profile Pictures
 * Updates all Team Alpha reps with realistic sales rep names and uploads profile pictures
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Realistic sales rep names
const REAL_NAMES = [
  'Mike Chen',
  'Emily Rodriguez',
  'Sarah Johnson',
  'Lisa Anderson',
  'David Martinez',
  'Jessica Williams',
  'Michael Thompson',
  'Amanda Davis',
  'James Wilson',
  'Rachel Brown',
  'Christopher Lee',
  'Nicole Garcia',
  'Daniel Moore',
  'Lauren Taylor',
  'Kevin White',
  'Michelle Harris',
  'Ryan Clark'
]

/**
 * Download an image from URL and return as buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`))
        return
      }
      
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

/**
 * Generate a placeholder avatar URL using UI Avatars
 */
function getPlaceholderAvatarUrl(name, size = 200) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  // Use UI Avatars service to generate avatar
  const colors = ['8B5CF6', '06B6D4', '10B981', 'EC4899', 'F59E0B', 'EF4444', '6366F1', '14B8A6']
  const colorIndex = name.length % colors.length
  const bgColor = colors[colorIndex]
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${bgColor}&color=fff&bold=true&format=png`
}

/**
 * Upload avatar for a user
 */
async function uploadAvatarForUser(userId, userName) {
  try {
    console.log(`   📸 Uploading avatar for ${userName}...`)
    
    // Generate placeholder avatar URL
    const avatarUrl = getPlaceholderAvatarUrl(userName)
    
    // Download the image
    const imageBuffer = await downloadImage(avatarUrl)
    
    // Create a file-like object
    const fileName = `profile-${userId}-${Date.now()}.png`
    const filePath = `${userId}/${fileName}`
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('profile pics')
      .upload(filePath, imageBuffer, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        console.error(`   ⚠️  Storage bucket issue: ${uploadError.message}`)
        console.error(`   💡 Make sure the 'profile pics' bucket exists in Supabase Storage`)
        return { success: false, error: uploadError }
      }
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile pics')
      .getPublicUrl(filePath)
    
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error(`   ❌ Error uploading avatar for ${userName}:`, error.message)
    return { success: false, error }
  }
}

/**
 * Main function to update Team Alpha reps
 */
async function updateTeamAlphaReps() {
  console.log('🚀 Updating Team Alpha reps with real names and profile pictures...\n')
  
  try {
    // Get Team Alpha team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('name', 'Team Alpha')
      .single()
    
    if (teamError || !team) {
      throw new Error(`Team Alpha not found: ${teamError?.message}`)
    }
    
    console.log(`✅ Found team: ${team.name} (${team.id})\n`)
    
    // Get all Team Alpha reps (exclude manager)
    const { data: reps, error: repsError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('team_id', team.id)
      .eq('role', 'rep')
      .order('email', { ascending: true })
    
    if (repsError || !reps) {
      throw new Error(`Failed to fetch reps: ${repsError?.message}`)
    }
    
    console.log(`📋 Found ${reps.length} reps to update\n`)
    
    if (reps.length > REAL_NAMES.length) {
      console.warn(`⚠️  Warning: More reps (${reps.length}) than names (${REAL_NAMES.length}). Some will reuse names.\n`)
    }
    
    let successCount = 0
    let errorCount = 0
    
    // Update each rep with a real name and avatar
    for (let i = 0; i < reps.length; i++) {
      const rep = reps[i]
      const newName = REAL_NAMES[i % REAL_NAMES.length]
      
      console.log(`👤 Updating ${rep.email}...`)
      console.log(`   Current name: ${rep.full_name}`)
      console.log(`   New name: ${newName}`)
      
      try {
        // Upload avatar first
        const avatarResult = await uploadAvatarForUser(rep.id, newName)
        
        // Update user record with new name and avatar URL
        const updateData = { full_name: newName }
        if (avatarResult.success) {
          updateData.avatar_url = avatarResult.url
        }
        
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', rep.id)
        
        if (updateError) {
          throw updateError
        }
        
        console.log(`   ✅ Updated successfully`)
        if (avatarResult.success) {
          console.log(`   ✅ Avatar: ${avatarResult.url}`)
        }
        successCount++
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`   ❌ Error updating ${rep.email}:`, error.message)
        errorCount++
      }
      
      console.log('')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Update complete!`)
    console.log(`   Success: ${successCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
updateTeamAlphaReps()

