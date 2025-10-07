import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const EarningsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1000px;
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

const SummaryCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.success} 0%, ${({ theme }) => theme.colors.primary} 100%);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

const EarningsBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const EarningsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const EarningsInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const EarningsIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const EarningsDetails = styled.div`
  flex: 1;
`;

const EarningsTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const EarningsMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EarningsAmount = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const TaxInfo = styled.div`
  background: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const TaxTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.warning};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const TaxText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const PayoutSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const PayoutItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const PayoutInfo = styled.div`
  flex: 1;
`;

const PayoutDate = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PayoutMethod = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const PayoutAmount = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
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

const EarningsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('doer'); // TODO: Get from auth context

  // Mock data
  const [earningsData] = useState({
    totalEarned: 8750,
    availableForPayout: 7200,
    pendingPayments: 1550,
    totalPaidOut: 6830,
    taxWithheld: 920,
    monthlyEarnings: [
      { month: 'Jan 2024', amount: 1200 },
      { month: 'Feb 2024', amount: 1800 },
      { month: 'Mar 2024', amount: 950 },
      { month: 'Apr 2024', amount: 2100 },
      { month: 'May 2024', amount: 2700 }
    ],
    recentPayouts: [
      { date: '2024-01-15', amount: 2000, method: 'Bank Transfer' },
      { date: '2023-12-15', amount: 1800, method: 'Bank Transfer' },
      { date: '2023-11-15', amount: 1600, method: 'Bank Transfer' }
    ]
  });

  useEffect(() => {
    // Simulate loading earnings data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <EarningsContainer>
        <LoadingSpinner />
      </EarningsContainer>
    );
  }

  return (
    <EarningsContainer>
      <Header>
        <div>
          <Title>My Earnings</Title>
          <Subtitle>Detailed breakdown of your earnings, payouts, and taxes</Subtitle>
        </div>
      </Header>

      {/* Summary Card */}
      <SummaryCard>
        <SummaryGrid>
          <SummaryItem>
            <SummaryValue>R {earningsData.totalEarned.toLocaleString('en-ZA')}</SummaryValue>
            <SummaryLabel>Total Earned</SummaryLabel>
          </SummaryItem>
          <SummaryItem>
            <SummaryValue>R {earningsData.availableForPayout.toLocaleString('en-ZA')}</SummaryValue>
            <SummaryLabel>Available for Payout</SummaryLabel>
          </SummaryItem>
          <SummaryItem>
            <SummaryValue>R {earningsData.pendingPayments.toLocaleString('en-ZA')}</SummaryValue>
            <SummaryLabel>Pending</SummaryLabel>
          </SummaryItem>
          <SummaryItem>
            <SummaryValue>R {earningsData.totalPaidOut.toLocaleString('en-ZA')}</SummaryValue>
            <SummaryLabel>Paid Out</SummaryLabel>
          </SummaryItem>
        </SummaryGrid>
      </SummaryCard>

      <ContentGrid>
        <MainContent>
          {/* Earnings Breakdown */}
          <Section>
            <SectionHeader>
              <SectionTitle>Earnings Breakdown</SectionTitle>
            </SectionHeader>

            <EarningsBreakdown>
              {earningsData.monthlyEarnings.map((earning, index) => (
                <EarningsItem key={index}>
                  <EarningsInfo>
                    <EarningsIcon>💰</EarningsIcon>
                    <EarningsDetails>
                      <EarningsTitle>{earning.month} Earnings</EarningsTitle>
                      <EarningsMeta>Completed jobs and bonuses</EarningsMeta>
                    </EarningsDetails>
                  </EarningsInfo>
                  <EarningsAmount>R {earning.amount.toLocaleString('en-ZA')}</EarningsAmount>
                </EarningsItem>
              ))}
            </EarningsBreakdown>

            <TaxInfo>
              <TaxTitle>💡 Tax Information</TaxTitle>
              <TaxText>
                South African tax regulations require withholding 15% VAT on service fees.
                Your total tax withheld this year: R {earningsData.taxWithheld.toLocaleString('en-ZA')}.
                This will be reflected in your IRP5 certificate at year-end.
              </TaxText>
            </TaxInfo>
          </Section>
        </MainContent>

        <Sidebar>
          {/* Recent Payouts */}
          <Section>
            <SectionHeader>
              <SectionTitle>Recent Payouts</SectionTitle>
            </SectionHeader>

            <PayoutSection>
              {earningsData.recentPayouts.map((payout, index) => (
                <PayoutItem key={index}>
                  <PayoutInfo>
                    <PayoutDate>{new Date(payout.date).toLocaleDateString('en-ZA')}</PayoutDate>
                    <PayoutMethod>{payout.method}</PayoutMethod>
                  </PayoutInfo>
                  <PayoutAmount>R {payout.amount.toLocaleString('en-ZA')}</PayoutAmount>
                </PayoutItem>
              ))}
            </PayoutSection>
          </Section>

          {/* Earnings Tips */}
          <Section>
            <SectionHeader>
              <SectionTitle>Earnings Tips</SectionTitle>
            </SectionHeader>

            <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
              <p><strong>💡 Complete more jobs:</strong> Focus on high-rated categories to increase your earnings potential.</p>
              <p><strong>⭐ Maintain high ratings:</strong> 5-star reviews lead to more job opportunities.</p>
              <p><strong>⏰ Respond quickly:</strong> Fast responses increase your chances of being selected.</p>
            </div>
          </Section>
        </Sidebar>
      </ContentGrid>
    </EarningsContainer>
  );
};

export default EarningsPage;