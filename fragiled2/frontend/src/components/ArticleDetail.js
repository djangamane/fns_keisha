import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiService from '../services/api';

/**
 * Enhanced Article Detail Page - Professional news article view
 * Shows hero image, full content, Keisha analysis, and original link
 */
const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get hybrid articles and find the one with matching ID
      const response = await apiService.getHybridArticles({ limit: 50 });
      const foundArticle = response.data.find((article, index) =>
        article.id === id || index.toString() === id
      );

      if (foundArticle) {
        setArticle(apiService.formatArticle(foundArticle));
      } else {
        setError('Article not found');
      }

    } catch (err) {
      console.error('Error loading article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DetailContainer>
        <LoadingMessage>Loading article...</LoadingMessage>
      </DetailContainer>
    );
  }

  if (error || !article) {
    return (
      <DetailContainer>
        <ErrorMessage>
          <ErrorIcon>❌</ErrorIcon>
          <ErrorText>{error || 'Article not found'}</ErrorText>
          <BackButton onClick={() => navigate('/')}>
            ← Back to News Feed
          </BackButton>
        </ErrorMessage>
      </DetailContainer>
    );
  }

  const heroImage = article.images && article.images.length > 0 ? article.images[0] : null;

  return (
    <DetailContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Button */}
      <BackButton onClick={() => navigate('/')}>
        ← Back to News Feed
      </BackButton>

      {/* Hero Section */}
      <HeroSection>
        {heroImage && (
          <HeroImageContainer>
            <HeroImage src={heroImage.url} alt={heroImage.alt || article.title} />
            <HeroOverlay />
          </HeroImageContainer>
        )}

        <HeroContent $hasImage={!!heroImage}>
          <SeverityBadge $severity={article.severity_score}>
            {article.severity_score >= 90 ? 'BREAKING' :
             article.severity_score >= 80 ? 'URGENT' :
             article.severity_score >= 70 ? 'IMPORTANT' : 'NEWS'}
          </SeverityBadge>

          <ArticleTitle>{article.title}</ArticleTitle>

          <ArticleMetadata>
            <MetadataItem>
              📅 {article.displayDate}
            </MetadataItem>
            <MetadataItem>
              📊 {article.severity_score}% severity
            </MetadataItem>
            <MetadataItem>
              📄 {article.word_count || 0} words
            </MetadataItem>
            {article.images && article.images.length > 0 && (
              <MetadataItem>
                🖼️ {article.images.length} images
              </MetadataItem>
            )}
          </ArticleMetadata>
        </HeroContent>
      </HeroSection>

      {/* Article Content */}
      <ContentSection>
        {/* Summary */}
        <SummarySection>
          <SectionTitle>📰 Summary</SectionTitle>
          <SummaryText>{article.summary || 'No summary available'}</SummaryText>
        </SummarySection>

        {/* Full Content */}
        {article.full_content && (
          <FullContentSection>
            <SectionTitle>📄 Full Article</SectionTitle>
            <FullContentText>
              {article.full_content}
            </FullContentText>
          </FullContentSection>
        )}

        {/* Keisha Analysis */}
        <KeishaSection>
          <SectionTitle>🧠 Keisha AI Analysis</SectionTitle>
          <KeishaAnalysis>
            {article.newsletter_analysis ? (
              <AnalysisText>{article.newsletter_analysis}</AnalysisText>
            ) : (
              <AnalysisPlaceholder>
                <AnalysisIcon>🤖</AnalysisIcon>
                <AnalysisMessage>
                  This article has been processed and is ready for Keisha AI analysis.
                  <br />
                  Full AI analysis will be available once the Keisha backend is connected.
                </AnalysisMessage>
              </AnalysisPlaceholder>
            )}
          </KeishaAnalysis>

          {/* Keisha Image */}
          <KeishaImageContainer>
            <KeishaImage src="/aikeish.png" alt="Keisha AI" />
            <KeishaCaption>Analysis by Keisha AI</KeishaCaption>
          </KeishaImageContainer>
        </KeishaSection>

        {/* Additional Images */}
        {article.images && article.images.length > 1 && (
          <ImagesSection>
            <SectionTitle>🖼️ Additional Images</SectionTitle>
            <ImageGallery>
              {article.images.slice(1).map((image, index) => (
                <GalleryImage
                  key={index}
                  src={image.url}
                  alt={image.alt || `Image ${index + 2}`}
                />
              ))}
            </ImageGallery>
          </ImagesSection>
        )}

        {/* Original Source */}
        <SourceSection>
          <SectionTitle>🔗 Original Source</SectionTitle>
          <SourceLink href={article.url} target="_blank" rel="noopener noreferrer">
            Read Original Article →
          </SourceLink>
          <SourceNote>
            This analysis is based on the original article from {article.metadata?.siteName || 'the source website'}.
          </SourceNote>
        </SourceSection>
      </ContentSection>
    </DetailContainer>
  );
};

