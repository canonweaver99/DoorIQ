'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, Package, DollarSign, MessageCircle, ClipboardCheck, Upload, 
  FileText, Save, Plus, Trash2, Edit2, Check, X, Target, Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type Tab = 'company' | 'pricing' | 'objections' | 'grading' | 'documents'

interface TeamGradingConfig {
  company_name?: string
  company_mission?: string
  product_description?: string
  service_guarantees?: string
  company_values?: string[]
  pricing_info?: Array<{
    name: string
    price: number
    frequency?: string
    description?: string
  }>
  objection_handlers?: Array<{
    objection: string
    response: string
  }>
  custom_grading_rubric?: {
    weights: {
      rapport_score: number
      objection_handling_score: number
      close_effectiveness_score: number
      needs_discovery_score: number
      introduction_score: number
    }
    custom_criteria: Array<{
      name: string
      description: string
      weight: number
    }>
    automatic_fails: string[]
  }
  passing_score?: number
  enabled?: boolean
}

interface KnowledgeDocument {
  id: string
  document_name: string
  file_url: string
  file_size_bytes: number
  document_type: string
  use_in_grading: boolean
  created_at: string
  is_shared_with_team?: boolean
}

export default function KnowledgeBase() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [config, setConfig] = useState<TeamGradingConfig>({
    company_values: [],
    pricing_info: [],
    objection_handlers: [],
    custom_grading_rubric: {
      weights: {
        rapport_score: 15,
        objection_handling_score: 25,
        close_effectiveness_score: 30,
        needs_discovery_score: 20,
        introduction_score: 10
      },
      custom_criteria: [],
      automatic_fails: []
    },
    passing_score: 70,
    enabled: true
  })
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Load config and documents
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load grading config
      const configRes = await fetch('/api/team/grading-config')
      if (configRes.ok) {
        const data = await configRes.json()
        if (data.config) {
          setConfig({
            ...config,
            ...data.config
          })
        }
      }

      // Load documents
      const docsRes = await fetch('/api/team/knowledge')
      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team/grading-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Configuration Saved!',
          message: 'Team grading configuration has been updated successfully.'
        })
      } else {
        console.error('Save error:', data)
        throw new Error(data.details || data.error || 'Failed to save configuration')
      }
    } catch (error: any) {
      console.error('Error saving config:', error)
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save configuration. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch('/api/team/knowledge/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          throw new Error('Upload failed')
        }

        const uploadData = await uploadRes.json()

        // Create document entry
        const docRes = await fetch('/api/team/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_name: file.name,
            file_url: uploadData.file.url,
            file_size_bytes: file.size,
            extracted_content: uploadData.file.extractedContent || '',
            document_type: 'other',
            use_in_grading: true
          })
        })

        if (!docRes.ok) {
          throw new Error('Failed to save document')
        }
      }

      // Reload documents
      await loadData()
      showToast({
        type: 'success',
        title: 'Files Uploaded!',
        message: `Successfully uploaded ${Array.from(files).length} file(s).`
      })
    } catch (error) {
      console.error('Upload error:', error)
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload files. Please try again.'
      })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/team/knowledge?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id))
        showToast({
          type: 'success',
          title: 'Document Deleted',
          message: 'Document has been removed successfully.'
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete document. Please try again.'
      })
    }
  }

  const tabs = [
    { id: 'company' as Tab, name: 'Company Info', icon: Building2 },
    { id: 'pricing' as Tab, name: 'Pricing Tables', icon: DollarSign },
    { id: 'objections' as Tab, name: 'Objection Handlers', icon: MessageCircle },
    { id: 'grading' as Tab, name: 'Grading Criteria', icon: ClipboardCheck },
    { id: 'documents' as Tab, name: 'Upload Documents', icon: Upload },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Base Management</h2>
          <p className="text-slate-400 mt-1">Manage company knowledge and training data</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
                
                {isActive && (
                  <motion.div
                    layoutId="activeKnowledgeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
      >
        {/* Company Info Tab */}
        {activeTab === 'company' && (
          <CompanyInfoTab config={config} setConfig={setConfig} />
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <PricingTab config={config} setConfig={setConfig} />
        )}

        {/* Objections Tab */}
        {activeTab === 'objections' && (
          <ObjectionsTab config={config} setConfig={setConfig} />
        )}

        {/* Grading Criteria Tab */}
        {activeTab === 'grading' && (
          <GradingTab config={config} setConfig={setConfig} />
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentsTab 
            documents={documents}
            uploading={uploading}
            onUpload={handleFileUpload}
            onDelete={deleteDocument}
          />
        )}
      </motion.div>
    </div>
  )
}

// Subcomponents for each tab

function CompanyInfoTab({ config, setConfig }: { config: TeamGradingConfig; setConfig: (c: TeamGradingConfig) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
        <input
          type="text"
          value={config.company_name || ''}
          onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
          placeholder="e.g., Pest Control Pro"
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Company Mission</label>
        <textarea
          value={config.company_mission || ''}
          onChange={(e) => setConfig({ ...config, company_mission: e.target.value })}
          placeholder="Protect homes and families by providing superior pest control services with exceptional customer care..."
          rows={3}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Product/Service Description</label>
        <textarea
          value={config.product_description || ''}
          onChange={(e) => setConfig({ ...config, product_description: e.target.value })}
          placeholder="Comprehensive pest control services including quarterly treatments, rodent protection, termite inspections..."
          rows={4}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Service Guarantees</label>
        <textarea
          value={config.service_guarantees || ''}
          onChange={(e) => setConfig({ ...config, service_guarantees: e.target.value })}
          placeholder="100% satisfaction guarantee. If pests return within treatment period, we re-treat at no additional cost..."
          rows={3}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
      </div>
    </div>
  )
}

function PricingTab({ config, setConfig }: { config: TeamGradingConfig; setConfig: (c: TeamGradingConfig) => void }) {
  const addPricingItem = () => {
    setConfig({
      ...config,
      pricing_info: [...(config.pricing_info || []), { name: '', price: 0, frequency: '', description: '' }]
    })
  }

  const updatePricingItem = (index: number, field: string, value: any) => {
    const newPricing = [...(config.pricing_info || [])]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setConfig({ ...config, pricing_info: newPricing })
  }

  const removePricingItem = (index: number) => {
    setConfig({
      ...config,
      pricing_info: config.pricing_info?.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-4">
      {config.pricing_info?.map((item, index) => (
        <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updatePricingItem(index, 'name', e.target.value)}
              placeholder="Service name (e.g., Quarterly Plan)"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) => updatePricingItem(index, 'price', parseFloat(e.target.value))}
              placeholder="Price"
              className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <input
              type="text"
              value={item.frequency || ''}
              onChange={(e) => updatePricingItem(index, 'frequency', e.target.value)}
              placeholder="/month"
              className="w-28 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <button
              onClick={() => removePricingItem(index)}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
          <textarea
            value={item.description || ''}
            onChange={(e) => updatePricingItem(index, 'description', e.target.value)}
            placeholder="Description..."
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          />
        </div>
      ))}

      <button
        onClick={addPricingItem}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Pricing Item
      </button>
    </div>
  )
}

