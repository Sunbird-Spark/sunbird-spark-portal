import type { CardTheme } from "@/services/workspace/contentDisplayConfig";

/* ─── SVG Pattern Components (light variants) ─── */

export const WavePatternSVG = ({ theme }: { theme: CardTheme }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id={`${theme.id}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.bgLight} />
                <stop offset="100%" stopColor={theme.bgLighter} />
            </linearGradient>
            <radialGradient id={`${theme.id}-g1`} cx="78%" cy="18%" r="55%">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${theme.id}-g2`} cx="12%" cy="85%" r="42%">
                <stop offset="0%" stopColor={theme.accentDark} stopOpacity="0.12" />
                <stop offset="100%" stopColor={theme.accentDark} stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Light gradient base */}
        <rect width="400" height="225" fill={`url(#${theme.id}-bg)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g1)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g2)`} />
        {/* Large soft arc — top right */}
        <circle
            cx="375"
            cy="-15"
            r="155"
            fill="none"
            stroke={theme.accent}
            strokeWidth="45"
            strokeOpacity="0.08"
        />
        <circle cx="375" cy="-15" r="100" fill={theme.accent} fillOpacity="0.06" />
        {/* Flowing wave forms at bottom */}
        <path
            d="M0 175 C70 148 150 192 240 162 C318 135 362 178 400 155 L400 225 L0 225Z"
            fill={theme.accent}
            fillOpacity="0.12"
        />
        <path
            d="M0 200 C90 185 200 215 310 192 C360 182 388 208 400 200 L400 225 L0 225Z"
            fill={theme.accentDark}
            fillOpacity="0.07"
        />
        {/* Constellation dots — top left */}
        <circle cx="38" cy="38" r="3.5" fill={theme.accentDark} fillOpacity="0.3" />
        <circle cx="54" cy="28" r="2" fill={theme.accent} fillOpacity="0.25" />
        <circle cx="25" cy="52" r="2.5" fill={theme.accent} fillOpacity="0.3" />
        <circle cx="62" cy="46" r="1.5" fill={theme.accentDark} fillOpacity="0.2" />
        {/* Subtle diagonal line */}
        <line
            x1="165"
            y1="0"
            x2="400"
            y2="195"
            stroke={theme.accent}
            strokeWidth="1"
            strokeOpacity="0.08"
        />
    </svg>
);

export const BlobPatternSVG = ({ theme }: { theme: CardTheme }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id={`${theme.id}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.bgLight} />
                <stop offset="100%" stopColor={theme.bgLighter} />
            </linearGradient>
            <radialGradient id={`${theme.id}-g1`} cx="18%" cy="78%" r="58%">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${theme.id}-g2`} cx="82%" cy="12%" r="45%">
                <stop offset="0%" stopColor={theme.accentDark} stopOpacity="0.15" />
                <stop offset="100%" stopColor={theme.accentDark} stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Light gradient base */}
        <rect width="400" height="225" fill={`url(#${theme.id}-bg)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g1)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g2)`} />
        {/* Organic sweeping blob — bottom left */}
        <path
            d="M-50 190 Q50 120 130 180 Q190 230 150 225 L-50 225Z"
            fill={theme.accent}
            fillOpacity="0.15"
        />
        {/* Angular geometric wedge — top right */}
        <path d="M290 0 L400 0 L400 95 Z" fill={theme.accent} fillOpacity="0.1" />
        <path d="M340 0 L400 0 L400 45 Z" fill={theme.accentDark} fillOpacity="0.07" />
        {/* Stroke ring — bottom left */}
        <circle
            cx="75"
            cy="208"
            r="85"
            fill="none"
            stroke={theme.accent}
            strokeWidth="28"
            strokeOpacity="0.08"
        />
        {/* Accent dots — top right */}
        <circle cx="348" cy="28" r="3" fill={theme.accentDark} fillOpacity="0.3" />
        <circle cx="362" cy="42" r="2" fill={theme.accent} fillOpacity="0.25" />
        <circle cx="335" cy="44" r="1.5" fill={theme.accent} fillOpacity="0.28" />
        <circle cx="370" cy="28" r="1.5" fill={theme.accentDark} fillOpacity="0.18" />
    </svg>
);

