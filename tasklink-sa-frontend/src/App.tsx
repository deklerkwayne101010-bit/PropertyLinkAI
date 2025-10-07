import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/global';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Auth/PrivateRoute';
import PublicRoute from './components/Auth/PublicRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import PostJobPage from './pages/PostJobPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import MyJobsPage from './pages/MyJobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EarningsPage from './pages/EarningsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactUsPage from './pages/ContactUsPage';
import FAQPage from './pages/FAQPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/email-verification" element={<PublicRoute><EmailVerificationPage /></PublicRoute>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/jobs" element={<PrivateRoute><JobsPage /></PrivateRoute>} />
            <Route path="/jobs/:id" element={<PrivateRoute><JobDetailsPage /></PrivateRoute>} />
            <Route path="/post-job" element={<PrivateRoute><PostJobPage /></PrivateRoute>} />

            {/* Account Routes */}
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

            {/* Business Routes */}
            <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
            <Route path="/my-jobs" element={<PrivateRoute><MyJobsPage /></PrivateRoute>} />
            <Route path="/applications" element={<PrivateRoute><ApplicationsPage /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
            <Route path="/earnings" element={<PrivateRoute><EarningsPage /></PrivateRoute>} />

            {/* Support Routes - Public */}
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;