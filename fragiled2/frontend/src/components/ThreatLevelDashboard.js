import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

/**
 * Threat Level Dashboard Component
 * Shows overall threat assessment and system status
 */
const ThreatLevelDashboard = ({ summary, stats, onAnalyzeClick }) => {
  const getThreatColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff6600';
      case 'MODERATE': return '#ffcc00';
      case 'LOW': return '#00ff00';
      default: return '#00ffff';
    }
  };

  const getThreatIcon = (level) => {
    switch (level) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MODERATE': return '⚡';
      case 'LOW': return '✅';
      default: return '📊';
    }
  };

  return (
    <DashboardContainer
      as={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Threat Level */}
      <ThreatLevelSection>
        <ThreatIcon>{getThreatIcon(summary.overall_threat_level)}</ThreatIcon>
        <ThreatInfo>
          <ThreatLevelText $color={getThreatColor(summary.overall_threat_level)}>
            THREAT LEVEL: {summary.overall_threat_level}
          </ThreatLevelText>
          <ThreatDetails>
            Average Severity: {summary.average_severity}% | 
            Total Articles: {summary.total_articles} |
            Max Severity: {summary.max_severity}%
          </ThreatDetails>
        </ThreatInfo>
        <ThreatMeter>
          <MeterBar>
            <MeterFill 
              $percentage={summary.average_severity} 
              $color={getThreatColor(summary.overall_threat_level)}
            />
          </MeterBar>
          <MeterLabel>{summary.average_severity}%</MeterLabel>
        </ThreatMeter>
      </ThreatLevelSection>

      {/* System Status */}
      <SystemStatusSection>
        <StatusGrid>
          {/* Enhancement Performance */}
          <StatusCard>
            <StatusIcon>🎯</StatusIcon>
            <StatusInfo>
              <StatusTitle>Enhancement Performance</StatusTitle>
              <StatusValue $color="#00ff00">
                {stats?.enhancement_success_rate || 0}% Success Rate
              </StatusValue>
              <StatusDetail>
                {stats?.successfully_enhanced || 0}/{stats?.total_processed || 0} articles enhanced
              </StatusDetail>
            </StatusInfo>
          </StatusCard>

          {/* Content Quality */}
          <StatusCard>
            <StatusIcon>📄</StatusIcon>
            <StatusInfo>
              <StatusTitle>Content Quality</StatusTitle>
              <StatusValue $color="#00ff00">
                {stats?.average_word_count || 0} avg words
              </StatusValue>
              <StatusDetail>
                {stats?.ready_for_keisha || 0} articles ready for Keisha
              </StatusDetail>
            </StatusInfo>
          </StatusCard>

          {/* Top Keywords */}
          <StatusCard>
            <StatusIcon>🏷️</StatusIcon>
            <StatusInfo>
              <StatusTitle>Top Keywords</StatusTitle>
              <KeywordsList>
                {Object.entries(summary.keywords || {})
                  .slice(0, 3)
                  .map(([keyword, count]) => (
                    <KeywordTag key={keyword}>
                      {keyword} ({count})
                    </KeywordTag>
                  ))
                }
              </KeywordsList>
            </StatusInfo>
          </StatusCard>

          {/* Keisha Analysis */}
          <StatusCard>
            <StatusIcon>🧠</StatusIcon>
            <StatusInfo>
              <StatusTitle>Keisha Analysis</StatusTitle>
              <StatusValue $color="#ffcc00">
                Ready for Analysis
              </StatusValue>
              <AnalyzeButton onClick={onAnalyzeClick}>
                Trigger Analysis
              </AnalyzeButton>
            </StatusInfo>
          </StatusCard>
        </StatusGrid>
      </SystemStatusSection>

      {/* Data Sources Status */}
      <DataSourcesSection>
        <SectionTitle>📊 Data Sources Status</SectionTitle>
        <SourcesGrid>
          <SourceCard $status="active">
            <SourceIcon>📰</SourceIcon>
            <SourceInfo>
              <SourceName>Critical Newsletters</SourceName>
              <SourceStatus>ACTIVE</SourceStatus>
              <SourceDetail>GitHub /docs folder</SourceDetail>
            </SourceInfo>
          </SourceCard>

          <SourceCard $status="active">
            <SourceIcon>🎯</SourceIcon>
            <SourceInfo>
              <SourceName>Hybrid Enhancement</SourceName>
              <SourceStatus>ACTIVE</SourceStatus>
              <SourceDetail>Full article fetching</SourceDetail>
            </SourceInfo>
          </SourceCard>

          <SourceCard $status="pending">
            <SourceIcon>🧠</SourceIcon>
            <SourceInfo>
              <SourceName>Keisha AI</SourceName>
              <SourceStatus>PENDING</SourceStatus>
              <SourceDetail>Backend connection needed</SourceDetail>
            </SourceInfo>
          </SourceCard>

          <SourceCard $status="active">
            <SourceIcon>📁</SourceIcon>
            <SourceInfo>
              <SourceName>Local Backup</SourceName>
              <SourceStatus>ACTIVE</SourceStatus>
              <SourceDetail>Fallback system</SourceDetail>
            </SourceInfo>
          </SourceCard>
        </SourcesGrid>
      </DataSourcesSection>

      {/* Last Updated */}
      <LastUpdated>
        Last updated: {new Date(summary.last_updated).toLocaleString()}
      </LastUpdated>
    </DashboardContainer>
  );
};

