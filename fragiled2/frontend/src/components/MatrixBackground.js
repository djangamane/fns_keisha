import React from 'react';
import styled from 'styled-components';

/**
 * Matrix Video Background - Uses the matrix.mp4 video
 */
const MatrixBackground = () => {
  return (
    <BackgroundContainer>
      <MatrixVideo
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/matrix.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        <FallbackCanvas />
      </MatrixVideo>
    </BackgroundContainer>
  );
};

// Styled Components
const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
`;

const MatrixVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
  filter: brightness(0.7) contrast(1.2);
`;

const FallbackCanvas = styled.div`
  width: 100%;
  height: 100%;
  background: #000000;
  background-image:
    linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
`;

export default MatrixBackground;