export const OrbPatternSVG = ({ theme }: { theme: CardTheme }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id={`${theme.id}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.bgLight} />
                <stop offset="100%" stopColor={theme.bgLighter} />
            </linearGradient>
            <radialGradient id={`${theme.id}-g1`} cx="75%" cy="25%" r="55%">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.22" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${theme.id}-g2`} cx="18%" cy="72%" r="45%">
                <stop offset="0%" stopColor={theme.accentDark} stopOpacity="0.18" />
                <stop offset="100%" stopColor={theme.accentDark} stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Light gradient base */}
        <rect width="400" height="225" fill={`url(#${theme.id}-bg)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g1)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g2)`} />
        {/* Overlapping translucent orbs */}
        <circle cx="295" cy="55" r="115" fill={theme.accent} fillOpacity="0.1" />
        <circle cx="325" cy="90" r="82" fill={theme.accentDark} fillOpacity="0.07" />
        {/* Thin arc outline */}
        <circle
            cx="295"
            cy="55"
            r="135"
            fill="none"
            stroke={theme.accent}
            strokeWidth="1"
            strokeOpacity="0.15"
        />
        {/* Gentle wave — bottom */}
        <path
            d="M0 182 Q100 152 200 175 Q300 198 400 170 L400 225 L0 225Z"
            fill={theme.accent}
            fillOpacity="0.1"
        />
        {/* Dot grid — bottom left */}
        <circle cx="38" cy="178" r="2" fill={theme.accentDark} fillOpacity="0.3" />
        <circle cx="53" cy="190" r="2" fill={theme.accent} fillOpacity="0.25" />
        <circle cx="68" cy="178" r="2" fill={theme.accentDark} fillOpacity="0.3" />
        <circle cx="38" cy="198" r="1.5" fill={theme.accent} fillOpacity="0.2" />
        <circle cx="53" cy="206" r="1.5" fill={theme.accent} fillOpacity="0.18" />
        <circle cx="68" cy="198" r="1.5" fill={theme.accent} fillOpacity="0.2" />
    </svg>
);

export const DiamondPatternSVG = ({ theme }: { theme: CardTheme }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id={`${theme.id}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.bgLight} />
                <stop offset="100%" stopColor={theme.bgLighter} />
            </linearGradient>
            <radialGradient id={`${theme.id}-g1`} cx="14%" cy="22%" r="50%">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.22" />
                <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${theme.id}-g2`} cx="88%" cy="82%" r="48%">
                <stop offset="0%" stopColor={theme.accentDark} stopOpacity="0.15" />
                <stop offset="100%" stopColor={theme.accentDark} stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Light gradient base */}
        <rect width="400" height="225" fill={`url(#${theme.id}-bg)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g1)`} />
        <rect width="400" height="225" fill={`url(#${theme.id}-g2)`} />
        {/* Nested diamond shapes — right side */}
        <path d="M335 -25 L420 90 L335 205 L250 90Z" fill={theme.accent} fillOpacity="0.1" />
        <path d="M355 15 L405 90 L355 165 L305 90Z" fill={theme.accentDark} fillOpacity="0.07" />
        {/* Curved blob — bottom left */}
        <path
            d="M0 145 Q75 112 118 158 Q168 214 55 225 L0 225Z"
            fill={theme.accent}
            fillOpacity="0.12"
        />
        {/* Horizontal rule lines — organized, layered feel */}
        <line
            x1="0" y1="78" x2="125" y2="78"
            stroke={theme.accent} strokeWidth="0.75" strokeOpacity="0.2"
        />
        <line
            x1="0" y1="102" x2="85" y2="102"
            stroke={theme.accent} strokeWidth="0.75" strokeOpacity="0.15"
        />
        <line
            x1="0" y1="126" x2="55" y2="126"
            stroke={theme.accent} strokeWidth="0.75" strokeOpacity="0.12"
        />
        {/* Accent dots — bottom right */}
        <circle cx="355" cy="186" r="3" fill={theme.accentDark} fillOpacity="0.25" />
        <circle cx="370" cy="197" r="2" fill={theme.accent} fillOpacity="0.2" />
        <circle cx="355" cy="208" r="2.5" fill={theme.accent} fillOpacity="0.22" />
        <circle cx="382" cy="186" r="1.5" fill={theme.accentDark} fillOpacity="0.15" />
    </svg>
);