function ObjectionsTab({ config, setConfig }: { config: TeamGradingConfig; setConfig: (c: TeamGradingConfig) => void }) {
  const addObjection = () => {
    setConfig({
      ...config,
      objection_handlers: [...(config.objection_handlers || []), { objection: '', response: '' }]
    })
  }

  const updateObjection = (index: number, field: string, value: string) => {
    const newHandlers = [...(config.objection_handlers || [])]
    newHandlers[index] = { ...newHandlers[index], [field]: value }
    setConfig({ ...config, objection_handlers: newHandlers })
  }

  const removeObjection = (index: number) => {
    setConfig({
      ...config,
      objection_handlers: config.objection_handlers?.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-4">
      {config.objection_handlers?.map((handler, index) => (
        <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Objection</label>
                <input
                  type="text"
                  value={handler.objection}
                  onChange={(e) => updateObjection(index, 'objection', e.target.value)}
                  placeholder="e.g., That's too expensive"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Response</label>
                <textarea
                  value={handler.response}
                  onChange={(e) => updateObjection(index, 'response', e.target.value)}
                  placeholder="I understand your concern. Let me show you how this investment protects your biggest asset..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => removeObjection(index)}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addObjection}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Objection Handler
      </button>
    </div>
  )
}

function GradingTab({ config, setConfig }: { config: TeamGradingConfig; setConfig: (c: TeamGradingConfig) => void }) {
  const weights = config.custom_grading_rubric?.weights || {
    rapport_score: 15,
    objection_handling_score: 25,
    close_effectiveness_score: 30,
    needs_discovery_score: 20,
    introduction_score: 10
  }

  const updateWeight = (key: string, newValue: number) => {
    const currentWeights = { ...weights }
    const oldValue = currentWeights[key as keyof typeof weights]
    const difference = newValue - oldValue
    
    // Update the changed weight
    currentWeights[key as keyof typeof weights] = newValue
    
    // Distribute the difference across other weights proportionally
    const otherKeys = Object.keys(currentWeights).filter(k => k !== key)
    const totalOtherWeights = otherKeys.reduce((sum, k) => sum + currentWeights[k as keyof typeof weights], 0)
    
    if (totalOtherWeights > 0) {
      otherKeys.forEach(k => {
        const proportion = currentWeights[k as keyof typeof weights] / totalOtherWeights
        const adjustment = -difference * proportion
        currentWeights[k as keyof typeof weights] = Math.max(0, Math.round(currentWeights[k as keyof typeof weights] + adjustment))
      })
    }
    
    // Ensure total is exactly 100
    const total = Object.values(currentWeights).reduce((sum, val) => sum + val, 0)
    if (total !== 100) {
      const firstOtherKey = otherKeys[0]
      if (firstOtherKey) {
        currentWeights[firstOtherKey as keyof typeof weights] += (100 - total)
        currentWeights[firstOtherKey as keyof typeof weights] = Math.max(0, currentWeights[firstOtherKey as keyof typeof weights])
      }
    }

    setConfig({
      ...config,
      custom_grading_rubric: {
        ...config.custom_grading_rubric!,
        weights: currentWeights
      }
    })
  }

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Score Weights</h3>
        <div className="space-y-4">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <label className="flex-1 text-sm text-slate-300 capitalize">
                {key.replace(/_/g, ' ').replace(' score', '')}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={value}
                onChange={(e) => updateWeight(key, parseInt(e.target.value))}
                className="w-48"
              />
              <span className="w-16 text-right text-sm font-semibold text-white">{value}%</span>
            </div>
          ))}
        </div>
        <div className={`mt-4 text-sm ${totalWeight === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
          Total: {totalWeight}% {totalWeight !== 100 && '(Should equal 100%)'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Passing Score</label>
        <input
          type="number"
          min="0"
          max="100"
          value={config.passing_score || 70}
          onChange={(e) => setConfig({ ...config, passing_score: parseInt(e.target.value) })}
          className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
        />
        <p className="text-xs text-slate-400 mt-1">Minimum score required to pass</p>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled ?? true}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 rounded bg-white/5 border-white/10"
          />
          <span className="text-sm text-slate-300">Enable custom grading for this team</span>
        </label>
      </div>
    </div>
  )
}

function DocumentsTab({ documents, uploading, onUpload, onDelete }: {
  documents: KnowledgeDocument[]
  uploading: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Upload Documents</h3>
        <p className="text-sm text-slate-400 mb-4">
          Upload training materials, playbooks, product catalogs, or any documents you want the AI to reference during grading
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Choose Files
            </>
          )}
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">Supported: PDF, DOC, DOCX, TXT</p>
      </div>

      {documents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Uploaded Documents ({documents.length})</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.document_name}</p>
                    <p className="text-xs text-slate-400">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.document_type}
                      {doc.is_shared_with_team && ' • Shared'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    doc.use_in_grading 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {doc.use_in_grading ? 'In Use' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
