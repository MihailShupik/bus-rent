import React from "react";

export type IconProps = { size?: number; color?: string; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth = 1.8) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* ------------------------------- Brand ------------------------------- */
export const IconBus = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" />
    <path d="M4 11h16" />
    <path d="M8 4v7M16 4v7" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
    <path d="M6 20h2M16 20h2" />
  </svg>
);

export const IconMinibus = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M3 15V9a2 2 0 0 1 2-2l9-3h4a3 3 0 0 1 3 3v8" />
    <path d="M3 12h18" />
    <circle cx="7" cy="17" r="1.8" />
    <circle cx="17" cy="17" r="1.8" />
  </svg>
);

export const IconSeat = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M6 4v9a3 3 0 0 0 3 3h6" />
    <path d="M15 16v4M9 20h10" />
    <path d="M6 4h4" />
  </svg>
);

export const IconRoute = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
  </svg>
);

export const IconClock = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconUsers = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
    <circle cx="9.5" cy="8" r="3.2" />
    <path d="M21 19v-1a4 4 0 0 0-3-3.87" />
    <path d="M16 5.13a4 4 0 0 1 0 5.74" />
  </svg>
);

export const IconSteering = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 9.6V3M9.9 13.2l-5.6 3.2M14.1 13.2l5.6 3.2" />
  </svg>
);

export const IconLuggage = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="5" y="7" width="14" height="12" rx="2" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M12 11v4" />
  </svg>
);

export const IconShield = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconWorld = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
);

export const IconWallet = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1.2" />
  </svg>
);

export const IconCalendar = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconPlane = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M10 20l2-6 8-8a2 2 0 0 0-3-3l-8 8-6 2 2 1 1 2 2-1z" />
  </svg>
);

export const IconBriefcase = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
  </svg>
);

export const IconMapPin = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 22s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="11" r="2.6" />
  </svg>
);

export const IconStar = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const IconCheck = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2.4)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconArrowRight = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconPhone = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconMail = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

export const IconSend = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const IconMenu = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const IconClose = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

export const IconPlus = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2.2)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconTrash = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const IconEdit = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

export const IconImage = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const IconChevronUp = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <polyline points="6 15 12 9 18 15" />
  </svg>
);
export const IconChevronDown = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconGrid = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const IconLayers = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export const IconInbox = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const IconSettings = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconLogout = ({ size = 18, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconTrend = ({ size = 20, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth || 2)}>
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </svg>
);

export const IconWifi = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />
  </svg>
);

export const IconSnow = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 2v20M4 7l16 10M20 7 4 17M12 6l3-2M12 6 9 4M12 18l3 2M12 18l-3 2" />
  </svg>
);

export const IconMusic = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M9 18V5l10-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="16" cy="16" r="3" />
  </svg>
);

export const IconLeaf = ({ size = 24, strokeWidth }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 11-3 16-9 16z" />
    <path d="M4 20c4-4 7-6 12-8" />
  </svg>
);

/* --------------------------- Viber / WhatsApp --------------------------- */
export const IconViber = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#7360f2">
    <path d="M12 2C6.9 2 2.8 5.6 2.8 10.1c0 2.4 1.2 4.6 3.2 6.1v3.9l3.6-2a10.6 10.6 0 0 0 2.4.3c5.1 0 9.2-3.6 9.2-8.1S17.1 2 12 2z" />
    <path d="M9 7.5c.5 0 .8.3 1 .7l.5 1.3c.1.3 0 .6-.2.8l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.6c.2-.2.5-.3.8-.2l1.3.5c.4.2.7.5.7 1 0 1-.9 1.7-1.9 1.7-2.9 0-5.3-2.4-5.3-5.3 0-1 .7-1.9 1.6-1.9z" fill="#fff" />
  </svg>
);

export const IconWhatsApp = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25d366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ------------------------- Icon registry (by name) ------------------------- */
export const ICON_REGISTRY: Record<string, (p: IconProps) => React.ReactElement> = {
  bus: IconBus,
  minibus: IconMinibus,
  seat: IconSeat,
  route: IconRoute,
  clock: IconClock,
  users: IconUsers,
  steering: IconSteering,
  luggage: IconLuggage,
  shield: IconShield,
  world: IconWorld,
  wallet: IconWallet,
  calendar: IconCalendar,
  plane: IconPlane,
  briefcase: IconBriefcase,
  mappin: IconMapPin,
  star: IconStar,
  check: IconCheck,
  arrow: IconArrowRight,
  phone: IconPhone,
  mail: IconMail,
  send: IconSend,
  wifi: IconWifi,
  snow: IconSnow,
  music: IconMusic,
  leaf: IconLeaf,
  layers: IconLayers,
  inbox: IconInbox,
  settings: IconSettings,
  trend: IconTrend,
};

export const ICON_OPTIONS = Object.keys(ICON_REGISTRY);

export function Icon({ name, size = 24, color, strokeWidth }: IconProps & { name: string }) {
  const Cmp = ICON_REGISTRY[name] || IconCheck;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
