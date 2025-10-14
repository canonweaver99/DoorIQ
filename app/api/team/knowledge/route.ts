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

    // Get team documents (owned + shared)
    const { data: ownedDocs, error: ownedError } = await supabase
      .from('team_knowledge_documents')
      .select('*')
      .eq('team_id', userProfile.team_id)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching documents:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get shared documents
    const { data: sharedDocs } = await supabase
      .from('team_shared_documents')
      .select(`
        document_id,
        team_knowledge_documents (*)
      `)
      .eq('shared_with_team_id', userProfile.team_id)

    const sharedDocsList = sharedDocs?.map(s => ({
      ...(s as any).team_knowledge_documents,
      is_shared_with_team: true
    })) || []

    return NextResponse.json({ 
      documents: [...(ownedDocs || []), ...sharedDocsList]
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

    const { data: document, error: insertError } = await supabase
      .from('team_knowledge_documents')
      .insert({
        team_id: userProfile.team_id,
        document_name: body.document_name,
        file_url: body.file_url,
        file_size_bytes: body.file_size_bytes,
        extracted_content: body.extracted_content,
        document_type: body.document_type || 'other',
        use_in_grading: body.use_in_grading ?? true,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating document:', insertError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
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
      .from('team_knowledge_documents')
      .delete()
      .eq('id', documentId)
      .eq('team_id', userProfile.team_id)

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

