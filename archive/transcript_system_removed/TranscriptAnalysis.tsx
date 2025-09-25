'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp?: Date | string
  analysis?: {
    score: number
    feedback: string
    category: 'introduction' | 'rapport' | 'discovery' | 'objection' | 'presentation' | 'closing' | 'general'
    sentiment: 'positive' | 'neutral' | 'negative'
  }
}

interface SectionAnalysis {
  name: string
  score: number
  feedback: string
  lineNumbers: number[]
  color: 'green' | 'yellow' | 'red'
}

interface TranscriptAnalysisProps {
  transcript: TranscriptEntry[]
  duration: string
  onAnalysisComplete?: (analysis: any) => void
}

export function TranscriptAnalysis({ transcript, duration, onAnalysisComplete }: TranscriptAnalysisProps) {
  const [analyzedTranscript, setAnalyzedTranscript] = useState<TranscriptEntry[]>([])
  const [sections, setSections] = useState<SectionAnalysis[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(true)

  useEffect(() => {
    analyzeTranscript()
  }, [transcript])

  const analyzeTranscript = async () => {
    setAnalyzing(true)
    
    // Simulate AI analysis - in production this would call an AI service
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const analyzed = transcript.map((entry, idx) => {
      const analysis = analyzeEntry(entry, idx, transcript)
      return { ...entry, analysis }
    })
    
    const sectionData = identifySections(analyzed)
    
    setAnalyzedTranscript(analyzed)
    setSections(sectionData)
    setAnalyzing(false)
    
    if (onAnalysisComplete) {
      onAnalysisComplete({ analyzed, sections: sectionData })
    }
  }

  const analyzeEntry = (entry: TranscriptEntry, index: number, fullTranscript: TranscriptEntry[]): TranscriptEntry['analysis'] => {
    const text = entry.text.toLowerCase()
    const isRep = entry.speaker === 'rep' || entry.speaker === 'user'
    
    // Introduction detection
    if (index < 5 && isRep) {
      if (text.includes('my name') || text.includes("i'm from") || text.includes('pest control')) {
        return {
          score: 90,
          feedback: 'Good clear introduction',
          category: 'introduction',
          sentiment: 'positive'
        }
      } else if (index === 0 && !text.includes('hello') && !text.includes('hi')) {
        return {
          score: 40,
          feedback: 'Missing greeting - always start with a friendly hello',
          category: 'introduction',
          sentiment: 'negative'
        }
      }
    }
    
    // Rapport building
    if (isRep && (text.includes('how are you') || text.includes('nice weather') || text.includes('beautiful home'))) {
      return {
        score: 85,
        feedback: 'Excellent rapport building',
        category: 'rapport',
        sentiment: 'positive'
      }
    }
    
    // Discovery questions
    if (isRep && text.includes('?') && (text.includes('pest') || text.includes('problem') || text.includes('issue'))) {
      return {
        score: 80,
        feedback: 'Good discovery question',
        category: 'discovery',
        sentiment: 'positive'
      }
    }
    
    // Objection handling
    if (!isRep && (text.includes("can't") || text.includes('expensive') || text.includes('not interested') || text.includes('busy'))) {
      const nextEntry = fullTranscript[index + 1]
      if (nextEntry && (nextEntry.speaker === 'rep' || nextEntry.speaker === 'user')) {
        const response = nextEntry.text.toLowerCase()
        if (response.includes('understand') || response.includes('appreciate')) {
          return {
            score: 75,
            feedback: 'Customer objection - handled with acknowledgment',
            category: 'objection',
            sentiment: 'neutral'
          }
        }
      }
      return {
        score: 50,
        feedback: 'Customer objection - needs acknowledgment',
        category: 'objection',
        sentiment: 'negative'
      }
    }
    
    // Closing attempts
    if (isRep && (text.includes('schedule') || text.includes('appointment') || text.includes('when can') || text.includes('service'))) {
      return {
        score: 85,
        feedback: 'Good closing attempt',
        category: 'closing',
        sentiment: 'positive'
      }
    }
    
    // Safety mentions
    if (isRep && (text.includes('safe') || text.includes('pet') || text.includes('child') || text.includes('eco'))) {
      return {
        score: 90,
        feedback: 'Excellent - addressing safety concerns',
        category: 'presentation',
        sentiment: 'positive'
      }
    }
    
    // Default analysis
    return {
      score: 70,
      feedback: '',
      category: 'general',
      sentiment: 'neutral'
    }
  }

  const identifySections = (analyzed: TranscriptEntry[]): SectionAnalysis[] => {
    const sections: SectionAnalysis[] = []
    
    // Identify introduction section (first 3-5 exchanges)
    const introEnd = Math.min(6, analyzed.length)
    const introLines = analyzed.slice(0, introEnd)
    const introScore = introLines.reduce((sum, e) => sum + (e.analysis?.score || 0), 0) / introLines.length
    
    sections.push({
      name: 'Introduction & Opening',
      score: Math.round(introScore),
      feedback: introScore >= 80 
        ? 'Strong opening with clear introduction and rapport building' 
        : 'Remember to introduce yourself clearly and build initial rapport',
      lineNumbers: Array.from({ length: introEnd }, (_, i) => i),
      color: introScore >= 80 ? 'green' : introScore >= 60 ? 'yellow' : 'red'
    })
    
    // Find discovery/needs assessment section
    const discoveryStart = introEnd
    const discoveryLines = analyzed.slice(discoveryStart).filter(e => 
      e.analysis?.category === 'discovery' || 
      (e.speaker === 'homeowner' && e.text.length > 20)
    )
    
    if (discoveryLines.length > 0) {
      const discoveryScore = discoveryLines.reduce((sum, e) => sum + (e.analysis?.score || 0), 0) / discoveryLines.length
      sections.push({
        name: 'Discovery & Needs Assessment',
        score: Math.round(discoveryScore),
        feedback: discoveryScore >= 70 
          ? 'Good job uncovering customer needs' 
          : 'Ask more open-ended questions to understand their situation',
        lineNumbers: analyzed.map((e, i) => discoveryLines.includes(e) ? i : -1).filter(i => i >= 0),
        color: discoveryScore >= 80 ? 'green' : discoveryScore >= 60 ? 'yellow' : 'red'
      })
    }
    
    // Find objection handling sections
    const objectionLines = analyzed.filter(e => e.analysis?.category === 'objection')
    if (objectionLines.length > 0) {
      const objectionScore = objectionLines.reduce((sum, e) => sum + (e.analysis?.score || 0), 0) / objectionLines.length
      sections.push({
        name: 'Objection Handling',
        score: Math.round(objectionScore),
        feedback: objectionScore >= 70 
          ? 'Handled objections with empathy and professionalism' 
          : 'Remember to acknowledge concerns before addressing them',
        lineNumbers: analyzed.map((e, i) => objectionLines.includes(e) ? i : -1).filter(i => i >= 0),
        color: objectionScore >= 80 ? 'green' : objectionScore >= 60 ? 'yellow' : 'red'
      })
    }
    
    // Find closing section
    const closingLines = analyzed.filter(e => e.analysis?.category === 'closing')
    if (closingLines.length > 0) {
      const closingScore = closingLines.reduce((sum, e) => sum + (e.analysis?.score || 0), 0) / closingLines.length
      sections.push({
        name: 'Closing & Next Steps',
        score: Math.round(closingScore),
        feedback: closingScore >= 80 
          ? 'Strong close with clear next steps' 
          : 'Be more assumptive in your close and offer specific appointment times',
        lineNumbers: analyzed.map((e, i) => closingLines.includes(e) ? i : -1).filter(i => i >= 0),
        color: closingScore >= 80 ? 'green' : closingScore >= 60 ? 'yellow' : 'red'
      })
    }
    
    return sections
  }

  const getLineColor = (entry: TranscriptEntry): string => {
    if (!entry.analysis) return 'bg-gray-50'
    const score = entry.analysis.score
    if (score >= 80) return 'bg-green-50 border-l-4 border-green-400'
    if (score >= 60) return 'bg-yellow-50 border-l-4 border-yellow-400'
    return 'bg-red-50 border-l-4 border-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  if (analyzing) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Analyzing Conversation...</p>
            <p className="text-sm text-gray-600 mt-2">Breaking down your performance by section</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation Sections</h2>
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => toggleSection(idx)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getScoreIcon(section.score)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.name}</h3>
                    <p className="text-sm text-gray-600">{section.feedback}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-2xl font-bold ${
                    section.color === 'green' ? 'text-green-600' : 
                    section.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {section.score}%
                  </span>
                  {expandedSections.has(idx) ? 
                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </div>
              
              <AnimatePresence>
                {expandedSections.has(idx) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-2 overflow-hidden"
                  >
                    {section.lineNumbers.map(lineNum => {
                      const entry = analyzedTranscript[lineNum]
                      if (!entry) return null
                      return (
                        <div
                          key={lineNum}
                          className={`p-3 rounded-lg text-sm ${getLineColor(entry)} cursor-pointer transition-all`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLine(lineNum)
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="font-medium text-gray-700">
                                {entry.speaker === 'rep' || entry.speaker === 'user' ? 'You' : 'Austin'}:
                              </span>
                              <span className="ml-2 text-gray-900">{entry.text}</span>
                            </div>
                            {entry.analysis?.feedback && (
                              <MessageSquare className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            )}
                          </div>
                          {selectedLine === lineNum && entry.analysis?.feedback && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-2 text-xs text-gray-600 italic"
                            >
                              💡 {entry.analysis.feedback}
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Transcript */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Transcript</h2>
        <div className="space-y-3">
          {analyzedTranscript.map((entry, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 2) }}
              className={`p-4 rounded-lg ${getLineColor(entry)} cursor-pointer transition-all hover:shadow-md`}
              onClick={() => setSelectedLine(selectedLine === idx ? null : idx)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {entry.speaker === 'rep' || entry.speaker === 'user' ? 'You' : 'Austin Rodriguez'}
                    </span>
                    {entry.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800">{entry.text}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {entry.analysis && getScoreIcon(entry.analysis.score)}
                  {entry.analysis?.feedback && (
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <AnimatePresence>
                {selectedLine === idx && entry.analysis?.feedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 p-3 bg-white bg-opacity-60 rounded-md"
                  >
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Feedback:</span> {entry.analysis.feedback}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                      <span>Category: {entry.analysis.category}</span>
                      <span>Score: {entry.analysis.score}%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
