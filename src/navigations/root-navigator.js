import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

// import { useAuth } from './../core';

import { AuthNavigator } from './auth-navigator';
import { NavigationContainer } from './navigation-container';
import { DrawerNavigator } from './drawer-navigator';
const Stack = createNativeStackNavigator();

export const Root = () => {
    // const status = useAuth.use.status();
    const status = true;
    const hideSplash = React.useCallback(async () => {
        await SplashScreen.hideAsync();
    }, []);
    useEffect(() => {
        if (status !== 'idle') {
            hideSplash();
        }
    }, [hideSplash, status]);

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'none',
            }}
        >
            <Stack.Group>
                {status === 'signOut' ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <Stack.Screen name="App" component={DrawerNavigator} />
                )}
            </Stack.Group>
        </Stack.Navigator>
    );
};

export const RootNavigator = () => (
    <NavigationContainer>
        <Root />
    </NavigationContainer>
);