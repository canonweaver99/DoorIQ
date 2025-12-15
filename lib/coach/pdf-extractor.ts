/**
 * PDF Text Extraction Utility
 * Extracts text content from PDF files for coaching scripts
 */

/**
 * Extract text content from a PDF file
 * @param file - PDF file (File object or Buffer)
 * @returns Extracted text content as a string
 */
export async function extractTextFromPDF(file: File | Buffer): Promise<string> {
  try {
    // Dynamic import to avoid loading pdf-parse during build
    const pdfParse = (await import('pdf-parse')).default

    let buffer: Buffer

    // Convert File to Buffer if needed
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    // Extract text using pdf-parse
    const pdfData = await pdfParse(buffer)

    // Clean and format the extracted text
    let text = pdfData.text

    // Remove excessive whitespace and normalize line breaks
    text = text
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .replace(/\r/g, '\n') // Handle old Mac line breaks
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with double newline
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim()

    return text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validate if a file is a PDF
 * @param file - File to validate
 * @returns True if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Validate if a file is a text file
 * @param file - File to validate
 * @returns True if file is a text file
 */
export function isTextFile(file: File): boolean {
  return (
    file.type === 'text/plain' ||
    file.name.toLowerCase().endsWith('.txt') ||
    file.type.startsWith('text/')
  )
}
