import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Enhanced Article Card for Hybrid Articles
 * Shows full content, images, and analysis comparison
 */
const HybridArticleCard = ({ article, onClick }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageError, setImageError] = useState({});

  const handleImageError = (imageIndex) => {
    setImageError(prev => ({ ...prev, [imageIndex]: true }));
  };

  const toggleContent = (e) => {
    e.stopPropagation();
    setShowFullContent(!showFullContent);
  };

  return (
    <ArticleCardContainer
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)' }}
      onClick={onClick}
      $severity={article.severity_score}
    >
      {/* Threat Level Indicator */}
      <ThreatIndicator $severity={article.severity_score}>
        <ThreatLevel>{article.threatLevel}</ThreatLevel>
        <SeverityScore>{article.severity_score}%</SeverityScore>
      </ThreatIndicator>

      {/* Enhancement Status */}
      <EnhancementBadge $isEnhanced={article.isHybridEnhanced}>
        {article.isHybridEnhanced ? '🎯 HYBRID ENHANCED' : '📰 NEWSLETTER ONLY'}
      </EnhancementBadge>

      {/* Article Header */}
      <ArticleHeader>
        <ArticleTitle>{article.title}</ArticleTitle>
        <ArticleMetadata>
          <MetadataItem>
            📅 {article.displayDate}
          </MetadataItem>
          <MetadataItem>
            📊 {article.word_count || 0} words
          </MetadataItem>
          <MetadataItem>
            🖼️ {article.images?.length || 0} images
          </MetadataItem>
          <MetadataItem>
            🏷️ {article.keyword}
          </MetadataItem>
        </ArticleMetadata>
      </ArticleHeader>

      {/* Images Section */}
      {article.hasImages && (
        <ImagesSection>
          <ImagesGrid>
            {article.images.slice(0, 3).map((image, index) => (
              !imageError[index] && (
                <ArticleImage
                  key={index}
                  src={image.url}
                  alt={image.alt || `Article image ${index + 1}`}
                  onError={() => handleImageError(index)}
                />
              )
            ))}
          </ImagesGrid>
          {article.images.length > 3 && (
            <MoreImages>+{article.images.length - 3} more images</MoreImages>
          )}
        </ImagesSection>
      )}

      {/* Content Section */}
      <ContentSection>
        {/* Newsletter Summary */}
        <ContentBlock>
          <ContentLabel>📰 Newsletter Summary:</ContentLabel>
          <ContentText>{article.shortSummary}</ContentText>
        </ContentBlock>

        {/* Full Content (if available) */}
        {article.hasFullContent && (
          <ContentBlock>
            <ContentLabel>
              📄 Full Article Content:
              <ToggleButton onClick={toggleContent}>
                {showFullContent ? 'Hide' : 'Show'} Full Content
              </ToggleButton>
            </ContentLabel>
            {showFullContent && (
              <FullContentText>
                {article.full_content.substring(0, 1000)}
                {article.full_content.length > 1000 && '...'}
              </FullContentText>
            )}
          </ContentBlock>
        )}

        {/* Analysis Comparison */}
        <AnalysisSection>
          <AnalysisLabel>🧠 Analysis Status:</AnalysisLabel>
          <AnalysisGrid>
            <AnalysisBlock>
              <AnalysisType>Newsletter Analysis</AnalysisType>
              <AnalysisText>
                {article.newsletter_analysis ? 
                  article.newsletter_analysis.substring(0, 150) + '...' : 
                  'Generic newsletter analysis'
                }
              </AnalysisText>
            </AnalysisBlock>
            <AnalysisBlock>
              <AnalysisType>
                Keisha Analysis 
                <KeishaStatus $ready={article.readyForKeisha}>
                  {article.readyForKeisha ? '✅ READY' : '⏳ PENDING'}
                </KeishaStatus>
              </AnalysisType>
              <AnalysisText>
                {article.readyForKeisha ? 
                  'Full article content ready for authentic Keisha AI analysis' :
                  'Waiting for content enhancement'
                }
              </AnalysisText>
            </AnalysisBlock>
          </AnalysisGrid>
        </AnalysisSection>
      </ContentSection>

      {/* Footer */}
      <ArticleFooter>
        <SourceInfo>
          <SourceLabel>Source:</SourceLabel>
          <SourceLink href={article.url} target="_blank" rel="noopener noreferrer">
            {article.metadata?.siteName || 'View Article'}
          </SourceLink>
        </SourceInfo>
        <ContentQuality $quality={article.contentQuality}>
          Content Quality: {article.contentQuality}
        </ContentQuality>
      </ArticleFooter>
    </ArticleCardContainer>
  );
};

