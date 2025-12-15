export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTextFromPDF, isPDFFile, isTextFile } from '@/lib/coach/pdf-extractor'

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
      .select('team_id, role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can upload coaching scripts' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!isPDFFile(file) && !isTextFile(file)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF (.pdf) and text (.txt) files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `coach-scripts/${userProfile.organization_id || userProfile.team_id}/${timestamp}-${safeName}`

    // Upload to Supabase Storage (knowledge-base bucket)
    const bucketName = 'knowledge-base'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage.',
        details: uploadError.message,
        code: uploadError.code
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Extract text content
    let extractedContent = ''
    try {
      if (isPDFFile(file)) {
        extractedContent = await extractTextFromPDF(file)
      } else if (isTextFile(file)) {
        extractedContent = await file.text()
      }
    } catch (extractError: any) {
      console.error('Error extracting text:', extractError)
      // Continue even if extraction fails - we'll store the file URL
      extractedContent = `[Text extraction failed: ${extractError.message}]`
    }

    // Store in knowledge_base table with is_coaching_script flag
    const { data: document, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || (isPDFFile(file) ? 'application/pdf' : 'text/plain'),
        file_size: file.size,
        file_url: publicUrl,
        content: extractedContent,
        is_coaching_script: true,
        is_active: true,
        metadata: {
          organization_id: userProfile.organization_id,
          team_id: userProfile.team_id,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating document:', insertError)
      // Try to clean up uploaded file
      await supabase.storage.from(bucketName).remove([filePath])
      return NextResponse.json({ 
        error: 'Failed to create document entry',
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
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
    console.error('Error in script upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
