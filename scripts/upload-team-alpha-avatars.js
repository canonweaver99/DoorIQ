/**
 * Upload Profile Pictures for Team Alpha
 * Uploads placeholder profile pictures for Team Alpha manager and all reps
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${bgColor}&color=fff&bold=true&format=png`
}

/**
 * Upload avatar for a user
 */
async function uploadAvatarForUser(userId, userName, userEmail) {
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
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('profile pics')
      .upload(filePath, imageBuffer, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      // If bucket doesn't exist or permission issue, try to create/configure
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
    
    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
    
    if (updateError) {
      throw updateError
    }
    
    console.log(`   ✅ Avatar uploaded: ${publicUrl}`)
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error(`   ❌ Error uploading avatar for ${userName}:`, error.message)
    return { success: false, error }
  }
}

/**
 * Main function to upload avatars for Team Alpha
 */
async function uploadTeamAlphaAvatars() {
  console.log('🚀 Uploading profile pictures for Team Alpha...\n')
  
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
    
    // Get all Team Alpha members (manager + reps)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('team_id', team.id)
      .order('role', { ascending: false }) // Manager first, then reps
    
    if (membersError || !members) {
      throw new Error(`Failed to fetch team members: ${membersError?.message}`)
    }
    
    console.log(`📋 Found ${members.length} team members:`)
    members.forEach(m => {
      console.log(`   - ${m.full_name} (${m.email}) - ${m.role}`)
    })
    console.log('')
    
    let successCount = 0
    let errorCount = 0
    
    // Upload avatars for each member
    for (const member of members) {
      const result = await uploadAvatarForUser(
        member.id,
        member.full_name || member.email,
        member.email
      )
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Upload complete!`)
    console.log(`   Success: ${successCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
uploadTeamAlphaAvatars()

