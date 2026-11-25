import '../src/config/polyfills';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '../src/providers/QueryProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.milky,
              },
              headerTintColor: colors.black,
              headerTitleStyle: {
                fontWeight: 'bold',
                color: colors.black,
              },
              contentStyle: {
                backgroundColor: colors.milky,
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                title: 'SONORA Home',
              }}
            />
            <Stack.Screen
              name="wallet/index"
              options={{
                title: 'Wallet',
                headerBackTitle: 'Home',
              }}
            />
            <Stack.Screen
              name="send/index"
              options={{
                title: 'Send Payment',
                headerBackTitle: 'Home',
              }}
            />
            <Stack.Screen
              name="receive/index"
              options={{
                title: 'Receive Payment',
                headerBackTitle: 'Home',
              }}
            />
            <Stack.Screen
              name="contacts/index"
              options={{
                title: 'Contacts',
                headerBackTitle: 'Home',
              }}
            />
            <Stack.Screen
              name="settings/index"
              options={{
                title: 'Settings',
                headerBackTitle: 'Home',
              }}
            />
          </Stack>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
