type IconProps = { className?: string };

const base = "none";
const common = { viewBox: "0 0 24 24", fill: base, "aria-hidden": true } as const;
const strokeProps = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function IconBrowser({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" {...strokeProps} />
      <path d="M3 8.5h18" {...strokeProps} />
      <path d="M6.5 6.5h.01M9 6.5h.01" {...strokeProps} />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="8.5" {...strokeProps} />
      <path d="M12 7.5V12l3 2" {...strokeProps} />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="9" cy="9" r="3" {...strokeProps} />
      <path d="M3.5 19c.7-3 3-4.8 5.5-4.8s4.8 1.8 5.5 4.8" {...strokeProps} />
      <circle cx="17" cy="8.5" r="2.3" {...strokeProps} />
      <path d="M15.8 14.5c2.1.4 3.7 2 4.2 4.2" {...strokeProps} />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5" {...strokeProps} />
      <path d="M17.5 3.5v3.3h-3.3M6.5 20.5v-3.3h3.3" {...strokeProps} />
    </svg>
  );
}

export function IconLink({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M9.5 14.5 14.5 9.5" {...strokeProps} />
      <path d="M11 6.5 12.6 4.9a3.8 3.8 0 0 1 5.4 5.4L16.4 12" {...strokeProps} />
      <path d="M13 17.5 11.4 19.1a3.8 3.8 0 0 1-5.4-5.4L7.6 12" {...strokeProps} />
    </svg>
  );
}

export function IconShieldCheck({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3.5 19 6v5.5c0 4.5-3 7-7 9-4-2-7-4.5-7-9V6l7-2.5Z" {...strokeProps} />
      <path d="M9 12.2l2 2 4-4.2" {...strokeProps} />
    </svg>
  );
}

export function IconChat({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 5.5h16v10H9l-3.5 3v-3H4Z" {...strokeProps} />
    </svg>
  );
}

export function IconCalendarX({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" {...strokeProps} />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" {...strokeProps} />
      <path d="M9.5 13.5l5 5m0-5-5 5" {...strokeProps} />
    </svg>
  );
}

export function IconAlert({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 4 21 19.5H3Z" {...strokeProps} />
      <path d="M12 10v4M12 16.5h.01" {...strokeProps} />
    </svg>
  );
}

export function IconChartBar({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 20V10M12 20V4M19 20v-7" {...strokeProps} />
      <path d="M3.5 20.5h17" {...strokeProps} />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" {...strokeProps} />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" {...strokeProps} />
      <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" {...strokeProps} />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M6 10.5a6 6 0 1 1 12 0c0 4 1.3 5.5 1.3 5.5H4.7S6 14.5 6 10.5Z" {...strokeProps} />
      <path d="M10 19a2 2 0 0 0 4 0" {...strokeProps} />
    </svg>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" {...strokeProps} />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" {...strokeProps} />
    </svg>
  );
}

export function IconBuilding({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" {...strokeProps} />
      <path d="M8.5 7.5h.01M12 7.5h.01M15.5 7.5h.01M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M15.5 14.5h.01" {...strokeProps} />
      <path d="M10 20.5V17h4v3.5" {...strokeProps} />
    </svg>
  );
}

export function IconCreditCard({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" {...strokeProps} />
      <path d="M3 9.5h18" {...strokeProps} />
      <path d="M6 14h4" {...strokeProps} />
    </svg>
  );
}

export function IconTag({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3.5h6a1.5 1.5 0 0 1 1.5 1.5v6L10 20.5 3.5 14 12 3.5Z" {...strokeProps} />
      <path d="M16.3 8.3h.01" {...strokeProps} />
    </svg>
  );
}
