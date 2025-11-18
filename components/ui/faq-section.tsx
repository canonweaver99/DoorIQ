"use client"

import * as React from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { ChevronDown, Mail } from "lucide-react"
import { useInView } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
    const sectionRef = React.useRef<HTMLElement>(null)
    const controls = useAnimation()
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

    React.useEffect(() => {
      if (isInView) {
        controls.start("visible")
      }
    }, [isInView, controls])

    return (
      <motion.section
        ref={sectionRef}
        className={cn(
          "py-16 w-full bg-gradient-to-b from-transparent via-muted/50 to-transparent",
          className,
        )}
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2
            }
          }
        }}
        {...props}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-4 lg:px-8">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" }
              }
            }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <h2 className="text-[56px] leading-[1.1] tracking-tight font-geist mb-3 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">{title}</span>
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </motion.div>

          <div className="w-full max-w-4xl mx-auto">
            <motion.div className="w-full space-y-3">
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
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.6, delay: 0.4, ease: "easeOut" }
                }
              }}
              className="w-full max-w-7xl mx-auto mt-16"
            >
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-sm p-8 md:p-12">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 opacity-50" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                  {/* Left side - Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center justify-center md:justify-start gap-3 mb-4">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <Mail className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        {contactInfo.title}
                      </h3>
                    </div>
                    <p className="text-base md:text-lg text-slate-300 max-w-2xl">
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
                          className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-3.5 px-8 text-base md:text-lg font-semibold whitespace-nowrap"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {contactInfo.buttonText}
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
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            duration: 0.5, 
            delay: index * 0.1,
            ease: "easeOut"
          }
        }
      }}
      className={cn(
        "group rounded-lg",
        "transition-all duration-200 ease-in-out",
        "border border-primary/30",
        "bg-white",
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-8 py-6 h-auto justify-between hover:bg-transparent"
      >
        <h3
          className={cn(
            "text-lg font-medium transition-colors duration-200 text-left",
            "text-slate-300",
            isOpen && "text-slate-300",
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
            "p-0.5 rounded-full flex-shrink-0",
            "transition-colors duration-200",
            isOpen ? "text-primary" : "text-gray-600",
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
            <div className="px-8 pb-6 pt-2">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-base text-slate-300 leading-relaxed"
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


