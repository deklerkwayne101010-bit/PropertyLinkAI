import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

// Temporary placeholder components - will be replaced with actual implementations
const LoginScreen: React.FC = () => {
  return null;
};

const SignupScreen: React.FC = () => {
  return null;
};