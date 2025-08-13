import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  // Matrix-style fonts loaded via index.html
  
  // Matrix animations
  ${props => props.theme.animations.matrixGlow}
  ${props => props.theme.animations.fadeIn}
  ${props => props.theme.animations.slideIn}
  ${props => props.theme.animations.pulse}
  ${props => props.theme.animations.typewriter}
  
  // Reset and base styles
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }
  
  body {
    font-family: ${props => props.theme.fonts.primary};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
    overflow-x: hidden;
    
    // Matrix background pattern
    ${props => props.theme.effects.backgroundPattern}
  }
  
  // Typography
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.heading};
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: ${props => props.theme.spacing.md};
    ${props => props.theme.effects.matrixGlow}
  }
  
  h1 {
    font-size: ${props => props.theme.fontSizes['4xl']};
    animation: matrixGlow 2s ease-in-out infinite;
  }
  
  h2 {
    font-size: ${props => props.theme.fontSizes['3xl']};
  }
  
  h3 {
    font-size: ${props => props.theme.fontSizes['2xl']};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.textSecondary};
  }
  
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: all 0.3s ease;
    
    &:hover {
      color: ${props => props.theme.colors.primaryLight};
      ${props => props.theme.effects.matrixGlow}
    }
  }
  
  // Scrollbar styling
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.primary};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.colors.primaryLight};
    }
  }
  
  // Selection styling
  ::selection {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
  }
  
  // App layout
  .App {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .main-content {
    flex: 1;
    padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.md};
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    z-index: ${props => props.theme.zIndex.content};
    position: relative;
  }
  
  // Utility classes
  .matrix-glow {
    ${props => props.theme.effects.matrixGlow}
    animation: matrixGlow 2s ease-in-out infinite;
  }
  
  .fade-in {
    animation: fadeIn 0.6s ease-out;
  }
  
  .slide-in {
    animation: slideIn 0.5s ease-out;
  }
  
  .pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .typewriter {
    overflow: hidden;
    white-space: nowrap;
    border-right: 2px solid ${props => props.theme.colors.primary};
    animation: typewriter 3s steps(40, end), pulse 1s step-end infinite;
  }
  
  // Severity indicators
  .severity-low {
    color: ${props => props.theme.colors.severityLow};
  }
  
  .severity-medium {
    color: ${props => props.theme.colors.severityMedium};
  }
  
  .severity-high {
    color: ${props => props.theme.colors.severityHigh};
  }
  
  .severity-critical {
    color: ${props => props.theme.colors.severityCritical};
  }
  
  // Loading states
  .loading {
    opacity: 0.7;
    pointer-events: none;
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      ${props => props.theme.colors.surface} 25%,
      ${props => props.theme.colors.surfaceAlt} 50%,
      ${props => props.theme.colors.surface} 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  // Responsive design
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    .main-content {
      padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.sm};
    }
    
    h1 {
      font-size: ${props => props.theme.fontSizes['3xl']};
    }
    
    h2 {
      font-size: ${props => props.theme.fontSizes['2xl']};
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    .main-content {
      padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xs};
    }
    
    h1 {
      font-size: ${props => props.theme.fontSizes['2xl']};
    }
  }
  
  // Print styles
  @media print {
    body {
      background: white;
      color: black;
    }
    
    .matrix-background,
    .matrix-glow {
      display: none !important;
    }
  }
  
  // High contrast mode
  @media (prefers-contrast: high) {
    body {
      background: #000000;
      color: #FFFFFF;
    }
    
    a {
      color: #00FF00;
    }
  }
  
  // Reduced motion
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  // Focus styles for accessibility
  button:focus,
  input:focus,
  select:focus,
  textarea:focus,
  a:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
  
  // Screen reader only content
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export default GlobalStyles;