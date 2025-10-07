import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const AnalyticsContainer = styled.div`
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

const FiltersBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background: ${({ theme }) => theme.colors.white};
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const DateInput = styled.input`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-align: center;
`;

const MetricValue = styled.div<{ trend?: 'up' | 'down' | 'neutral' }>`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme, trend }) => {
    switch (trend) {
      case 'up': return theme.colors.success;
      case 'down': return theme.colors.error;
      default: return theme.colors.primary;
    }
  }};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const MetricChange = styled.div<{ trend: 'up' | 'down' | 'neutral' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, trend }) => {
    switch (trend) {
      case 'up': return theme.colors.success;
      case 'down': return theme.colors.error;
      default: return theme.colors.gray[600];
    }
  }};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  border: 2px dashed ${({ theme }) => theme.colors.gray[300]};
`;

const InsightsList = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const InsightsHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const InsightsTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const InsightsSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

const InsightIcon = styled.div<{ type: 'positive' | 'negative' | 'neutral' }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: bold;

  background: ${({ theme, type }) => {
    switch (type) {
      case 'positive': return theme.colors.success + '20';
      case 'negative': return theme.colors.error + '20';
      default: return theme.colors.warning + '20';
    }
  }};

  color: ${({ theme, type }) => {
    switch (type) {
      case 'positive': return theme.colors.success;
      case 'negative': return theme.colors.error;
      default: return theme.colors.warning;
    }
  }};
`;

const InsightContent = styled.div`
  flex: 1;
`;

const InsightText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const InsightMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
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

const AnalyticsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('poster'); // TODO: Get from auth context

  // Filter states
  const [filters, setFilters] = useState({
    period: '30days',
    dateFrom: '',
    dateTo: ''
  });

  // Mock data
  const [metrics] = useState({
    poster: {
      totalJobs: 48,
      activeJobs: 12,
      completedJobs: 36,
      totalEarnings: 45230,
      avgJobValue: 1250,
      responseRate: 87,
      completionRate: 92
    },
    doer: {
      applicationsSent: 24,
      applicationsAccepted: 8,
      jobsCompleted: 23,
      totalEarnings: 8750,
      avgJobRate: 380,
      successRate: 33,
      avgRating: 4.9
    }
  });

  const [insights] = useState([
    {
      type: 'positive' as const,
      text: 'Your job completion rate has increased by 15% this month',
      meta: 'vs last month'
    },
    {
      type: 'positive' as const,
      text: 'Average response time to applications improved by 2 hours',
      meta: 'Performance boost'
    },
    {
      type: 'neutral' as const,
      text: 'Most popular job category: Web Development',
      meta: 'Based on applications received'
    },
    {
      type: 'negative' as const,
      text: '3 jobs expired without receiving applications',
      meta: 'Consider extending deadlines'
    }
  ]);

  useEffect(() => {
    // Simulate loading analytics data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const currentMetrics = userRole === 'poster' ? metrics.poster : metrics.doer as any;

  if (isLoading) {
    return (
      <AnalyticsContainer>
        <LoadingSpinner />
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <Header>
        <div>
          <Title>Analytics Dashboard</Title>
          <Subtitle>Track your performance and business insights</Subtitle>
        </div>
      </Header>

      {/* Filters */}
      <FiltersBar>
        <FilterGroup>
          <FilterLabel htmlFor="period">Time Period</FilterLabel>
          <Select
            id="period"
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel htmlFor="dateFrom">From Date</FilterLabel>
          <DateInput
            type="date"
            id="dateFrom"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel htmlFor="dateTo">To Date</FilterLabel>
          <DateInput
            type="date"
            id="dateTo"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </FilterGroup>
      </FiltersBar>

      {/* Key Metrics */}
      <MetricsGrid>
        {userRole === 'poster' ? (
          <>
            <MetricCard>
              <MetricValue trend="up">{currentMetrics.totalJobs}</MetricValue>
              <MetricLabel>Total Jobs Posted</MetricLabel>
              <MetricChange trend="up">+12% from last month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue>{currentMetrics.activeJobs}</MetricValue>
              <MetricLabel>Active Jobs</MetricLabel>
              <MetricChange trend="neutral">Same as last month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue trend="up">R {currentMetrics.totalEarnings.toLocaleString('en-ZA')}</MetricValue>
              <MetricLabel>Total Earnings</MetricLabel>
              <MetricChange trend="up">+8% from last month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue>{currentMetrics.responseRate}%</MetricValue>
              <MetricLabel>Response Rate</MetricLabel>
              <MetricChange trend="up">+5% from last month</MetricChange>
            </MetricCard>
          </>
        ) : (
          <>
            <MetricCard>
              <MetricValue>{currentMetrics.applicationsSent}</MetricValue>
              <MetricLabel>Applications Sent</MetricLabel>
              <MetricChange trend="up">+3 this month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue trend="up">{currentMetrics.jobsCompleted}</MetricValue>
              <MetricLabel>Jobs Completed</MetricLabel>
              <MetricChange trend="up">+2 from last month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue trend="up">R {currentMetrics.totalEarnings.toLocaleString('en-ZA')}</MetricValue>
              <MetricLabel>Total Earnings</MetricLabel>
              <MetricChange trend="up">+15% from last month</MetricChange>
            </MetricCard>
            <MetricCard>
              <MetricValue>{currentMetrics.successRate}%</MetricValue>
              <MetricLabel>Success Rate</MetricLabel>
              <MetricChange trend="up">+8% from last month</MetricChange>
            </MetricCard>
          </>
        )}
      </MetricsGrid>

      {/* Charts */}
      <ChartsGrid>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              {userRole === 'poster' ? 'Job Performance Trends' : 'Earnings Trends'}
            </ChartTitle>
          </ChartHeader>
          <ChartPlaceholder>
            📊 Chart will be displayed here
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              {userRole === 'poster' ? 'Applications by Category' : 'Applications by Status'}
            </ChartTitle>
          </ChartHeader>
          <ChartPlaceholder>
            📈 Chart will be displayed here
          </ChartPlaceholder>
        </ChartCard>
      </ChartsGrid>

      {/* Insights */}
      <InsightsList>
        <InsightsHeader>
          <InsightsTitle>Key Insights</InsightsTitle>
          <InsightsSubtitle>AI-powered insights to help you improve</InsightsSubtitle>
        </InsightsHeader>

        {insights.map((insight, index) => (
          <InsightItem key={index}>
            <InsightIcon type={insight.type}>
              {insight.type === 'positive' ? '↑' : insight.type === 'negative' ? '↓' : '→'}
            </InsightIcon>
            <InsightContent>
              <InsightText>{insight.text}</InsightText>
              <InsightMeta>{insight.meta}</InsightMeta>
            </InsightContent>
          </InsightItem>
        ))}
      </InsightsList>
    </AnalyticsContainer>
  );
};

export default AnalyticsPage;