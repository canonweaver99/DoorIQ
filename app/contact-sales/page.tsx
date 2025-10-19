import { ContactSalesForm } from '@/components/forms/ContactSalesForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Sales - DoorIQ',
  description: 'Get in touch with our sales team to learn how DoorIQ can transform your sales team performance',
}

export default function ContactSalesPage() {
  return <ContactSalesForm />
}
