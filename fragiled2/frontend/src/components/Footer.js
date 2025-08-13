import React from 'react';
import styled from 'styled-components';

/**
 * Matrix-themed footer
 */
const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <SectionTitle>🎬 Fragile News Source</SectionTitle>
          <SectionText>
            Matrix-enhanced news analysis powered by hybrid data sources
          </SectionText>
        </FooterSection>

        <FooterSection>
          <SectionTitle>📊 Data Sources</SectionTitle>
          <SourceList>
            <SourceItem>🎯 Hybrid Enhanced Articles</SourceItem>
            <SourceItem>📰 Critical Newsletter Seeds</SourceItem>
            <SourceItem>🧠 Keisha AI Analysis</SourceItem>
            <SourceItem>📁 Local Backup System</SourceItem>
          </SourceList>
        </FooterSection>

        <FooterSection>
          <SectionTitle>⚡ System Status</SectionTitle>
          <StatusList>
            <StatusItem $status="active">✅ Hybrid Enhancement: ACTIVE</StatusItem>
            <StatusItem $status="active">✅ Critical Data: ONLINE</StatusItem>
            <StatusItem $status="pending">⏳ Keisha AI: PENDING</StatusItem>
            <StatusItem $status="active">✅ Fallback: READY</StatusItem>
          </StatusList>
        </FooterSection>
      </FooterContent>

      <FooterBottom>
        <Copyright>
          © 2025 Fragile News Source | Matrix-Enhanced Analysis System
        </Copyright>
        <TechInfo>
          Powered by React, Node.js, and the Matrix
        </TechInfo>
      </FooterBottom>
    </FooterContainer>
  );
};

// Styled Components
const FooterContainer = styled.footer`
  background: rgba(0, 20, 0, 0.95);
  border-top: 2px solid ${props => props.theme.colors.matrix};
  margin-top: 40px;
  backdrop-filter: blur(10px);
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.matrix};
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
`;

const SectionText = styled.p`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
`;

const SourceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SourceItem = styled.li`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  font-family: 'Courier New', monospace;
`;

const StatusList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatusItem = styled.li`
  color: ${props => {
    switch(props.$status) {
      case 'active': return '#00ff00';
      case 'pending': return '#ffcc00';
      case 'error': return '#ff0000';
      default: return props.theme.colors.matrixDim;
    }
  }};
  font-size: 14px;
  font-family: 'Courier New', monospace;
`;

const FooterBottom = styled.div`
  border-top: 1px solid rgba(0, 255, 0, 0.2);
  padding: 16px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const Copyright = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  font-family: 'Courier New', monospace;
`;

const TechInfo = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  font-family: 'Courier New', monospace;
`;

export default Footer;
