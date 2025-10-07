import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const DashboardContainer = styled.div`
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

const QuickActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ViewAllLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: underline;
  }
`;

const JobCard = styled(Link)`
  display: block;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.fast};
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}05;
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const JobTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const JobMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const JobLocation = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const JobBudget = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.success};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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

const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('poster'); // TODO: Get from auth context

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  const renderStatsCards = () => {
    if (userRole === 'poster') {
      return (
        <>
          <StatCard>
            <StatValue>12</StatValue>
            <StatLabel>Active Jobs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>48</StatValue>
            <StatLabel>Applications Received</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>R 2,450</StatValue>
            <StatLabel>Available Balance</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>4.8★</StatValue>
            <StatLabel>Average Rating</StatLabel>
          </StatCard>
        </>
      );
    } else {
      return (
        <>
          <StatCard>
            <StatValue>8</StatValue>
            <StatLabel>Active Applications</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>23</StatValue>
            <StatLabel>Completed Jobs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>R 8,750</StatValue>
            <StatLabel>Total Earnings</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>4.9★</StatValue>
            <StatLabel>Average Rating</StatLabel>
          </StatCard>
        </>
      );
    }
  };

  const renderMainContent = () => {
    if (userRole === 'poster') {
      return (
        <>
          <Section>
            <SectionHeader>
              <SectionTitle>Recent Job Activity</SectionTitle>
              <ViewAllLink to="/jobs">View All Jobs</ViewAllLink>
            </SectionHeader>
            <JobCard to="/jobs/1">
              <JobTitle>Website Development for Local Business</JobTitle>
              <JobMeta>
                <JobLocation>📍 Johannesburg, Gauteng</JobLocation>
                <JobBudget>R 5,000</JobBudget>
              </JobMeta>
            </JobCard>
            <JobCard to="/jobs/2">
              <JobTitle>Garden Maintenance Service</JobTitle>
              <JobMeta>
                <JobLocation>📍 Cape Town, Western Cape</JobLocation>
                <JobBudget>R 800</JobBudget>
              </JobMeta>
            </JobCard>
            <JobCard to="/jobs/3">
              <JobTitle>Car Detailing Service</JobTitle>
              <JobMeta>
                <JobLocation>📍 Durban, KwaZulu-Natal</JobLocation>
                <JobBudget>R 1,200</JobBudget>
              </JobMeta>
            </JobCard>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>New Applications</SectionTitle>
              <ViewAllLink to="/applications">View All Applications</ViewAllLink>
            </SectionHeader>
            <JobCard to="/applications/1">
              <JobTitle>Maria Johnson applied for Website Development</JobTitle>
              <JobMeta>
                <span>2 hours ago</span>
                <span>⭐ 4.7 rating</span>
              </JobMeta>
            </JobCard>
            <JobCard to="/applications/2">
              <JobTitle>John Smith applied for Garden Maintenance</JobTitle>
              <JobMeta>
                <span>4 hours ago</span>
                <span>⭐ 4.9 rating</span>
              </JobMeta>
            </JobCard>
          </Section>
        </>
      );
    } else {
      return (
        <>
          <Section>
            <SectionHeader>
              <SectionTitle>Recommended Jobs</SectionTitle>
              <ViewAllLink to="/jobs">Browse All Jobs</ViewAllLink>
            </SectionHeader>
            <JobCard to="/jobs/1">
              <JobTitle>Website Development for Local Business</JobTitle>
              <JobMeta>
                <JobLocation>📍 Johannesburg, Gauteng</JobLocation>
                <JobBudget>R 5,000</JobBudget>
              </JobMeta>
            </JobCard>
            <JobCard to="/jobs/2">
              <JobTitle>Garden Maintenance Service</JobTitle>
              <JobMeta>
                <JobLocation>📍 Cape Town, Western Cape</JobLocation>
                <JobBudget>R 800</JobBudget>
              </JobMeta>
            </JobCard>
            <JobCard to="/jobs/3">
              <JobTitle>Car Detailing Service</JobTitle>
              <JobMeta>
                <JobLocation>📍 Durban, KwaZulu-Natal</JobLocation>
                <JobBudget>R 1,200</JobBudget>
              </JobMeta>
            </JobCard>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Your Applications</SectionTitle>
              <ViewAllLink to="/my-applications">View All Applications</ViewAllLink>
            </SectionHeader>
            <JobCard to="/applications/1">
              <JobTitle>Website Development - Pending Review</JobTitle>
              <JobMeta>
                <span>Applied 2 days ago</span>
                <span>⏳ Under Review</span>
              </JobMeta>
            </JobCard>
            <JobCard to="/applications/2">
              <JobTitle>Garden Maintenance - Interview Scheduled</JobTitle>
              <JobMeta>
                <span>Applied 1 week ago</span>
                <span>📅 Interview: Tomorrow 2 PM</span>
              </JobMeta>
            </JobCard>
          </Section>
        </>
      );
    }
  };

  const renderSidebar = () => {
    if (userRole === 'poster') {
      return (
        <>
          <Section>
            <SectionTitle>Quick Actions</SectionTitle>
            <ActionButton to="/post-job" style={{ marginTop: '16px' }}>
              📝 Post New Job
            </ActionButton>
            <ActionButton to="/workers" style={{ backgroundColor: '#6B7280' }}>
              🔍 Browse Workers
            </ActionButton>
            <ActionButton to="/messages" style={{ backgroundColor: '#059669' }}>
              💬 Messages
            </ActionButton>
          </Section>

          <Section>
            <SectionTitle>Nearby Workers</SectionTitle>
            <EmptyState>
              <EmptyIcon>👥</EmptyIcon>
              <EmptyTitle>No workers nearby</EmptyTitle>
              <EmptyText>Expand your search radius to find more skilled workers in your area.</EmptyText>
            </EmptyState>
          </Section>
        </>
      );
    } else {
      return (
        <>
          <Section>
            <SectionTitle>Quick Actions</SectionTitle>
            <ActionButton to="/jobs" style={{ marginTop: '16px' }}>
              🔍 Browse Jobs
            </ActionButton>
            <ActionButton to="/profile" style={{ backgroundColor: '#6B7280' }}>
              👤 Update Profile
            </ActionButton>
            <ActionButton to="/earnings" style={{ backgroundColor: '#059669' }}>
              💰 View Earnings
            </ActionButton>
          </Section>

          <Section>
            <SectionTitle>Earnings This Month</SectionTitle>
            <StatValue style={{ fontSize: '24px', marginBottom: '8px' }}>R 3,250</StatValue>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              +12% from last month
            </div>
          </Section>
        </>
      );
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <div>
          <Title>Welcome back! 👋</Title>
          <Subtitle>
            {userRole === 'poster'
              ? "Here's what's happening with your jobs today."
              : "Here's what's new in your TaskLink SA account."
            }
          </Subtitle>
        </div>
        <QuickActions>
          {userRole === 'poster' ? (
            <ActionButton to="/post-job">📝 Post New Job</ActionButton>
          ) : (
            <ActionButton to="/jobs">🔍 Find Jobs</ActionButton>
          )}
          <ActionButton to="/messages">💬 Messages</ActionButton>
        </QuickActions>
      </Header>

      <StatsGrid>
        {renderStatsCards()}
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          {renderMainContent()}
        </MainContent>
        <Sidebar>
          {renderSidebar()}
        </Sidebar>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default DashboardPage;