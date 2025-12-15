export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { preprocessScriptChunks } from '@/lib/coach/rag-retrieval'

/**
 * POST /api/coach/script/create
 * Create a coaching script from text content
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and verify manager role
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can create coaching scripts' }, { status: 403 })
    }

    const body = await request.json()
    const { name, content } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Script name is required' }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Script content is required' }, { status: 400 })
    }

    // Validate content length (max 1MB of text)
    const MAX_CONTENT_LENGTH = 1024 * 1024 // 1MB
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: 'Script content exceeds maximum length of 1MB' },
        { status: 400 }
      )
    }

    // Store in knowledge_base table with is_coaching_script flag
    const { data: document, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: user.id,
        file_name: name.trim(),
        file_type: 'text/plain',
        file_size: new Blob([content]).size,
        file_url: '', // No file URL for text-based scripts
        content: content.trim(),
        is_coaching_script: true,
        is_active: true,
        metadata: {
          organization_id: userProfile.organization_id,
          team_id: userProfile.team_id,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          created_from_text: true
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating script:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create script',
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    // Pre-process and cache script chunks for faster retrieval
    try {
      const chunks = preprocessScriptChunks(content.trim())
      await supabase
        .from('knowledge_base')
        .update({ chunks })
        .eq('id', document.id)
    } catch (chunkError) {
      // Log but don't fail - chunks are optional for backward compatibility
      console.error('Error pre-processing script chunks:', chunkError)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        file_name: document.file_name,
        file_url: document.file_url,
        file_size: document.file_size,
        file_type: document.file_type,
        created_at: document.created_at
      }
    })
  } catch (error: any) {
    console.error('Error in script create:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
