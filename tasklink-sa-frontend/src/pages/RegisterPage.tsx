import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  padding: ${({ theme }) => theme.spacing[4]};
`;

const RegisterCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 450px;

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

const Select = styled.select`
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

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.error};
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

const RoleSelection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const RoleCard = styled.div<{ selected: boolean }>`
  padding: ${({ theme }) => theme.spacing[6]};
  border: 2px solid ${({ selected, theme }) => selected ? theme.colors.primary : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  text-align: center;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  background: ${({ selected, theme }) => selected ? `${theme.colors.primary}05` : theme.colors.white};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}05;
  }
`;

const RoleIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const RoleTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const RoleDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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
  role: yup.string().oneOf(['poster', 'doer'], 'Please select a role').required('Role is required'),
  firstName: yup.string().min(2, 'First name must be at least 2 characters').required('First name is required'),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  phone: yup.string().matches(/^(\+27|0)[6-8][0-9]{8}$/, 'Please enter a valid South African phone number').required('Phone number is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions').required(),
});

type RegisterFormData = {
  role: 'poster' | 'doer';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'poster' | 'doer' | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement registration API call
      console.log('Registration data:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to email verification
      navigate('/email-verification', { state: { email: data.email } });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: 'poster' | 'doer') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <Logo>
          <LogoText>TaskLink SA</LogoText>
          <Subtitle>Join our community and start connecting today!</Subtitle>
        </Logo>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <RoleSelection>
            <RoleCard selected={selectedRole === 'poster'} onClick={() => handleRoleSelect('poster')}>
              <RoleIcon>📋</RoleIcon>
              <RoleTitle>Task Poster</RoleTitle>
              <RoleDescription>I need to post tasks and find workers</RoleDescription>
            </RoleCard>
            <RoleCard selected={selectedRole === 'doer'} onClick={() => handleRoleSelect('doer')}>
              <RoleIcon>🔨</RoleIcon>
              <RoleTitle>Task Doer</RoleTitle>
              <RoleDescription>I want to find work and earn money</RoleDescription>
            </RoleCard>
          </RoleSelection>
          {errors.role && <ErrorMessage style={{ textAlign: 'center' }}>{errors.role.message}</ErrorMessage>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter first name"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && <ErrorMessage>{errors.firstName.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter last name"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && <ErrorMessage>{errors.lastName.message}</ErrorMessage>}
            </FormGroup>
          </div>

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

          <FormGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+27 XX XXX XXXX"
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && <ErrorMessage>{errors.phone.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="terms"
                type="checkbox"
                {...register('terms')}
                disabled={isLoading}
              />
              <Label htmlFor="terms" style={{ margin: 0, fontSize: '14px' }}>
                I agree to the <LinkText to="/terms">Terms & Conditions</LinkText> and <LinkText to="/privacy">Privacy Policy</LinkText>
              </Label>
            </div>
            {errors.terms && <ErrorMessage>{errors.terms.message}</ErrorMessage>}
          </FormGroup>

          {error && <ErrorMessage style={{ textAlign: 'center' }}>{error}</ErrorMessage>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : 'Create Account'}
          </Button>
        </Form>

        <LinksContainer>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Already have an account?
          </p>
          <LinkText to="/login">Sign in instead</LinkText>
        </LinksContainer>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;