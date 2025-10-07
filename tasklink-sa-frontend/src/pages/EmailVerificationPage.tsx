import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

const EmailVerificationContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  padding: ${({ theme }) => theme.spacing[4]};
`;

const EmailVerificationCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 500px;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[6]};
    margin: ${({ theme }) => theme.spacing[2]};
  }
`;

const Logo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Icon = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const EmailDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.gray[50]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const EmailText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  margin: ${({ theme }) => theme.spacing[2]} 0;

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
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  margin: ${({ theme }) => theme.spacing[2]} 0;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinksContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const LinkText = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: underline;
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  color: ${({ theme }) => theme.colors.success};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}20;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error}10;
  color: ${({ theme }) => theme.colors.error};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.error}20;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const email = location.state?.email || 'your email';

  useEffect(() => {
    // Check if email is already verified (from URL params or state)
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

    if (token) {
      // Auto-verify with token
      handleVerification(token);
    }
  }, [location]);

  const handleVerification = async (token?: string) => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement email verification API call
      console.log('Verifying email with token:', token);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsVerified(true);
    } catch (err) {
      setError('Verification failed. The link may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');

    try {
      // TODO: Implement resend verification API call
      console.log('Resending verification to:', email);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      alert('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/login', { state: { message: 'Email verified successfully! Please sign in.' } });
  };

  if (isVerified) {
    return (
      <EmailVerificationContainer>
        <EmailVerificationCard>
          <Logo>
            <LogoText>TaskLink SA</LogoText>
          </Logo>

          <Icon>✅</Icon>

          <Title>Email Verified!</Title>

          <SuccessMessage>
            <p>Your email has been successfully verified. You can now sign in to your account.</p>
          </SuccessMessage>

          <Button onClick={handleContinue}>
            Continue to Sign In
          </Button>

          <LinksContainer>
            <LinkText to="/login">Back to sign in</LinkText>
          </LinksContainer>
        </EmailVerificationCard>
      </EmailVerificationContainer>
    );
  }

  return (
    <EmailVerificationContainer>
      <EmailVerificationCard>
        <Logo>
          <LogoText>TaskLink SA</LogoText>
        </Logo>

        <Icon>📧</Icon>

        <Title>Check your email</Title>

        <Subtitle>
          We've sent a verification link to your email address. Click the link to verify your account and start using TaskLink SA.
        </Subtitle>

        <EmailDisplay>
          <EmailText>{email}</EmailText>
        </EmailDisplay>

        {isLoading && (
          <div>
            <LoadingSpinner />
            <p>Verifying your email...</p>
          </div>
        )}

        {error && (
          <ErrorMessage>
            <p>{error}</p>
          </ErrorMessage>
        )}

        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
          Didn't receive the email? Check your spam folder or click below to resend.
        </p>

        <SecondaryButton onClick={handleResendVerification} disabled={resendLoading || isLoading}>
          {resendLoading ? 'Sending...' : 'Resend Verification Email'}
        </SecondaryButton>

        <LinksContainer>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Wrong email address?
          </p>
          <LinkText to="/register">Create a new account</LinkText>
        </LinksContainer>
      </EmailVerificationCard>
    </EmailVerificationContainer>
  );
};

export default EmailVerificationPage;