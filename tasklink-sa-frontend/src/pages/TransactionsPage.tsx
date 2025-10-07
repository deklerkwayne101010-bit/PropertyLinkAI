import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const TransactionsContainer = styled.div`
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

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  min-width: 250px;
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    min-width: auto;
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-align: center;
`;

const SummaryValue = styled.div<{ type?: 'positive' | 'negative' | 'neutral' }>`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme, type }) => {
    switch (type) {
      case 'positive': return theme.colors.success;
      case 'negative': return theme.colors.error;
      default: return theme.colors.primary;
    }
  }};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const TransactionsTable = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const TransactionRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[2]};
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

const TransactionCell = styled.div<{ align?: 'left' | 'center' | 'right' }>`
  display: flex;
  align-items: center;
  justify-content: ${({ align }) => align || 'flex-start'};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text.primary};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: space-between;
    padding: ${({ theme }) => theme.spacing[1]} 0;

    &::before {
      content: attr(data-label);
      font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
      color: ${({ theme }) => theme.colors.gray[600]};
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

const TransactionTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TransactionMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const TransactionAmount = styled.div<{ type: 'credit' | 'debit' }>`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme, type }) =>
    type === 'credit' ? theme.colors.success : theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const TransactionStatus = styled.span<{ status: 'completed' | 'pending' | 'failed' }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  background: ${({ theme, status }) => {
    switch (status) {
      case 'completed': return theme.colors.success + '20';
      case 'pending': return theme.colors.warning + '20';
      case 'failed': return theme.colors.error + '20';
      default: return theme.colors.gray[100];
    }
  }};

  color: ${({ theme, status }) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'failed': return theme.colors.error;
      default: return theme.colors.gray[600];
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.gray[500]};
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

const TransactionsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('poster'); // TODO: Get from auth context

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Mock data
  const [summary] = useState({
    totalEarnings: 45230,
    totalSpent: 12850,
    pendingPayments: 2450,
    availableBalance: 32380
  });

  const [transactions] = useState([
    {
      id: 1,
      title: 'Job Payment - Website Development',
      description: 'Payment received for completed website development project',
      amount: 5000,
      type: 'credit' as const,
      status: 'completed' as const,
      date: '2024-01-15',
      reference: 'TXN-2024-001'
    },
    {
      id: 2,
      title: 'Withdrawal to Bank Account',
      description: 'Funds transferred to Standard Bank account',
      amount: -2000,
      type: 'debit' as const,
      status: 'completed' as const,
      date: '2024-01-10',
      reference: 'WD-2024-001'
    },
    {
      id: 3,
      title: 'Job Payment - Mobile App',
      description: 'Payment received for mobile application development',
      amount: 3500,
      type: 'credit' as const,
      status: 'completed' as const,
      date: '2024-01-08',
      reference: 'TXN-2024-002'
    },
    {
      id: 4,
      title: 'Platform Fee',
      description: 'Service fee for job posting',
      amount: -150,
      type: 'debit' as const,
      status: 'completed' as const,
      date: '2024-01-08',
      reference: 'FEE-2024-001'
    },
    {
      id: 5,
      title: 'Job Payment - Garden Maintenance',
      description: 'Payment received for garden maintenance service',
      amount: 800,
      type: 'credit' as const,
      status: 'pending' as const,
      date: '2024-01-05',
      reference: 'TXN-2024-003'
    },
    {
      id: 6,
      title: 'Deposit from Bank',
      description: 'Funds added to wallet from bank transfer',
      amount: 5000,
      type: 'credit' as const,
      status: 'completed' as const,
      date: '2024-01-03',
      reference: 'DEP-2024-001'
    }
  ]);

  useEffect(() => {
    // Simulate loading transactions
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

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.status !== 'all' && transaction.status !== filters.status) return false;
    if (filters.search && !transaction.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    // TODO: Add date filtering
    return true;
  });

  if (isLoading) {
    return (
      <TransactionsContainer>
        <LoadingSpinner />
      </TransactionsContainer>
    );
  }

  return (
    <TransactionsContainer>
      <Header>
        <div>
          <Title>Transaction History</Title>
          <Subtitle>View and manage all your payment transactions</Subtitle>
        </div>
      </Header>

      {/* Summary Cards */}
      <SummaryCards>
        <SummaryCard>
          <SummaryValue type="positive">
            R {summary.totalEarnings.toLocaleString('en-ZA')}
          </SummaryValue>
          <SummaryLabel>Total Earnings</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryValue type="negative">
            R {summary.totalSpent.toLocaleString('en-ZA')}
          </SummaryValue>
          <SummaryLabel>Total Spent</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryValue type="neutral">
            R {summary.pendingPayments.toLocaleString('en-ZA')}
          </SummaryValue>
          <SummaryLabel>Pending Payments</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryValue>
            R {summary.availableBalance.toLocaleString('en-ZA')}
          </SummaryValue>
          <SummaryLabel>Available Balance</SummaryLabel>
        </SummaryCard>
      </SummaryCards>

      {/* Filters */}
      <FiltersBar>
        <FilterGroup>
          <FilterLabel htmlFor="type">Transaction Type</FilterLabel>
          <Select
            id="type"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="credit">Credits (Earnings)</option>
            <option value="debit">Debits (Expenses)</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel htmlFor="status">Status</FilterLabel>
          <Select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
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

        <FilterGroup>
          <FilterLabel htmlFor="search">Search</FilterLabel>
          <SearchInput
            type="text"
            id="search"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </FilterGroup>
      </FiltersBar>

      {/* Transactions Table */}
      <TransactionsTable>
        <TableHeader>
          <div>Transaction</div>
          <div>Type</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Date</div>
        </TableHeader>

        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionRow key={transaction.id}>
              <TransactionCell data-label="Transaction">
                <div>
                  <TransactionTitle>{transaction.title}</TransactionTitle>
                  <TransactionMeta>{transaction.reference}</TransactionMeta>
                </div>
              </TransactionCell>
              <TransactionCell data-label="Type" align="center">
                {transaction.type === 'credit' ? 'Credit' : 'Debit'}
              </TransactionCell>
              <TransactionCell data-label="Amount" align="right">
                <TransactionAmount type={transaction.type}>
                  {transaction.type === 'credit' ? '+' : ''}R {Math.abs(transaction.amount).toLocaleString('en-ZA')}
                </TransactionAmount>
              </TransactionCell>
              <TransactionCell data-label="Status" align="center">
                <TransactionStatus status={transaction.status}>
                  {transaction.status}
                </TransactionStatus>
              </TransactionCell>
              <TransactionCell data-label="Date" align="center">
                {new Date(transaction.date).toLocaleDateString('en-ZA')}
              </TransactionCell>
            </TransactionRow>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon>💳</EmptyIcon>
            <EmptyTitle>No transactions found</EmptyTitle>
            <EmptyText>
              {filters.search || filters.type !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to see more transactions.'
                : 'Your transaction history will appear here once you start using TaskLink SA.'
              }
            </EmptyText>
          </EmptyState>
        )}
      </TransactionsTable>
    </TransactionsContainer>
  );
};

export default TransactionsPage;