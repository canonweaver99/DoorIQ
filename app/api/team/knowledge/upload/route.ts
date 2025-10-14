import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      return NextResponse.json({ error: 'Only managers can upload files' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `team-${userProfile.team_id}/${timestamp}-${safeName}`

    // Upload to the dedicated knowledge-base bucket using team folder convention
    // Path pattern supported by RLS: team-{teamId}/...
    const bucketName = 'knowledge-base'
    const documentFilePath = filePath

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(documentFilePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage.',
        details: uploadError.message,
        code: uploadError.code,
        storageError: uploadError
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(documentFilePath)

    // Extract text content if it's a supported file type
    let extractedContent = ''
    
    if (file.type === 'text/plain') {
      extractedContent = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'll extract text on the client side or use a service
      // For now, just note that it's a PDF
      extractedContent = '[PDF Document - Text extraction pending]'
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        extractedContent
      }
    })
  } catch (error: any) {
    console.error('Error in upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

