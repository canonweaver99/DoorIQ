import { MetadataRoute } from 'next'

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                process.env.NEXT_PUBLIC_APP_URL || 
                'https://dooriq.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl

  // Static pages
  const routes = [
    '',
    '/pricing',
    '/about',
    '/faqs',
    '/testimonials',
    '/contact-sales',
    '/privacy',
    '/terms',
    '/help',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : 0.7,
  }))
}

