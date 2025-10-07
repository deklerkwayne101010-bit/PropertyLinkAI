import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const ForgotPasswordContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  padding: ${({ theme }) => theme.spacing[4]};
`;

const ForgotPasswordCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 400px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[6]};
    margin: ${({ theme }) => theme.spacing[2]};
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Label = styled.label`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Input = styled.input`
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

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  color: ${({ theme }) => theme.colors.success};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}20;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing[2]};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinksContainer = styled.div`
  text-align: center;
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
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.white};
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
});

type ForgotPasswordFormData = {
  email: string;
};

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Implement password reset API call
      console.log('Password reset request for:', data.email);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ForgotPasswordContainer>
      <ForgotPasswordCard>
        <Logo>
          <LogoText>TaskLink SA</LogoText>
          <Subtitle>Reset your password</Subtitle>
        </Logo>

        {success ? (
          <div>
            <SuccessMessage>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
                Check your email
              </h3>
              <p style={{ marginBottom: '16px' }}>
                We've sent password reset instructions to your email address.
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </SuccessMessage>

            <Button
              onClick={() => setSuccess(false)}
              style={{ marginTop: '24px', backgroundColor: '#6B7280' }}
            >
              Try Different Email
            </Button>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '24px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
              </FormGroup>

              {error && <ErrorMessage style={{ textAlign: 'center' }}>{error}</ErrorMessage>}

              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : 'Send Reset Link'}
              </Button>
            </Form>
          </>
        )}

        <LinksContainer>
          <LinkText to="/login">Back to sign in</LinkText>
        </LinksContainer>
      </ForgotPasswordCard>
    </ForgotPasswordContainer>
  );
};

export default ForgotPasswordPage;