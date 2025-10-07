import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 800px;
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

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
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

const Form = styled.form`
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

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]} 0;
`;

const ToggleLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const ToggleSwitch = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 50px;
  height: 24px;
  background: ${({ theme, isActive }) =>
    isActive ? theme.colors.primary : theme.colors.gray[300]};
  border-radius: 12px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ isActive }) => (isActive ? '26px' : '2px')};
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.white};
    border-radius: 50%;
    transition: ${({ theme }) => theme.transitions.fast};
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const SaveButton = styled.button`
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

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[400]};
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[700]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const DangerSection = styled(Section)`
  border-color: ${({ theme }) => theme.colors.error}20;
`;

const DangerButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: #dc2626;
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

const SettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Account Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,

    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',

    // Payment Settings
    defaultCurrency: 'ZAR',
    autoWithdraw: false,
    withdrawThreshold: '1000',

    // Language & Region
    language: 'en',
    timezone: 'Africa/Johannesburg',
    dateFormat: 'DD/MM/YYYY',
  });

  useEffect(() => {
    // Simulate loading settings
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSelectChange = (setting: keyof typeof settings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // TODO: Show success message
    }, 1500);
  };

  const handleReset = () => {
    // Reset to default settings
    // TODO: Implement reset functionality
  };

  if (isLoading) {
    return (
      <SettingsContainer>
        <LoadingSpinner />
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <Header>
        <div>
          <Title>Account Settings</Title>
          <Subtitle>Manage your account preferences and privacy settings</Subtitle>
        </div>
      </Header>

      <SettingsGrid>
        {/* Notification Settings */}
        <Section>
          <SectionHeader>
            <SectionTitle>Notifications</SectionTitle>
          </SectionHeader>

          <Form>
            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('emailNotifications')}>
                Email Notifications
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.emailNotifications}
                onClick={() => handleToggle('emailNotifications')}
              />
            </ToggleContainer>

            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('smsNotifications')}>
                SMS Notifications
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.smsNotifications}
                onClick={() => handleToggle('smsNotifications')}
              />
            </ToggleContainer>

            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('pushNotifications')}>
                Push Notifications
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.pushNotifications}
                onClick={() => handleToggle('pushNotifications')}
              />
            </ToggleContainer>

            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('marketingEmails')}>
                Marketing Emails
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.marketingEmails}
                onClick={() => handleToggle('marketingEmails')}
              />
            </ToggleContainer>
          </Form>
        </Section>

        {/* Privacy Settings */}
        <Section>
          <SectionHeader>
            <SectionTitle>Privacy</SectionTitle>
          </SectionHeader>

          <Form>
            <FormGroup>
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select
                id="profileVisibility"
                value={settings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
              >
                <option value="public">Public - Anyone can see my profile</option>
                <option value="contacts">Contacts Only - Only people I connect with</option>
                <option value="private">Private - Only I can see my profile</option>
              </Select>
            </FormGroup>

            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                id="showEmail"
                checked={settings.showEmail}
                onChange={() => handleToggle('showEmail')}
              />
              <CheckboxLabel htmlFor="showEmail">
                Show email address on profile
              </CheckboxLabel>
            </CheckboxContainer>

            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                id="showPhone"
                checked={settings.showPhone}
                onChange={() => handleToggle('showPhone')}
              />
              <CheckboxLabel htmlFor="showPhone">
                Show phone number on profile
              </CheckboxLabel>
            </CheckboxContainer>

            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                id="showLocation"
                checked={settings.showLocation}
                onChange={() => handleToggle('showLocation')}
              />
              <CheckboxLabel htmlFor="showLocation">
                Show location on profile
              </CheckboxLabel>
            </CheckboxContainer>
          </Form>
        </Section>

        {/* Security Settings */}
        <Section>
          <SectionHeader>
            <SectionTitle>Security</SectionTitle>
          </SectionHeader>

          <Form>
            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('twoFactorAuth')}>
                Two-Factor Authentication
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.twoFactorAuth}
                onClick={() => handleToggle('twoFactorAuth')}
              />
            </ToggleContainer>

            <FormGroup>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Select
                id="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={(e) => handleSelectChange('sessionTimeout', e.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="0">Never</option>
              </Select>
            </FormGroup>
          </Form>
        </Section>

        {/* Payment Settings */}
        <Section>
          <SectionHeader>
            <SectionTitle>Payments</SectionTitle>
          </SectionHeader>

          <Form>
            <FormGroup>
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={(e) => handleSelectChange('defaultCurrency', e.target.value)}
              >
                <option value="ZAR">South African Rand (ZAR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </Select>
            </FormGroup>

            <ToggleContainer>
              <ToggleLabel onClick={() => handleToggle('autoWithdraw')}>
                Automatic Withdrawals
              </ToggleLabel>
              <ToggleSwitch
                isActive={settings.autoWithdraw}
                onClick={() => handleToggle('autoWithdraw')}
              />
            </ToggleContainer>

            {settings.autoWithdraw && (
              <FormGroup>
                <Label htmlFor="withdrawThreshold">Withdrawal Threshold (ZAR)</Label>
                <Input
                  type="number"
                  id="withdrawThreshold"
                  value={settings.withdrawThreshold}
                  onChange={(e) => handleSelectChange('withdrawThreshold', e.target.value)}
                  min="100"
                  step="50"
                />
              </FormGroup>
            )}
          </Form>
        </Section>

        {/* Language & Region */}
        <Section>
          <SectionHeader>
            <SectionTitle>Language & Region</SectionTitle>
          </SectionHeader>

          <Form>
            <FormGroup>
              <Label htmlFor="language">Language</Label>
              <Select
                id="language"
                value={settings.language}
                onChange={(e) => handleSelectChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">isiZulu</option>
                <option value="xh">isiXhosa</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => handleSelectChange('timezone', e.target.value)}
              >
                <option value="Africa/Johannesburg">South Africa (GMT+2)</option>
                <option value="Africa/Cairo">Egypt (GMT+2)</option>
                <option value="Europe/London">London (GMT+1)</option>
                <option value="America/New_York">New York (GMT-5)</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => handleSelectChange('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
            </FormGroup>
          </Form>
        </Section>

        {/* Danger Zone */}
        <DangerSection>
          <SectionHeader>
            <SectionTitle>Danger Zone</SectionTitle>
          </SectionHeader>

          <p style={{ color: '#6B7280', marginBottom: '16px' }}>
            These actions are irreversible. Please be certain before proceeding.
          </p>

          <ButtonGroup style={{ justifyContent: 'flex-start' }}>
            <DangerButton type="button">
              Delete Account
            </DangerButton>
          </ButtonGroup>
        </DangerSection>

        {/* Save Actions */}
        <Section>
          <ButtonGroup>
            <ResetButton type="button" onClick={handleReset}>
              Reset to Defaults
            </ResetButton>
            <SaveButton type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </SaveButton>
          </ButtonGroup>
        </Section>
      </SettingsGrid>
    </SettingsContainer>
  );
};

export default SettingsPage;

export {};