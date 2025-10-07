import React from 'react';
import styled from 'styled-components';

const PrivacyContainer = styled.div`
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

const ContactInfo = styled.div`
  background: ${({ theme }) => theme.colors.primary + '05'};
  border: 1px solid ${({ theme }) => theme.colors.primary + '20'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const ContactTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const ContactText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin: 0;
`;

const PrivacyPage: React.FC = () => {
  return (
    <PrivacyContainer>
      <Header>
        <Title>Privacy Policy</Title>
        <LastUpdated>Last updated: January 15, 2024</LastUpdated>
      </Header>

      <Content>
        <Section>
          <SectionTitle>1. Introduction</SectionTitle>
          <Paragraph>
            TaskLink SA ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using TaskLink SA, you agree to the collection and use of information in accordance with this policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Information We Collect</SectionTitle>

          <SubsectionTitle>2.1 Personal Information</SubsectionTitle>
          <Paragraph>
            We collect personal information that you provide directly to us, including:
          </Paragraph>
          <List>
            <ListItem>Name, email address, and contact information</ListItem>
            <ListItem>Government-issued identification documents</ListItem>
            <ListItem>Profile information and work history</ListItem>
            <ListItem>Payment and banking information</ListItem>
            <ListItem>Communications with other users and our support team</ListItem>
          </List>

          <SubsectionTitle>2.2 Usage Information</SubsectionTitle>
          <Paragraph>
            We automatically collect certain information when you use our platform:
          </Paragraph>
          <List>
            <ListItem>Device information and browser type</ListItem>
            <ListItem>IP address and location data</ListItem>
            <ListItem>Usage patterns and platform interactions</ListItem>
            <ListItem>Cookies and similar tracking technologies</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. How We Use Your Information</SectionTitle>
          <Paragraph>
            We use the collected information for the following purposes:
          </Paragraph>
          <List>
            <ListItem>To provide and maintain our service</ListItem>
            <ListItem>To verify user identities and prevent fraud</ListItem>
            <ListItem>To process payments and manage transactions</ListItem>
            <ListItem>To communicate with you about your account and our services</ListItem>
            <ListItem>To improve our platform and develop new features</ListItem>
            <ListItem>To comply with legal obligations</ListItem>
            <ListItem>To resolve disputes and enforce our terms</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Information Sharing and Disclosure</SectionTitle>
          <Paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
          </Paragraph>
          <List>
            <ListItem>With your explicit consent</ListItem>
            <ListItem>To comply with legal obligations</ListItem>
            <ListItem>To protect our rights and prevent fraud</ListItem>
            <ListItem>With service providers who assist our operations (under strict confidentiality agreements)</ListItem>
            <ListItem>In connection with a business transfer or acquisition</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Data Security</SectionTitle>
          <Paragraph>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
          </Paragraph>
          <List>
            <ListItem>Encryption of sensitive data in transit and at rest</ListItem>
            <ListItem>Regular security audits and updates</ListItem>
            <ListItem>Access controls and employee training</ListItem>
            <ListItem>Secure data centers and infrastructure</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Your Rights</SectionTitle>
          <Paragraph>
            Under South African data protection laws, you have the following rights regarding your personal information:
          </Paragraph>
          <List>
            <ListItem>Right to access your personal information</ListItem>
            <ListItem>Right to correct inaccurate information</ListItem>
            <ListItem>Right to delete your information (subject to legal requirements)</ListItem>
            <ListItem>Right to restrict or object to processing</ListItem>
            <ListItem>Right to data portability</ListItem>
            <ListItem>Right to withdraw consent</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Cookies and Tracking Technologies</SectionTitle>
          <Paragraph>
            We use cookies and similar technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences. However, disabling certain cookies may affect platform functionality.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. International Data Transfers</SectionTitle>
          <Paragraph>
            Your information may be transferred to and processed in countries other than South Africa. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Data Retention</SectionTitle>
          <Paragraph>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Account information is typically retained for 7 years after account closure for tax and legal compliance purposes.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Children's Privacy</SectionTitle>
          <Paragraph>
            Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will delete it immediately.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Changes to This Privacy Policy</SectionTitle>
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of TaskLink SA after such changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Contact Us</SectionTitle>
          <Paragraph>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </Paragraph>

          <ContactInfo>
            <ContactTitle>Data Protection Officer</ContactTitle>
            <ContactText>
              Email: privacy@tasklink.co.za<br />
              Phone: +27 (21) 123-4567<br />
              Address: 123 Main Street, Cape Town, 8001, South Africa
            </ContactText>
          </ContactInfo>

          <Paragraph>
            You also have the right to lodge a complaint with the Information Regulator of South Africa if you believe your privacy rights have been violated.
          </Paragraph>
        </Section>
      </Content>
    </PrivacyContainer>
  );
};

export default PrivacyPage;

export {};