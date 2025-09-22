import { NextRequest, NextResponse } from 'next/server';
import { PDFTrainingProcessor } from '@/lib/pdf-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const category = formData.get('category') as string || 'general';
    
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process the PDF
    const chunksProcessed = await PDFTrainingProcessor.processPDFContent(
      buffer,
      file.name,
      category as any
    );
    
    return NextResponse.json({ 
      success: true, 
      processed: chunksProcessed,
      filename: file.name,
      category 
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get training library stats
    const library = await PDFTrainingProcessor.getTrainingLibrary();
    
    return NextResponse.json(library);
  } catch (error) {
    console.error('Error fetching training library:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch training library' 
    }, { status: 500 });
  }
}
