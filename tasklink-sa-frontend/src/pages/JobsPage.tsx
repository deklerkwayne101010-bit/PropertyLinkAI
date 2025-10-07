import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const JobsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
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

const SearchSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: end;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
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

const SearchButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const FiltersSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
  align-items: center;
`;

const FilterChip = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background-color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.gray[100]};
  color: ${({ active, theme }) => active ? theme.colors.white : theme.colors.gray[700]};
  border: 1px solid ${({ active, theme }) => active ? theme.colors.primary : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ active, theme }) => active ? theme.colors.secondary : theme.colors.gray[200]};
    border-color: ${({ active, theme }) => active ? theme.colors.secondary : theme.colors.gray[400]};
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ResultsCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.white};
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[4]};
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
    transform: translateY(-4px);
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
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  line-height: 1.3;
`;

const JobBudget = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
  text-align: right;
`;

const JobDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const JobMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const JobLocation = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const JobTime = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const JobCategory = styled.span`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 40px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
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
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const ClearFiltersButton = styled.button`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const JobsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const categories = [
    'All Categories',
    'Home Services',
    'Automotive',
    'Technology',
    'Health & Beauty',
    'Education',
    'Events',
    'Other'
  ];

  const locations = [
    'All Locations',
    'Johannesburg',
    'Cape Town',
    'Durban',
    'Pretoria',
    'Port Elizabeth',
    'Bloemfontein'
  ];

  const filterOptions = [
    'Under R500',
    'R500 - R2000',
    'R2000 - R5000',
    'Over R5000',
    'Urgent',
    'Remote Work'
  ];

  useEffect(() => {
    loadJobs();
  }, [searchQuery, selectedCategory, selectedLocation, sortBy, activeFilters]);

  const loadJobs = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data
    const mockJobs = [
      {
        id: 1,
        title: 'Website Development for Local Business',
        description: 'Looking for an experienced web developer to create a modern, responsive website for our small business. We need a homepage, about page, services page, and contact form.',
        category: 'Technology',
        location: 'Johannesburg, Gauteng',
        budget: 'R 5,000 - R 8,000',
        budgetMin: 5000,
        postedAt: '2 hours ago',
        urgent: false,
        remote: true
      },
      {
        id: 2,
        title: 'Garden Maintenance Service',
        description: 'Need someone to maintain our garden weekly. Tasks include mowing lawn, trimming hedges, watering plants, and general upkeep.',
        category: 'Home Services',
        location: 'Cape Town, Western Cape',
        budget: 'R 800 - R 1,200',
        budgetMin: 800,
        postedAt: '4 hours ago',
        urgent: false,
        remote: false
      },
      {
        id: 3,
        title: 'Car Detailing Service',
        description: 'Professional car detailing service needed for luxury vehicle. Interior and exterior cleaning, waxing, and polishing required.',
        category: 'Automotive',
        location: 'Durban, KwaZulu-Natal',
        budget: 'R 1,500 - R 2,500',
        budgetMin: 1500,
        postedAt: '6 hours ago',
        urgent: true,
        remote: false
      },
      {
        id: 4,
        title: 'Social Media Marketing',
        description: 'Create and manage social media content for our fashion brand. Need someone with experience in Instagram, Facebook, and TikTok marketing.',
        category: 'Technology',
        location: 'Pretoria, Gauteng',
        budget: 'R 3,000 - R 6,000',
        budgetMin: 3000,
        postedAt: '1 day ago',
        urgent: false,
        remote: true
      },
      {
        id: 5,
        title: 'House Cleaning Service',
        description: 'Deep cleaning service needed for 3-bedroom house. Includes all rooms, kitchen, bathrooms, and general tidying.',
        category: 'Home Services',
        location: 'Port Elizabeth, Eastern Cape',
        budget: 'R 600 - R 900',
        budgetMin: 600,
        postedAt: '2 days ago',
        urgent: false,
        remote: false
      },
      {
        id: 6,
        title: 'Logo Design for Startup',
        description: 'Design a modern, professional logo for our tech startup. We need logo variations, brand colors, and basic brand guidelines.',
        category: 'Technology',
        location: 'Cape Town, Western Cape',
        budget: 'R 2,000 - R 4,000',
        budgetMin: 2000,
        postedAt: '3 days ago',
        urgent: false,
        remote: true
      }
    ];

    setJobs(mockJobs);
    setIsLoading(false);
  };

  const handleSearch = () => {
    loadJobs();
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  const filteredJobs = jobs.filter(job => {
    // Apply active filters
    if (activeFilters.includes('Under R500') && job.budgetMin >= 500) return false;
    if (activeFilters.includes('R500 - R2000') && (job.budgetMin < 500 || job.budgetMin > 2000)) return false;
    if (activeFilters.includes('R2000 - R5000') && (job.budgetMin < 2000 || job.budgetMin > 5000)) return false;
    if (activeFilters.includes('Over R5000') && job.budgetMin <= 5000) return false;
    if (activeFilters.includes('Urgent') && !job.urgent) return false;
    if (activeFilters.includes('Remote Work') && !job.remote) return false;

    return true;
  });

  return (
    <JobsContainer>
      <Header>
        <Title>Find Jobs</Title>
      </Header>

      <SearchSection>
        <SearchGrid>
          <SearchInput
            type="text"
            placeholder="Search for jobs, skills, or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(category => (
              <option key={category} value={category === 'All Categories' ? '' : category}>
                {category}
              </option>
            ))}
          </Select>
          <Select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
            {locations.map(location => (
              <option key={location} value={location === 'All Locations' ? '' : location}>
                {location}
              </option>
            ))}
          </Select>
          <SearchButton onClick={handleSearch}>
            🔍 Search
          </SearchButton>
        </SearchGrid>
      </SearchSection>

      <FiltersSection>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>Quick Filters:</span>
        {filterOptions.map(filter => (
          <FilterChip
            key={filter}
            active={activeFilters.includes(filter)}
            onClick={() => toggleFilter(filter)}
          >
            {filter}
          </FilterChip>
        ))}
        {(activeFilters.length > 0 || searchQuery || selectedCategory || selectedLocation) && (
          <ClearFiltersButton onClick={clearFilters}>
            Clear All
          </ClearFiltersButton>
        )}
      </FiltersSection>

      <ResultsHeader>
        <ResultsCount>
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
        </ResultsCount>
        <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="budget-high">Highest Budget</option>
          <option value="budget-low">Lowest Budget</option>
        </SortSelect>
      </ResultsHeader>

      {isLoading ? (
        <LoadingSpinner />
      ) : filteredJobs.length > 0 ? (
        <JobsGrid>
          {filteredJobs.map(job => (
            <JobCard key={job.id} to={`/jobs/${job.id}`}>
              <JobCategory>{job.category}</JobCategory>
              <JobHeader>
                <JobTitle>{job.title}</JobTitle>
                <JobBudget>{job.budget}</JobBudget>
              </JobHeader>
              <JobDescription>{job.description}</JobDescription>
              <JobMeta>
                <JobLocation>📍 {job.location}</JobLocation>
                <JobTime>{job.postedAt}</JobTime>
              </JobMeta>
            </JobCard>
          ))}
        </JobsGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>🔍</EmptyIcon>
          <EmptyTitle>No jobs found</EmptyTitle>
          <EmptyText>
            Try adjusting your search criteria or filters to find more opportunities.
          </EmptyText>
          <ClearFiltersButton onClick={clearFilters}>
            Clear Filters
          </ClearFiltersButton>
        </EmptyState>
      )}
    </JobsContainer>
  );
};

export default JobsPage;