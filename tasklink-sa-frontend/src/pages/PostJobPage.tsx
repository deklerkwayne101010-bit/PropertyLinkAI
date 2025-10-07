import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PostJobContainer = styled.div`
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
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ProgressBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.gray[200]};
    z-index: 1;
  }
`;

const ProgressStep = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 50%;
    right: -50%;
    height: 2px;
    background-color: ${({ active, completed, theme }) =>
      completed ? theme.colors.primary : active ? theme.colors.primary : theme.colors.gray[200]};
    z-index: 1;
  }

  &:last-child::before {
    display: none;
  }
`;

const StepCircle = styled.div<{ active: boolean; completed: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ active, completed, theme }) =>
    completed ? theme.colors.primary : active ? theme.colors.primary : theme.colors.gray[200]};
  color: ${({ active, completed, theme }) =>
    completed || active ? theme.colors.white : theme.colors.gray[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  position: relative;
  z-index: 3;
`;

const StepLabel = styled.div<{ active: boolean; completed: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ active, completed, theme }) =>
    active || completed ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  color: ${({ active, completed, theme }) =>
    active || completed ? theme.colors.primary : theme.colors.gray[500]};
  text-align: center;
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FormSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Label = styled.label`
  display: block;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Input = styled.input`
  width: 100%;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
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
  width: 100%;
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

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[8]};
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  border: 2px solid ${({ variant, theme }) => variant === 'secondary' ? theme.colors.gray[300] : theme.colors.primary};
  background-color: ${({ variant, theme }) => variant === 'secondary' ? 'transparent' : theme.colors.primary};
  color: ${({ variant, theme }) => variant === 'secondary' ? theme.colors.gray[700] : theme.colors.white};

  &:hover:not(:disabled) {
    background-color: ${({ variant, theme }) => variant === 'secondary' ? theme.colors.gray[50] : theme.colors.secondary};
    border-color: ${({ variant, theme }) => variant === 'secondary' ? theme.colors.gray[400] : theme.colors.secondary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 1;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.white};
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing[1]};
  display: block;
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background-color: ${({ theme }) => theme.colors.success}10;
  color: ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}20;
