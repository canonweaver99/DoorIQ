"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useScrollAnimation, fadeInUp, staggerContainer, staggerItem } from "@/hooks/useScrollAnimation"

interface FaqSectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  items: {
    question: string
    answer: string
  }[]
  contactInfo?: {
    title: string
    description: string
    buttonText: string
    onContact?: () => void
  }
}

const FaqSection = React.forwardRef<HTMLElement, FaqSectionProps>(
  ({ className, title, description, items, contactInfo, ...props }, ref) => {
    const { ref: scrollRef, controls } = useScrollAnimation(0.2)

    return (
      <motion.section
        ref={scrollRef}
        className={cn(
          "py-8 sm:py-12 md:py-16 lg:py-20 w-full",
          className,
        )}
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
        {...props}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            className="max-w-2xl mx-auto text-center mb-8 sm:mb-10 lg:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.2] sm:leading-[1.15] lg:leading-[1.1] tracking-tight font-space font-bold mb-3 sm:mb-4 lg:mb-6 px-2 sm:px-0 text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{title}</span>
            </h2>
            {description ? (
              <p className="text-base sm:text-lg lg:text-xl text-white font-sans leading-relaxed">{description}</p>
            ) : null}
          </motion.div>

          <div className="w-full max-w-4xl mx-auto">
            <motion.div className="w-full space-y-3 sm:space-y-4" variants={staggerContainer}>
              {items.map((item, index) => (
                <FaqItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  index={index}
                />
              ))}
            </motion.div>
          </div>

          {contactInfo ? (
            <motion.div
              variants={fadeInUp}
              className="w-full max-w-7xl mx-auto mt-12 sm:mt-16"
            >
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-indigo-500/30 bg-black/50 backdrop-blur-sm p-6 sm:p-8 md:p-12">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-50" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                  {/* Left side - Content */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 font-space">
                      {contactInfo.title}
                    </h3>
                    <p className="text-base sm:text-lg md:text-xl text-white max-w-2xl font-sans leading-relaxed">
                      {contactInfo.description}
                    </p>
                  </div>
                  
                  {/* Right side - CTA Button */}
                  <div className="flex-shrink-0">
                    <motion.span 
                      className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                      <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault()
                            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                              try {
                                navigator.vibrate(10)
                              } catch {}
                            }
                            contactInfo.onContact?.()
                          }}
                          className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent dark:from-indigo-500/15 dark:via-purple-500/15 text-white border-indigo-500/30 border-[1px] hover:bg-gradient-to-tr hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-transparent dark:hover:from-indigo-500/25 dark:hover:via-purple-500/25 transition-all py-3.5 px-6 sm:px-8 text-base sm:text-lg font-semibold whitespace-nowrap"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {contactInfo.buttonText}
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </motion.section>
    )
  },
)
FaqSection.displayName = "FaqSection"

const FaqItem = React.forwardRef<
  HTMLDivElement,
  {
    question: string
    answer: string
    index: number
  }
>(({ question, answer, index }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      className={cn(
        "group rounded-lg sm:rounded-xl",
        "transition-all duration-200 ease-in-out",
        "border border-indigo-500/30",
        "bg-black/50 backdrop-blur-sm",
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 h-auto justify-between transition-all"
      >
        <h3
          className={cn(
            "text-base sm:text-lg md:text-xl font-medium transition-colors duration-200 text-left font-space",
            "text-white",
            isOpen && "text-white",
          )}
        >
          {question}
        </h3>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "p-0.5 rounded-full flex-shrink-0 ml-4",
            "transition-colors duration-200",
            isOpen ? "text-indigo-400" : "text-slate-300",
          )}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </Button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: "easeIn" },
            }}
          >
            <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-5 md:pb-6 pt-2">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-base sm:text-lg md:text-xl text-white leading-relaxed font-sans"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
})
FaqItem.displayName = "FaqItem"

export { FaqSection }


