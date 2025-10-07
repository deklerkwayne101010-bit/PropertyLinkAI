import React, { useState } from 'react';
import styled from 'styled-components';

const FAQContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 800px;
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
  margin-bottom: ${({ theme }) => theme.spacing[6]};
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

const FAQItem = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  overflow: hidden;
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[6]};
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const QuestionText = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ToggleIcon = styled.span<{ isOpen: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary};
  transition: ${({ theme }) => theme.transitions.fast};
  transform: ${({ isOpen }) => isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
`;

const FAQAnswer = styled.div<{ isOpen: boolean }>`
  padding: ${({ theme, isOpen }) => isOpen ? theme.spacing[6] : '0'};
  padding-top: 0;
  border-top: ${({ theme, isOpen }) => isOpen ? `1px solid ${theme.colors.gray[200]}` : 'none'};
  max-height: ${({ isOpen }) => isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.fast};
`;

const AnswerText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`;

const Categories = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
`;

const CategoryButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.white};
  color: ${({ theme, active }) => active ? theme.colors.white : theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, active }) => active ? theme.colors.secondary : theme.colors.primary + '10'};
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const NoResultsText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      category: 'getting-started',
      question: 'How do I create an account on TaskLink SA?',
      answer: 'To create an account, click the "Register" button on our homepage. Choose whether you want to post jobs or complete tasks, fill in your details, and verify your email address. You\'ll need to provide valid identification for verification purposes.'
    },
    {
      category: 'getting-started',
      question: 'What documents do I need to verify my account?',
      answer: 'For South African users, you\'ll need to provide a valid ID document (ID book or smart card), proof of address, and in some cases, proof of income. International users may need passport and additional documentation. Our verification process typically takes 24-48 hours.'
    },
    {
      category: 'jobs',
      question: 'How do I post a job on TaskLink SA?',
      answer: 'Click "Post a Job" from your dashboard, fill in the job details including title, description, budget, location, and requirements. You can also upload images and set specific skills needed. Once posted, your job will be visible to qualified task doers in your area.'
    },
    {
      category: 'jobs',
      question: 'How does the application and hiring process work?',
      answer: 'Task doers can apply to your job posting. You can review their profiles, ratings, and proposals. Once you select someone, you can communicate through our platform and agree on terms. Payment is held securely until the job is completed and approved.'
    },
    {
      category: 'payments',
      question: 'What are the fees for using TaskLink SA?',
      answer: 'For job posters, there\'s a 10% service fee on successful transactions. Task doers pay a 5% fee. There are no hidden charges, and all fees are clearly displayed before any transaction. We accept all major South African payment methods.'
    },
    {
      category: 'payments',
      question: 'When do I get paid for completed work?',
      answer: 'Task doers receive payment within 24 hours after job completion and approval from the job poster. Funds are transferred directly to your chosen payment method. You can track all payments in your wallet and earnings sections.'
    },
    {
      category: 'safety',
      question: 'How does TaskLink SA ensure user safety?',
      answer: 'We verify all users with government-issued ID, maintain secure payment processing, and provide dispute resolution services. We also have a rating system and encourage users to communicate through our platform. Report any suspicious activity immediately.'
    },
    {
      category: 'safety',
      question: 'What should I do if I encounter a problem with a job?',
      answer: 'Contact our support team immediately through the platform. We have mediators who can help resolve disputes. Never share personal contact details or arrange payments outside the platform. Our dispute resolution process is free and usually resolved within 48 hours.'
    },
    {
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your profile page from the sidebar menu. You can update your personal information, skills, portfolio, and preferences. Keep your profile complete and up-to-date to attract more opportunities and build trust with other users.'
    },
    {
      category: 'account',
      question: 'Can I change my account type (poster to doer or vice versa)?',
      answer: 'Yes, you can have both roles on TaskLink SA. Simply update your profile settings to enable both posting jobs and applying for work. This gives you flexibility in how you use the platform.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'account', label: 'Account & Profile' },
    { id: 'jobs', label: 'Jobs & Applications' },
    { id: 'payments', label: 'Payments & Earnings' },
    { id: 'safety', label: 'Safety & Security' }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <FAQContainer>
      <Header>
        <Title>Frequently Asked Questions</Title>
        <Subtitle>Find answers to common questions about TaskLink SA</Subtitle>
      </Header>

      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchSection>

      <Categories>
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            active={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label}
          </CategoryButton>
        ))}
      </Categories>

      {filteredFAQs.length > 0 ? (
        filteredFAQs.map((faq, index) => (
          <FAQItem key={index}>
            <FAQQuestion onClick={() => toggleItem(index)}>
              <QuestionText>{faq.question}</QuestionText>
              <ToggleIcon isOpen={openItems.has(index)}>
                {openItems.has(index) ? '×' : '+'}
              </ToggleIcon>
            </FAQQuestion>
            <FAQAnswer isOpen={openItems.has(index)}>
              <AnswerText>{faq.answer}</AnswerText>
            </FAQAnswer>
          </FAQItem>
        ))
      ) : (
        <NoResults>
          <NoResultsText>No FAQs found matching your search.</NoResultsText>
          <p>Try adjusting your search terms or browse all categories.</p>
        </NoResults>
      )}
    </FAQContainer>
  );
};

export default FAQPage;

export {};