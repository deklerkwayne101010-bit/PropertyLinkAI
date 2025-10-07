import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const MyJobsContainer = styled.div`
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

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const JobCard = styled(Link)`
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

const JobHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const JobTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  flex: 1;
`;

const JobStatus = styled.span<{ status: 'active' | 'completed' | 'draft' | 'cancelled' }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  background: ${({ theme, status }) => {
    switch (status) {
      case 'active': return theme.colors.success + '20';
      case 'completed': return theme.colors.info + '20';
      case 'draft': return theme.colors.warning + '20';
      case 'cancelled': return theme.colors.error + '20';
      default: return theme.colors.gray[100];
    }
  }};

  color: ${({ theme, status }) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'completed': return theme.colors.info;
      case 'draft': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.gray[600];
    }
  }};
`;

const JobDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: ${({ theme }) => theme.spacing[3]} 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
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

const JobActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const JobActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
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

const MyJobsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'drafts'>('active');

  // Mock data
  const [stats] = useState({
    active: 12,
    completed: 48,
    drafts: 3,
    totalEarnings: 45230
  });

  const [jobs] = useState({
    active: [
      {
        id: 1,
        title: 'Website Development for Local Business',
        description: 'Need a professional website for my small business. Looking for someone with experience in modern web technologies.',
        budget: 5000,
        location: 'Johannesburg, Gauteng',
        applications: 8,
        postedDate: '2024-01-15',
        deadline: '2024-02-15'
      },
      {
        id: 2,
        title: 'Garden Maintenance Service',
        description: 'Regular garden maintenance including lawn mowing, trimming, and general upkeep.',
        budget: 800,
        location: 'Cape Town, Western Cape',
        applications: 12,
        postedDate: '2024-01-10',
        deadline: '2024-01-25'
      }
    ],
    completed: [
      {
        id: 3,
        title: 'Mobile App Development',
        description: 'Cross-platform mobile application for inventory management.',
        budget: 15000,
        location: 'Durban, KwaZulu-Natal',
        completedDate: '2024-01-08',
        rating: 4.8
      },
      {
        id: 4,
        title: 'Logo Design Project',
        description: 'Professional logo design for a new startup company.',
        budget: 2500,
        location: 'Pretoria, Gauteng',
        completedDate: '2024-01-05',
        rating: 5.0
      }
    ],
    drafts: [
      {
        id: 5,
        title: 'Social Media Marketing Campaign',
        description: 'Comprehensive social media strategy and content creation for Q1 2024.',
        budget: 7500,
        location: 'Johannesburg, Gauteng',
        lastEdited: '2024-01-12'
      }
    ]
  });

  useEffect(() => {
    // Simulate loading jobs data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getCurrentJobs = () => {
    switch (activeTab) {
      case 'active': return jobs.active;
      case 'completed': return jobs.completed;
      case 'drafts': return jobs.drafts;
      default: return jobs.active;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'active': return `Active Jobs (${stats.active})`;
      case 'completed': return `Completed Jobs (${stats.completed})`;
      case 'drafts': return `Drafts (${stats.drafts})`;
      default: return tab;
    }
  };

  if (isLoading) {
    return (
      <MyJobsContainer>
        <LoadingSpinner />
      </MyJobsContainer>
    );
  }

  return (
    <MyJobsContainer>
      <Header>
        <div>
          <Title>My Jobs</Title>
          <Subtitle>Manage your posted jobs and track their progress</Subtitle>
        </div>
        <ActionButton to="/post-job">
          📝 Post New Job
        </ActionButton>
      </Header>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatValue>{stats.active}</StatValue>
          <StatLabel>Active Jobs</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.completed}</StatValue>
          <StatLabel>Completed Jobs</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.drafts}</StatValue>
          <StatLabel>Draft Jobs</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>R {stats.totalEarnings.toLocaleString('en-ZA')}</StatValue>
          <StatLabel>Total Earnings</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Tabs */}
      <TabsContainer>
        {(['active', 'completed', 'drafts'] as const).map((tab) => (
          <Tab
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {getTabLabel(tab)}
          </Tab>
        ))}
      </TabsContainer>

      {/* Jobs Grid */}
      <JobsGrid>
        {getCurrentJobs().length > 0 ? (
          getCurrentJobs().map((job) => (
            <JobCard key={job.id} to={`/jobs/${job.id}`}>
              <JobHeader>
                <JobTitle>{job.title}</JobTitle>
                <JobStatus status={activeTab === 'drafts' ? 'draft' : activeTab === 'completed' ? 'completed' : 'active'}>
                  {activeTab === 'drafts' ? 'Draft' : activeTab === 'completed' ? 'Completed' : 'Active'}
                </JobStatus>
              </JobHeader>

              <JobDescription>{job.description}</JobDescription>

              <JobMeta>
                <JobLocation>📍 {job.location}</JobLocation>
                <JobBudget>R {job.budget.toLocaleString('en-ZA')}</JobBudget>
              </JobMeta>

              {activeTab === 'active' && 'applications' in job && 'postedDate' in job && (
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
                  {job.applications} applications • Posted {new Date(job.postedDate).toLocaleDateString('en-ZA')}
                </div>
              )}

              {activeTab === 'completed' && 'completedDate' in job && 'rating' in job && (
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
                  Completed {new Date(job.completedDate).toLocaleDateString('en-ZA')} • ⭐ {job.rating}/5.0
                </div>
              )}

              {activeTab === 'drafts' && 'lastEdited' in job && (
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280' }}>
                  Last edited {new Date(job.lastEdited).toLocaleDateString('en-ZA')}
                </div>
              )}

              <JobActions>
                <JobActionButton variant="primary">
                  {activeTab === 'drafts' ? 'Edit Draft' : activeTab === 'completed' ? 'View Details' : 'Manage'}
                </JobActionButton>
                <JobActionButton>
                  {activeTab === 'drafts' ? 'Delete' : 'More Options'}
                </JobActionButton>
              </JobActions>
            </JobCard>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon>💼</EmptyIcon>
            <EmptyTitle>
              {activeTab === 'drafts' ? 'No draft jobs' : activeTab === 'completed' ? 'No completed jobs yet' : 'No active jobs'}
            </EmptyTitle>
            <EmptyText>
              {activeTab === 'drafts'
                ? 'Your draft jobs will appear here. Start creating a job posting to see it here.'
                : activeTab === 'completed'
                ? 'Jobs you\'ve completed will appear here once they\'re finished.'
                : 'Your active job postings will appear here. Post your first job to get started.'
              }
            </EmptyText>
            {activeTab === 'active' && (
              <ActionButton to="/post-job" style={{ marginTop: '16px' }}>
                📝 Post Your First Job
              </ActionButton>
            )}
          </EmptyState>
        )}
      </JobsGrid>
    </MyJobsContainer>
  );
};

export default MyJobsPage;