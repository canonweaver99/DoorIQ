import { ContactSalesFlow } from '@/components/forms/ContactSalesFlow'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Sales - DoorIQ',
  description: 'Get in touch with our sales team to learn how DoorIQ can transform your sales team performance',
}

export default function ContactSalesPage() {
  return <ContactSalesFlow />
}
