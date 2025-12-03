'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileAudio, FileVideo, Loader2, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock recent uploads data
const mockRecentUploads = [
  {
    id: 1,
    filename: 'sales-call-monday.mp3',
    uploadDate: '2025-10-11',
    status: 'completed',
    score: 85,
    duration: '5:30',
  },
  {
    id: 2,
    filename: 'training-session-02.mp4',
    uploadDate: '2025-10-10',
    status: 'completed',
    score: 72,
    duration: '4:15',
  },
  {
    id: 3,
    filename: 'pitch-practice.wav',
    uploadDate: '2025-10-09',
    status: 'failed',
    error: 'Audio quality too low',
  },
]

export default function UploadTab() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime']
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please select a valid audio (MP3, WAV) or video (MP4, MOV) file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      // Navigate to the full upload page
      router.push('/trainer/upload')
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to navigate to upload page')
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime']
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please select a valid audio or video file')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Upload Section */}
      <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Upload Sales Call</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!file ? (
          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-purple-500/50 transition-all cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-slate-400">
              MP3, WAV, MP4, or MOV (max 100MB)
            </p>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,video/mp4,video/quicktime"
              onChange={handleFileSelect}
            />
          </div>
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

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-600/30"
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

      {/* Recent Uploads */}
      <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Uploads</h3>
        <div className="space-y-3">
          {mockRecentUploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => {
                if (upload.status === 'completed' && upload.score) {
                  // In production, navigate to the actual session
                  router.push(`/analytics/${upload.id}`)
                }
              }}
            >
              <div className="flex items-center gap-4">
                <FileAudio className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-white font-medium">{upload.filename}</p>
                  <p className="text-slate-400 text-sm">{upload.uploadDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {upload.status === 'completed' && (
                  <>
                    <div className="text-right">
                      <p className="text-white font-semibold">{upload.score}%</p>
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {upload.duration}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </>
                )}
                {upload.status === 'failed' && (
                  <>
                    <p className="text-red-400 text-sm">{upload.error}</p>
                    <XCircle className="w-5 h-5 text-red-400" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </motion.div>
  )
}
