export const Spacing = {
  // Base spacing unit (4px)
  unit: 4,

  // Common spacing values
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 20,   // 20px
  '2xl': 24, // 24px
  '3xl': 32, // 32px
  '4xl': 48, // 48px
  '5xl': 64, // 64px

  // Semantic spacing
  padding: {
    screen: 16,      // Standard screen padding
    card: 16,        // Card internal padding
    button: 12,      // Button padding
    input: 12,       // Input field padding
    modal: 20,       // Modal padding
  },

  margin: {
    section: 24,     // Between major sections
    element: 16,     // Between related elements
    component: 8,    // Between small components
    text: 4,         // Between text elements
  },

  // Border radius
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,      // For circular elements
  },

  // Icon sizes
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },

  // Component heights
  height: {
    button: 48,      // Standard button height
    input: 48,       // Input field height
    tabBar: 80,      // Bottom tab bar height
    header: 56,      // Header height
    card: 120,       // Standard card height
  },
} as const;

export type SpacingKey = keyof typeof Spacing;