/**
 * Shared color constants for the app.
 * TODO: Replace placeholder values with final design tokens from Figma.
 */

export const Colors = {
  /** Primary brand color (dark navy/indigo used for buttons and active elements) */
  primary: '#2D2B55',
  /** White background */
  background: '#FFFFFF',
  /** Primary text color */
  text: '#1A1A2E',
  /** Secondary/description text */
  textSecondary: '#6B7280',
  /** Skip/link text color */
  accent: '#E53E3E',
  /** Inactive pagination dot */
  dotInactive: '#D1D5DB',
  /** Active pagination dot */
  dotActive: '#2D2B55',
  /** Placeholder background (for image placeholders) */
  placeholder: '#E5E7EB',
  /** Placeholder text color */
  placeholderText: '#9CA3AF',
  /** Button text on primary background */
  buttonText: '#FFFFFF',
  /** Border color for subtle outlines */
  border: '#E5E7EB',
} as const;

/**
 * Autumn/warm color palette used by the Preferences screen.
 */
export const AutumnColors = {
  /** Warm cream/ivory background */
  background: '#FFF9F1',
  /** Burnt orange / terracotta red — primary button */
  primary: '#C63F18',
  /** Dark rust — primary pressed state */
  primaryDark: '#A93418',
  /** Pale peach — selected preference chip background */
  selectedBackground: '#FFF0E7',
  /** Coral terracotta — selected preference chip border */
  selectedBorder: '#E66A46',
  /** Deep terracotta — selected preference text / icon tint */
  selectedText: '#B64224',
  /** Warm white — normal preference chip background */
  chipBackground: '#FFFCF7',
  /** Warm beige — normal preference chip border */
  chipBorder: '#E8D9C8',
  /** Dark espresso brown — main heading */
  heading: '#2B160D',
  /** Warm taupe — body/description text */
  body: '#62574B',
  /** Charcoal brown — preference label text */
  chipText: '#302A24',
  /** Muted olive green — secondary accent */
  secondaryAccent: '#5F6237',
  /** Pumpkin orange — autumn accent */
  autumnAccent: '#D87527',
  /** Warm golden amber — golden accent */
  goldenAccent: '#D89B42',
} as const;
