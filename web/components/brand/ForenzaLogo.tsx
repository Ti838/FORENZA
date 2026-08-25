'use client'

import Image from 'next/image'
import Link from 'next/link'

interface ForenzaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showTagline?: boolean
  linkToDashboard?: boolean
  className?: string
}

export function ForenzaLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  linkToDashboard = false,
  className = '',
}: ForenzaLogoProps) {
  const sizeMap = {
    sm: { img: 28, text: 'text-base font-bold tracking-tight', tag: 'text-[9px]' },
    md: { img: 36, text: 'text-lg font-bold tracking-tight', tag: 'text-[10px]' },
    lg: { img: 48, text: 'text-2xl font-bold tracking-tight', tag: 'text-xs' },
    xl: { img: 72, text: 'text-3xl font-extrabold tracking-tight', tag: 'text-sm' },
  }

  const currentSize = sizeMap[size]

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official FORENZA Brand Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105"
        style={{
          width: currentSize.img,
          height: currentSize.img,
          boxShadow: '0 0 20px rgba(37, 99, 235, 0.25)',
        }}
      >
        <Image
          src="/logo.png"
          alt="FORENZA Official Forensic Security Logo"
          width={currentSize.img}
          height={currentSize.img}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`${currentSize.text} tracking-wider font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-white dark:via-blue-100 dark:to-indigo-200 bg-clip-text text-transparent`}
              style={{ letterSpacing: '0.08em' }}
            >
              FORENZA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          {showTagline && (
            <span
              className={`${currentSize.tag} text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5`}
            >
              Trusted Evidence. True Justice.
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (linkToDashboard) {
    return (
      <Link href="/" className="group inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
