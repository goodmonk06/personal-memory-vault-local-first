import './globals.css'

export const metadata = {
  title: 'Memory Vault',
  description: 'Local-first personal memory vault',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
