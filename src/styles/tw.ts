import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type StyleObject = ViewStyle & TextStyle & ImageStyle;

const PALETTE: Record<string, Record<string, string>> = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
};

const SPACING_MAP: Record<string, number> = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384,
};

const FONT_SIZES: Record<string, { fontSize: number; lineHeight: number }> = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
  '5xl': { fontSize: 48, lineHeight: 48 },
};

const parseColor = (colorName: string): string | undefined => {
  if (colorName === 'white') return '#ffffff';
  if (colorName === 'black') return '#000000';
  if (colorName === 'transparent') return 'transparent';

  // shadcn official premium fintech base tokens
  if (colorName === 'background') return '#f8fafc';
  if (colorName === 'foreground') return '#0f172a';
  if (colorName === 'card') return '#ffffff';
  if (colorName === 'card-foreground') return '#0f172a';
  if (colorName === 'popover') return '#ffffff';
  if (colorName === 'popover-foreground') return '#0f172a';
  if (colorName === 'primary') return '#4f46e5';
  if (colorName === 'primary-foreground') return '#ffffff';
  if (colorName === 'primary-dark') return '#4338ca';
  if (colorName === 'primary-light') return '#eef2ff';
  if (colorName === 'secondary') return '#f1f5f9';
  if (colorName === 'secondary-foreground') return '#0f172a';
  if (colorName === 'secondary-light') return '#ecfdf5';
  if (colorName === 'muted') return '#f8fafc';
  if (colorName === 'muted-foreground') return '#64748b';
  if (colorName === 'accent') return '#f1f5f9';
  if (colorName === 'accent-foreground') return '#0f172a';
  if (colorName === 'accent-light') return '#fef3c7';
  if (colorName === 'destructive') return '#e11d48';
  if (colorName === 'destructive-light') return '#fff1f2';
  if (colorName === 'destructive-foreground') return '#ffffff';
  if (colorName === 'border') return '#e2e8f0';
  if (colorName === 'input') return '#e2e8f0';
  if (colorName === 'ring') return '#6366f1';
  if (colorName === 'danger') return '#e11d48';
  if (colorName === 'danger-light') return '#fff1f2';
  if (colorName === 'success') return '#059669';
  if (colorName === 'success-light') return '#ecfdf5';
  if (colorName === 'success-foreground') return '#ffffff';
  if (colorName === 'warning') return '#d97706';
  if (colorName === 'warning-light') return '#fef3c7';
  if (colorName === 'warning-foreground') return '#ffffff';

  const parts = colorName.split('-');
  if (parts.length >= 2) {
    const family = parts[0];
    const shade = parts[1];
    if (PALETTE[family] && PALETTE[family][shade]) {
      return PALETTE[family][shade];
    }
  }
  return undefined;
};

const styleCache: Record<string, StyleObject> = {};

