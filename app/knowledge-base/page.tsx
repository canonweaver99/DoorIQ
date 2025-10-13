'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Trash2, Download, Search, Plus, Loader2, CheckCircle } from 'lucide-react'

interface KnowledgeBaseItem {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  content: string | null
  metadata: any
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchKnowledgeBase()
  }, [])

  const fetchKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching knowledge base:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const file = files[0]

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('knowledge-base')
        .getPublicUrl(fileName)

      // Extract text content (for PDFs, we'd need a PDF parser)
      let content = ''
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        content = await file.text()
      }

      // Create knowledge base entry
      const { error: dbError } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
          content: content,
          metadata: {
            original_name: file.name,
            upload_date: new Date().toISOString()
          }
        })

      if (dbError) throw dbError

      // Refresh the list
      await fetchKnowledgeBase()
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      
      // Remove from local state
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    return Math.round(bytes / 1048576) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('text')) return '📝'
    if (fileType.includes('word')) return '📃'
    if (fileType.includes('sheet')) return '📊'
    return '📎'
  }

  const filteredItems = items.filter(item =>
    item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Knowledge Base
          </h1>
          <p className="text-xl text-slate-400 drop-shadow-md max-w-3xl mx-auto">
            Upload training materials and documentation to improve AI grading accuracy
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="w-5 h-5 text-slate-300" />
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Upload File
              </>
            )}
          </button>
        </div>

        {/* File Grid */}
        {filteredItems.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-700 shadow-xl hover:border-purple-500/60 hover:shadow-purple-500/20 transition-all"
          >
            <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-xl text-white/80 mb-2">No files uploaded yet</p>
            <p className="text-slate-400">
              Tap anywhere here or use the upload button to add training materials.
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all shadow-xl group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{getFileIcon(item.file_type)}</div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-white font-semibold mb-2 truncate" title={item.file_name}>
                  {item.file_name}
                </h3>

                <div className="space-y-1 text-sm text-slate-400">
                  <p>Size: {formatFileSize(item.file_size)}</p>
                  <p>Uploaded: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>

                {item.is_public && (
                  <div className="mt-3 inline-flex items-center px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Public
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">How Knowledge Base Works</h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Upload training scripts, product documentation, or best practices</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>AI will reference these materials when grading conversations</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>More relevant content = more accurate and contextual feedback</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Supported formats: PDF, TXT, MD, DOC, DOCX</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}