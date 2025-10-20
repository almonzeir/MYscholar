import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const Activity = (props: IconProps) => (
  <IconBase {...props}>
    <polyline points="3 12 8.5 7 12 13 16 9 21 12" />
  </IconBase>
)

export const AlertTriangle = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 3.5 3.5 19h17L12 3.5z" />
    <line x1="12" x2="12" y1="9.5" y2="13.5" />
    <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
  </IconBase>
)

export const CheckCircle = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8.5 12.5 11 15 16 9.5" />
  </IconBase>
)

export const Clock = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 16 14" />
  </IconBase>
)

export const Database = (props: IconProps) => (
  <IconBase {...props}>
    <ellipse cx="12" cy="6.5" rx="7" ry="3.5" />
    <path d="M5 6.5v5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-5" />
    <path d="M5 16v1c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-1" />
  </IconBase>
)

export const RefreshCw = (props: IconProps) => (
  <IconBase {...props}>
    <polyline points="21 5 21 11 15 11" />
    <path d="M21 11a9 9 0 1 0 2.6 6.4" />
    <polyline points="3 19 3 13 9 13" />
    <path d="M3 13a9 9 0 0 1-2.6-6.4" />
  </IconBase>
)

export const TrendingUp = (props: IconProps) => (
  <IconBase {...props}>
    <polyline points="3 17 10 10 14 14 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </IconBase>
)

export const Zap = (props: IconProps) => (
  <IconBase {...props}>
    <polyline points="13 2 5 14 11 14 11 22 19 10 13 10 13 2" />
  </IconBase>
)

export const BarChart3 = (props: IconProps) => (
  <IconBase {...props}>
    <line x1="5" x2="5" y1="11" y2="21" />
    <line x1="12" x2="12" y1="3" y2="21" />
    <line x1="19" x2="19" y1="7" y2="21" />
  </IconBase>
)

export const Settings = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M19.4 15a1.8 1.8 0 0 0 .3 1.9l.1.1a1.5 1.5 0 0 1-2.2 2.2l-.1-.1a1.8 1.8 0 0 0-1.9-.3 1.8 1.8 0 0 0-1 1.6V21a1.5 1.5 0 0 1-3 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-1.9.3l-.1.1a1.5 1.5 0 0 1-2.2-2.2l.1-.1a1.8 1.8 0 0 0 .3-1.9 1.8 1.8 0 0 0-1.6-1H3a1.5 1.5 0 0 1 0-3h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-1.9l-.1-.1a1.5 1.5 0 0 1 2.2-2.2l.1.1a1.8 1.8 0 0 0 1.9.3 1.8 1.8 0 0 0 1-1.6V3a1.5 1.5 0 0 1 3 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 1.9-.3l.1-.1a1.5 1.5 0 0 1 2.2 2.2l-.1.1a1.8 1.8 0 0 0-.3 1.9 1.8 1.8 0 0 0 1.6 1H21a1.5 1.5 0 0 1 0 3h-.1a1.8 1.8 0 0 0-1.6 1z" />
  </IconBase>
)

export type { IconProps }
