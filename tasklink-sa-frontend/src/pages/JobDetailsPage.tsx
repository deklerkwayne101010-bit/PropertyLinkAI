import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const JobDetailsContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1000px;
  margin: 0 auto;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const JobHeader = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const JobTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const JobMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const JobBudget = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const JobCategory = styled.span`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const JobDescription = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const JobDescriptionText = styled.p`
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const JobRequirements = styled.ul`
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  padding-left: ${({ theme }) => theme.spacing[6]};

  li {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }
`;

const JobDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const DetailItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const DetailValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const PosterInfo = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const PosterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const PosterAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PosterDetails = styled.div`
  flex: 1;
`;

const PosterName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

const PosterMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
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
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const ApplicationForm = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
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

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  color: ${({ theme }) => theme.colors.success};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}20;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  text-align: center;
`;

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [userRole, setUserRole] = useState<'poster' | 'doer'>('doer'); // TODO: Get from auth context
  const [applicationData, setApplicationData] = useState({
    proposedRate: '',
    message: '',
    availability: ''
  });

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  const loadJobDetails = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock job data
    const mockJob = {
      id: parseInt(id || '1'),
      title: 'Website Development for Local Business',
      description: 'Looking for an experienced web developer to create a modern, responsive website for our small business. We need a homepage, about page, services page, and contact form with email integration.',
      category: 'Technology',
      location: 'Johannesburg, Gauteng',
      budget: 'R 5,000 - R 8,000',
      budgetMin: 5000,
      budgetMax: 8000,
      postedAt: '2 hours ago',
      urgent: false,
      remote: true,
      requirements: [
        '3+ years of web development experience',
        'Proficiency in HTML, CSS, JavaScript',
        'Experience with React or similar frameworks',
        'Knowledge of responsive design principles',
        'Understanding of SEO best practices'
      ],
      skills: ['React', 'JavaScript', 'HTML/CSS', 'Responsive Design', 'SEO'],
      poster: {
        name: 'Sarah Johnson',
        company: 'Local Business Co.',
        rating: 4.8,
        jobsPosted: 15,
        memberSince: '2022',
        verified: true
      },
      applicationsCount: 3,
      status: 'open'
    };

    setJob(mockJob);
    setIsLoading(false);
  };

  const handleApply = async () => {
    if (!applicationData.message.trim()) {
      alert('Please provide a message with your application.');
      return;
    }

    setIsApplying(true);

    try {
      // TODO: Implement application API call
      console.log('Application data:', applicationData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setApplicationSubmitted(true);
    } catch (error) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleMessage = () => {
    // TODO: Navigate to chat with poster
    navigate(`/messages?user=${job.poster.name}`);
  };

  if (isLoading) {
    return (
      <JobDetailsContainer>
        <LoadingSpinner style={{ margin: '40px auto' }} />
      </JobDetailsContainer>
    );
  }

  if (!job) {
    return (
      <JobDetailsContainer>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Job not found</h2>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Link to="/jobs">← Back to jobs</Link>
        </div>
      </JobDetailsContainer>
    );
  }

  return (
    <JobDetailsContainer>
      <BackButton to="/jobs">← Back to jobs</BackButton>

      <JobHeader>
        <JobCategory>{job.category}</JobCategory>
        <JobTitle>{job.title}</JobTitle>
        <JobMeta>
          <MetaItem>📍 {job.location}</MetaItem>
          <MetaItem>🕒 Posted {job.postedAt}</MetaItem>
          <MetaItem>👥 {job.applicationsCount} applications</MetaItem>
          {job.urgent && <MetaItem>🚨 Urgent</MetaItem>}
          {job.remote && <MetaItem>🏠 Remote work</MetaItem>}
        </JobMeta>
        <JobBudget>{job.budget}</JobBudget>
      </JobHeader>

      <JobDetailsGrid>
        <div>
          <JobDescription>
            <SectionTitle>Job Description</SectionTitle>
            <JobDescriptionText>{job.description}</JobDescriptionText>

            <SectionTitle>Requirements</SectionTitle>
            <JobRequirements>
              {job.requirements.map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </JobRequirements>

            <SectionTitle>Skills Required</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {job.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#00808010',
                    color: '#008080',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </JobDescription>
        </div>

        <div>
          <DetailCard>
            <SectionTitle>Job Details</SectionTitle>
            <DetailItem>
              <DetailLabel>Category</DetailLabel>
              <DetailValue>{job.category}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Location</DetailLabel>
              <DetailValue>📍 {job.location}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Budget Range</DetailLabel>
              <DetailValue>💰 {job.budget}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Work Type</DetailLabel>
              <DetailValue>{job.remote ? '🏠 Remote' : '📍 On-site'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Posted</DetailLabel>
              <DetailValue>🕒 {job.postedAt}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Status</DetailLabel>
              <DetailValue>
                {job.status === 'open' ? '🟢 Open' : '🔴 Closed'}
              </DetailValue>
            </DetailItem>
          </DetailCard>

          <PosterInfo>
            <SectionTitle>About the Client</SectionTitle>
            <PosterHeader>
              <PosterAvatar>
                {job.poster.name.charAt(0)}
              </PosterAvatar>
              <PosterDetails>
                <PosterName>{job.poster.name}</PosterName>
                <PosterMeta>
                  ⭐ {job.poster.rating} rating • {job.poster.jobsPosted} jobs posted • Member since {job.poster.memberSince}
                  {job.poster.verified && ' • ✓ Verified'}
                </PosterMeta>
              </PosterDetails>
            </PosterHeader>

            {userRole === 'doer' && job.status === 'open' && (
              <ActionButtons>
                <PrimaryButton onClick={handleMessage}>
                  💬 Message Client
                </PrimaryButton>
                <SecondaryButton onClick={() => document.getElementById('application-form')?.scrollIntoView()}>
                  📝 Apply Now
                </SecondaryButton>
              </ActionButtons>
            )}
          </PosterInfo>
        </div>
      </JobDetailsGrid>

      {userRole === 'doer' && job.status === 'open' && (
        <ApplicationForm id="application-form">
          <SectionTitle>Apply for this Job</SectionTitle>

          {applicationSubmitted ? (
            <SuccessMessage>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ marginBottom: '8px' }}>Application Submitted!</h3>
              <p>Your application has been sent to the client. You'll be notified when they review your application.</p>
            </SuccessMessage>
          ) : (
            <>
              <FormGroup>
                <Label htmlFor="proposedRate">Your Proposed Rate (ZAR)</Label>
                <Input
                  id="proposedRate"
                  type="number"
                  placeholder="e.g. 6500"
                  value={applicationData.proposedRate}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, proposedRate: e.target.value }))}
                />
                <small style={{ color: '#6B7280', fontSize: '14px' }}>
                  Optional: Suggest a rate within the budget range
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="availability">Your Availability</Label>
                <Input
                  id="availability"
                  type="text"
                  placeholder="e.g. Available immediately, 2 weeks notice, etc."
                  value={applicationData.availability}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, availability: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="message">Cover Message *</Label>
                <TextArea
                  id="message"
                  placeholder="Introduce yourself and explain why you're the right person for this job. Include relevant experience and how you can help the client."
                  value={applicationData.message}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </FormGroup>

              <PrimaryButton onClick={handleApply} disabled={isApplying}>
                {isApplying ? <LoadingSpinner /> : 'Submit Application'}
              </PrimaryButton>
            </>
          )}
        </ApplicationForm>
      )}
    </JobDetailsContainer>
  );
};

export default JobDetailsPage;