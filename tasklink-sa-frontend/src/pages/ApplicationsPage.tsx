import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

interface Application {
  id: number;
  jobTitle: string;
  jobId: number;
  description: string;
  budget: number;
  location: string;
  appliedDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  acceptedDate?: string;
  rejectedDate?: string;
}

interface ApplicationsData {
  sent: Application[];
  accepted: Application[];
  rejected: Application[];
}

const ApplicationsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: ${({ theme }) => theme.spacing[2]} 0 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ActionButton = styled(Link)`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: none;
  border: none;
  border-bottom: 2px solid ${({ theme, active }) =>
    active ? theme.colors.primary : 'transparent'};
  color: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.gray[600]};
  font-weight: ${({ theme, active }) =>
    active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ApplicationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const ApplicationCard = styled(Link)`
  display: block;
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ApplicationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const ApplicationTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  flex: 1;
`;

const ApplicationStatus = styled.span<{ status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  background: ${({ theme, status }) => {
    switch (status) {
      case 'accepted': return theme.colors.success + '20';
      case 'rejected': return theme.colors.error + '20';
      case 'pending': return theme.colors.warning + '20';
      case 'withdrawn': return theme.colors.gray[100];
      default: return theme.colors.gray[100];
    }
  }};

  color: ${({ theme, status }) => {
    switch (status) {
      case 'accepted': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      case 'withdrawn': return theme.colors.gray[600];
      default: return theme.colors.gray[600];
    }
  }};
`;

const ApplicationDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: ${({ theme }) => theme.spacing[3]} 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ApplicationMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ApplicationLocation = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ApplicationBudget = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.success};
`;

const ApplicationActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const ApplicationActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.white : theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, variant }) =>
      variant === 'primary' ? theme.colors.secondary : theme.colors.primary + '10'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.gray[500]};
  grid-column: 1 / -1;
`;

