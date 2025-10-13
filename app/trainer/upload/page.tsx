'use client'

import { useState } from 'react'
import { Upload, FileAudio, FileVideo, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadSessionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime']
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please select a valid audio (MP3, WAV, WebM) or video (MP4, MOV) file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      // Step 1: Upload file to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      
      setProgress(30)
      
      // Get auth token for API calls
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const uploadResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const { fileUrl, filename } = await uploadResponse.json()
      
      setProgress(50)
      setTranscribing(true)

      // Step 2: Transcribe audio using OpenAI Whisper
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ fileUrl, filename })
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.error || 'Transcription failed')
      }
      
      const { transcript, sessionId } = await transcribeResponse.json()
      
      setProgress(75)

      // Step 3: Grade the session
      const gradeResponse = await fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!gradeResponse.ok) {
        const errorData = await gradeResponse.json()
        throw new Error(errorData.error || 'Grading failed')
      }
      
      setProgress(100)

      // Redirect to analytics
      router.push(`/analytics/${sessionId}`)

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process file. Please try again.')
      setUploading(false)
      setTranscribing(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime']
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please select a valid audio (MP3, WAV, WebM) or video (MP4, MOV) file')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Upload Sales Call</h1>
          <p className="text-slate-400 text-lg">
            Upload a recorded sales call (audio or video) to get AI-powered analysis and coaching
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!file ? (
            <label 
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-16 h-16 text-slate-400 mb-4" />
                <p className="mb-2 text-lg font-semibold text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-400">
                  MP3, WAV, WebM, MP4, or MOV (max 100MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,video/mp4,video/quicktime"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                {file.type.startsWith('audio') ? (
                  <FileAudio className="w-12 h-12 text-purple-400" />
                ) : (
                  <FileVideo className="w-12 h-12 text-purple-400" />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={() => {
                      setFile(null)
                      setError(null)
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>
                      {transcribing ? 'Transcribing & analyzing...' : 'Uploading...'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-600/30 disabled:shadow-none"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-semibold mb-2">1. Upload</div>
            <p className="text-slate-400 text-sm">Upload your recorded sales call</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-semibold mb-2">2. Transcribe</div>
            <p className="text-slate-400 text-sm">AI converts speech to text</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-semibold mb-2">3. Analyze</div>
            <p className="text-slate-400 text-sm">Get detailed feedback & coaching</p>
          </div>
        </div>
      </div>
    </div>
  )
}
