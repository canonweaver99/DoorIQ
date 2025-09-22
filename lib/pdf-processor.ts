import { supabaseAdmin } from './supabase';

export interface TrainingDocument {
  id: string;
  title: string;
  content: string;
  category: 'objection_handling' | 'closing_techniques' | 'discovery_questions' | 'value_proposition' | 'general';
  source_file: string;
  page_number?: number;
  keywords: string[];
  created_at: string;
}

export class PDFTrainingProcessor {
  
  // Extract text from PDF buffer (server-side only)
  static async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid build-time issues
      const pdf = await import('pdf-parse');
      const data = await pdf.default(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Process PDF content and store in Supabase
  static async processPDFContent(
    pdfBuffer: Buffer,
    fileName: string, 
    category: TrainingDocument['category'] = 'general'
  ): Promise<number> {
    try {
      // Extract text from PDF
      const pdfText = await this.extractTextFromPDF(pdfBuffer);
      
      // Split PDF into chunks
      const chunks = this.chunkPDFText(pdfText);
      
      const trainingDocs: Omit<TrainingDocument, 'id' | 'created_at'>[] = chunks.map((chunk, index) => ({
        title: this.extractTitle(chunk) || `${fileName} - Section ${index + 1}`,
        content: chunk.trim(),
        category,
        source_file: fileName,
        page_number: this.extractPageNumber(chunk),
        keywords: this.extractKeywords(chunk)
      }));

      // Store in Supabase
      const { error } = await supabaseAdmin
        .from('training_documents')
        .insert(trainingDocs);

      if (error) {
        console.error('Error storing training documents:', error);
        throw error;
      }

      console.log(`Processed ${trainingDocs.length} training chunks from ${fileName}`);
      return trainingDocs.length;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  // Split text into meaningful chunks
  private static chunkPDFText(text: string): string[] {
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    const sections = cleanText.split(/(?=\n(?:\d+\.|[A-Z][A-Z\s]{10,}|Chapter|Section))/);
    
    const chunks: string[] = [];
    
    for (const section of sections) {
      if (section.trim().length < 100) continue;
      
      if (section.length > 2000) {
        const paragraphs = section.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        let currentChunk = '';
        for (const paragraph of paragraphs) {
          if (currentChunk.length + paragraph.length > 1500) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
          } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          }
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      } else {
        chunks.push(section.trim());
      }
    }
    
    return chunks.filter(chunk => chunk.length > 100);
  }

  // Extract title from chunk
  private static extractTitle(chunk: string): string | null {
    const lines = chunk.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return null;
    
    const firstLine = lines[0];
    
    const numberedMatch = firstLine.match(/^\d+\.\s*(.+)/);
    if (numberedMatch) {
      return numberedMatch[1].substring(0, 100);
    }
    
    if (firstLine === firstLine.toUpperCase() && firstLine.length < 80) {
      return firstLine;
    }
    
    if (firstLine.match(/^(Chapter|Section|Part)\s+/i)) {
      return firstLine.substring(0, 100);
    }
    
    const firstSentence = firstLine.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence;
    }
    
    return null;
  }

  // Extract page number if present
  private static extractPageNumber(chunk: string): number | undefined {
    const pageMatch = chunk.match(/(?:Page|p\.)\s*(\d+)/i);
    return pageMatch ? parseInt(pageMatch[1]) : undefined;
  }

  // Extract keywords for search
  private static extractKeywords(text: string): string[] {
    const salesKeywords = [
      'objection', 'price', 'cost', 'budget', 'expensive', 'cheap', 'afford', 'money',
      'competitor', 'comparison', 'alternative', 'think about it', 'maybe later',
      'safety', 'safe', 'chemical', 'organic', 'family', 'kids', 'pets', 'children',
      'epa', 'certification', 'license', 'guarantee', 'warranty', 'insurance',
      'schedule', 'appointment', 'when', 'time', 'available', 'calendar', 'booking',
      'process', 'treatment', 'service', 'inspection', 'evaluation',
      'benefit', 'value', 'results', 'effective', 'prevent', 'protection', 'peace of mind',
      'save', 'reduce', 'eliminate', 'control', 'management',
      'neighbor', 'reference', 'testimonial', 'review', 'local', 'community',
      'experience', 'satisfaction', 'recommendation',
      'pest', 'bug', 'ant', 'spider', 'mouse', 'mice', 'roach', 'cockroach',
      'termite', 'wasp', 'bee', 'flea', 'tick', 'mosquito',
      'rapport', 'trust', 'relationship', 'discovery', 'qualify', 'close', 'closing',
      'follow up', 'callback', 'urgency', 'scarcity', 'pain point'
    ];

    const words = text.toLowerCase().split(/\W+/);
    const foundKeywords = salesKeywords.filter(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    );

    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueCapitalized = [...new Set(capitalizedWords)]
      .filter(word => word.length > 3 && word.length < 30)
      .slice(0, 10);

    return [...new Set([...foundKeywords, ...uniqueCapitalized.map(w => w.toLowerCase())])];
  }

  // Retrieve relevant training content for grading
  static async getRelevantTraining(
    conversationText: string, 
    category?: TrainingDocument['category'],
    limit: number = 5
  ): Promise<TrainingDocument[]> {
    try {
      const keywords = this.extractKeywords(conversationText);
      
      let query = supabaseAdmin
        .from('training_documents')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (keywords.length > 0) {
        query = query.overlaps('keywords', keywords);
      }

      const { data, error } = await query
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error retrieving training documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRelevantTraining:', error);
      return [];
    }
  }

  // Enhanced grading with training data context
  static async enhanceGradingWithTraining(
    transcript: string,
    baseEvaluation: any
  ): Promise<any> {
    try {
      const objectionTraining = await this.getRelevantTraining(transcript, 'objection_handling', 2);
      const closingTraining = await this.getRelevantTraining(transcript, 'closing_techniques', 2);
      const discoveryTraining = await this.getRelevantTraining(transcript, 'discovery_questions', 2);
      const valueTraining = await this.getRelevantTraining(transcript, 'value_proposition', 2);
      
      const allTraining = [...objectionTraining, ...closingTraining, ...discoveryTraining, ...valueTraining];
      
      if (allTraining.length === 0) {
        return baseEvaluation;
      }

      const enhancedEvaluation = {
        ...baseEvaluation,
        training_insights: {
          relevant_materials: allTraining.map(doc => ({
            title: doc.title,
            category: doc.category,
            source: doc.source_file,
            relevance_score: this.calculateRelevance(transcript, doc.content)
          })),
          training_context_used: true,
          total_references: allTraining.length
        },
        enhanced_feedback: this.generateTrainingBasedFeedback(transcript, allTraining),
        recommended_reading: allTraining
          .filter(doc => this.calculateRelevance(transcript, doc.content) > 20)
          .map(doc => ({
            title: doc.title,
            category: doc.category,
            reason: this.getRecommendationReason(transcript, doc)
          }))
      };

      return enhancedEvaluation;
    } catch (error) {
      console.error('Error enhancing grading with training:', error);
      return baseEvaluation;
    }
  }

  // Calculate relevance score
  private static calculateRelevance(transcript: string, trainingContent: string): number {
    const transcriptWords = new Set(transcript.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const trainingWords = trainingContent.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    const commonWords = trainingWords.filter(word => transcriptWords.has(word));
    const relevanceScore = (commonWords.length / Math.max(trainingWords.length, 1)) * 100;
    
    return Math.round(relevanceScore);
  }

  // Generate training-based feedback
  private static generateTrainingBasedFeedback(
    transcript: string,
    trainingDocs: TrainingDocument[]
  ): string[] {
    const feedback: string[] = [];
    
    const objectionDocs = trainingDocs.filter(doc => doc.category === 'objection_handling');
    if (objectionDocs.length > 0 && transcript.toLowerCase().includes('expensive')) {
      feedback.push(`Reference "${objectionDocs[0].title}" for better price objection handling`);
    }
    
    const closingDocs = trainingDocs.filter(doc => doc.category === 'closing_techniques');
    if (closingDocs.length > 0 && !transcript.toLowerCase().includes('schedule')) {
      feedback.push(`Apply closing techniques from "${closingDocs[0].title}" to secure next steps`);
    }
    
    const discoveryDocs = trainingDocs.filter(doc => doc.category === 'discovery_questions');
    if (discoveryDocs.length > 0 && transcript.split('?').length < 3) {
      feedback.push(`Use discovery questions from "${discoveryDocs[0].title}" to better understand needs`);
    }
    
    return feedback;
  }

  // Get recommendation reason
  private static getRecommendationReason(transcript: string, doc: TrainingDocument): string {
    const transcriptLower = transcript.toLowerCase();
    
    switch (doc.category) {
      case 'objection_handling':
        if (transcriptLower.includes('expensive') || transcriptLower.includes('cost')) {
          return 'Customer expressed price concerns';
        }
        return 'Objection handling opportunities identified';
        
      case 'closing_techniques':
        if (!transcriptLower.includes('schedule')) {
          return 'No clear next steps established';
        }
        return 'Closing technique opportunities';
        
      case 'discovery_questions':
        if (transcript.split('?').length < 3) {
          return 'Limited discovery questions asked';
        }
        return 'Discovery improvement opportunities';
        
      default:
        return 'General sales improvement';
    }
  }

  // Get training library stats
  static async getTrainingLibrary(): Promise<{
    documents: TrainingDocument[];
    stats: {
      total: number;
      by_category: Record<string, number>;
      total_content_length: number;
    };
  }> {
    try {
      const { data: documents, error } = await supabaseAdmin
        .from('training_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching training library:', error);
        throw error;
      }

      const docs = documents || [];
      
      const stats = {
        total: docs.length,
        by_category: docs.reduce((acc, doc) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        total_content_length: docs.reduce((acc, doc) => acc + doc.content.length, 0)
      };

      return { documents: docs, stats };
    } catch (error) {
      console.error('Error getting training library:', error);
      return { documents: [], stats: { total: 0, by_category: {}, total_content_length: 0 } };
    }
  }

  // Delete training document
  static async deleteTrainingDocument(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('training_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting training document:', error);
      throw error;
    }
  }
}
