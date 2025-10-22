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
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 sm:px-6 lg:px-8">
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

          <motion.div className="w-full max-w-3xl space-y-3">
            {items.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
                index={index}
              />
            ))}
          </motion.div>

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
              className="max-w-md mx-auto mt-12 p-6 rounded-lg text-center"
            >
              <div className="inline-flex items-center justify-center p-1.5 rounded-full mb-4">
                <Mail className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {contactInfo.title}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {contactInfo.description}
              </p>
              <motion.button
                onClick={contactInfo.onContact}
                className="inline-flex rounded-full text-center items-center justify-center bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 text-white border border-purple-500/30 hover:border-purple-500/50 transition-all px-6 py-2.5 text-sm font-semibold backdrop-blur-sm duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {contactInfo.buttonText}
              </motion.button>
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
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        "group rounded-lg",
        "transition-all duration-200 ease-in-out",
        "border border-border/50",
        isOpen
          ? "bg-gradient-to-br from-background via-muted/50 to-background"
          : "hover:bg-muted/50",
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-6 py-4 h-auto justify-between hover:bg-transparent"
      >
        <h3
          className={cn(
            "text-base font-medium transition-colors duration-200 text-left",
            "text-foreground/70",
            isOpen && "text-foreground",
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
            isOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <ChevronDown className="h-4 w-4" />
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
            <div className="px-6 pb-4 pt-2">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-sm text-muted-foreground leading-relaxed"
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


