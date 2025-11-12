'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import Cal, { getCalApi } from "@calcom/embed-react"

const customerRanges = [
  'Under 1,000 customers',
  '1,000-10,000 customers',
  '10,000+ customers'
]

function PricingPageContent() {
  const [selectedRange, setSelectedRange] = useState<string | null>(null)
  const [calLoaded, setCalLoaded] = useState(false)

  // Initialize Cal.com embed when customer range is selected
  useEffect(() => {
    if (selectedRange) {
      setCalLoaded(false)
      ;(async function () {
        try {
          const cal = await getCalApi({"namespace":"dooriq"});
          cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
      setTimeout(() => {
            setCalLoaded(true)
          }, 1000)
        } catch (error) {
          console.error('Error initializing Cal.com:', error)
          setCalLoaded(true) // Show anyway if there's an error
        }
      })();
    } else {
      setCalLoaded(false)
    }
  }, [selectedRange])

  const handleSelectRange = (range: string) => {
    setSelectedRange(range)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Get Started with DoorIQ
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={selectedRange ? 'calendar' : 'question'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg sm:text-xl text-slate-300"
            >
              {selectedRange ? 'Schedule Your Demo' : 'How many active customers does your business have?'}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {!selectedRange ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Select your customer range
              </h2>
              <p className="text-slate-400 mb-8">
                Choose the option that best describes your business
              </p>
              <div className="space-y-3">
                {customerRanges.map((range) => (
              <button
                    key={range}
                    onClick={() => handleSelectRange(range)}
                    className="w-full text-left px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                    <span className="text-lg font-medium text-white">
                      {range}
                    </span>
              </button>
                ))}
                </div>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 overflow-hidden"
            >
              {/* Cal.com Embed */}
              <div 
                className="relative w-full overflow-hidden rounded-xl"
                style={{ 
                  minHeight: 'calc(100vh - 300px)',
                  height: 'calc(100vh - 300px)',
                  maxHeight: '800px'
                }}
              >
                <Cal 
                  namespace="dooriq"
                  calLink="canon-weaver-aa0twn/dooriq"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "calc(100vh - 300px)",
                    maxHeight: "800px",
                    overflow: "auto",
                    padding: "0"
                  }}
                  config={{"layout":"month_view"}}
                />
                {!calLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                      <p className="text-base font-medium text-white">
                        Loading calendar...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
  )
}

export default function PricingPage() {
  return (
      <PricingPageContent />
  )
}