// Styled Components
const ArticleCardContainer = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      if (props.$severity >= 90) return '#ff0000';
      if (props.$severity >= 80) return '#ff6600';
      if (props.$severity >= 70) return '#ffcc00';
      return '#00ff00';
    }};
    box-shadow: 0 0 10px ${props => {
      if (props.$severity >= 90) return '#ff0000';
      if (props.$severity >= 80) return '#ff6600';
      if (props.$severity >= 70) return '#ffcc00';
      return '#00ff00';
    }};
  }
`;

const ThreatIndicator = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => {
    if (props.$severity >= 90) return '#ff0000';
    if (props.$severity >= 80) return '#ff6600';
    if (props.$severity >= 70) return '#ffcc00';
    return '#00ff00';
  }};
`;

const ThreatLevel = styled.div`
  font-size: 12px;
  font-weight: bold;
`;

const SeverityScore = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
`;

const EnhancementBadge = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: ${props => props.$isEnhanced ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)'};
  color: ${props => props.$isEnhanced ? '#00ff00' : '#ffa500'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid ${props => props.$isEnhanced ? '#00ff00' : '#ffa500'};
`;

const ArticleHeader = styled.div`
  margin-top: 50px;
  margin-bottom: 16px;
`;

const ArticleTitle = styled.h3`
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  margin: 0 0 8px 0;
  line-height: 1.4;
`;

const ArticleMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
`;

const MetadataItem = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  background: rgba(0, 255, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
`;

const ImagesSection = styled.div`
  margin: 16px 0;
`;

const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
`;

const ArticleImage = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.matrix};
`;

const MoreImages = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  text-align: center;
`;

const ContentSection = styled.div`
  margin: 16px 0;
`;

const ContentBlock = styled.div`
  margin-bottom: 16px;
`;

const ContentLabel = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContentText = styled.p`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
`;

const FullContentText = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 13px;
  line-height: 1.6;
  background: rgba(0, 255, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid ${props => props.theme.colors.matrix};
  max-height: 300px;
  overflow-y: auto;
`;

const ToggleButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.matrix};
  border: 1px solid ${props => props.theme.colors.matrix};
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 255, 0, 0.1);
  }
`;

const AnalysisSection = styled.div`
  border-top: 1px solid ${props => props.theme.colors.matrixDim};
  padding-top: 16px;
`;

const AnalysisLabel = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const AnalysisBlock = styled.div`
  background: rgba(0, 255, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 0, 0.2);
`;

const AnalysisType = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AnalysisText = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 12px;
  line-height: 1.4;
`;

const KeishaStatus = styled.span`
  color: ${props => props.$ready ? '#00ff00' : '#ffcc00'};
  font-size: 10px;
`;

const ArticleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.colors.matrixDim};
`;

const SourceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SourceLabel = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
`;

const SourceLink = styled.a`
  color: ${props => props.theme.colors.matrix};
  font-size: 12px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ContentQuality = styled.div`
  color: ${props => {
    switch(props.$quality) {
      case 'EXCELLENT': return '#00ff00';
      case 'GOOD': return '#ffcc00';
      default: return '#ff6600';
    }
  }};
  font-size: 12px;
  font-weight: bold;
`;

export default HybridArticleCard;
