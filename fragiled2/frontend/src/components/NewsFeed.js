import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import NewsCard from './NewsCard';
import LoadingMatrix from './LoadingMatrix';
import apiService from '../services/api';

/**
 * Clean NewsFeed Component - Professional news site style
 * Focus on top stories with images, no admin stats
 */
const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load articles on component mount
  useEffect(() => {
    loadArticles();

    // Refresh every 5 minutes
    const interval = setInterval(loadArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get top stories with high severity and images
      const response = await apiService.getHybridArticles({
        limit: 30,
        minSeverity: 70,
        enhanceContent: true
      });

      // Format and prioritize articles with images for top stories
      const formattedArticles = apiService.formatArticles(response.data);

      // Separate articles with and without images
      const articlesWithImages = formattedArticles.filter(article =>
        article.images && article.images.length > 0
      );
      const articlesWithoutImages = formattedArticles.filter(article =>
        !article.images || article.images.length === 0
      );

      // Sort by severity (highest first)
      articlesWithImages.sort((a, b) => b.severity_score - a.severity_score);
      articlesWithoutImages.sort((a, b) => b.severity_score - a.severity_score);

      // Take top 6 stories with images, then add others
      const topStories = articlesWithImages.slice(0, 6);
      const otherStories = [
        ...articlesWithImages.slice(6),
        ...articlesWithoutImages
      ].slice(0, 10);

      setArticles([...topStories, ...otherStories]);

    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load news articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && articles.length === 0) {
    return <LoadingMatrix message="Loading latest news..." />;
  }

  // Separate top stories (with images) from other stories
  const topStories = articles.filter(article =>
    article.images && article.images.length > 0
  ).slice(0, 6);

  const otherStories = articles.filter(article =>
    !topStories.includes(article)
  );

  return (
    <NewsFeedContainer>
      {/* Error Display */}
      {error && (
        <ErrorMessage>
          ⚠️ {error}
          <RetryButton onClick={loadArticles}>Retry</RetryButton>
        </ErrorMessage>
      )}

      {/* Top Stories Section */}
      {topStories.length > 0 && (
        <TopStoriesSection>
          <SectionHeader>
            <SectionTitle>🚨 Breaking News</SectionTitle>
            <UpdateTime>
              Updated: {new Date().toLocaleTimeString()}
            </UpdateTime>
          </SectionHeader>

          <TopStoriesGrid>
            {topStories.map((article, index) => (
              <NewsCard
                key={article.id || `top-${index}`}
                article={article}
                index={index}
              />
            ))}
          </TopStoriesGrid>
        </TopStoriesSection>
      )}

      {/* Other Stories Section */}
      {otherStories.length > 0 && (
        <OtherStoriesSection>
          <SectionHeader>
            <SectionTitle>📰 More News</SectionTitle>
            <ArticleCount>
              {otherStories.length} additional stories
            </ArticleCount>
          </SectionHeader>

          <OtherStoriesGrid>
            {otherStories.map((article, index) => (
              <NewsCard
                key={article.id || `other-${index}`}
                article={article}
                index={index + topStories.length}
              />
            ))}
          </OtherStoriesGrid>
        </OtherStoriesSection>
      )}

      {/* No Articles Message */}
      {articles.length === 0 && !loading && (
        <NoArticlesMessage>
          <NoArticlesIcon>📰</NoArticlesIcon>
          <NoArticlesText>
            No news articles available at the moment.
            <br />
            Please check back later for updates.
          </NoArticlesText>
        </NoArticlesMessage>
      )}

      {/* Loading Overlay */}
      {loading && articles.length > 0 && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>Updating news...</LoadingText>
        </LoadingOverlay>
      )}
    </NewsFeedContainer>
  );
};

// Styled Components
const NewsFeedContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid #ff0000;
  color: #ff0000;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Courier New', monospace;
`;

const RetryButton = styled.button`
  background: transparent;
  color: #ff0000;
  border: 1px solid #ff0000;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', monospace;

  &:hover {
    background: rgba(255, 0, 0, 0.1);
  }
`;

const TopStoriesSection = styled.div`
  margin-bottom: 48px;
`;

const OtherStoriesSection = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${props => props.theme.colors.matrix};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.matrix};
  font-size: 28px;
  margin: 0;
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
`;

const UpdateTime = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  font-family: 'Courier New', monospace;
`;

const ArticleCount = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  font-family: 'Courier New', monospace;
`;

const TopStoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OtherStoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const NoArticlesMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.matrixDim};
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
`;

const NoArticlesIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const NoArticlesText = styled.div`
  font-size: 18px;
  line-height: 1.6;
  font-family: 'Arial', sans-serif;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top: 3px solid ${props => props.theme.colors.matrix};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme.colors.matrix};
  margin-top: 20px;
  font-size: 18px;
  font-family: 'Courier New', monospace;
`;

export default NewsFeed;