const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ApplicationsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sent' | 'accepted' | 'rejected'>('sent');

  // Mock data
  const [stats] = useState({
    sent: 24,
    accepted: 8,
    rejected: 12,
    successRate: 33
  });

  const [applications] = useState<ApplicationsData>({
    sent: [
      {
        id: 1,
        jobTitle: 'Website Development for Local Business',
        jobId: 1,
        description: 'I have 5+ years of experience in web development and can deliver this project within the specified timeline.',
        budget: 5000,
        location: 'Johannesburg, Gauteng',
        appliedDate: '2024-01-15',
        status: 'pending'
      },
      {
        id: 2,
        jobTitle: 'Garden Maintenance Service',
        jobId: 2,
        description: 'Professional gardener with equipment. Available for weekly or monthly maintenance contracts.',
        budget: 800,
        location: 'Cape Town, Western Cape',
        appliedDate: '2024-01-10',
        status: 'pending'
      }
    ],
    accepted: [
      {
        id: 3,
        jobTitle: 'Mobile App Development',
        jobId: 3,
        description: 'Cross-platform mobile application development using React Native.',
        budget: 15000,
        location: 'Durban, KwaZulu-Natal',
        appliedDate: '2024-01-08',
        acceptedDate: '2024-01-09',
        status: 'accepted'
      }
    ],
    rejected: [
      {
        id: 4,
        jobTitle: 'Logo Design Project',
        jobId: 4,
        description: 'Creative logo design for a new startup company.',
        budget: 2500,
        location: 'Pretoria, Gauteng',
        appliedDate: '2024-01-05',
        rejectedDate: '2024-01-07',
        status: 'rejected'
      }
    ]
  });

  useEffect(() => {
    // Simulate loading applications data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getCurrentApplications = () => {
    switch (activeTab) {
      case 'sent': return applications.sent;
      case 'accepted': return applications.accepted;
      case 'rejected': return applications.rejected;
      default: return applications.sent;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'sent': return `Sent Applications (${stats.sent})`;
      case 'accepted': return `Accepted (${stats.accepted})`;
      case 'rejected': return `Rejected (${stats.rejected})`;
      default: return tab;
    }
  };

  if (isLoading) {
    return (
      <ApplicationsContainer>
        <LoadingSpinner />
      </ApplicationsContainer>
    );
  }

  return (
    <ApplicationsContainer>
      <Header>
        <div>
          <Title>My Applications</Title>
          <Subtitle>Track and manage your job applications</Subtitle>
        </div>
        <ActionButton to="/jobs">
          🔍 Browse More Jobs
        </ActionButton>
      </Header>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatValue>{stats.sent}</StatValue>
          <StatLabel>Applications Sent</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.accepted}</StatValue>
          <StatLabel>Accepted</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.rejected}</StatValue>
          <StatLabel>Rejected</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.successRate}%</StatValue>
          <StatLabel>Success Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Tabs */}
      <TabsContainer>
        {(['sent', 'accepted', 'rejected'] as const).map((tab) => (
          <Tab
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {getTabLabel(tab)}
          </Tab>
        ))}
      </TabsContainer>

      {/* Applications Grid */}
      <ApplicationsGrid>
        {getCurrentApplications().length > 0 ? (
          getCurrentApplications().map((application) => (
            <ApplicationCard key={application.id} to={`/jobs/${application.jobId}`}>
              <ApplicationHeader>
                <ApplicationTitle>{application.jobTitle}</ApplicationTitle>
                <ApplicationStatus status={application.status}>
                  {application.status === 'pending' ? 'Under Review' :
                   application.status === 'accepted' ? 'Accepted' :
                   application.status === 'rejected' ? 'Rejected' : application.status}
                </ApplicationStatus>
              </ApplicationHeader>

              <ApplicationDescription>{application.description}</ApplicationDescription>

              <ApplicationMeta>
                <ApplicationLocation>📍 {application.location}</ApplicationLocation>
                <ApplicationBudget>R {application.budget.toLocaleString('en-ZA')}</ApplicationBudget>
              </ApplicationMeta>

              <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
                Applied {new Date(application.appliedDate).toLocaleDateString('en-ZA')}
                {application.status === 'accepted' && 'acceptedDate' in application && (
                  <> • Accepted {new Date(application.acceptedDate as string).toLocaleDateString('en-ZA')}</>
                )}
                {application.status === 'rejected' && 'rejectedDate' in application && (
                  <> • Rejected {new Date(application.rejectedDate as string).toLocaleDateString('en-ZA')}</>
                )}
              </div>

              <ApplicationActions>
                <ApplicationActionButton variant="primary">
                  View Job Details
                </ApplicationActionButton>
                {application.status === 'accepted' && (
                  <ApplicationActionButton>
                    Start Work
                  </ApplicationActionButton>
                )}
                {application.status === 'pending' && (
                  <ApplicationActionButton>
                    Withdraw Application
                  </ApplicationActionButton>
                )}
              </ApplicationActions>
            </ApplicationCard>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon>📋</EmptyIcon>
            <EmptyTitle>
              {activeTab === 'sent' ? 'No applications sent yet' :
               activeTab === 'accepted' ? 'No accepted applications' :
               'No rejected applications'}
            </EmptyTitle>
            <EmptyText>
              {activeTab === 'sent'
                ? 'Your sent applications will appear here. Start applying to jobs to see them here.'
                : activeTab === 'accepted'
                ? 'Accepted applications will appear here once employers approve your proposals.'
                : 'Rejected applications will appear here. Don\'t give up - keep applying to other opportunities!'
              }
            </EmptyText>
            {activeTab === 'sent' && (
              <ActionButton to="/jobs" style={{ marginTop: '16px' }}>
                🔍 Find Jobs to Apply
              </ActionButton>
            )}
          </EmptyState>
        )}
      </ApplicationsGrid>
    </ApplicationsContainer>
  );
};

export default ApplicationsPage;

export {};