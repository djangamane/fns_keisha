// Matrix-themed color palette and design system
export const matrixTheme = {
  colors: {
    // Matrix green palette
    primary: '#00FF41',      // Bright matrix green
    primaryDark: '#00CC33',  // Darker green
    primaryLight: '#66FF66', // Lighter green
    
    // Background colors
    background: '#000000',   // Pure black
    backgroundAlt: '#0A0A0A', // Slightly lighter black
    surface: '#111111',      // Dark surface
    surfaceAlt: '#1A1A1A',   // Lighter surface
    
    // Text colors
    text: '#00FF41',         // Matrix green text
    textSecondary: '#66FF66', // Lighter green text
    textMuted: '#339933',    // Muted green
    textWhite: '#FFFFFF',    // Pure white for contrast

    // Matrix-specific colors (for component compatibility)
    matrix: '#00FF41',       // Primary matrix green
    matrixDim: '#339933',    // Dimmed matrix green
    
    // Accent colors
    accent: '#FF0040',       // Red for alerts/high severity
    warning: '#FFAA00',      // Orange for warnings
    success: '#00FF41',      // Green for success
    info: '#0099FF',         // Blue for info
    
    // Severity colors
    severityLow: '#00FF41',    // Green
    severityMedium: '#FFAA00', // Orange  
    severityHigh: '#FF6600',   // Red-orange
    severityCritical: '#FF0040', // Red
    
    // UI elements
    border: '#333333',       // Dark border
    borderLight: '#555555',  // Lighter border
    shadow: 'rgba(0, 255, 65, 0.3)', // Green glow
    overlay: 'rgba(0, 0, 0, 0.8)',   // Dark overlay
  },
  
  fonts: {
    primary: '"Courier New", "Monaco", "Lucida Console", monospace',
    secondary: '"Arial", "Helvetica", sans-serif',
    heading: '"Orbitron", "Courier New", monospace',
  },
  
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px',
  },
  
  animations: {
    matrixGlow: `
      @keyframes matrixGlow {
        0%, 100% { text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 15px #00FF41; }
        50% { text-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 30px #00FF41; }
      }
    `,
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
    slideIn: `
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `,
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `,
    typewriter: `
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
    `,
  },
  
  effects: {
    matrixGlow: 'text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41;',
    cardGlow: 'box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);',
    borderGlow: 'border: 1px solid #00FF41; box-shadow: 0 0 5px rgba(0, 255, 65, 0.5);',
    backgroundPattern: `
      background-image: 
        linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
    `,
  },
  
  components: {
    button: {
      primary: `
        background: linear-gradient(45deg, #00FF41, #00CC33);
        color: #000000;
        border: none;
        padding: 12px 24px;
        font-family: "Courier New", monospace;
        font-weight: bold;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
        
        &:hover {
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.6);
          transform: translateY(-2px);
        }
      `,
      secondary: `
        background: transparent;
        color: #00FF41;
        border: 2px solid #00FF41;
        padding: 10px 22px;
        font-family: "Courier New", monospace;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: #00FF41;
          color: #000000;
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
      `,
    },
    
    card: `
      background: rgba(17, 17, 17, 0.9);
      border: 1px solid #333333;
      border-radius: 8px;
      padding: 24px;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #00FF41;
        box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
        transform: translateY(-2px);
      }
    `,
    
    input: `
      background: rgba(17, 17, 17, 0.9);
      border: 2px solid #333333;
      color: #00FF41;
      padding: 12px 16px;
      font-family: "Courier New", monospace;
      border-radius: 4px;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #00FF41;
        box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
      }
      
      &::placeholder {
        color: #339933;
      }
    `,
  },
  
  zIndex: {
    background: -1,
    content: 1,
    header: 10,
    modal: 100,
    tooltip: 1000,
  },
};
