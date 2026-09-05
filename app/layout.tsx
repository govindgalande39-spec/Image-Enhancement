export const metadata = {
  title: 'Image Enhancement',
  description: 'A Next.js App Router example'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
