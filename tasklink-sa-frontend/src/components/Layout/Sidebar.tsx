import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const SidebarContainer = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.white};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform ${({ theme }) => theme.transitions.normal};
  z-index: ${({ theme }) => theme.zIndex[50]};
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: fixed;
  }
`;

const SidebarHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  display: block;

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const SidebarNav = styled.nav`
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

const NavSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const NavSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const NavLink = styled(Link)<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.gray[700]};
  background-color: ${({ theme, active }) =>
    active ? theme.colors.primary + '10' : 'transparent'};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme, active }) =>
    active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CloseButton = styled.button`
  display: none;
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.gray[500]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    {
      section: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/jobs', label: 'Browse Jobs', icon: '💼' },
        { path: '/post-job', label: 'Post a Job', icon: '➕' },
      ],
    },
    {
      section: 'Account',
      items: [
        { path: '/profile', label: 'My Profile', icon: '👤' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
        { path: '/messages', label: 'Messages', icon: '💬' },
        { path: '/applications', label: 'My Applications', icon: '📋' },
        { path: '/my-jobs', label: 'My Jobs', icon: '📁' },
      ],
    },
    {
      section: 'Business',
      items: [
        { path: '/wallet', label: 'Wallet', icon: '💰' },
        { path: '/transactions', label: 'Transactions', icon: '📈' },
        { path: '/earnings', label: 'Earnings', icon: '💵' },
        { path: '/analytics', label: 'Analytics', icon: '📊' },
      ],
    },
  ];

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={onClose}>×</CloseButton>

      <SidebarHeader>
        <Logo to="/dashboard">
          TaskLink SA
        </Logo>
      </SidebarHeader>

      <SidebarNav>
        {navigationItems.map((section) => (
          <NavSection key={section.section}>
            <NavSectionTitle>{section.section}</NavSectionTitle>
            <NavList>
              {section.items.map((item) => (
                <NavItem key={item.path}>
                  <NavLink
                    to={item.path}
                    active={location.pathname === item.path}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        ))}

        <NavSection>
          <NavSectionTitle>Support</NavSectionTitle>
          <NavList>
            <NavItem>
              <NavLink
                to="/help"
                active={location.pathname === '/help'}
              >
                <span>❓</span>
                Help Center
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to="/contact"
                active={location.pathname === '/contact'}
              >
                <span>📞</span>
                Contact Us
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to="/faq"
                active={location.pathname === '/faq'}
              >
                <span>📖</span>
                FAQ
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to="/terms"
                active={location.pathname === '/terms'}
              >
                <span>📄</span>
                Terms & Conditions
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to="/privacy"
                active={location.pathname === '/privacy'}
              >
                <span>🔒</span>
                Privacy Policy
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
      </SidebarNav>
    </SidebarContainer>
  );
};

export default Sidebar;