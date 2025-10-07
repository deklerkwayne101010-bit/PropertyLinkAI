import React, { useState } from 'react';
import styled from 'styled-components';

const HelpContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const SearchSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const CategoryCard = styled.div<{ active?: boolean }>`
  background: ${({ theme, active }) => active ? theme.colors.primary + '10' : theme.colors.white};
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary + '05'};
  }
`;

const CategoryTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const CategoryDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const ArticleCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ArticleTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const ArticlePreview = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ContactSection = styled.div`
  background: ${({ theme }) => theme.colors.primary + '05'};
  border: 1px solid ${({ theme }) => theme.colors.primary + '20'};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const ContactTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const ContactText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const ContactButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const HelpCenterPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of using TaskLink SA'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Manage your account settings and profile'
    },
    {
      id: 'jobs',
      title: 'Jobs & Applications',
      description: 'How to post jobs and apply for work'
    },
    {
      id: 'payments',
      title: 'Payments & Earnings',
      description: 'Understanding payments, fees, and earnings'
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      description: 'Stay safe while using our platform'
    }
  ];

  const articles = [
    {
      title: 'How to create your first job posting',
      preview: 'Learn step-by-step how to post your first job on TaskLink SA and find the right person for the task.',
      category: 'getting-started'
    },
    {
      title: 'Setting up your profile for success',
      preview: 'Optimize your profile to attract more job opportunities and build trust with potential clients.',
      category: 'account'
    },
    {
      title: 'Understanding our payment system',
      preview: 'Learn how payments work, when you get paid, and what fees apply to transactions.',
      category: 'payments'
    },
    {
      title: 'Safety tips for job posters',
      preview: 'Important safety guidelines to follow when hiring workers through our platform.',
      category: 'safety'
    }
  ];

  const filteredArticles = articles.filter(article =>
    article.category === activeCategory &&
    (searchQuery === '' ||
     article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     article.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <HelpContainer>
      <Header>
        <Title>Help Center</Title>
        <Subtitle>Find answers to your questions and get the help you need</Subtitle>
      </Header>

      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search for help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchSection>

      <ContentGrid>
        <Sidebar>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              <CategoryTitle>{category.title}</CategoryTitle>
              <CategoryDescription>{category.description}</CategoryDescription>
            </CategoryCard>
          ))}
        </Sidebar>

        <MainContent>
          {filteredArticles.map((article, index) => (
            <ArticleCard key={index}>
              <ArticleTitle>{article.title}</ArticleTitle>
              <ArticlePreview>{article.preview}</ArticlePreview>
            </ArticleCard>
          ))}

          <ContactSection>
            <ContactTitle>Can't find what you're looking for?</ContactTitle>
            <ContactText>
              Our support team is here to help. Contact us for personalized assistance.
            </ContactText>
            <ContactButton>Contact Support</ContactButton>
          </ContactSection>
        </MainContent>
      </ContentGrid>
    </HelpContainer>
  );
};

export default HelpCenterPage;