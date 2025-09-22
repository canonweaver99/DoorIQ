'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, BookOpen } from 'lucide-react';

interface TrainingLibraryStats {
  documents: any[];
  stats: {
    total: number;
    by_category: Record<string, number>;
    total_content_length: number;
  };
}

export default function AdminPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [library, setLibrary] = useState<TrainingLibraryStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('general');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const response = await fetch('/api/training/upload');
      const data = await response.json();
      setLibrary(data);
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('category', selectedCategory);

      const response = await fetch('/api/training/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(`✅ Successfully processed ${result.processed} chunks from ${result.filename}`);
        loadLibrary(); // Refresh library stats
      } else {
        setUploadResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`❌ Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Training Data Management
          </h1>

          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Training PDF</h2>
            <div className="bg-black/20 rounded-xl p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="general">General Sales Training</option>
                  <option value="objection_handling">Objection Handling</option>
                  <option value="closing_techniques">Closing Techniques</option>
                  <option value="discovery_questions">Discovery Questions</option>
                  <option value="value_proposition">Value Proposition</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">
                  Drop your PDF training materials here or click to browse
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              {isUploading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                    Processing PDF...
                  </div>
                </div>
              )}

              {uploadResult && (
                <div className="mt-4 p-4 rounded-lg bg-black/30">
                  <p className="text-sm text-white">{uploadResult}</p>
                </div>
              )}
            </div>
          </div>

          {/* Library Stats */}
          {library && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Training Library</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-400">{library.stats.total}</div>
                  <div className="text-sm text-gray-400">Total Documents</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(library.stats.total_content_length / 1000)}K
                  </div>
                  <div className="text-sm text-gray-400">Characters</div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Object.keys(library.stats.by_category).length}
                  </div>
                  <div className="text-sm text-gray-400">Categories</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-3">By Category</h3>
                <div className="space-y-2">
                  {Object.entries(library.stats.by_category).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-white font-medium">{count} docs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Documents */}
          {library && library.documents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Training Documents</h2>
              <div className="space-y-3">
                {library.documents.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-400">
                          {doc.category.replace('_', ' ')} • {doc.source_file}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {doc.content.length} chars
                      </span>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  async function deleteDocument(id: string) {
    try {
      const response = await fetch(`/api/training/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadLibrary(); // Refresh
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }
}
