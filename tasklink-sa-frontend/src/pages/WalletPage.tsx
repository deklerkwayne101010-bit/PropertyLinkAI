import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const WalletContainer = styled.div`
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

const BalanceCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const BalanceLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const BalanceAmount = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin: ${({ theme }) => theme.spacing[2]} 0;
`;

const BalanceSubtext = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme, variant }) =>
    variant === 'secondary' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${({ theme, variant }) =>
    variant === 'secondary' ? theme.colors.white : theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ theme, variant }) =>
      variant === 'secondary' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 1)'};
    transform: translateY(-1px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
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

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}05;
  }
`;

const TransactionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const TransactionIcon = styled.div<{ type: 'credit' | 'debit' }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, type }) =>
    type === 'credit' ? theme.colors.success + '20' : theme.colors.error + '20'};
  color: ${({ theme, type }) =>
    type === 'credit' ? theme.colors.success : theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const TransactionDetails = styled.div`
  flex: 1;
`;

const TransactionTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const TransactionMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TransactionAmount = styled.div<{ type: 'credit' | 'debit' }>`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme, type }) =>
    type === 'credit' ? theme.colors.success : theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const PaymentMethodCard = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PaymentMethodInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const PaymentMethodIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
`;

const PaymentMethodDetails = styled.div`
  flex: 1;
`;

const PaymentMethodName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PaymentMethodMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const PaymentMethodActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const PaymentMethodButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
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

const WithdrawalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Input = styled.input`
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

const WithdrawButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing[2]};

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[400]};
    cursor: not-allowed;
  }
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

const WalletPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('poster'); // TODO: Get from auth context

  // Mock data
  const [balance, setBalance] = useState(2450.75);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  const [transactions] = useState([
    {
      id: 1,
      type: 'credit' as const,
      title: 'Job Payment - Website Development',
      amount: 5000,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: 2,
      type: 'debit' as const,
      title: 'Withdrawal to Bank Account',
      amount: -2000,
      date: '2024-01-10',
      status: 'completed'
    },
    {
      id: 3,
      type: 'credit' as const,
      title: 'Job Payment - Mobile App',
      amount: 3500,
      date: '2024-01-08',
      status: 'completed'
    },
    {
      id: 4,
      type: 'debit' as const,
      title: 'Platform Fee',
      amount: -150,
      date: '2024-01-08',
      status: 'completed'
    }
  ]);

  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'bank',
      name: 'Standard Bank',
      account: '**** 1234',
      isDefault: true
    },
    {
      id: 2,
      type: 'card',
      name: 'Visa **** 5678',
      account: 'Expires 12/26',
      isDefault: false
    }
  ]);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: 'bank',
    accountId: '1'
  });

  useEffect(() => {
    // Simulate loading wallet data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement withdrawal logic
    console.log('Withdrawal request:', withdrawalForm);
  };

  const handleFormChange = (field: string, value: string) => {
    setWithdrawalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <WalletContainer>
        <LoadingSpinner />
      </WalletContainer>
    );
  }

  return (
    <WalletContainer>
      <Header>
        <div>
          <Title>My Wallet</Title>
          <Subtitle>Manage your funds, payments, and withdrawals</Subtitle>
        </div>
      </Header>

      {/* Balance Card */}
      <BalanceCard>
        <BalanceHeader>
          <div>
            <BalanceLabel>Available Balance</BalanceLabel>
            <BalanceAmount>R {balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</BalanceAmount>
            <BalanceSubtext>
              {pendingWithdrawals > 0 && `R ${pendingWithdrawals.toLocaleString('en-ZA')} pending withdrawal`}
            </BalanceSubtext>
          </div>
        </BalanceHeader>

        <ActionButtons>
          <ActionButton onClick={() => {/* TODO: Open withdrawal modal */}}>
            Withdraw Funds
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {/* TODO: Open deposit modal */}}>
            Add Funds
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {/* TODO: Navigate to transactions */}}>
            View History
          </ActionButton>
        </ActionButtons>
      </BalanceCard>

      <ContentGrid>
        <MainContent>
          {/* Recent Transactions */}
          <Section>
            <SectionHeader>
              <SectionTitle>Recent Transactions</SectionTitle>
            </SectionHeader>

            <TransactionList>
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id}>
                  <TransactionInfo>
                    <TransactionIcon type={transaction.type}>
                      {transaction.type === 'credit' ? '↓' : '↑'}
                    </TransactionIcon>
                    <TransactionDetails>
                      <TransactionTitle>{transaction.title}</TransactionTitle>
                      <TransactionMeta>
                        {new Date(transaction.date).toLocaleDateString('en-ZA')} • {transaction.status}
                      </TransactionMeta>
                    </TransactionDetails>
                  </TransactionInfo>
                  <TransactionAmount type={transaction.type}>
                    {transaction.type === 'credit' ? '+' : ''}R {Math.abs(transaction.amount).toLocaleString('en-ZA')}
                  </TransactionAmount>
                </TransactionItem>
              ))}
            </TransactionList>
          </Section>
        </MainContent>

        <Sidebar>
          {/* Payment Methods */}
          <Section>
            <SectionHeader>
              <SectionTitle>Payment Methods</SectionTitle>
            </SectionHeader>

            {paymentMethods.map((method) => (
              <PaymentMethodCard key={method.id}>
                <PaymentMethodInfo>
                  <PaymentMethodIcon>
                    {method.type === 'bank' ? '🏦' : '💳'}
                  </PaymentMethodIcon>
                  <PaymentMethodDetails>
                    <PaymentMethodName>{method.name}</PaymentMethodName>
                    <PaymentMethodMeta>{method.account}</PaymentMethodMeta>
                  </PaymentMethodDetails>
                </PaymentMethodInfo>
                <PaymentMethodActions>
                  {method.isDefault && (
                    <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '500' }}>
                      Default
                    </span>
                  )}
                  <PaymentMethodButton variant="secondary">
                    Edit
                  </PaymentMethodButton>
                </PaymentMethodActions>
              </PaymentMethodCard>
            ))}

            <PaymentMethodButton variant="primary" style={{ width: '100%', marginTop: '16px' }}>
              Add Payment Method
            </PaymentMethodButton>
          </Section>

          {/* Quick Withdrawal */}
          <Section>
            <SectionHeader>
              <SectionTitle>Quick Withdrawal</SectionTitle>
            </SectionHeader>

            <WithdrawalForm onSubmit={handleWithdrawalSubmit}>
              <FormGroup>
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input
                  type="number"
                  id="amount"
                  placeholder="Enter amount"
                  min="100"
                  max={balance}
                  step="10"
                  value={withdrawalForm.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  id="method"
                  value={withdrawalForm.method}
                  onChange={(e) => handleFormChange('method', e.target.value)}
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card Transfer</option>
                </Select>
              </FormGroup>

              <WithdrawButton
                type="submit"
                disabled={!withdrawalForm.amount || parseFloat(withdrawalForm.amount) < 100}
              >
                Request Withdrawal
              </WithdrawButton>
            </WithdrawalForm>
          </Section>
        </Sidebar>
      </ContentGrid>
    </WalletContainer>
  );
};

export default WalletPage;