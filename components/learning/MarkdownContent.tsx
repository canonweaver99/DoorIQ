'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold text-white mb-4 mt-6 font-space" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-white mb-3 mt-5 font-space" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold text-white mb-2 mt-4 font-space" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-slate-300 leading-relaxed mb-4 font-sans" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 ml-4 font-sans" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-2 ml-4 font-sans" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-slate-300 leading-relaxed font-sans" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white font-sans" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-200 font-sans" {...props} />
          ),
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-slate-800 text-purple-300 rounded text-sm font-mono"
                  {...props}
                />
              )
            }
            return (
              <code
                className="block p-4 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-sm font-mono mb-4"
                {...props}
              />
            )
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-500 pl-4 italic text-slate-300 my-4 font-sans"
              {...props}
            />
          ),
          a: ({ node, ...props }: any) => (
            <a
              className="text-purple-400 hover:text-purple-300 underline font-sans"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

