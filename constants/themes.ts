export interface Theme {
  id: string;
  label: string;
  background: string;
  primary: string;
  secondary: string;
  text: string;
  /** Secondary/muted text (replaces ink-400/500 tones). */
  muted: string;
  /** Subtle chip/icon background (replaces ink-100). */
  subtle: string;
  /** Input/well background (replaces ink-50). */
  surface: string;
  /** Hairline borders and dividers (replaces ink-200). */
  border: string;
  /** Text/icon color placed on top of `primary` buttons and banners. */
  onPrimary: string;
}

export const THEMES: Theme[] = [
  {
    id: "default",
    label: "Lavender",
    background: "#F8F7FF",
    primary: "#9381FF",
    secondary: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    subtle: "#F1F5F9",
    surface: "#F8FAFC",
    border: "#E2E8F0",
    onPrimary: "#FFFFFF",
  },
  {
    id: "sage",
    label: "Sage",
    background: "#F7F2EB",
    primary: "#8B9A6E",
    secondary: "#FFFFFF",
    text: "#3D3D3D",
    muted: "#6B6F63",
    subtle: "#EDEFE7",
    surface: "#F4F5EF",
    border: "#DEE2D4",
    onPrimary: "#FFFFFF",
  },
  {
    id: "forest",
    label: "Forest",
    background: "#F2EFE7",
    primary: "#66A3BF",
    secondary: "#FFFFFF",
    text: "#2D3436",
    muted: "#5A6B75",
    subtle: "#ECF3F7",
    surface: "#F4F9FB",
    border: "#DCE7EE",
    onPrimary: "#FFFFFF",
  },
  {
    id: "orange",
    label: "Orange",
    background: "#FFF7F0",
    primary: "#F97316",
    secondary: "#FFFFFF",
    text: "#1F1B16",
    muted: "#7C6A5D",
    subtle: "#FDF0E4",
    surface: "#FFF9F3",
    border: "#F3E2D2",
    onPrimary: "#FFFFFF",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    background: "#2b2d42",
    primary: "#8d99ae",
    secondary: "#3D3F56",
    text: "#edf2f4",
    muted: "#A9B0C3",
    subtle: "#4A4C66",
    surface: "#35374D",
    border: "#4F5170",
    onPrimary: "#1F2233",
  },
  {
    id: "sky",
    label: "Sky",
    background: "#d9f0ff",
    primary: "#83c9f4",
    secondary: "#FFFFFF",
    text: "#1B2631",
    muted: "#51637A",
    subtle: "#E8F6FE",
    surface: "#F0F9FF",
    border: "#D6EBF7",
    onPrimary: "#16324A",
  },
  {
    id: "coral",
    label: "Coral",
    background: "#EFCFE3",
    primary: "#E27396",
    secondary: "#FFFFFF",
    text: "#3D2B3A",
    muted: "#7A5A66",
    subtle: "#FBEEF4",
    surface: "#FFF7FA",
    border: "#F3DEE8",
    onPrimary: "#FFFFFF",
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
