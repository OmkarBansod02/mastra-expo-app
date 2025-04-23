// Theme colors similar to ChatGPT's dark theme
export const colors = {
  // Main theme colors
  background: '#343541',        // Main background
  secondaryBackground: '#444654', // Secondary/alternating background
  inputBackground: '#40414F',   // Input field background
  primary: '#128C7E',           // Primary color for WhatsApp-style header (WhatsApp green)
  
  // Text colors
  primaryText: '#FFFFFF',       // Main text color
  secondaryText: '#ECECF1',     // Secondary text color
  tertiaryText: '#9CA3AF',      // Less important text
  
  // UI element colors
  accent: '#10A37F',            // Primary accent (buttons, highlights) - ChatGPT green
  accentHover: '#1A7F64',       // Accent hover state
  border: '#4D4D4F',            // Border color
  divider: '#4D4D4F',           // Dividers and separators
  
  // Message bubble colors
  userBubble: '#343541',        // User message bubble
  assistantBubble: '#444654',   // Assistant message bubble
  
  // Status colors
  error: '#EF4444',             // Error messages
  warning: '#F59E0B',           // Warnings
  success: '#10A37F',           // Success messages
  
  // Misc
  overlay: 'rgba(52, 53, 65, 0.7)', // Overlay for modals
  loadingIndicator: '#10A37F',   // Loading spinner color
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Combined theme object
export const theme = {
  colors,
  typography,
  spacing,
};

export default theme;
