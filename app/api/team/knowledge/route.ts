export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all knowledge documents for team
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ documents: [] })
    }

    // Get documents from knowledge_base table for this team
    const { data: documents, error: docsError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true)
      .contains('metadata', { team_id: userProfile.team_id })
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('Error fetching documents:', docsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Transform to match expected format
    const transformedDocs = (documents || []).map(doc => ({
      id: doc.id,
      document_name: doc.file_name,
      file_url: doc.file_url,
      file_size_bytes: doc.file_size,
      document_type: doc.file_type,
      use_in_grading: doc.metadata?.use_in_grading ?? true,
      created_at: doc.created_at
    }))

    return NextResponse.json({ 
      documents: transformedDocs
    })
  } catch (error) {
    console.error('Error in GET knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create knowledge document entry
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and verify manager role
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ error: 'User not in a team' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can upload documents' }, { status: 403 })
    }

    const body = await request.json()

    // Use the simpler knowledge_base table instead of team_knowledge_documents
    // This avoids the teams table foreign key issue
    const { data: document, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: user.id,
        file_name: body.document_name,
        file_type: body.document_type || 'other',
        file_size: body.file_size_bytes || 0,
        file_url: body.file_url,
        content: body.extracted_content || '',
        metadata: {
          team_id: userProfile.team_id,
          use_in_grading: body.use_in_grading ?? true,
          uploaded_by: user.id
        },
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating document:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create document',
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('Error in POST knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove document
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Verify user is manager of the team that owns this document
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can delete documents' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

