/**
 * Spacing constants for consistent padding and margins
 * Based on design system requirements
 * xs: 4px, sm: 6px, md: 12px, lg: 18px, xl: 26px, 2xl: 34px
 */
export const SPACING = {
  xs: "4px",
  sm: "6px",
  md: "12px",
  lg: "18px",
  xl: "26px",
  "2xl": "34px",
} as const;

/**
 * Common spacing values for components
 */
export const COMMON_SPACING = {
  pagePadding: SPACING.md, // 12px - default for md and above
  cardPadding: SPACING.lg, // 18px
  sectionGap: SPACING.xl, // 26px
  itemGap: SPACING.md, // 12px
  smallGap: SPACING.sm, // 6px
  tinyGap: SPACING.xs, // 4px
} as const;

/**
 * Get responsive padding based on screen breakpoints
 * Returns appropriate padding size for xs, sm, md, lg, xl, 2xl
 */
export const getResponsivePadding = (
  screens: Record<string, boolean>,
): string => {
  if (screens["2xl"]) return SPACING["2xl"]; // 34px
  if (screens.xl) return SPACING.xl; // 26px
  if (screens.lg) return SPACING.lg; // 18px
  if (screens.md) return SPACING.md; // 12px
  if (screens.sm) return SPACING.sm; // 6px
  return SPACING.xs; // 4px (default for xs)
};

export type SpacingSize = keyof typeof SPACING;
