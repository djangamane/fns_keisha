import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * Matrix-themed loading component
 */
const LoadingMatrix = ({ message = "Loading..." }) => {
  return (
    <LoadingContainer>
      <MatrixRain>
        {Array.from({ length: 20 }).map((_, i) => (
          <MatrixColumn key={i} $delay={i * 0.1}>
            {Array.from({ length: 10 }).map((_, j) => (
              <MatrixChar key={j}>
                {String.fromCharCode(0x30A0 + Math.random() * 96)}
              </MatrixChar>
            ))}
          </MatrixColumn>
        ))}
      </MatrixRain>
      
      <LoadingContent>
        <LoadingSpinner />
        <LoadingMessage>{message}</LoadingMessage>
        <LoadingSubtext>Accessing the Matrix...</LoadingSubtext>
      </LoadingContent>
    </LoadingContainer>
  );
};

// Animations
const fall = keyframes`
  0% {
    transform: translateY(-100vh);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

// Styled Components
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
`;

const MatrixRain = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  opacity: 0.3;
`;

const MatrixColumn = styled.div`
  display: flex;
  flex-direction: column;
  animation: ${fall} 3s linear infinite;
  animation-delay: ${props => props.$delay}s;
`;

const MatrixChar = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.2;
  text-shadow: 0 0 5px ${props => props.theme.colors.matrix};
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  background: rgba(0, 20, 0, 0.8);
  padding: 40px;
  border-radius: 12px;
  border: 2px solid ${props => props.theme.colors.matrix};
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 3px solid transparent;
  border-top: 3px solid ${props => props.theme.colors.matrix};
  border-right: 3px solid ${props => props.theme.colors.matrix};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
`;

const LoadingMessage = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingSubtext = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  text-align: center;
  font-family: 'Courier New', monospace;
`;

export default LoadingMatrix;
