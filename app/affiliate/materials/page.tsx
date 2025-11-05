'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Image as ImageIcon, FileText, Mail, Instagram, Facebook, Linkedin, Globe, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MarketingMaterial {
  id: string
  title: string
  description: string
  type: 'banner' | 'social' | 'email' | 'logo' | 'template'
  size?: string
  format: string
  downloadUrl: string
  previewUrl?: string
  icon: any
}

const marketingMaterials: MarketingMaterial[] = [
  // Social Media Banners
  {
    id: 'instagram-post',
    title: 'Instagram Post',
    description: '1080x1080px square format for Instagram feed posts',
    type: 'social',
    size: '1080x1080',
    format: 'PNG',
    downloadUrl: '/marketing/social/instagram-post.png',
    icon: Instagram
  },
  {
    id: 'instagram-story',
    title: 'Instagram Story',
    description: '1080x1920px vertical format for Instagram stories',
    type: 'social',
    size: '1080x1920',
    format: 'PNG',
    downloadUrl: '/marketing/social/instagram-story.png',
    icon: Instagram
  },
  {
    id: 'facebook-cover',
    title: 'Facebook Cover',
    description: '1200x630px cover image for Facebook pages',
    type: 'social',
    size: '1200x630',
    format: 'PNG',
    downloadUrl: '/marketing/social/facebook-cover.png',
    icon: Facebook
  },
  {
    id: 'linkedin-banner',
    title: 'LinkedIn Banner',
    description: '1128x191px banner for LinkedIn company pages',
    type: 'social',
    size: '1128x191',
    format: 'PNG',
    downloadUrl: '/marketing/social/linkedin-banner.png',
    icon: Linkedin
  },
  // Website Banners
  {
    id: 'website-banner-1',
    title: 'Website Banner (Large)',
    description: '1920x600px hero banner for website headers',
    type: 'banner',
    size: '1920x600',
    format: 'PNG',
    downloadUrl: '/marketing/banners/website-banner-large.png',
    icon: Globe
  },
  {
    id: 'website-banner-2',
    title: 'Website Banner (Medium)',
    description: '1200x400px banner for blog posts and articles',
    type: 'banner',
    size: '1200x400',
    format: 'PNG',
    downloadUrl: '/marketing/banners/website-banner-medium.png',
    icon: Globe
  },
  // Logo Assets
  {
    id: 'logo-transparent',
    title: 'DoorIQ Logo (Transparent)',
    description: 'PNG logo with transparent background',
    type: 'logo',
    format: 'PNG',
    downloadUrl: '/dooriqlogo.png',
    icon: ImageIcon
  },
  {
    id: 'logo-svg',
    title: 'DoorIQ Logo (SVG)',
    description: 'Scalable vector logo for web use',
    type: 'logo',
    format: 'SVG',
    downloadUrl: '/dooriq-logo.svg',
    icon: ImageIcon
  },
  // Email Templates
  {
    id: 'email-template-1',
    title: 'Email Template - Introduction',
    description: 'HTML email template for introducing DoorIQ',
    type: 'email',
    format: 'HTML',
    downloadUrl: '/marketing/email/introduction-template.html',
    icon: Mail
  },
  {
    id: 'email-template-2',
    title: 'Email Template - Follow-up',
    description: 'HTML email template for follow-up messages',
    type: 'email',
    format: 'HTML',
    downloadUrl: '/marketing/email/followup-template.html',
    icon: Mail
  },
  // Text Templates
  {
    id: 'social-post-template',
    title: 'Social Media Post Copy',
    description: 'Ready-to-use social media post templates',
    type: 'template',
    format: 'TXT',
    downloadUrl: '/marketing/templates/social-post-copy.txt',
    icon: FileText
  },
  {
    id: 'email-copy-template',
    title: 'Email Copy Templates',
    description: 'Sample email copy for promoting DoorIQ',
    type: 'template',
    format: 'TXT',
    downloadUrl: '/marketing/templates/email-copy.txt',
    icon: FileText
  }
]

const materialCategories = [
  { id: 'all', label: 'All Materials' },
  { id: 'social', label: 'Social Media' },
  { id: 'banner', label: 'Website Banners' },
  { id: 'logo', label: 'Logo Assets' },
  { id: 'email', label: 'Email Templates' },
  { id: 'template', label: 'Text Templates' }
]

export default function MarketingMaterialsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const filteredMaterials = selectedCategory === 'all' 
    ? marketingMaterials 
    : marketingMaterials.filter(m => m.type === selectedCategory)

  const handleDownload = (material: MarketingMaterial) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = material.downloadUrl
    link.download = `${material.id}.${material.format.toLowerCase()}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Marketing Materials
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Download banners, social media graphics, email templates, and other promotional assets to help you promote DoorIQ and grow your affiliate earnings.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {materialCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Materials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredMaterials.map((material, idx) => {
            const Icon = material.icon
            return (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">
                    {material.format}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {material.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-4">
                  {material.description}
                </p>
                
                {material.size && (
                  <p className="text-xs text-slate-500 mb-4">
                    Size: {material.size}
                  </p>
                )}
                
                <Button
                  onClick={() => handleDownload(material)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Usage Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Usage Guidelines
          </h2>
          <div className="space-y-3 text-slate-300">
            <p>• All materials are approved for use in promoting DoorIQ through your affiliate links</p>
            <p>• Please maintain the integrity of DoorIQ branding and messaging</p>
            <p>• Do not modify logos or create misleading representations</p>
            <p>• Include your affiliate link when sharing these materials</p>
            <p>• For questions about usage, contact support@dooriq.ai</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