export const parseClass = (cls: string): StyleObject => {
  if (styleCache[cls]) return styleCache[cls];

  const style: StyleObject = {};

  if (cls === 'flex-1') style.flex = 1;
  else if (cls === 'flex-grow' || cls === 'grow') style.flexGrow = 1;
  else if (cls === 'flex-grow-0' || cls === 'grow-0') style.flexGrow = 0;
  else if (cls === 'flex-shrink' || cls === 'shrink') style.flexShrink = 1;
  else if (cls === 'flex-shrink-0' || cls === 'shrink-0') style.flexShrink = 0;
  else if (cls === 'flex-row') style.flexDirection = 'row';
  else if (cls === 'flex-col') style.flexDirection = 'column';
  else if (cls === 'flex-row-reverse') style.flexDirection = 'row-reverse';
  else if (cls === 'flex-col-reverse') style.flexDirection = 'column-reverse';
  else if (cls === 'flex-wrap') style.flexWrap = 'wrap';
  else if (cls === 'flex-nowrap') style.flexWrap = 'nowrap';
  else if (cls === 'items-center') style.alignItems = 'center';
  else if (cls === 'items-start') style.alignItems = 'flex-start';
  else if (cls === 'items-end') style.alignItems = 'flex-end';
  else if (cls === 'items-stretch') style.alignItems = 'stretch';
  else if (cls === 'items-baseline') style.alignItems = 'baseline';
  else if (cls === 'justify-center') style.justifyContent = 'center';
  else if (cls === 'justify-between') style.justifyContent = 'space-between';
  else if (cls === 'justify-around') style.justifyContent = 'space-around';
  else if (cls === 'justify-evenly') style.justifyContent = 'space-evenly';
  else if (cls === 'justify-start') style.justifyContent = 'flex-start';
  else if (cls === 'justify-end') style.justifyContent = 'flex-end';
  else if (cls === 'self-auto') style.alignSelf = 'auto';
  else if (cls === 'self-start') style.alignSelf = 'flex-start';
  else if (cls === 'self-end') style.alignSelf = 'flex-end';
  else if (cls === 'self-center') style.alignSelf = 'center';
  else if (cls === 'self-stretch') style.alignSelf = 'stretch';
  else if (cls === 'absolute') style.position = 'absolute';
  else if (cls === 'relative') style.position = 'relative';
  else if (cls === 'inset-0') {
    style.top = 0;
    style.left = 0;
    style.right = 0;
    style.bottom = 0;
  }
  else if (cls === 'top-0') style.top = 0;
  else if (cls === 'bottom-0') style.bottom = 0;
  else if (cls === 'left-0') style.left = 0;
  else if (cls === 'right-0') style.right = 0;
  else if (cls === 'overflow-hidden') style.overflow = 'hidden';
  else if (cls === 'overflow-visible') style.overflow = 'visible';
  else if (cls === 'w-full') style.width = '100%';
  else if (cls === 'w-screen') style.width = '100%';
  else if (cls === 'w-auto') style.width = 'auto';
  else if (cls === 'h-full') style.height = '100%';
  else if (cls === 'h-screen') style.height = '100%';
  else if (cls === 'h-auto') style.height = 'auto';
  else if (cls === 'min-h-full' || cls === 'min-h-screen') style.minHeight = '100%';
  else if (cls === 'min-w-full') style.minWidth = '100%';
  else if (cls === 'max-w-sm') style.maxWidth = 384;
  else if (cls === 'max-w-md') style.maxWidth = 448;
  else if (cls === 'max-w-lg') style.maxWidth = 512;
  else if (cls === 'max-w-xl') style.maxWidth = 576;
  else if (cls.startsWith('max-w-[') && cls.endsWith(']')) {
    const val = parseInt(cls.slice(7, -1), 10);
    if (!isNaN(val)) style.maxWidth = val;
  } else if (cls.startsWith('min-h-[') && cls.endsWith(']')) {
    const val = parseInt(cls.slice(7, -1), 10);
    if (!isNaN(val)) style.minHeight = val;
  } else if (cls.startsWith('w-[') && cls.endsWith(']')) {
    const val = parseInt(cls.slice(3, -1), 10);
    if (!isNaN(val)) style.width = val;
  } else if (cls.startsWith('h-[') && cls.endsWith(']')) {
    const val = parseInt(cls.slice(3, -1), 10);
    if (!isNaN(val)) style.height = val;
  }
  else if (cls === 'text-left') style.textAlign = 'left';
  else if (cls === 'text-center') style.textAlign = 'center';
  else if (cls === 'text-right') style.textAlign = 'right';
  else if (cls === 'text-justify') style.textAlign = 'justify';
  else if (cls === 'font-thin') style.fontWeight = '100';
  else if (cls === 'font-extralight') style.fontWeight = '200';
  else if (cls === 'font-light') style.fontWeight = '300';
  else if (cls === 'font-normal') style.fontWeight = '400';
  else if (cls === 'font-medium') style.fontWeight = '500';
  else if (cls === 'font-semibold') style.fontWeight = '600';
  else if (cls === 'font-bold') style.fontWeight = '700';
  else if (cls === 'font-extrabold') style.fontWeight = '800';
  else if (cls === 'font-black') style.fontWeight = '900';
  else if (cls === 'rounded-none') style.borderRadius = 0;
  else if (cls === 'rounded-sm') style.borderRadius = 2;
  else if (cls === 'rounded') style.borderRadius = 4;
  else if (cls === 'rounded-md') style.borderRadius = 6;
  else if (cls === 'rounded-lg') style.borderRadius = 8;
  else if (cls === 'rounded-xl') style.borderRadius = 12;
  else if (cls === 'rounded-2xl') style.borderRadius = 16;
  else if (cls === 'rounded-3xl') style.borderRadius = 24;
  else if (cls === 'rounded-full') style.borderRadius = 9999;
  else if (cls === 'border') style.borderWidth = 1;
  else if (cls === 'border-0') style.borderWidth = 0;
  else if (cls === 'border-2') style.borderWidth = 2;
  else if (cls === 'border-4') style.borderWidth = 4;
  else if (cls === 'border-t') style.borderTopWidth = 1;
  else if (cls === 'border-b') style.borderBottomWidth = 1;
  else if (cls === 'border-l') style.borderLeftWidth = 1;
  else if (cls === 'border-r') style.borderRightWidth = 1;
  else if (cls === 'border-dashed') style.borderStyle = 'dashed';
  else if (cls === 'border-dotted') style.borderStyle = 'dotted';
  else if (cls === 'border-solid') style.borderStyle = 'solid';
  else if (cls === 'shadow-sm') {
    style.shadowColor = '#000';
    style.shadowOffset = { width: 0, height: 1 };
    style.shadowOpacity = 0.05;
    style.shadowRadius = 2;
    style.elevation = 1;
  } else if (cls === 'shadow') {
    style.shadowColor = '#000';
    style.shadowOffset = { width: 0, height: 2 };
    style.shadowOpacity = 0.07;
    style.shadowRadius = 4;
    style.elevation = 2;
  } else if (cls === 'shadow-md') {
    style.shadowColor = '#000';
    style.shadowOffset = { width: 0, height: 4 };
    style.shadowOpacity = 0.1;
    style.shadowRadius = 6;
    style.elevation = 4;
  } else if (cls === 'shadow-lg') {
    style.shadowColor = '#000';
    style.shadowOffset = { width: 0, height: 8 };
    style.shadowOpacity = 0.12;
    style.shadowRadius = 12;
    style.elevation = 6;
  } else if (cls === 'shadow-xl') {
    style.shadowColor = '#000';
    style.shadowOffset = { width: 0, height: 12 };
    style.shadowOpacity = 0.15;
    style.shadowRadius = 16;
    style.elevation = 8;
  } else if (cls === 'shadow-none') {
    style.shadowColor = 'transparent';
    style.shadowOpacity = 0;
    style.elevation = 0;
  } else if (cls.startsWith('bg-')) {
    const col = parseColor(cls.replace('bg-', ''));
    if (col) style.backgroundColor = col;
  } else if (cls.startsWith('text-')) {
    const txtKey = cls.replace('text-', '');
    if (FONT_SIZES[txtKey]) {
      style.fontSize = FONT_SIZES[txtKey].fontSize;
      style.lineHeight = FONT_SIZES[txtKey].lineHeight;
    } else {
      const col = parseColor(txtKey);
      if (col) style.color = col;
    }
  } else if (cls.startsWith('border-')) {
    const col = parseColor(cls.replace('border-', ''));
    if (col) style.borderColor = col;
  } else if (cls.startsWith('p-')) {
    const val = SPACING_MAP[cls.replace('p-', '')];
    if (val !== undefined) style.padding = val;
  } else if (cls.startsWith('px-')) {
    const val = SPACING_MAP[cls.replace('px-', '')];
    if (val !== undefined) style.paddingHorizontal = val;
  } else if (cls.startsWith('py-')) {
    const val = SPACING_MAP[cls.replace('py-', '')];
    if (val !== undefined) style.paddingVertical = val;
  } else if (cls.startsWith('pt-')) {
    const val = SPACING_MAP[cls.replace('pt-', '')];
    if (val !== undefined) style.paddingTop = val;
  } else if (cls.startsWith('pb-')) {
    const val = SPACING_MAP[cls.replace('pb-', '')];
    if (val !== undefined) style.paddingBottom = val;
  } else if (cls.startsWith('pl-')) {
    const val = SPACING_MAP[cls.replace('pl-', '')];
    if (val !== undefined) style.paddingLeft = val;
  } else if (cls.startsWith('pr-')) {
    const val = SPACING_MAP[cls.replace('pr-', '')];
    if (val !== undefined) style.paddingRight = val;
  } else if (cls.startsWith('m-')) {
    const val = SPACING_MAP[cls.replace('m-', '')];
    if (val !== undefined) style.margin = val;
  } else if (cls.startsWith('mx-')) {
    const val = SPACING_MAP[cls.replace('mx-', '')];
    if (val !== undefined) style.marginHorizontal = val;
  } else if (cls.startsWith('my-')) {
    const val = SPACING_MAP[cls.replace('my-', '')];
    if (val !== undefined) style.marginVertical = val;
  } else if (cls.startsWith('mt-')) {
    const val = SPACING_MAP[cls.replace('mt-', '')];
    if (val !== undefined) style.marginTop = val;
  } else if (cls.startsWith('mb-')) {
    const val = SPACING_MAP[cls.replace('mb-', '')];
    if (val !== undefined) style.marginBottom = val;
  } else if (cls.startsWith('ml-')) {
    const val = SPACING_MAP[cls.replace('ml-', '')];
    if (val !== undefined) style.marginLeft = val;
  } else if (cls.startsWith('mr-')) {
    const val = SPACING_MAP[cls.replace('mr-', '')];
    if (val !== undefined) style.marginRight = val;
  } else if (cls.startsWith('gap-')) {
    const val = SPACING_MAP[cls.replace('gap-', '')];
    if (val !== undefined) style.gap = val;
  } else if (cls.startsWith('w-')) {
    const val = SPACING_MAP[cls.replace('w-', '')];
    if (val !== undefined) style.width = val;
  } else if (cls.startsWith('h-')) {
    const val = SPACING_MAP[cls.replace('h-', '')];
    if (val !== undefined) style.height = val;
  } else if (cls.startsWith('opacity-')) {
    const opVal = parseInt(cls.replace('opacity-', ''), 10);
    if (!isNaN(opVal)) style.opacity = opVal / 100;
  }

  styleCache[cls] = style;
  return style;
};

export function tw(strings: TemplateStringsArray | string, ...values: any[]): StyleObject;
export function tw(...args: (string | boolean | undefined | null | StyleObject)[]): StyleObject;
export function tw(...args: any[]): StyleObject {
  let classString = '';

  if (Array.isArray(args[0]) && 'raw' in args[0]) {
    const strings = args[0] as TemplateStringsArray;
    const values = args.slice(1);
    classString = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
  } else {
    classString = args
      .filter((a) => typeof a === 'string')
      .join(' ');
  }

  const extraStyles = args.filter((a) => a && typeof a === 'object' && !Array.isArray(a) && !('raw' in a));

  const classes = classString.trim().split(/\s+/).filter(Boolean);
  const combined: StyleObject = {};

  for (const c of classes) {
    Object.assign(combined, parseClass(c));
  }

  for (const s of extraStyles) {
    Object.assign(combined, s);
  }

  return combined;
}

tw.style = (...args: any[]) => tw(...args);

export default tw;
