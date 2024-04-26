import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../../.next/static/css/app/page.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quill Todo',
  description: 'A work in progress...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className='h-full w-full'>
      <head>
          <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@300;600&family=Dongle:wght@300;400&family=Jost:wght@300;400;600;700&family=Kanit:wght@200;300&family=M+PLUS+Rounded+1c:wght@400;500;700;800&family=Merriweather+Sans:wght@500;700;800&family=Quicksand:wght@400;500;600&family=Secular+One&display=swap"
            rel="stylesheet"
          />
          
          {/* Font awesome */}
          <script src="https://kit.fontawesome.com/fd95a77a02.js" crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.className} bg-red`}>{children}</body>
    </html>
  )
}
