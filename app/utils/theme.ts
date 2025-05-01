import { DefaultTheme } from 'react-native-paper';

// Spacing values
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography values
const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeight: {
    normal: 'normal' as const,
    medium: '500' as const,
    bold: 'bold' as const,
  },
};

// Colors
const colors = {
  // Main theme colors
  background: '#343541',        // Main background
  secondaryBackground: '#444654', // Secondary/alternating background
  inputBackground: '#40414F',   // Input field background
  primary: '#128C7E',           // Primary color for WhatsApp-style header (WhatsApp green)
  
  // Text colors
  primaryText: '#FFFFFF',       // Main text color
  secondaryText: '#ECECF1',     // Secondary text color
  tertiaryText: '#9CA3AF',      // Less important text
  userText: '#FFFFFF',          // User message text color - white for better contrast
  assistantText: '#FFFFFF',     // Assistant message text color
  
  // UI element colors
  accent: '#10A37F',            // Primary accent (buttons, highlights) - ChatGPT green
  accentHover: '#1A7F64',       // Accent hover state
  border: '#4D4D4F',            // Border color
  divider: '#4D4D4F',           // Dividers and separators
  
  // Message bubble colors
  userBubble: '#1E8870',        // Darker green for user bubbles (improved contrast with white text)
  assistantBubble: '#444654',   // Assistant message bubble (dark gray)
  
  // Status colors
  error: '#EF4444',             // Error messages
  warning: '#F59E0B',           // Warnings
  success: '#10A37F',           // Success messages
  info: '#2196F3',              // Info messages
  
  // Misc
  overlay: 'rgba(52, 53, 65, 0.7)', // Overlay for modals
  loadingIndicator: '#10A37F',   // Loading spinner color
};

// Combined theme object
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
  },
  spacing,
  typography,
};

export default theme;
