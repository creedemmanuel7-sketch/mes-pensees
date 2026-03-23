import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const AuthContext = createContext();

const AUTO_LOCK_OPTIONS = [1, 2, 5, 10];

export function AuthProvider({ children }) {
  const [pin, setPin] = useState(null);
  const [decoyPin, setDecoyPin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [autoDestructEnabled, setAutoDestructEnabled] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [intrusionAlert, setIntrusionAlert] = useState(false);
  const [intrusionPhotos, setIntrusionPhotos] = useState([]);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [recoveryKeywords, setRecoveryKeywordsState] = useState(null);

  const backgroundTimeRef = useRef(null);
  const navigationRef = useRef(null);

  useEffect(() => { loadAuth(); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isAuthenticated, autoLockMinutes, incognitoMode]);

  const handleAppStateChange = (nextState) => {
    if (nextState === 'background' || nextState === 'inactive') {
      backgroundTimeRef.current = Date.now();
      if (incognitoMode) {
        setIsAuthenticated(false);
      }
    } else if (nextState === 'active') {
      if (backgroundTimeRef.current && isAuthenticated) {
        const elapsed = (Date.now() - backgroundTimeRef.current) / 1000 / 60;
        if (elapsed >= autoLockMinutes) {
          setIsAuthenticated(false);
        }
      }
      backgroundTimeRef.current = null;
    }
  };

  const loadAuth = async () => {
    try {
      const savedPin          = await AsyncStorage.getItem('user_pin');
      const savedDecoy        = await AsyncStorage.getItem('decoy_pin');
      const savedAutoDestruct = await AsyncStorage.getItem('auto_destruct');
      const savedFails        = await AsyncStorage.getItem('failed_attempts');
      const savedIncognito    = await AsyncStorage.getItem('incognito_mode');
      const savedIntrusion    = await AsyncStorage.getItem('intrusion_alert');
      const savedPhotos       = await AsyncStorage.getItem('intrusion_photos');
      const savedAutoLock     = await AsyncStorage.getItem('auto_lock_minutes');
      const savedRecovery     = await AsyncStorage.getItem('recovery_keywords');

      if (savedPin)          setPin(savedPin);
      if (savedDecoy)        setDecoyPin(savedDecoy);
      if (savedAutoDestruct) setAutoDestructEnabled(savedAutoDestruct === 'true');
      if (savedFails)        setFailedAttempts(parseInt(savedFails));
      if (savedIncognito)    setIncognitoMode(savedIncognito === 'true');
      if (savedIntrusion)    setIntrusionAlert(savedIntrusion === 'true');
      if (savedPhotos)       setIntrusionPhotos(JSON.parse(savedPhotos));
      if (savedAutoLock)     setAutoLockMinutes(parseInt(savedAutoLock));
      if (savedRecovery)     setRecoveryKeywordsState(JSON.parse(savedRecovery));

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (e) {
      console.error(e);
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller Mes Pensées',
        fallbackLabel: 'Utiliser le code PIN',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsAuthenticated(true);
        setFailedAttempts(0);
        await AsyncStorage.setItem('failed_attempts', '0');
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  const authenticateWithPin = async (inputPin) => {
    const currentPin = pin || '1234';
    if (inputPin === currentPin) {
      setIsAuthenticated(true);
      setIsDecoyMode(false);
      setFailedAttempts(0);
      await AsyncStorage.setItem('failed_attempts', '0');
      return { success: true, decoy: false };
    }
    if (decoyPin && inputPin === decoyPin) {
      setIsAuthenticated(true);
      setIsDecoyMode(true);
      return { success: true, decoy: true };
    }
    const newFails = failedAttempts + 1;
    setFailedAttempts(newFails);
    await AsyncStorage.setItem('failed_attempts', newFails.toString());
    if (intrusionAlert) await captureIntrusionLog();
    if (autoDestructEnabled && newFails >= 3) {
      return { success: false, autoDestruct: true };
    }
    return { success: false, attempts: newFails };
  };

  const saveIntrusionPhoto = async (photoUri) => {
    await captureIntrusionLog(photoUri);
  };

  const captureIntrusionLog = async (photoUri = null) => {
    try {
      const log = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        note: 'Tentative de déverrouillage échouée',
        photo: photoUri,
      };
      const updated = [log, ...intrusionPhotos].slice(0, 10);
      setIntrusionPhotos(updated);
      await AsyncStorage.setItem('intrusion_photos', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const savePin = async (newPin) => {
    setPin(newPin);
    await AsyncStorage.setItem('user_pin', newPin);
  };

  const saveDecoyPin = async (newDecoyPin) => {
    setDecoyPin(newDecoyPin);
    await AsyncStorage.setItem('decoy_pin', newDecoyPin);
  };

  const toggleAutoDestruct = async (enabled) => {
    setAutoDestructEnabled(enabled);
    await AsyncStorage.setItem('auto_destruct', enabled.toString());
  };

  const toggleIncognito = async (enabled) => {
    setIncognitoMode(enabled);
    await AsyncStorage.setItem('incognito_mode', enabled.toString());
  };

  const toggleIntrusionAlert = async (enabled) => {
    setIntrusionAlert(enabled);
    await AsyncStorage.setItem('intrusion_alert', enabled.toString());
  };

  const setAutoLock = async (minutes) => {
    setAutoLockMinutes(minutes);
    await AsyncStorage.setItem('auto_lock_minutes', minutes.toString());
  };

  const lock = () => {
    setIsAuthenticated(false);
    setIsDecoyMode(false);
  };

  const setRecoveryKeywords = async (words) => {
    setRecoveryKeywordsState(words);
    await AsyncStorage.setItem('recovery_keywords', JSON.stringify(words));
  };

  const clearIntrusionPhotos = async () => {
    setIntrusionPhotos([]);
    await AsyncStorage.removeItem('intrusion_photos');
  };

  const deleteIntrusionPhoto = async (id) => {
    const updated = intrusionPhotos.filter(p => p.id !== id);
    setIntrusionPhotos(updated);
    await AsyncStorage.setItem('intrusion_photos', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      pin, decoyPin, isAuthenticated, biometricAvailable,
      failedAttempts, autoDestructEnabled, isDecoyMode,
      incognitoMode, intrusionAlert, intrusionPhotos,
      autoLockMinutes, AUTO_LOCK_OPTIONS, recoveryKeywords,
      authenticateWithBiometric, authenticateWithPin,
      savePin, saveDecoyPin, toggleAutoDestruct,
      toggleIncognito, toggleIntrusionAlert,
      setAutoLock, lock, saveIntrusionPhoto,
      setRecoveryKeywords, clearIntrusionPhotos, deleteIntrusionPhoto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);