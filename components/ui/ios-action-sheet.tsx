'use client'

import * as React from 'react'
import { IOSBottomSheet } from './ios-bottom-sheet'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'

interface IOSActionSheetAction {
  label: string
  icon?: React.ReactNode
  action: () => void
  destructive?: boolean
  disabled?: boolean
}

interface IOSActionSheetProps {
  isOpen: boolean
  onClose: () => void
  actions: IOSActionSheetAction[]
  title?: string
  cancelLabel?: string
}

export function IOSActionSheet({
  isOpen,
  onClose,
  actions,
  title,
  cancelLabel = 'Cancel'
}: IOSActionSheetProps) {
  const { trigger } = useHaptic()

  const handleAction = (action: IOSActionSheetAction) => {
    if (action.disabled) return
    
    if (action.destructive) {
      trigger('warning')
    } else {
      trigger('light')
    }
    
    action.action()
    onClose()
  }

  return (
    <IOSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="auto"
      showCloseButton={false}
    >
      {title && (
        <div className="px-2 py-3 text-center">
          <p className="text-sm font-medium text-white/60">{title}</p>
        </div>
      )}
      
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            disabled={action.disabled}
            className={cn(
              'w-full flex items-center gap-3',
              'px-4 py-4 rounded-xl',
              'min-h-[56px]',
              'transition-all duration-200',
              'touch-manipulation',
              'active:scale-[0.98]',
              action.disabled
                ? 'opacity-50 cursor-not-allowed'
                : action.destructive
                  ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
                  : 'text-white hover:bg-white/10 active:bg-white/20'
            )}
          >
            {action.icon && (
              <span className="flex-shrink-0 w-5 h-5">
                {action.icon}
              </span>
            )}
            <span className="font-medium text-base flex-1 text-left">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <button
          onClick={() => {
            trigger('light')
            onClose()
          }}
          className={cn(
            'w-full px-4 py-4 rounded-xl',
            'min-h-[56px]',
            'font-semibold text-base',
            'text-white',
            'bg-white/10 hover:bg-white/15 active:bg-white/20',
            'transition-all duration-200',
            'touch-manipulation',
            'active:scale-[0.98]'
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </IOSBottomSheet>
  )
}

