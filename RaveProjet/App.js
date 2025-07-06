
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';

import { store, persistor } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import NotificationToast from './src/components/NotificationToast';


export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loader />} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#111111" />
            <RootNavigator />
            <NotificationToast />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}