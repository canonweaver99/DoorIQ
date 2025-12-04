'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
  moduleTitle?: string // Optional module title to filter out duplicate headings
}

// Function to emphasize the first 3 words of each paragraph and "45-degree angle" phrase
const emphasizeImportantWords = (text: string): string => {
  // Skip if already has bold formatting (markdown or HTML)
  if (text.includes('**') || text.includes('<strong>')) {
    return text
  }

  let processed = text

  // First, check for and emphasize important phrases
  const importantPhrases = [
    /what not to do/gi,
    /look busy while you wait/gi,
    /45-degree angle/gi,
    /45 degree angle/gi,
    /45-degree/gi,
    /45 degree/gi
  ]

  for (const phraseRegex of importantPhrases) {
    if (phraseRegex.test(processed)) {
      processed = processed.replace(phraseRegex, (match) => {
        // Check if already emphasized
        if (processed.includes(`<strong>${match}</strong>`)) {
          return match
        }
        return `<strong>${match}</strong>`
      })
      // Don't break - continue to check for other phrases
    }
  }

  // Then emphasize the first 3 words (if not already emphasized)
  const words = processed.split(/(\s+)/)
  const nonEmptyWords = words.filter(w => w.trim().length > 0 && !w.includes('<strong>'))
  
  if (nonEmptyWords.length >= 3) {
    let emphasizedCount = 0
    let result = ''
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      // Skip if already emphasized
      if (word.includes('<strong>')) {
        result += word
        continue
      }
      
      // If it's a non-empty word and we haven't emphasized 3 yet
      if (word.trim().length > 0 && emphasizedCount < 3) {
        result += `<strong>${word}</strong>`
        emphasizedCount++
      } else {
        result += word
      }
    }
    
    return result
  }

  return processed
}

export function MarkdownContent({ content, className, moduleTitle }: MarkdownContentProps) {
  // Filter out "Try This Today" sections and duplicate title
  const lines = content.split(/\n/)
  const filteredLines: string[] = []
  let skipMode = false
  let firstHeadingSkipped = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const trimmedLine = line.trim()

    // Check if this line starts a "Try This Today" section
    if (trimmedLine.startsWith('**Try This Today**') || trimmedLine.startsWith('Try This Today')) {
      skipMode = true
      continue
    }

    // Stop skipping if we hit a new heading
    if (skipMode && trimmedLine.startsWith('#')) {
      skipMode = false
    }

    // Skip the first H1 heading if it matches the module title
    if (!firstHeadingSkipped && moduleTitle && trimmedLine.startsWith('# ')) {
      const headingText = trimmedLine.replace(/^#+\s+/, '').trim()
      // Check if heading matches module title (case-insensitive, ignoring special chars)
      const normalizedHeading = headingText.toLowerCase().replace(/[^\w\s]/g, '')
      const normalizedTitle = moduleTitle.toLowerCase().replace(/[^\w\s]/g, '')
      if (normalizedHeading === normalizedTitle || headingText === moduleTitle) {
        firstHeadingSkipped = true
        continue
      }
    }

    // Add emphasis to paragraph lines (not headings, lists, or code blocks)
    if (!skipMode && trimmedLine.length > 0 && !trimmedLine.startsWith('#') && 
        !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && 
        !trimmedLine.startsWith('1.') && !trimmedLine.startsWith('```') &&
        !trimmedLine.startsWith('>')) {
      line = emphasizeImportantWords(line)
    }

    // Add the line if we're not in skip mode
    if (!skipMode) {
      filteredLines.push(line)
    }
  }

  const filteredContent = filteredLines.join('\n')

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 sm:mb-5 mt-4 sm:mt-6 font-space tracking-tight leading-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-3 sm:mb-4 mt-3 sm:mt-5 font-space tracking-tight leading-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 mt-2 sm:mt-4 font-space tracking-tight leading-tight" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-white leading-relaxed mb-4 sm:mb-5 font-sans font-medium text-base sm:text-lg" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-white mb-4 sm:mb-5 space-y-2 sm:space-y-3 ml-3 sm:ml-4 font-sans font-medium text-base sm:text-lg" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-white mb-4 sm:mb-5 space-y-2 sm:space-y-3 ml-3 sm:ml-4 font-sans font-medium text-base sm:text-lg" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-white leading-relaxed font-sans font-medium text-base sm:text-lg mb-1.5 sm:mb-2" {...props} />
          ),
          strong: ({ node, ...props }: any) => (
            <strong className="font-black text-white font-sans text-base sm:text-lg" style={{ fontWeight: 900 }} {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-white font-sans font-bold text-base sm:text-lg" {...props} />
          ),
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 text-purple-300 rounded text-sm sm:text-base font-mono font-bold"
                  {...props}
                />
              )
            }
            return (
              <code
                className="block p-3 sm:p-4 bg-slate-900 text-white rounded-lg overflow-x-auto text-sm sm:text-base font-mono font-medium mb-4 sm:mb-5"
                {...props}
              />
            )
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-500 pl-3 sm:pl-5 italic text-white my-4 sm:my-5 font-sans font-medium text-base sm:text-lg"
              {...props}
            />
          ),
          a: ({ node, ...props }: any) => (
            <a
              className="text-purple-400 active:text-purple-300 underline font-sans font-bold text-base sm:text-lg touch-manipulation"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {filteredContent}
      </ReactMarkdown>
    </div>
  )
}

