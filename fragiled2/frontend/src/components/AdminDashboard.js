import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import ThreatLevelDashboard from './ThreatLevelDashboard';
import apiService from '../services/api';

/**
 * Admin Dashboard - Internal stats and system monitoring
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, summaryResponse, statusResponse] = await Promise.all([
        apiService.getEnhancementStats(),
        apiService.getDailySummary(),
        apiService.getDataSourceStatus()
      ]);
      
      setStats(statsResponse.data);
      setDailySummary(summaryResponse.data);
      setSystemStatus(statusResponse.data);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminContainer>
        <LoadingMessage>Loading admin dashboard...</LoadingMessage>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Admin Header */}
      <AdminHeader>
        <AdminTitle>🎬 FNS ADMIN DASHBOARD</AdminTitle>
        <AdminSubtitle>System Monitoring & Performance Analytics</AdminSubtitle>
      </AdminHeader>

      {/* Threat Level Dashboard */}
      {dailySummary && (
        <ThreatLevelDashboard 
          summary={dailySummary}
          stats={stats}
          onAnalyzeClick={() => {}} // Remove trigger functionality
        />
      )}

      {/* Detailed Analytics */}
      <AnalyticsGrid>
        {/* System Performance */}
        <AnalyticsCard>
          <CardHeader>
            <CardIcon>⚡</CardIcon>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <MetricsList>
            <Metric>
              <MetricLabel>Enhancement Success Rate:</MetricLabel>
              <MetricValue $color="#00ff00">{stats?.enhancement_success_rate || 0}%</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Articles Processed Today:</MetricLabel>
              <MetricValue>{stats?.total_processed || 0}</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Average Content Quality:</MetricLabel>
              <MetricValue>{stats?.average_word_count || 0} words</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Keisha-Ready Articles:</MetricLabel>
              <MetricValue $color="#00ff00">{stats?.ready_for_keisha || 0}</MetricValue>
            </Metric>
          </MetricsList>
        </AnalyticsCard>

        {/* Data Sources Health */}
        <AnalyticsCard>
          <CardHeader>
            <CardIcon>📊</CardIcon>
            <CardTitle>Data Sources Health</CardTitle>
          </CardHeader>
          <SourcesList>
            <SourceItem $status={systemStatus?.critical_newsletter?.available ? 'active' : 'inactive'}>
              <SourceIcon>📰</SourceIcon>
              <SourceInfo>
                <SourceName>Critical Newsletters</SourceName>
                <SourceDetail>
                  {systemStatus?.critical_newsletter?.available ? 'ONLINE' : 'OFFLINE'} | 
                  {systemStatus?.critical_newsletter?.count || 0} articles
                </SourceDetail>
              </SourceInfo>
            </SourceItem>
            
            <SourceItem $status={systemStatus?.local_files?.available ? 'active' : 'inactive'}>
              <SourceIcon>📁</SourceIcon>
              <SourceInfo>
                <SourceName>Local Backup</SourceName>
                <SourceDetail>
                  {systemStatus?.local_files?.available ? 'ONLINE' : 'OFFLINE'} | 
                  {systemStatus?.local_files?.count || 0} articles
                </SourceDetail>
              </SourceInfo>
            </SourceItem>
            
            <SourceItem $status="pending">
              <SourceIcon>🧠</SourceIcon>
              <SourceInfo>
                <SourceName>Keisha AI</SourceName>
                <SourceDetail>Backend Integration Pending</SourceDetail>
              </SourceInfo>
            </SourceItem>
          </SourcesList>
        </AnalyticsCard>

        {/* Content Analytics */}
        <AnalyticsCard>
          <CardHeader>
            <CardIcon>📈</CardIcon>
            <CardTitle>Content Analytics</CardTitle>
          </CardHeader>
          <MetricsList>
            <Metric>
              <MetricLabel>Total Articles:</MetricLabel>
              <MetricValue>{dailySummary?.total_articles || 0}</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Average Severity:</MetricLabel>
              <MetricValue $color="#ff6600">{dailySummary?.average_severity || 0}%</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Max Severity:</MetricLabel>
              <MetricValue $color="#ff0000">{dailySummary?.max_severity || 0}%</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Threat Level:</MetricLabel>
              <MetricValue $color="#ff0000">{dailySummary?.overall_threat_level || 'UNKNOWN'}</MetricValue>
            </Metric>
          </MetricsList>
        </AnalyticsCard>

        {/* Top Keywords */}
        <AnalyticsCard>
          <CardHeader>
            <CardIcon>🏷️</CardIcon>
            <CardTitle>Top Keywords Today</CardTitle>
          </CardHeader>
          <KeywordsList>
            {Object.entries(dailySummary?.keywords || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([keyword, count]) => (
                <KeywordItem key={keyword}>
                  <KeywordName>{keyword}</KeywordName>
                  <KeywordCount>{count}</KeywordCount>
                </KeywordItem>
              ))
            }
          </KeywordsList>
        </AnalyticsCard>
      </AnalyticsGrid>

      {/* System Logs Preview */}
      <LogsSection>
        <LogsHeader>📋 Recent System Activity</LogsHeader>
        <LogsList>
          <LogItem>✅ Hybrid enhancement completed - {stats?.successfully_enhanced || 0} articles processed</LogItem>
          <LogItem>📰 Critical newsletter import successful - {systemStatus?.critical_newsletter?.count || 0} stories</LogItem>
          <LogItem>🧠 {stats?.ready_for_keisha || 0} articles ready for Keisha analysis</LogItem>
          <LogItem>⚡ System performance: {stats?.enhancement_success_rate || 0}% success rate</LogItem>
        </LogsList>
      </LogsSection>

      <AdminFooter>
        <FooterText>Last updated: {new Date().toLocaleString()}</FooterText>
        <FooterText>FNS Admin Dashboard v1.0</FooterText>
      </AdminFooter>
    </AdminContainer>
  );
};

