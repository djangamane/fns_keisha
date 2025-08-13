import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Clean News Card - Professional media company style
 * No newsletter references, focus on the story
 */
const NewsCard = ({ article, index }) => {
  const [imageError, setImageError] = useState({});
  const navigate = useNavigate();

  const handleImageError = (imageIndex) => {
    setImageError(prev => ({ ...prev, [imageIndex]: true }));
  };

  const handleCardClick = () => {
    navigate(`/article/${article.id || index}`);
  };

  const getSeverityColor = (severity) => {
    if (severity >= 90) return '#ff0000';
    if (severity >= 80) return '#ff6600';
    if (severity >= 70) return '#ffcc00';
    return '#00ff00';
  };

  const getSeverityLabel = (severity) => {
    if (severity >= 90) return 'BREAKING';
    if (severity >= 80) return 'URGENT';
    if (severity >= 70) return 'IMPORTANT';
    return 'NEWS';
  };

  // Get the main image for the card
  const mainImage = article.images && article.images.length > 0 ? article.images[0] : null;

  return (
    <CardContainer
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleCardClick}
      $severity={article.severity_score}
    >
      {/* Severity Badge */}
      <SeverityBadge $severity={article.severity_score}>
        {getSeverityLabel(article.severity_score)}
      </SeverityBadge>

      {/* Main Image */}
      {mainImage && !imageError[0] && (
        <ImageContainer>
          <MainImage
            src={mainImage.url}
            alt={mainImage.alt || article.title}
            onError={() => handleImageError(0)}
          />
          <ImageOverlay />
        </ImageContainer>
      )}

      {/* Content */}
      <ContentContainer $hasImage={!!mainImage}>
        {/* Title */}
        <Title>{article.title}</Title>

        {/* Summary */}
        <Summary>
          {article.summary ? 
            (article.summary.length > 200 ? 
              article.summary.substring(0, 200) + '...' : 
              article.summary
            ) : 
            'Breaking news story - click to read full analysis'
          }
        </Summary>

        {/* Metadata */}
        <Metadata>
          <MetadataItem>
            📅 {article.date ? new Date(article.date).toLocaleDateString() : 'Today'}
          </MetadataItem>
          <MetadataItem>
            📊 {article.severity_score}% severity
          </MetadataItem>
          {article.word_count && (
            <MetadataItem>
              📄 {article.word_count} words
            </MetadataItem>
          )}
          {article.images && article.images.length > 0 && (
            <MetadataItem>
              🖼️ {article.images.length} images
            </MetadataItem>
          )}
        </Metadata>

        {/* Additional Images Preview */}
        {article.images && article.images.length > 1 && (
          <ImagePreview>
            {article.images.slice(1, 4).map((image, index) => (
              !imageError[index + 1] && (
                <PreviewImage
                  key={index}
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  onError={() => handleImageError(index + 1)}
                />
              )
            ))}
            {article.images.length > 4 && (
              <MoreImages>+{article.images.length - 4}</MoreImages>
            )}
          </ImagePreview>
        )}

        {/* Read More Indicator */}
        <ReadMore>
          Click to read full analysis →
        </ReadMore>
      </ContentContainer>
    </CardContainer>
  );
};

// Styled Components
const CardContainer = styled.div`
  background: rgba(0, 20, 0, 0.95);
  border: 2px solid ${props => {
    if (props.$severity >= 90) return '#ff0000';
    if (props.$severity >= 80) return '#ff6600';
    if (props.$severity >= 70) return '#ffcc00';
    return '#00ff00';
  }};
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 24px;
  
  &:hover {
    box-shadow: 0 0 25px ${props => {
      if (props.$severity >= 90) return 'rgba(255, 0, 0, 0.4)';
      if (props.$severity >= 80) return 'rgba(255, 102, 0, 0.4)';
      if (props.$severity >= 70) return 'rgba(255, 204, 0, 0.4)';
      return 'rgba(0, 255, 0, 0.4)';
    }};
    transform: translateY(-2px);
  }
`;

const SeverityBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: ${props => {
    if (props.$severity >= 90) return '#ff0000';
    if (props.$severity >= 80) return '#ff6600';
    if (props.$severity >= 70) return '#ffcc00';
    return '#00ff00';
  }};
  color: #000000;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  z-index: 2;
  box-shadow: 0 0 10px ${props => {
    if (props.$severity >= 90) return 'rgba(255, 0, 0, 0.6)';
    if (props.$severity >= 80) return 'rgba(255, 102, 0, 0.6)';
    if (props.$severity >= 70) return 'rgba(255, 204, 0, 0.6)';
    return 'rgba(0, 255, 0, 0.6)';
  }};
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
`;

const ContentContainer = styled.div`
  padding: ${props => props.$hasImage ? '20px' : '24px'};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.matrix};
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 12px 0;
  line-height: 1.3;
  font-family: 'Arial', sans-serif;
`;

const Summary = styled.p`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  font-family: 'Arial', sans-serif;
`;

const Metadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const MetadataItem = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  background: rgba(0, 255, 0, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
`;

const ImagePreview = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
`;

const PreviewImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.matrix};
`;

const MoreImages = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  font-weight: bold;
`;

const ReadMore = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  text-align: right;
  font-family: 'Courier New', monospace;
  opacity: 0.8;
  
  ${CardContainer}:hover & {
    opacity: 1;
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
`;

export default NewsCard;