// Styled Components
const DashboardContainer = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
`;

const ThreatLevelSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 0, 0.3);
`;

const ThreatIcon = styled.div`
  font-size: 48px;
`;

const ThreatInfo = styled.div`
  flex: 1;
`;

const ThreatLevelText = styled.div`
  color: ${props => props.$color};
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 0 10px ${props => props.$color};
`;

const ThreatDetails = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
`;

const ThreatMeter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const MeterBar = styled.div`
  width: 100px;
  height: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid ${props => props.theme.colors.matrix};
  border-radius: 10px;
  overflow: hidden;
`;

const MeterFill = styled.div`
  width: ${props => props.$percentage}%;
  height: 100%;
  background: ${props => props.$color};
  box-shadow: 0 0 10px ${props => props.$color};
  transition: width 0.5s ease;
`;

const MeterLabel = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
`;

const SystemStatusSection = styled.div`
  margin-bottom: 24px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const StatusCard = styled.div`
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusIcon = styled.div`
  font-size: 24px;
`;

const StatusInfo = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatusValue = styled.div`
  color: ${props => props.$color};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatusDetail = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
`;

const KeywordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const KeywordTag = styled.span`
  background: rgba(0, 255, 0, 0.1);
  color: ${props => props.theme.colors.matrix};
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  border: 1px solid rgba(0, 255, 0, 0.3);
`;

const AnalyzeButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.matrix};
  border: 1px solid ${props => props.theme.colors.matrix};
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
  
  &:hover {
    background: rgba(0, 255, 0, 0.1);
  }
`;

const DataSourcesSection = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const SourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const SourceCard = styled.div`
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid ${props => {
    switch(props.$status) {
      case 'active': return 'rgba(0, 255, 0, 0.3)';
      case 'pending': return 'rgba(255, 204, 0, 0.3)';
      case 'error': return 'rgba(255, 0, 0, 0.3)';
      default: return 'rgba(0, 255, 0, 0.2)';
    }
  }};
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SourceIcon = styled.div`
  font-size: 20px;
`;

const SourceInfo = styled.div`
  flex: 1;
`;

const SourceName = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const SourceStatus = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 10px;
  margin-bottom: 2px;
`;

const SourceDetail = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 10px;
`;

const LastUpdated = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 255, 0, 0.2);
`;

export default ThreatLevelDashboard;
