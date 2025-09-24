import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