`;

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [jobData, setJobData] = useState({
    title: '',
    category: '',
    description: '',
    requirements: '',
    skills: [] as string[],
    location: '',
    budgetMin: '',
    budgetMax: '',
    remote: false,
    urgent: false,
    timeline: '',
    contactMethod: 'messages'
  });

  const categories = [
    'Home Services',
    'Automotive',
    'Technology',
    'Health & Beauty',
    'Education',
    'Events',
    'Other'
  ];

  const locations = [
    'Johannesburg, Gauteng',
    'Cape Town, Western Cape',
    'Durban, KwaZulu-Natal',
    'Pretoria, Gauteng',
    'Port Elizabeth, Eastern Cape',
    'Bloemfontein, Free State',
    'Other'
  ];

  const skills = [
    'Cleaning', 'Gardening', 'Plumbing', 'Electrical', 'Painting', 'Carpentry',
    'Web Development', 'Graphic Design', 'Writing', 'Translation', 'Photography',
    'Car Repair', 'Mechanic', 'Tutoring', 'Event Planning', 'Catering'
  ];

  const steps = [
    { number: 1, label: 'Basic Info' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Requirements' },
    { number: 4, label: 'Budget & Location' },
    { number: 5, label: 'Review' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!jobData.title.trim()) newErrors.title = 'Job title is required';
        if (!jobData.category) newErrors.category = 'Please select a category';
        break;
      case 2:
        if (!jobData.description.trim()) newErrors.description = 'Job description is required';
        break;
      case 3:
        if (!jobData.requirements.trim()) newErrors.requirements = 'Requirements are required';
        if (jobData.skills.length === 0) newErrors.skills = 'Please select at least one skill';
        break;
      case 4:
        if (!jobData.location) newErrors.location = 'Location is required';
        if (!jobData.budgetMin || parseInt(jobData.budgetMin) <= 0) newErrors.budgetMin = 'Valid minimum budget is required';
        if (!jobData.budgetMax || parseInt(jobData.budgetMax) <= 0) newErrors.budgetMax = 'Valid maximum budget is required';
        if (parseInt(jobData.budgetMin) >= parseInt(jobData.budgetMax)) newErrors.budgetMax = 'Maximum budget must be higher than minimum';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSkillToggle = (skill: string) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);

    try {
      // TODO: Implement job posting API call
      console.log('Posting job:', jobData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSubmitted(true);

      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Failed to post job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobData = (field: string, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormSection>
            <SectionTitle>Basic Information</SectionTitle>
            <FormGroup>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g. Website Development for Local Business"
                value={jobData.title}
                onChange={(e) => updateJobData('title', e.target.value)}
              />
              {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="category">Category *</Label>
              <Select
                id="category"
                value={jobData.category}
                onChange={(e) => updateJobData('category', e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
              {errors.category && <ErrorMessage>{errors.category}</ErrorMessage>}
            </FormGroup>
          </FormSection>
        );

      case 2:
        return (
          <FormSection>
            <SectionTitle>Job Description</SectionTitle>
            <FormGroup>
              <Label htmlFor="description">Describe your job in detail *</Label>
              <TextArea
                id="description"
                placeholder="Provide a detailed description of the work needed, including specific tasks, deliverables, and any important context..."
                value={jobData.description}
                onChange={(e) => updateJobData('description', e.target.value)}
              />
              {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="timeline">Project Timeline</Label>
              <Select
                id="timeline"
                value={jobData.timeline}
                onChange={(e) => updateJobData('timeline', e.target.value)}
              >
                <option value="">Select timeline</option>
                <option value="asap">ASAP</option>
                <option value="1-week">Within 1 week</option>
                <option value="2-weeks">Within 2 weeks</option>
                <option value="1-month">Within 1 month</option>
                <option value="flexible">Flexible</option>
              </Select>
            </FormGroup>
          </FormSection>
        );

      case 3:
        return (
          <FormSection>
            <SectionTitle>Requirements & Skills</SectionTitle>
            <FormGroup>
              <Label htmlFor="requirements">Specific Requirements *</Label>
              <TextArea
                id="requirements"
                placeholder="List the specific requirements, qualifications, or experience needed for this job..."
                value={jobData.requirements}
                onChange={(e) => updateJobData('requirements', e.target.value)}
              />
              {errors.requirements && <ErrorMessage>{errors.requirements}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Relevant Skills *</Label>
              <CheckboxGroup>
                {skills.map(skill => (
                  <CheckboxLabel key={skill}>
                    <input
                      type="checkbox"
                      checked={jobData.skills.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                    />
                    {skill}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
              {errors.skills && <ErrorMessage>{errors.skills}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={jobData.remote}
                  onChange={(e) => updateJobData('remote', e.target.checked)}
                />
                This job can be done remotely
              </CheckboxLabel>
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={jobData.urgent}
                  onChange={(e) => updateJobData('urgent', e.target.checked)}
                />
                This is an urgent job (higher priority)
              </CheckboxLabel>
            </FormGroup>
          </FormSection>
        );

      case 4:
        return (
          <FormSection>
            <SectionTitle>Budget & Location</SectionTitle>
            <FormGroup>
              <Label htmlFor="location">Job Location *</Label>
              <Select
                id="location"
                value={jobData.location}
                onChange={(e) => updateJobData('location', e.target.value)}
              >
                <option value="">Select location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </Select>
              {errors.location && <ErrorMessage>{errors.location}</ErrorMessage>}
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label htmlFor="budgetMin">Minimum Budget (ZAR) *</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  placeholder="500"
                  value={jobData.budgetMin}
                  onChange={(e) => updateJobData('budgetMin', e.target.value)}
                />
                {errors.budgetMin && <ErrorMessage>{errors.budgetMin}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="budgetMax">Maximum Budget (ZAR) *</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  placeholder="2000"
                  value={jobData.budgetMax}
                  onChange={(e) => updateJobData('budgetMax', e.target.value)}
                />
                {errors.budgetMax && <ErrorMessage>{errors.budgetMax}</ErrorMessage>}
              </FormGroup>
            </div>
          </FormSection>
        );

      case 5:
        return (
          <FormSection>
            <SectionTitle>Review Your Job Post</SectionTitle>
            <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#111827' }}>{jobData.title}</h3>
              <p style={{ color: '#6B7280', marginBottom: '16px' }}>{jobData.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div><strong>Category:</strong> {jobData.category}</div>
                <div><strong>Location:</strong> {jobData.location}</div>
                <div><strong>Budget:</strong> R{jobData.budgetMin} - R{jobData.budgetMax}</div>
                <div><strong>Timeline:</strong> {jobData.timeline || 'Not specified'}</div>
                <div><strong>Remote:</strong> {jobData.remote ? 'Yes' : 'No'}</div>
                <div><strong>Urgent:</strong> {jobData.urgent ? 'Yes' : 'No'}</div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <strong>Skills:</strong> {jobData.skills.join(', ')}
              </div>
            </div>
          </FormSection>
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <PostJobContainer>
        <SuccessMessage>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ marginBottom: '8px' }}>Job Posted Successfully!</h2>
          <p>Your job has been posted and is now visible to qualified workers in your area.</p>
          <p style={{ marginTop: '16px', fontSize: '14px' }}>
            Redirecting to dashboard in a few seconds...
          </p>
        </SuccessMessage>
      </PostJobContainer>
    );
  }

  return (
    <PostJobContainer>
      <Header>
        <Title>Post a New Job</Title>
        <Subtitle>Find the perfect person for your task in just a few steps</Subtitle>
      </Header>

      <ProgressBar>
        {steps.map(step => (
          <ProgressStep
            key={step.number}
            active={currentStep === step.number}
            completed={currentStep > step.number}
          >
            <StepCircle
              active={currentStep === step.number}
              completed={currentStep > step.number}
            >
              {currentStep > step.number ? '✓' : step.number}
            </StepCircle>
            <StepLabel
              active={currentStep === step.number}
              completed={currentStep > step.number}
            >
              {step.label}
            </StepLabel>
          </ProgressStep>
        ))}
      </ProgressBar>

      <FormCard>
        {renderStepContent()}

        <ButtonGroup>
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handlePrevious}>
              Previous
            </Button>
          )}

          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : 'Post Job'}
            </Button>
          )}
        </ButtonGroup>
      </FormCard>
    </PostJobContainer>
  );
};

export default PostJobPage;