import 'react-native-get-random-values';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotesProvider } from './context/NotesContext';
import { AuthProvider } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';

import OnboardingScreen from './screens/OnboardingScreen';
import LockScreen from './screens/LockScreen';
import PinScreen from './screens/PinScreen';
import TimelineScreen from './screens/TimelineScreen';
import EditorScreen from './screens/EditorScreen';
import StatsScreen from './screens/StatsScreen';
import CoffreScreen from './screens/CoffreScreen';
import PersonnalisationScreen from './screens/PersonnalisationScreen';
import DrawerScreen from './screens/DrawerScreen';
import SearchScreen from './screens/SearchScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import ShareNoteScreen from './screens/ShareNoteScreen';
import CapsulesScreen from './screens/CapsulesScreen';
import TrashScreen from './screens/TrashScreen';
import RecoveryScreen from './screens/RecoveryScreen';


const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isFirstLaunch, resolvedMode, theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated && navigationRef.current) {
      try {
        const currentRoute = navigationRef.current.getCurrentRoute()?.name;
        const protectedScreens = ['Timeline', 'Editor', 'Stats', 'Coffre', 'Personnalisation', 'Search', 'Notifications', 'Drawer'];
        if (protectedScreens.includes(currentRoute)) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Lock' }],
          });
        }
      } catch (e) {}
    }
  }, [isAuthenticated]);

  // Sur le Web, on évite de bloquer l'affichage si le chargement prend du temps
  if (isFirstLaunch === null && Platform.OS !== 'web') return null;

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isFirstLaunch ? 'Onboarding' : 'Lock'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            animation: 'fade_from_bottom',
            animationDuration: 380,
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen}
            options={{ animation: 'fade', animationDuration: 600 }} />
          <Stack.Screen name="Lock" component={LockScreen}
            options={{ animation: 'fade', animationDuration: 500 }} />
          <Stack.Screen name="Pin" component={PinScreen}
            options={{ animation: 'slide_from_bottom', animationDuration: 400, gestureDirection: 'vertical' }} />
          <Stack.Screen name="Timeline" component={TimelineScreen}
            options={{ animation: 'fade_from_bottom', animationDuration: 380 }} />
          <Stack.Screen name="Editor" component={EditorScreen}
            options={{ animation: 'slide_from_bottom', animationDuration: 400, gestureDirection: 'vertical' }} />
          <Stack.Screen name="Stats" component={StatsScreen}
            options={{ animation: 'fade_from_bottom', animationDuration: 380 }} />
          <Stack.Screen name="Coffre" component={CoffreScreen}
            options={{ animation: 'fade_from_bottom', animationDuration: 380 }} />
          <Stack.Screen name="Personnalisation" component={PersonnalisationScreen}
            options={{ animation: 'slide_from_right', animationDuration: 380 }} />
          <Stack.Screen name="Search" component={SearchScreen}
            options={{ animation: 'slide_from_right', animationDuration: 380 }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen}
            options={{ animation: 'slide_from_right', animationDuration: 380 }} />
          <Stack.Screen name="Drawer" component={DrawerScreen}
            options={{ animation: 'none', presentation: 'transparentModal' }} />
            <Stack.Screen name="ShareNote" component={ShareNoteScreen}
  options={{ animation: 'slide_from_bottom', animationDuration: 400 }} />
  <Stack.Screen name="Capsules" component={CapsulesScreen}
  options={{ animation: 'slide_from_right', animationDuration: 380 }} />
  <Stack.Screen name="Trash" component={TrashScreen}
  options={{ animation: 'slide_from_right', animationDuration: 380 }} />
  <Stack.Screen name="Recovery" component={RecoveryScreen}
  options={{ animation: 'slide_from_bottom', animationDuration: 400 }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={Platform.OS === 'web' ? { flex: 1, minHeight: '100vh' } : { flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotesProvider>
            <SoundProvider>
              <AppNavigator />
            </SoundProvider>
          </NotesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}