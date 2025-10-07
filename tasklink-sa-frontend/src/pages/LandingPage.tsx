import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const LandingContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.background.primary} 0%, ${({ theme }) => theme.colors.background.secondary} 100%);
`;

const HeroSection = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  color: ${({ theme }) => theme.colors.white};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><polygon points="0,0 1000,0 1000,100 0,50"/></svg>');
    background-size: cover;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[4]};
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  }
`;

const HeroSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  opacity: 0.9;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const CTAContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const CTAButton = styled(Link)`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  transition: ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryCTAButton = styled(Link)`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  border: 2px solid ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FeaturesSection = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.white};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[4]};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.text.primary};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const FeatureCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[8]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  text-align: center;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const FeatureIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.primary};
`;

const FeatureTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const StatsSection = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} ${({ theme }) => theme.spacing[6]};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gray[900]} 0%, ${({ theme }) => theme.colors.gray[800]} 100%);
  color: ${({ theme }) => theme.colors.white};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[4]};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  max-width: 800px;
  margin: 0 auto;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const HowItWorksSection = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.background.secondary};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[4]};
  }
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  max-width: 1000px;
  margin: 0 auto;
`;

const StepCard = styled.div`
  text-align: center;
  position: relative;
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
`;

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StepDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Find Local Tasks',
      description: 'Browse thousands of tasks in your area from trusted South African businesses and individuals.',
    },
    {
      icon: '💰',
      title: 'Earn Money',
      description: 'Set your own rates and work on your schedule. Get paid securely through our platform.',
    },
    {
      icon: '🛡️',
      title: 'Safe & Secure',
      description: 'Verified users, secure payments, and our support team ensures your safety.',
    },
    {
      icon: '⭐',
      title: 'Build Reputation',
      description: 'Earn reviews and build your profile to unlock higher-paying opportunities.',
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Active Users' },
    { number: '50,000+', label: 'Tasks Completed' },
    { number: 'R2.5M+', label: 'Paid to Workers' },
    { number: '4.8★', label: 'Average Rating' },
  ];

  const steps = [
    {
      number: '1',
      title: 'Sign Up',
      description: 'Create your free account and choose whether you want to post tasks or complete them.',
    },
    {
      number: '2',
      title: 'Browse or Post',
      description: 'Find tasks that match your skills or post your own tasks with detailed requirements.',
    },
    {
      number: '3',
      title: 'Connect & Work',
      description: 'Chat with task posters, agree on terms, and complete the work to everyone\'s satisfaction.',
    },
    {
      number: '4',
      title: 'Get Paid',
      description: 'Receive secure payment once the task is completed and approved.',
    },
  ];

  return (
    <LandingContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Connect South Africa Through Local Tasks
          </HeroTitle>
          <HeroSubtitle>
            TaskLink SA connects South African businesses and individuals with skilled workers.
            Post tasks, find work, and build lasting professional relationships in your community.
          </HeroSubtitle>
          <CTAContainer>
            <CTAButton to="/register?role=poster">
              I'm a Task Poster
            </CTAButton>
            <SecondaryCTAButton to="/register?role=doer">
              I'm a Task Doer
            </SecondaryCTAButton>
          </CTAContainer>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Why Choose TaskLink SA?</SectionTitle>
        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesSection>

      <StatsSection>
        <StatsGrid>
          {stats.map((stat, index) => (
            <StatItem key={index}>
              <StatNumber>{stat.number}</StatNumber>
              <StatLabel>{stat.label}</StatLabel>
            </StatItem>
          ))}
        </StatsGrid>
      </StatsSection>

      <HowItWorksSection>
        <SectionTitle>How It Works</SectionTitle>
        <StepsGrid>
          {steps.map((step, index) => (
            <StepCard key={index}>
              <StepNumber>{step.number}</StepNumber>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
            </StepCard>
          ))}
        </StepsGrid>
      </HowItWorksSection>
    </LandingContainer>
  );
};

export default LandingPage;