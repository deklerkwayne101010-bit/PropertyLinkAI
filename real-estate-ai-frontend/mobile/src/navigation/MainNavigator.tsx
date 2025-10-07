import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Home: undefined;
  Generate: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Generate" component={GenerateScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;

// Temporary placeholder components - will be replaced with actual implementations
const HomeScreen: React.FC = () => {
  return null;
};

const GenerateScreen: React.FC = () => {
  return null;
};

const HistoryScreen: React.FC = () => {
  return null;
};

const ProfileScreen: React.FC = () => {
  return null;
};