// Styled Components
const DetailContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  padding: 60px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorText = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.matrix};
  border: 2px solid ${props => props.theme.colors.matrix};
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 0, 0.1);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
`;

const HeroSection = styled.div`
  position: relative;
  margin-bottom: 32px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
`;

const HeroImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
`;

const HeroContent = styled.div`
  position: ${props => props.$hasImage ? 'absolute' : 'relative'};
  bottom: ${props => props.$hasImage ? '0' : 'auto'};
  left: 0;
  right: 0;
  padding: 32px;
  z-index: 2;
`;

const SeverityBadge = styled.div`
  display: inline-block;
  background: ${props => {
    if (props.$severity >= 90) return '#ff0000';
    if (props.$severity >= 80) return '#ff6600';
    if (props.$severity >= 70) return '#ffcc00';
    return '#00ff00';
  }};
  color: #000000;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-bottom: 16px;
  box-shadow: 0 0 15px ${props => {
    if (props.$severity >= 90) return 'rgba(255, 0, 0, 0.6)';
    if (props.$severity >= 80) return 'rgba(255, 102, 0, 0.6)';
    if (props.$severity >= 70) return 'rgba(255, 204, 0, 0.6)';
    return 'rgba(0, 255, 0, 0.6)';
  }};
`;

const ArticleTitle = styled.h1`
  color: ${props => props.theme.colors.matrix};
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 16px 0;
  line-height: 1.2;
  font-family: 'Arial', sans-serif;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
`;

const ArticleMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const MetadataItem = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  background: rgba(0, 255, 0, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const SummarySection = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
`;

const FullContentSection = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
`;

const KeishaSection = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
  position: relative;
`;

const ImagesSection = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
`;

const SourceSection = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.matrix};
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 16px 0;
  font-family: 'Courier New', monospace;
`;

const SummaryText = styled.p`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  font-family: 'Arial', sans-serif;
`;

const FullContentText = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  line-height: 1.7;
  font-family: 'Arial', sans-serif;

  p {
    margin-bottom: 16px;
  }
`;

const KeishaAnalysis = styled.div`
  margin-bottom: 24px;
`;

const AnalysisText = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  line-height: 1.6;
  font-family: 'Arial', sans-serif;
  background: rgba(0, 255, 0, 0.05);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.theme.colors.matrix};
`;

const AnalysisPlaceholder = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 255, 0, 0.05);
  border-radius: 8px;
  border: 2px dashed ${props => props.theme.colors.matrix};
`;

const AnalysisIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const AnalysisMessage = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 16px;
  line-height: 1.5;
  font-family: 'Courier New', monospace;
`;

const KeishaImageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 255, 0, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 0, 0.2);
`;

const KeishaImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${props => props.theme.colors.matrix};
  object-fit: cover;
`;

const KeishaCaption = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
`;

const ImageGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid ${props => props.theme.colors.matrix};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const SourceLink = styled.a`
  display: inline-block;
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  font-weight: bold;
  text-decoration: none;
  padding: 12px 24px;
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 6px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;

  &:hover {
    background: rgba(0, 255, 0, 0.1);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
`;

const SourceNote = styled.p`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  margin: 0;
  font-style: italic;
`;

export default ArticleDetail;
