import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from './src/supabase';
import AuthScreen    from './src/screens/AuthScreen';
import MapScreen     from './src/screens/MapScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import DetailScreen  from './src/screens/DetailScreen';
import AddScreen     from './src/screens/AddScreen';
import SavedScreen    from './src/screens/SavedScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AdminScreen       from './src/screens/AdminScreen';
import TabBar        from './src/components/TabBar';

const Stack = createNativeStackNavigator();
const Tabs  = createBottomTabNavigator();

function MainTabs({ navigation }) {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} onAdd={() => navigation.navigate('Add')} />
      )}
    >
      <Tabs.Screen name="Map"     component={MapScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Saved"   component={SavedScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function App() {
  // Track session globally so screens can access it
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {/* ── Always accessible ── */}
          <Stack.Screen name="Main"   component={MainTabs} />
          <Stack.Screen name="Detail" component={DetailScreen} />

          {/* ── Requires auth (handled inside screen) ── */}
          <Stack.Screen
            name="Add"
            component={AddScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />

          {/* ── Auth modal ── */}
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
