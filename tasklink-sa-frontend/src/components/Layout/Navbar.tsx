import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const NavbarContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex[40]};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 400px;
  flex: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  padding-left: ${({ theme }) => theme.spacing[10]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing[3]};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const NotificationButton = styled.button`
  position: relative;
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.gray[600]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  object-fit: cover;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const ProfileName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileRole = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

interface NavbarProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, showMenuButton }) => {
  const navigate = useNavigate();

  // Mock user data - this would come from auth context
  const user = {
    name: 'John Doe',
    role: 'Task Poster',
    avatar: 'https://via.placeholder.com/32',
    unreadNotifications: 3,
  };

  return (
    <NavbarContainer>
      <LeftSection>
        {showMenuButton && (
          <MenuButton onClick={onMenuClick}>
            ☰
          </MenuButton>
        )}
        <Logo to="/dashboard">
          TaskLink SA
        </Logo>
      </LeftSection>

      <SearchBar>
        <SearchIcon>🔍</SearchIcon>
        <SearchInput
          type="text"
          placeholder="Search jobs, skills, or users..."
        />
      </SearchBar>

      <RightSection>
        <NotificationButton>
          🔔
          {user.unreadNotifications > 0 && (
            <NotificationBadge>
              {user.unreadNotifications}
            </NotificationBadge>
          )}
        </NotificationButton>

        <ProfileButton onClick={() => navigate('/profile')}>
          <ProfileImage src={user.avatar} alt={user.name} />
          <ProfileInfo>
            <ProfileName>{user.name}</ProfileName>
            <ProfileRole>{user.role}</ProfileRole>
          </ProfileInfo>
        </ProfileButton>
      </RightSection>
    </NavbarContainer>
  );
};

export default Navbar;