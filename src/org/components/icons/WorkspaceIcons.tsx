import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  }
}

export function WorkspaceGaugeIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M4.5 14.5a7.5 7.5 0 1 1 15 0" />
      <path d="M12 14.5l3.4-3.9" />
      <circle cx="12" cy="14.5" r="1.4" />
    </svg>
  )
}

export function WorkspaceEventsIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M5 9.8 6.6 5.4h10.8L19 9.8" />
      <path d="M4 9.8a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.2a2 2 0 0 0-2-2z" />
      <path d="m9 14.2 2 2 4-4.4" />
    </svg>
  )
}

export function WorkspaceTeamIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <circle cx="9" cy="8.2" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.9" />
      <path d="M16.6 13.7a5.5 5.5 0 0 1 3.9 5.3" />
    </svg>
  )
}

export function WorkspaceRolesIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M12 3 19 5.6v5.3c0 4.3-3 7.6-7 9.1-4-1.5-7-4.8-7-9.1V5.6z" />
      <path d="m9 11.8 2.2 2.2 3.8-4.3" />
    </svg>
  )
}

export function WorkspaceBillingIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 15h4.5" />
    </svg>
  )
}

export function WorkspaceReportsIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M5.5 20V9" />
      <path d="M12 20V4" />
      <path d="M18.5 20v-6" />
      <path d="M3 20h18" />
    </svg>
  )
}

export function WorkspaceTemplatesIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M4 9.5h16" />
      <path d="M10.5 9.5V20" />
    </svg>
  )
}

export function WorkspaceArchiveIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="4.5" rx="1.2" />
      <path d="M5.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5" />
      <path d="M10 13h4" />
    </svg>
  )
}

export function WorkspaceSettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <path d="M10 5v4" />
      <path d="M15 10v4" />
      <path d="M9 15v4" />
    </svg>
  )
}

export function WorkspaceAuditIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="m9.5 12.2 2 2 3.5-3.6" />
    </svg>
  )
}

export function WorkspaceHelpIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.2a2.5 2.5 0 1 1 3.9 2.1c-.9.6-1.4 1.2-1.4 2.4" />
      <circle cx="12" cy="16.6" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WorkspaceAssistedElectionIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M9 12h6" />
      <path d="M12 9v6" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18" />
      <path d="M9 3v6" />
    </svg>
  )
}
