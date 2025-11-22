'use client'

import { SettingsLayout } from '@/components/settings/SettingsLayout'

export default function SettingsLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SettingsLayout>{children}</SettingsLayout>
}