// Styled Components
const AdminContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const AdminHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const AdminTitle = styled.h1`
  color: ${props => props.theme.colors.matrix};
  font-size: 32px;
  margin: 0 0 8px 0;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 15px rgba(0, 255, 0, 0.8);
`;

const AdminSubtitle = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 16px;
  font-family: 'Courier New', monospace;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  padding: 60px;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 32px 0;
`;

const AnalyticsCard = styled.div`
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const CardIcon = styled.div`
  font-size: 24px;
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Metric = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 255, 0, 0.1);
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
`;

const MetricValue = styled.span`
  color: ${props => props.$color || props.theme.colors.matrix};
  font-size: 16px;
  font-weight: bold;
`;

const SourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SourceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 255, 0, 0.05);
  border-radius: 8px;
  border: 1px solid ${props => {
    switch(props.$status) {
      case 'active': return 'rgba(0, 255, 0, 0.3)';
      case 'pending': return 'rgba(255, 204, 0, 0.3)';
      default: return 'rgba(255, 0, 0, 0.3)';
    }
  }};
`;

const SourceIcon = styled.div`
  font-size: 20px;
`;

const SourceInfo = styled.div`
  flex: 1;
`;

const SourceName = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const SourceDetail = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
`;

const KeywordsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
`;

const KeywordItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 255, 0, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 0, 0.2);
`;

const KeywordName = styled.span`
  color: ${props => props.theme.colors.matrix};
  font-size: 12px;
  font-weight: bold;
`;

const KeywordCount = styled.span`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
`;

const LogsSection = styled.div`
  margin: 32px 0;
  background: rgba(0, 20, 0, 0.9);
  border: 2px solid ${props => props.theme.colors.matrix};
  border-radius: 12px;
  padding: 24px;
`;

const LogsHeader = styled.h3`
  color: ${props => props.theme.colors.matrix};
  font-size: 18px;
  margin: 0 0 16px 0;
  font-family: 'Courier New', monospace;
`;

const LogsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LogItem = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 14px;
  font-family: 'Courier New', monospace;
  padding: 4px 0;
`;

const AdminFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 255, 0, 0.2);
`;

const FooterText = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  font-family: 'Courier New', monospace;
`;

export default AdminDashboard;
