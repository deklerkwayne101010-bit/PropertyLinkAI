import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
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

const ProfileImageSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const ProfileImageContainer = styled.div`
  position: relative;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const ImageUploadButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.1);
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const ProfileRole = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const ProfileStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
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

const TextArea = styled.textarea`
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  min-height: 100px;
  resize: vertical;
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

const SkillsSection = styled.div`
  grid-column: 1 / -1;
`;

const SkillsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const SkillTag = styled.span`
  background: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const RemoveSkillButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding: 0;
  margin-left: ${({ theme }) => theme.spacing[1]};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const AddSkillInput = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const SkillInput = styled(Input)`
  flex: 1;
`;

const AddSkillButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
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

const CancelButton = styled.button`
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

const ProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('poster'); // TODO: Get from auth context

  // Form state
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+27 21 123 4567',
    location: 'Cape Town, Western Cape',
    bio: 'Experienced professional with a passion for quality work and customer satisfaction.',
    experience: '5',
    hourlyRate: '250',
    companyName: '',
    website: '',
  });

  const [skills, setSkills] = useState<string[]>([
    'Web Development', 'Mobile Apps', 'UI/UX Design', 'Project Management'
  ]);

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    // Simulate loading user profile data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // TODO: Show success message
    }, 1500);
  };

  const handleCancel = () => {
    // Reset form to original values
    // TODO: Reset to original values
  };

  if (isLoading) {
    return (
      <ProfileContainer>
        <LoadingSpinner />
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <Header>
        <div>
          <Title>My Profile</Title>
          <Subtitle>Manage your personal information and preferences</Subtitle>
        </div>
      </Header>

      <ContentGrid>
        {/* Profile Image and Basic Info */}
        <Section>
          <SectionHeader>
            <SectionTitle>Profile Picture & Info</SectionTitle>
          </SectionHeader>

          <ProfileImageSection>
            <ProfileImageContainer>
              <ProfileImage
                src="https://via.placeholder.com/120x120/008080/FFFFFF?text=JD"
                alt="Profile"
              />
              <ImageUploadButton title="Upload new photo">
                📷
              </ImageUploadButton>
            </ProfileImageContainer>

            <ProfileInfo>
              <ProfileName>{formData.firstName} {formData.lastName}</ProfileName>
              <ProfileRole>
                {userRole === 'poster' ? 'Job Poster' : 'Task Doer'}
              </ProfileRole>
              <ProfileStats>
                <StatItem>
                  <StatValue>4.8</StatValue>
                  <StatLabel>Rating</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>127</StatValue>
                  <StatLabel>{userRole === 'poster' ? 'Jobs Posted' : 'Jobs Completed'}</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>R 45,230</StatValue>
                  <StatLabel>{userRole === 'poster' ? 'Total Spent' : 'Total Earned'}</StatLabel>
                </StatItem>
              </ProfileStats>
            </ProfileInfo>
          </ProfileImageSection>
        </Section>

        {/* Personal Information */}
        <Section>
          <SectionHeader>
            <SectionTitle>Personal Information</SectionTitle>
          </SectionHeader>

          <Form>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="location">Location</Label>
              <Input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="experience">Years of Experience</Label>
              <Select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
              >
                <option value="0">Less than 1 year</option>
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </Select>
            </FormGroup>

            {userRole === 'doer' && (
              <>
                <FormGroup>
                  <Label htmlFor="hourlyRate">Hourly Rate (ZAR)</Label>
                  <Input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </>
            )}

            {userRole === 'poster' && (
              <>
                <FormGroup>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                  />
                </FormGroup>
              </>
            )}

            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label htmlFor="bio">Bio</Label>
              <TextArea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell others about yourself, your experience, and what you do..."
              />
            </FormGroup>

            {userRole === 'doer' && (
              <SkillsSection>
                <Label>Skills</Label>
                <SkillsGrid>
                  {skills.map((skill, index) => (
                    <SkillTag key={index}>
                      {skill}
                      <RemoveSkillButton
                        onClick={() => handleRemoveSkill(skill)}
                        title="Remove skill"
                      >
                        ×
                      </RemoveSkillButton>
                    </SkillTag>
                  ))}
                </SkillsGrid>

                <AddSkillInput>
                  <SkillInput
                    type="text"
                    placeholder="Add a new skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <AddSkillButton
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </AddSkillButton>
                </AddSkillInput>
              </SkillsSection>
            )}
          </Form>

          <ButtonGroup>
            <CancelButton type="button" onClick={handleCancel}>
              Cancel
            </CancelButton>
            <SaveButton type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </SaveButton>
          </ButtonGroup>
        </Section>
      </ContentGrid>
    </ProfileContainer>
  );
};

export default ProfilePage;

export {};