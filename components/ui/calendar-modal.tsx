'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import Cal, { getCalApi } from "@calcom/embed-react"

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [calLoaded, setCalLoaded] = useState(false)

  // Initialize Cal.com embed when modal opens
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] max-h-[900px] p-0 overflow-hidden bg-white dark:bg-slate-900">
        <div 
          className="relative w-full h-full overflow-hidden rounded-2xl"
          style={{ 
            minHeight: '600px',
            height: '100%'
          }}
        >
          <Cal 
            namespace="dooriq"
            calLink="canon-weaver-aa0twn/dooriq"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "600px",
              overflow: "auto",
              padding: "0"
            }}
            config={{"layout":"month_view"}}
          />
          {!calLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 backdrop-blur-sm z-20 rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                <p className="text-base font-medium text-slate-900 dark:text-white">
                  Loading calendar...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

