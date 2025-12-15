export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/coach/script
 * List all coaching scripts for the user's team/organization
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization/team
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch coaching scripts for the organization/team
    let query = supabase
      .from('knowledge_base')
      .select('*')
      .eq('is_coaching_script', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Filter by organization_id or team_id from metadata
    if (userProfile.organization_id) {
      query = query.contains('metadata', { organization_id: userProfile.organization_id })
    } else if (userProfile.team_id) {
      query = query.contains('metadata', { team_id: userProfile.team_id })
    }

    const { data: scripts, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching scripts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 })
    }

    // Transform to match expected format
    const transformedScripts = (scripts || []).map(script => ({
      id: script.id,
      file_name: script.file_name,
      file_url: script.file_url,
      file_size: script.file_size,
      file_type: script.file_type,
      content_preview: script.content ? script.content.substring(0, 200) + '...' : null,
      created_at: script.created_at,
      updated_at: script.updated_at
    }))

    return NextResponse.json({ 
      scripts: transformedScripts
    })
  } catch (error: any) {
    console.error('Error in GET scripts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/coach/script?id=scriptId
 * Delete a coaching script
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, organization_id, team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || !['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can delete scripts' }, { status: 403 })
    }

    const url = new URL(request.url)
    const scriptId = url.searchParams.get('id')

    if (!scriptId) {
      return NextResponse.json({ error: 'Script ID required' }, { status: 400 })
    }

    // Get script to verify ownership and get file path
    const { data: script, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', scriptId)
      .eq('is_coaching_script', true)
      .single()

    if (fetchError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    // Verify ownership (check metadata for organization_id or team_id)
    const scriptOrgId = script.metadata?.organization_id
    const scriptTeamId = script.metadata?.team_id
    
    if (scriptOrgId && scriptOrgId !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Unauthorized to delete this script' }, { status: 403 })
    }
    
    if (scriptTeamId && scriptTeamId !== userProfile.team_id) {
      return NextResponse.json({ error: 'Unauthorized to delete this script' }, { status: 403 })
    }

    // Extract file path from URL to delete from storage
    const fileUrl = script.file_url
    const urlMatch = fileUrl.match(/coach-scripts\/[^/]+\/(.+)$/)
    const filePath = urlMatch ? `coach-scripts/${urlMatch[1].split('/').slice(1).join('/')}` : null

    // Delete from storage if we can extract the path
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([filePath])
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Mark as inactive (soft delete) or hard delete
    const { error: deleteError } = await supabase
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', scriptId)

    if (deleteError) {
      console.error('Error deleting script:', deleteError)
      return NextResponse.json({ error: 'Failed to delete script' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE script:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
