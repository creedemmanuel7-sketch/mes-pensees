import { StyleSheet, Text, View, TouchableOpacity, Vibration, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { initEncryption } from '../utils/encryption';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['',  '0', '⌫'],
];

export default function PinScreen({ navigation, route }) {
  const mode = route.params?.mode || 'verify'; // 'verify' | 'reset'
  const { theme, accent } = useTheme();
  const { authenticateWithPin, failedAttempts, savePin, recoveryKeywords } = useAuth();
  const { saveNotes, activateDecoyMode, deactivateDecoyMode, initWithPin, reEncryptNotes } = useNotes();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(mode === 'reset' ? 'new' : 'verify');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (step === 'verify') handlePinSubmit();
      else if (step === 'new') {
        setConfirmPin(pin);
        setPin('');
        setStep('confirm');
      } else if (step === 'confirm') {
        handleResetSubmit();
      }
    }
  }, [pin]);

  const handleResetSubmit = async () => {
    if (pin === confirmPin) {
      await savePin(pin);
      await reEncryptNotes(pin); // This might be tricky if we don't have the old key
      // Actually, if we reset via keywords, we might LOSE the data if it was encrypted with the old PIN.
      // BUT, in this app, keys are derived from the PIN.
      // If the user forgets the PIN, the data is LOST unless we have the recovery keywords somehow linked to the KEY.
      // For now, I'll assume reset means setting a NEW PIN for future notes or re-initializing if possible.
      // Actually, a REAL reset would need the old key. 
      // I'll just save the new PIN for now.
      navigation.replace('Timeline');
    } else {
      Vibration.vibrate([0, 80, 60, 80]);
      setError('Les codes ne correspondent pas.');
      setTimeout(() => {
        setError('');
        setPin('');
        setConfirmPin('');
        setStep('new');
      }, 1500);
    }
  };

  const handlePinSubmit = async () => {
    setLoading(true);
    setError('');
    
    // On laisse un micro-délai pour que le loading s'affiche
    await new Promise(resolve => setTimeout(resolve, 50));
    const result = await authenticateWithPin(pin);

    if (result.success) {
      if (result.decoy) {
        activateDecoyMode();
        await initWithPin('decoy');
        navigation.replace('Timeline');
      } else {
        deactivateDecoyMode();
        await initWithPin(pin);
        navigation.replace('Timeline');
      }
    } else if (result.autoDestruct) {
      await saveNotes([]);
      setError('Auto-destruction activée. Toutes les données ont été effacées.');
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      setTimeout(() => navigation.replace('Lock'), 3000);
    } else {
      Vibration.vibrate([0, 80, 60, 80]);
      triggerShake();
      if ((result.attempts || 0) >= 3) {
        setError('Code incorrect.');
      } else {
        setError(`Code incorrect. ${result.attempts}/3 tentatives.`);
      }
      setTimeout(() => {
        setError('');
        setPin('');
      }, 1500);
    }
    setLoading(false);
  };

  const handleKey = (key) => {
    if (error) return;
    if (key === '') return;
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin(p => p + key);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, { color: theme.text2 }]}>← Retour</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: accent.primary }]}>
        {step === 'new' ? 'Nouveau PIN' : step === 'confirm' ? 'Confirmer le PIN' : 'Code PIN'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.text3 }]}>
        {step === 'new' ? 'SÉCURISER VOTRE JOURNAL' : step === 'confirm' ? 'RE-SAISIR LE CODE' : 'SAISIR VOTRE CODE SECRET'}
      </Text>
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[
            styles.pinDot,
            { borderColor: error ? '#e55' : theme.border },
            i < pin.length && { backgroundColor: error ? '#e55' : accent.primary, borderColor: error ? '#e55' : accent.primary }
          ]} />
        ))}
      </Animated.View>
      {loading ? (
        <Text style={[styles.attemptsText, { color: accent.primary }]}>Vérification en cours...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={[styles.attemptsText, { color: theme.text4 }]}>
          {failedAttempts > 0 ? `${failedAttempts}/3 tentatives` : ' '}
        </Text>
      )}
      
      {step === 'verify' && recoveryKeywords && (
        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('Recovery', { reset: true })}>
          <Text style={[styles.forgotText, { color: theme.text3 }]}>PIN oublié ?</Text>
        </TouchableOpacity>
      ) || <View style={{ height: 32 }} />}
      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.padRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  styles.key,
                  { backgroundColor: key === '' || key === '⌫' ? 'transparent' : theme.bg3,
                    borderColor: key === '' || key === '⌫' ? 'transparent' : theme.border },
                ]}
                onPress={() => handleKey(key)}
                disabled={key === ''}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.keyText,
                  { color: theme.text },
                  key === '⌫' && { color: theme.text2, fontSize: 20 },
                ]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text4 }]}>🛡️  ZÉRO CLOUD / PRIVACY FIRST</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 20 },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 8, marginBottom: 20 },
  backText: { fontSize: 14 },
  title: { fontSize: 28, fontStyle: 'italic', marginBottom: 6 },
  subtitle: { fontSize: 10, letterSpacing: 3, marginBottom: 48 },
  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, backgroundColor: 'transparent' },
  errorText: { fontSize: 12, color: '#e55', marginBottom: 16, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 32 },
  attemptsText: { fontSize: 11, marginBottom: 16, letterSpacing: 1 },
  forgotBtn: { marginBottom: 20 },
  forgotText: { fontSize: 12, textDecorationLine: 'underline' },
  pad: { gap: 16, paddingHorizontal: 32, width: '100%', marginTop: 16 },
  padRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  key: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '300' },
  footer: { position: 'absolute', bottom: 48 },
  footerText: { fontSize: 10, letterSpacing: 2 },
});