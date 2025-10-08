'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Database, FileText, DollarSign, Shield, Edit, Save, Upload, History, Plus } from 'lucide-react'

export default function KnowledgeBase() {
  const [activeSection, setActiveSection] = useState('company')
  const [editMode, setEditMode] = useState(false)

  const sections = [
    { id: 'company', name: 'Company Info', icon: FileText },
    { id: 'pricing', name: 'Pricing Tables', icon: DollarSign },
    { id: 'objections', name: 'Objection Handlers', icon: Shield },
    { id: 'grading', name: 'Grading Criteria', icon: Edit },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Knowledge Base Management</h2>
          <p className="text-slate-400">Manage company knowledge and training data</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all">
            <History className="w-4 h-4" />
            Version History
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30">
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                activeSection === section.id
                  ? 'bg-purple-500/20 border-2 border-purple-500/50 text-white'
                  : 'bg-[#1e1e30] border border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{section.name}</span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
      >
        {activeSection === 'company' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Company Policies & Information</h3>
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors"
              >
                {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Mission</label>
                <textarea
                  disabled={!editMode}
                  className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none disabled:opacity-70"
                  defaultValue="Protect homes and families by providing superior pest control services with exceptional customer care..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Service Guarantees</label>
                <textarea
                  disabled={!editMode}
                  className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none disabled:opacity-70"
                  defaultValue="100% satisfaction guarantee. If pests return within treatment period, we re-treat at no additional cost..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Uploaded Documents</label>
                <div className="space-y-2">
                  {['company-handbook.pdf', 'product-catalog.pdf', 'safety-protocols.docx'].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-white">{doc}</span>
                      </div>
                      <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'objections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Custom Objection Handlers</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors">
                <Plus className="w-4 h-4" />
                Add Handler
              </button>
            </div>

            {['Price Too High', 'Need to Talk to Spouse', 'Already Have Service', 'Not Interested'].map((objection, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">{objection}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">85% effective</span>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-300">
                  "I completely understand, and I appreciate you being upfront about that. Let me ask you this - what if I could show you how this actually saves you money in the long run by preventing costly damage?"
                </p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'pricing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pricing Tables</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors">
                <Edit className="w-4 h-4" />
                Edit Pricing
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Basic Plan', 'Premium Plan', 'Ultimate Plan'].map((plan, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-2">{plan}</h4>
                  <p className="text-3xl font-bold text-purple-300 mb-4">${49 + idx * 30}/mo</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>✓ {1 + idx} treatments/year</li>
                    <li>✓ {idx === 2 ? 'All' : 'Common'} pests</li>
                    <li>✓ {idx > 0 ? 'Priority' : 'Standard'} service</li>
                    {idx === 2 && <li>✓ Termite protection</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'grading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Grading Criteria & Weights</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            {['Rapport Building', 'Discovery', 'Objection Handling', 'Closing Technique'].map((criteria, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">{criteria}</h4>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400">Weight:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="25"
                      className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Evaluates how well the rep builds connection and trust with the homeowner
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

