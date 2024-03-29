import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const NavigationContainer = ({ theme, navigationRef, children }) => {
  return (
    <SafeAreaProvider className="flex-1 bg-white">
      <RNNavigationContainer theme={theme} ref={navigationRef}>
        {children}
      </RNNavigationContainer>
    </SafeAreaProvider>
  );
};
