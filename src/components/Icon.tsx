/** Inline stroke icons (same drawing language as the design-system preview sprite). Decorative unless `label` is given. */
const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const PATHS = {
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </>
  ),
  chev: <path d="m6 9 6 6 6-6" {...round} />,
  chevLeft: <path d="m15 6-6 6 6 6" {...round} />,
  chevRight: <path d="m9 6 6 6-6 6" {...round} />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" {...round} />,
  check: <path d="m5 12 5 5 9-10" {...round} />,
  x: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  minus: <path d="M5 12h14" strokeLinecap="round" />,
  share: <path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" {...round} />,
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" strokeLinejoin="round" />
      <circle cx="7.5" cy="8.5" r="1.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />,
  bookmark: <path d="M6 4h12v16l-6-4-6 4V4Z" strokeLinejoin="round" />,
  message: <path d="M4 5h16v11H9l-5 4V5Z" strokeLinejoin="round" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 19c1.2-3.3 3.6-5 6.5-5s5.3 1.7 6.5 5" strokeLinecap="round" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c1.6.7 2.8 2.2 3.5 4.6" strokeLinecap="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />
    </>
  ),
  flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" {...round} />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" {...round} />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5-9 9" {...round} />
    </>
  ),
  text: <path d="M5 6h14M12 6v13M9 19h6" strokeLinecap="round" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" {...round} />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" {...round} />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" {...round} />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5h6v2M3 12h18" {...round} />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" {...round} />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...round} />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.5 5.8 3.5 9s-1 6.2-3.5 9c-2.5-2.8-3.5-5.8-3.5-9s1-6.2 3.5-9Z" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" {...round} />
    </>
  ),
  send: <path d="m4 12 16-8-6 16-2-7-8-1Z" strokeLinejoin="round" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </>
  ),
  logout: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" {...round} />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />,
  eyeOff: <path d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3.2 3.8M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a9 9 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-2-.4-1.2.3-2 1.5-2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" strokeLinejoin="round" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V4H4v12h4" strokeLinejoin="round" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" strokeLinecap="round" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.2.9-4.5 4.3 1 6.2L12 17l-5.5 3 1-6.2L3 9.5l6.2-.9L12 3Z" strokeLinejoin="round" />,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" strokeLinecap="round" />,
  drag: (
    <>
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy={y} r="1.2" fill="currentColor" stroke="none" />
        </g>
      ))}
    </>
  ),
  arrowUp: <path d="M12 19V5m-6 6 6-6 6 6" {...round} />,
  arrowDown: <path d="M12 5v14m-6-6 6 6 6-6" {...round} />,
  device: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </>
  ),
  dollar: <path d="M12 3v18M16.5 7.5C16 6 14.3 5 12 5 9.5 5 8 6.3 8 8c0 4 8.5 2.5 8.5 7 0 1.8-1.7 3-4.5 3-2.4 0-4.2-1-4.8-2.7" {...round} />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size, strokeWidth = 1.75, className, label }: { name: IconName; size?: number; strokeWidth?: number; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
