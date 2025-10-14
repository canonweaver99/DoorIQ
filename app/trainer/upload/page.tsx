'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileAudio, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Force dynamic rendering - Upload feature
export const dynamic = 'force-dynamic'

export default function UploadTrainingPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload an audio file (MP3, WAV, WEBM, MP4, or MOV)')
      return
    }

    // Validate file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Step 1: Upload audio file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await import('@/lib/supabase/client')).createClient().auth.getSession()}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      const audioUrl = uploadData.fileUrl

      // Step 2: Transcribe audio using Whisper
      setUploading(false)
      setGrading(true)

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl })
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const transcribeData = await transcribeResponse.json()
      const transcript = transcribeData.transcript

      // Step 3: Create session with transcript
      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'Uploaded Recording',
          audioUrl: audioUrl,
          transcript: transcript
        })
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session')
      }

      const sessionData = await sessionResponse.json()
      const newSessionId = sessionData.sessionId

      // Step 4: Grade the session
      const gradeResponse = await fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId })
      })

      if (!gradeResponse.ok) {
        console.warn('Grading failed, but session was created')
      }

      setSuccess(true)
      setSessionId(newSessionId)
      setGrading(false)

      // Redirect to analytics page after 2 seconds
      setTimeout(() => {
        router.push(`/analytics/${newSessionId}`)
      }, 2000)

    } catch (err: any) {
      console.error('Upload/grading error:', err)
      setError(err.message || 'Failed to process audio file')
      setUploading(false)
      setGrading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setSessionId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/trainer"
          className="inline-flex items-center text-gray-400 hover:text-gray-300 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Training
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Upload & Grade Recording</h1>
          <p className="text-slate-400 mb-8">
            Upload a recording of your sales call to get instant AI feedback and scoring
          </p>

          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-8">
            {!success ? (
              <>
                {/* Upload Area */}
                <div
                  onClick={() => !uploading && !grading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    file
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
                  } ${(uploading || grading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/mp4,video/quicktime"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || grading}
                  />

                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileAudio className="w-16 h-16 text-purple-400 mb-4" />
                      <p className="text-lg font-semibold text-white mb-1">{file.name}</p>
                      <p className="text-sm text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-16 h-16 text-slate-400 mb-4" />
                      <p className="text-lg font-semibold text-white mb-1">
                        Drop your audio file here
                      </p>
                      <p className="text-sm text-slate-400">
                        or click to browse
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Supports MP3, WAV, WEBM, MP4, MOV (max 100MB)
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center gap-3">
                  {file && (
                    <button
                      onClick={resetUpload}
                      disabled={uploading || grading}
                      className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading || grading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : grading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transcribing & Grading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload & Grade
                      </>
                    )}
                  </button>
                </div>

                {/* Processing Steps */}
                {(uploading || grading) && (
                  <div className="mt-6 space-y-3">
                    <div className={`flex items-center gap-3 ${uploading ? 'text-purple-400' : 'text-slate-600'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${uploading ? 'bg-purple-500/20 animate-pulse' : 'bg-slate-700'}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                      <span className="text-sm font-medium">Uploading audio file...</span>
                    </div>
                    <div className={`flex items-center gap-3 ${grading && !uploading ? 'text-purple-400' : 'text-slate-600'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${grading && !uploading ? 'bg-purple-500/20 animate-pulse' : 'bg-slate-700'}`}>
                        {grading && !uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 bg-slate-500 rounded-full" />}
                      </div>
                      <span className="text-sm font-medium">Transcribing with AI...</span>
                    </div>
                    <div className={`flex items-center gap-3 text-slate-600`}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-700">
                        <div className="w-2 h-2 bg-slate-500 rounded-full" />
                      </div>
                      <span className="text-sm font-medium">Analyzing performance...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Upload Complete!</h2>
                <p className="text-slate-400 mb-6">
                  Your recording has been transcribed and graded. Redirecting to results...
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-400">Loading analytics...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
