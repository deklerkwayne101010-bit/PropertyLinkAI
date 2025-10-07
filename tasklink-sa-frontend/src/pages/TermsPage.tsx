import React from 'react';
import styled from 'styled-components';

const TermsContainer = styled.div`
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

const LastUpdated = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0;
`;

const Content = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const SubsectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: ${({ theme }) => theme.spacing[6]} 0 ${({ theme }) => theme.spacing[3]} 0;
`;

const Paragraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const List = styled.ul`
  margin: ${({ theme }) => theme.spacing[4]} 0;
  padding-left: ${({ theme }) => theme.spacing[6]};
`;

const ListItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const TermsPage: React.FC = () => {
  return (
    <TermsContainer>
      <Header>
        <Title>Terms & Conditions</Title>
        <LastUpdated>Last updated: January 15, 2024</LastUpdated>
      </Header>

      <Content>
        <Section>
          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By accessing and using TaskLink SA, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Use License</SectionTitle>
          <Paragraph>
            Permission is granted to temporarily use TaskLink SA for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Paragraph>
          <List>
            <ListItem>Modify or copy the materials</ListItem>
            <ListItem>Use the materials for any commercial purpose or for any public display</ListItem>
            <ListItem>Attempt to decompile or reverse engineer any software contained on TaskLink SA</ListItem>
            <ListItem>Remove any copyright or other proprietary notations from the materials</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. User Accounts</SectionTitle>
          <SubsectionTitle>3.1 Account Creation</SubsectionTitle>
          <Paragraph>
            To use certain features of TaskLink SA, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Paragraph>

          <SubsectionTitle>3.2 Verification</SubsectionTitle>
          <Paragraph>
            All users must undergo identity verification. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. Job Posting and Applications</SectionTitle>
          <SubsectionTitle>4.1 Job Posters</SubsectionTitle>
          <Paragraph>
            Job posters are responsible for providing accurate job descriptions, fair compensation, and maintaining professional conduct. All jobs must comply with South African labor laws and regulations.
          </Paragraph>

          <SubsectionTitle>4.2 Task Doers</SubsectionTitle>
          <Paragraph>
            Task doers must provide accurate information about their skills and experience. They are responsible for completing work to the agreed standards and timelines.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>5. Payment Terms</SectionTitle>
          <Paragraph>
            TaskLink SA facilitates payments between job posters and task doers. We charge a service fee as outlined in our pricing section. All payments are processed securely through approved payment providers.
          </Paragraph>

          <SubsectionTitle>5.1 Refunds</SubsectionTitle>
          <Paragraph>
            Refunds may be requested within 48 hours of payment if the service has not been started. Refund requests must be submitted through our dispute resolution process.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Prohibited Activities</SectionTitle>
          <Paragraph>
            You may not use TaskLink SA for any unlawful purpose or to solicit others to perform unlawful acts. Prohibited activities include but are not limited to:
          </Paragraph>
          <List>
            <ListItem>Posting illegal or harmful content</ListItem>
            <ListItem>Discriminating against other users</ListItem>
            <ListItem>Sharing false information</ListItem>
            <ListItem>Attempting to circumvent our payment system</ListItem>
            <ListItem>Harassing or threatening other users</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Content and Intellectual Property</SectionTitle>
          <Paragraph>
            Users retain ownership of content they submit to TaskLink SA. By submitting content, you grant TaskLink SA a non-exclusive, royalty-free license to use, display, and distribute your content in connection with the service.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Termination</SectionTitle>
          <Paragraph>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Limitation of Liability</SectionTitle>
          <Paragraph>
            In no event shall TaskLink SA, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Governing Law</SectionTitle>
          <Paragraph>
            These Terms shall be interpreted and governed by the laws of South Africa. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the South African courts.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Changes to Terms</SectionTitle>
          <Paragraph>
            We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms on this page and updating the "Last updated" date.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Contact Information</SectionTitle>
          <Paragraph>
            If you have any questions about these Terms, please contact us at legal@tasklink.co.za or through our contact form.
          </Paragraph>
        </Section>
      </Content>
    </TermsContainer>
  );
};

export default TermsPage;

export {};