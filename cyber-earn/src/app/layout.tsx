import React from 'react'

export const metadata = {
  title: 'CyberEarn',
  description: 'CyberEarn platforması',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  )
}