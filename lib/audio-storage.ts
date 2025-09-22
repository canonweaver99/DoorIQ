import { supabaseAdmin } from './supabase';

export interface AudioRecording {
  attemptId: string;
  turnNumber: number;
  audioBlob: Blob;
  role: 'user' | 'ai';
  transcription?: string;
}

export class AudioStorageService {
  private static bucketName = 'audio-recordings';

  static async initialize() {
    // Create bucket if it doesn't exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    
    if (!buckets?.find(b => b.name === this.bucketName)) {
      const { error } = await supabaseAdmin.storage.createBucket(this.bucketName, {
        public: false
      });
      
      if (error) {
        console.error('Error creating audio bucket:', error);
      }
    }
  }

  static async saveAudioRecording({
    attemptId,
    turnNumber,
    audioBlob,
    role,
    transcription
  }: AudioRecording): Promise<string | null> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${attemptId}/${turnNumber}-${role}-${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(this.bucketName)
        .getPublicUrl(filename);
        
      const audioUrl = urlData.publicUrl;
      
      // Calculate duration if possible
      let duration: number | undefined;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        duration = audioBuffer.duration;
      } catch (e) {
        console.log('Could not calculate audio duration:', e);
      }
      
      // Save metadata to database
      const { error: dbError } = await supabaseAdmin
        .from('audio_recordings')
        .insert({
          attempt_id: attemptId,
          turn_number: turnNumber,
          audio_url: audioUrl,
          transcription,
          duration_seconds: duration,
          role
        });
        
      if (dbError) {
        console.error('Error saving audio metadata:', dbError);
        return null;
      }
      
      return audioUrl;
    } catch (error) {
      console.error('Error in saveAudioRecording:', error);
      return null;
    }
  }
  
  static async getAudioRecordings(attemptId: string) {
    const { data, error } = await supabaseAdmin
      .from('audio_recordings')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('turn_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching audio recordings:', error);
      return [];
    }
    
    return data;
  }
  
  static async deleteAudioRecording(attemptId: string, turnNumber: number, role: 'user' | 'ai') {
    // First get the recording to find the file path
    const { data: recording } = await supabaseAdmin
      .from('audio_recordings')
      .select('audio_url')
      .eq('attempt_id', attemptId)
      .eq('turn_number', turnNumber)
      .eq('role', role)
      .single();
      
    if (recording?.audio_url) {
      // Extract file path from URL
      const urlParts = recording.audio_url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // attemptId/filename
      
      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([filePath]);
        
      if (storageError) {
        console.error('Error deleting audio file:', storageError);
      }
    }
    
    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('audio_recordings')
      .delete()
      .eq('attempt_id', attemptId)
      .eq('turn_number', turnNumber)
      .eq('role', role);
      
    if (dbError) {
      console.error('Error deleting audio metadata:', dbError);
    }
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  AudioStorageService.initialize().catch(console.error);
}
