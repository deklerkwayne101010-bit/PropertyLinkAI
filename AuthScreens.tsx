import React, { useState } from 'react';
import './design-system.css';
import './AuthScreens.css';

// Types for our auth forms
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface AuthScreensProps {
  initialView?: 'login' | 'signup';
  onLogin?: (data: LoginFormData) => void;
  onSignup?: (data: SignupFormData) => void;
  onSocialLogin?: (provider: 'google' | 'facebook') => void;
}

const AuthScreens: React.FC<AuthScreensProps> = ({
  initialView = 'login',
  onLogin,
  onSignup,
  onSocialLogin
}) => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>(initialView);
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [signupData, setSignupData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateLoginForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!signupData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!signupData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(signupData.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!signupData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms of service';
    }

    if (!signupData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Event handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    try {
      await onLogin?.(loginData);
    } catch (error) {
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);
    try {
      await onSignup?.(signupData);
    } catch (error) {
      setErrors({ submit: 'Signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      await onSocialLogin?.(provider);
    } catch (error) {
      setErrors({ submit: `${provider} login failed. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => {
    setCurrentView('signup');
    setErrors({});
  };

  const switchToLogin = () => {
    setCurrentView('login');
    setErrors({});
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🏠</div>
            <h1 className="logo-text">RealEstate AI</h1>
          </div>
          <p className="auth-subtitle">
            {currentView === 'login'
              ? 'Welcome back! Sign in to your account'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="social-login-section">
          <button
            type="button"
            className="social-btn google-btn"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            aria-label="Continue with Google"
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            className="social-btn facebook-btn"
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            aria-label="Continue with Facebook"
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Login Form */}
        {currentView === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                disabled={isLoading}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span id="email-error" className="form-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                disabled={isLoading}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <span id="password-error" className="form-error">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  disabled={isLoading}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <button type="button" className="link-btn">
                Forgot password?
              </button>
            </div>

            {errors.submit && (
              <div className="form-error-message">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              className="auth-btn primary-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {currentView === 'signup' && (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name" className="form-label">
                  First Name
                </label>
                <input
                  id="first-name"
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  value={signupData.firstName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  disabled={isLoading}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && (
                  <span id="firstName-error" className="form-error">
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last-name" className="form-label">
                  Last Name
                </label>
                <input
                  id="last-name"
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  value={signupData.lastName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  disabled={isLoading}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                />
                {errors.lastName && (
                  <span id="lastName-error" className="form-error">
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={signupData.email}
                onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@example.com"
                disabled={isLoading}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
              />
              {errors.email && (
                <span id="signup-email-error" className="form-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a strong password"
                disabled={isLoading}
                aria-describedby={errors.password ? 'signup-password-error' : 'password-help'}
              />
              {errors.password && (
                <span id="signup-password-error" className="form-error">
                  {errors.password}
                </span>
              )}
              <span id="password-help" className="form-help">
                Must be at least 8 characters long
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                disabled={isLoading}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {errors.confirmPassword && (
                <span id="confirmPassword-error" className="form-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className="form-consent">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={signupData.agreeToTerms}
                  onChange={(e) => setSignupData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                  disabled={isLoading}
                />
                <span className="checkbox-text">
                  I agree to the{' '}
                  <button type="button" className="link-btn">
                    Terms of Service
                  </button>
                </span>
              </label>
              {errors.agreeToTerms && (
                <span className="form-error">{errors.agreeToTerms}</span>
              )}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={signupData.agreeToPrivacy}
                  onChange={(e) => setSignupData(prev => ({ ...prev, agreeToPrivacy: e.target.checked }))}
                  disabled={isLoading}
                />
                <span className="checkbox-text">
                  I agree to the{' '}
                  <button type="button" className="link-btn">
                    Privacy Policy
                  </button>
                </span>
              </label>
              {errors.agreeToPrivacy && (
                <span className="form-error">{errors.agreeToPrivacy}</span>
              )}
            </div>

            {errors.submit && (
              <div className="form-error-message">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              className="auth-btn primary-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="auth-footer">
          {currentView === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button type="button" className="link-btn" onClick={switchToSignup}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={switchToLogin}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreens;