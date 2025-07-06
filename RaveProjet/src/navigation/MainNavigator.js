import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import DashboardScreen from '../screens/DashboardScreen';
import MicrophoneScreen from '../screens/MicrophoneScreen';
import TransformScreen from '../screens/TransformScreen';

import { fetchRecordList } from '../store/slices/audioSlice';
import { updateCurrentTab } from '../store/slices/uiSlice';

const Tab = createBottomTabNavigator();

const RootNavigator = () => {
  const dispatch = useDispatch();
  const serverState = useSelector(state => state.server);

  useEffect(() => {
    dispatch(fetchRecordList());
  }, [dispatch]);

  const defineTabIcon = (screenName, isFocused) => {
    switch (screenName) {
      case 'Dashboard':
        return isFocused ? 'home' : 'home-outline';
      case 'Recorder':
        return isFocused ? 'mic' : 'mic-outline';
      case 'Converter':
        return isFocused ? 'musical-notes' : 'musical-notes-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icon = defineTabIcon(route.name, focused);
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00B2FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#1B1B1D',
          borderTopColor: '#333',
          borderTopWidth: 1,
          paddingTop: 5,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5,
        },
        headerStyle: {
          backgroundColor: '#1B1B1D',
          borderBottomColor: '#333',
          borderBottomWidth: 1,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        tabBarButton: (props) => (
          <Pressable
            {...props}
            onPress={(e) => {
              dispatch(updateCurrentTab(route.name.toLowerCase()));
              props.onPress(e);
            }}
          />
        )
      })}
      initialRouteName="Dashboard"
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: '🔌 Connexion Serveur',
          tabBarLabel: 'Serveur',
          tabBarBadge: !serverState.connected ? '!' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF453A',
            color: 'white',
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />

      <Tab.Screen
        name="Recorder"
        component={MicrophoneScreen}
        options={{
          headerTitle: '🎙️ Capture Audio',
          tabBarLabel: 'Micro'
        }}
      />

      <Tab.Screen
        name="Converter"
        component={TransformScreen}
        options={{
          headerTitle: '🧬 Conversion IA',
          tabBarLabel: 'Convertir',
          tabBarBadge: !serverState.connected ? '?' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF9F0A',
            color: 'white',
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
