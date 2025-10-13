'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Slider = forwardRef<HTMLSpanElement, SliderPrimitive.SliderProps>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-pink-600 to-purple-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-white/20 bg-white shadow focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
    </SliderPrimitive.Root>
  )
)

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

