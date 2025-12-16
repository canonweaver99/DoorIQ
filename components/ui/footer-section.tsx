'use client';

// Footer component with social media links
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Facebook } from 'lucide-react';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSectionType {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSectionType[] = [
  {
    label: 'Product',
    links: [
      { title: 'Features', href: '/features' },
      // Pricing page hidden from navigation but accessible via direct URL
      // { title: 'Pricing', href: '/pricing' },
      { title: 'Testimonials', href: '/testimonials' },
      // Archived: { title: 'Documentation', href: '/documentation' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'FAQs', href: '/faqs' },
      { title: 'About Us', href: '/about' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Services', href: '/terms' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { title: 'Contact Us', href: 'mailto:contact@dooriq.ai?subject=Support%20Request&body=Hi%20DoorIQ%20Team,%0D%0A%0D%0AI%20need%20help%20with:%0D%0A%0D%0A' },
      { title: 'Help', href: '/help' },
      { title: 'Become an Affiliate', href: '/affiliate/program' },
    ],
  },
  {
    label: 'Follow Us',
    links: [
      { title: 'Instagram', href: 'https://www.instagram.com/dooriq.ai/', icon: Instagram },
      { title: 'Facebook', href: 'https://www.facebook.com/dooriq.ai', icon: Facebook },
    ],
  },
];

export function Footer() {
  return (
    <footer className="md:rounded-t-6xl relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-white/10 bg-[#0a0a0a] px-6 py-12 lg:py-16">
      <div className="bg-white/10 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 lg:grid-cols-5 lg:gap-12">
        {/* Logo and Copyright - Left Side */}
        <AnimatedContainer className="space-y-4 lg:col-span-1">
          <Link href="/" className="inline-block">
            <Image 
              src="/dooriqlogo.png" 
              alt="DoorIQ Logo" 
              width={1280} 
              height={214} 
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-white/70 text-sm font-light leading-relaxed">
            © {new Date().getFullYear()} DoorIQ. All rights reserved.
          </p>
        </AnimatedContainer>

        {/* Navigation Columns - Right Side */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:col-span-4 lg:gap-12">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-sm text-white/70 font-space uppercase tracking-wider mb-4 font-semibold">{section.label}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-white/70 font-space text-sm hover:text-white/90 inline-flex items-center gap-2 transition-colors duration-200"
                      >
                        {link.icon && <link.icon className="w-4 h-4" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children as any;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


