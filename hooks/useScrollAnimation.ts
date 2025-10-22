import { useAnimation, AnimationControls, Variants } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement>
  controls: AnimationControls
  isInView: boolean
}

export function useScrollAnimation(threshold = 0.1): UseScrollAnimationReturn {
  const ref = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const isInView = useInView(ref, { 
    once: true, 
    amount: threshold,
    margin: "0px 0px -100px 0px" // Trigger animation slightly before element is fully in view
  })

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])

  return { ref, controls, isInView }
}

// Preset animation variants
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export const fadeInScale: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}
