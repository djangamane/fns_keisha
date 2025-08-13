import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

/**
 * Matrix-themed header with system status
 */
const Header = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Load system status
    loadSystemStatus();

    // Update system status every 30 seconds
    const statusInterval = setInterval(loadSystemStatus, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const loadSystemStatus = async () => {
    try {
      const [healthResponse, statusResponse] = await Promise.all([
        apiService.getHealth(),
        apiService.getDataSourceStatus()
      ]);

      setSystemStatus({
        health: healthResponse,
        dataSources: statusResponse.data
      });
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const getSystemStatusColor = () => {
    if (!systemStatus) return '#ffcc00';
    
    const criticalAvailable = systemStatus.dataSources?.critical_newsletter?.available;
    const localAvailable = systemStatus.dataSources?.local_files?.available;
    
    if (criticalAvailable && localAvailable) return '#00ff00';
    if (criticalAvailable || localAvailable) return '#ffcc00';
    return '#ff0000';
  };

  const getSystemStatusText = () => {
    if (!systemStatus) return 'CHECKING...';
    
    const criticalAvailable = systemStatus.dataSources?.critical_newsletter?.available;
    const localAvailable = systemStatus.dataSources?.local_files?.available;
    
    if (criticalAvailable && localAvailable) return 'ALL SYSTEMS OPERATIONAL';
    if (criticalAvailable || localAvailable) return 'PARTIAL SYSTEMS ONLINE';
    return 'SYSTEMS OFFLINE';
  };

  return (
    <HeaderContainer
      as={motion.header}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HeaderContent>
        {/* Logo and Title */}
        <LogoSection>
          <Logo to="/">
            <LogoIcon>🎬</LogoIcon>
            <LogoText>
              <MainTitle>FRAGILE NEWS SOURCE</MainTitle>
              <SubTitle>Matrix-Enhanced News Analysis</SubTitle>
            </LogoText>
          </Logo>
        </LogoSection>

        {/* System Status */}
        <StatusSection>
          <SystemTime>
            {currentTime.toLocaleTimeString()}
          </SystemTime>
          
          <SystemStatus $color={getSystemStatusColor()}>
            <StatusIndicator $color={getSystemStatusColor()} />
            <StatusText>{getSystemStatusText()}</StatusText>
          </SystemStatus>

          {systemStatus && (
            <DataSourcesStatus>
              <SourceStatus 
                $active={systemStatus.dataSources?.critical_newsletter?.available}
                title="Critical Newsletter Data"
              >
                📰
              </SourceStatus>
              <SourceStatus 
                $active={systemStatus.dataSources?.local_files?.available}
                title="Local Backup Data"
              >
                📁
              </SourceStatus>
              <SourceStatus 
                $active={false}
                title="Keisha AI Analysis"
              >
                🧠
              </SourceStatus>
            </DataSourcesStatus>
          )}
        </StatusSection>
      </HeaderContent>

      {/* Navigation */}
      <Navigation>
        <NavLink to="/" $active>
          📰 News
        </NavLink>
        <NavLink to="/admin">
          📊 Admin
        </NavLink>
      </Navigation>

      {/* Matrix Effect Border */}
      <MatrixBorder />
    </HeaderContainer>
  );
};

// Styled Components
const HeaderContainer = styled.header`
  background: rgba(0, 20, 0, 0.95);
  border-bottom: 2px solid ${props => props.theme.colors.matrix};
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
`;

const LogoIcon = styled.div`
  font-size: 32px;
  filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.5));
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
`;

const MainTitle = styled.h1`
  color: ${props => props.theme.colors.matrix};
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  font-family: 'Courier New', monospace;
`;

const SubTitle = styled.div`
  color: ${props => props.theme.colors.matrixDim};
  font-size: 12px;
  margin-top: 2px;
  font-family: 'Courier New', monospace;
`;

const StatusSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const SystemTime = styled.div`
  color: ${props => props.theme.colors.matrix};
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
`;

const SystemStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.$color};
  font-size: 12px;
  font-weight: bold;
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
  box-shadow: 0 0 10px ${props => props.$color};
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

const StatusText = styled.span`
  font-family: 'Courier New', monospace;
`;

const DataSourcesStatus = styled.div`
  display: flex;
  gap: 8px;
`;

const SourceStatus = styled.div`
  font-size: 16px;
  opacity: ${props => props.$active ? 1 : 0.3};
  filter: ${props => props.$active ? 
    'drop-shadow(0 0 5px rgba(0, 255, 0, 0.8))' : 
    'grayscale(100%)'
  };
  cursor: help;
`;

const Navigation = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 12px;
  display: flex;
  gap: 24px;
  border-top: 1px solid rgba(0, 255, 0, 0.2);
  padding-top: 12px;
`;

const NavLink = styled(Link)`
  color: ${props => props.$active ? 
    props.theme.colors.matrix : 
    props.theme.colors.matrixDim
  };
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  
  &:hover {
    color: ${props => props.theme.colors.matrix};
    border-color: ${props => props.theme.colors.matrix};
    background: rgba(0, 255, 0, 0.1);
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
`;

const MatrixBorder = styled.div`
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    ${props => props.theme.colors.matrix} 50%,
    transparent 100%
  );
  animation: scan 3s ease-in-out infinite;
  
  @keyframes scan {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
`;

export default Header;
