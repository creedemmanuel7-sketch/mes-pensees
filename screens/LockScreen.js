import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { Camera, CameraView } from 'expo-camera';

const { width, height } = Dimensions.get('window');

function AnimatedLines({ accent }) {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (anim, duration, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    loop(anim1, 4000, 0);
    loop(anim2, 5500, 800);
    loop(anim3, 3800, 1600);
  }, []);

  const r1 = anim1.interpolate({ inputRange: [0,1], outputRange: ['-15deg','-10deg'] });
  const r2 = anim2.interpolate({ inputRange: [0,1], outputRange: ['25deg','30deg'] });
  const r3 = anim3.interpolate({ inputRange: [0,1], outputRange: ['-5deg','5deg'] });
  const t1 = anim1.interpolate({ inputRange: [0,1], outputRange: [-20, 20] });
  const t2 = anim2.interpolate({ inputRange: [0,1], outputRange: [10,-15] });
  const t3 = anim3.interpolate({ inputRange: [0,1], outputRange: [-10, 10] });

  const lineStyle = (rotate, tx) => ({
    position: 'absolute', width: width * 1.8, height: 1, left: -width * 0.4,
    transform: [{ rotate }, { translateY: tx }],
  });

  const c = accent.primary + '18';
  const c2 = accent.primary + '10';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[lineStyle(r1, t1), { top: height*0.22, backgroundColor: c }]} />
      <Animated.View style={[lineStyle(r1, t1), { top: height*0.22+2, backgroundColor: c2 }]} />
      <Animated.View style={[lineStyle(r2, t2), { top: height*0.38, backgroundColor: c }]} />
      <Animated.View style={[lineStyle(r2, t2), { top: height*0.38+2, backgroundColor: c2 }]} />
      <Animated.View style={[lineStyle(r3, t3), { top: height*0.55, backgroundColor: c }]} />
      <Animated.View style={[lineStyle(r3, t3), { top: height*0.55+2, backgroundColor: c2 }]} />
      <Animated.View style={[lineStyle(r1, t2), { top: height*0.70, backgroundColor: c2 }]} />
      <Animated.View style={[lineStyle(r2, t1), { top: height*0.82, backgroundColor: c }]} />
    </View>
  );
}

function LockIcon({ accent }) {
  return (
    <Svg width="70" height="80" viewBox="0 0 140 160">
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accent.primary} />
          <Stop offset="0.5" stopColor={accent.secondary} />
          <Stop offset="1" stopColor={accent.secondary} />
        </LinearGradient>
      </Defs>
      <Path d="M35,65 L35,35 Q35,5 70,5 Q105,5 105,35 L105,65"
        fill="none" stroke="url(#lg)" strokeWidth="18" strokeLinecap="round" />
      <Rect x="15" y="60" width="110" height="90" rx="14" fill="url(#lg)" />
      <Circle cx="70" cy="100" r="14" fill="#1a0e0a" />
      <Rect x="63" y="110" width="14" height="20" rx="4" fill="#1a0e0a" />
    </Svg>
  );
}

export default function LockScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const {
    authenticateWithBiometric, biometricAvailable,
    intrusionAlert, failedAttempts, saveIntrusionPhoto
  } = useAuth();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    if (biometricAvailable) {
      handleBiometric();
    }
    requestCameraPermission();
  }, [biometricAvailable]);

  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  const requestCameraPermission = async () => {
    if (intrusionAlert) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log("Camera permission:", status);
    }
  };

  const takeIntrusionPhoto = async () => {
    if (cameraRef.current && intrusionAlert && cameraReady) {
      try {
        console.log("Attempting picture capture...");
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
          fastMode: true,
        });
        console.log("Picture captured:", photo.uri);
        await saveIntrusionPhoto(photo.uri);
      } catch (e) {
        console.error("Camera fail:", e);
      }
    } else {
      console.log("Camera not ready or alert off:", { cameraReady, intrusionAlert });
      // Si la caméra n'est pas prête, on crée au moins un log texte
      if (intrusionAlert) await saveIntrusionPhoto(null);
    }
  };

  useEffect(() => {
    if (failedAttempts > 0 && intrusionAlert) {
      // Un petit délai pour laisser l'UI se mettre à jour
      setTimeout(() => takeIntrusionPhoto(), 500);
    }
  }, [failedAttempts]);

 const { deactivateDecoyMode } = useNotes();

const handleBiometric = async () => {
  const result = await authenticateWithBiometric();
  if (result.success) {
    deactivateDecoyMode();
    navigation.replace('Timeline');
  }
};

  const titleStyle = fontsLoaded
    ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 52, color: accent.primary, marginBottom: 8 }
    : { fontSize: 42, fontStyle: 'italic', color: accent.primary, marginBottom: 8 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <AnimatedLines accent={accent} />

      <Text style={titleStyle}>Mes Pensées</Text>
      <Text style={[styles.subtitle, { color: theme.text3 }]}>CHIFFREMENT DE BOUT EN BOUT</Text>

      <Animated.View style={[styles.lockCircle,
        { backgroundColor: theme.bg3, borderColor: accent.primary + '40' },
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <LockIcon accent={accent} />
        <View style={styles.protectedRow}>
          <View style={[styles.greenDot, { backgroundColor: accent.teal }]} />
          <Text style={[styles.protectedText, { color: theme.text3 }]}>PROTÉGÉ</Text>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.bioButton, { backgroundColor: theme.bg3, borderColor: theme.border }]}
        onPress={handleBiometric}
      >
        <Text style={[styles.bioText, { color: theme.text }]}>
          {biometricAvailable
            ? 'Déverrouiller avec FaceID / Empreinte'
            : 'Biométrie non disponible'}
        </Text>
        <Text style={styles.bioIcons}>🤳  🫆</Text>
      </TouchableOpacity>

      {intrusionAlert && (
        <CameraView
          ref={cameraRef}
          onCameraReady={() => setCameraReady(true)}
          style={{ width: 50, height: 50, opacity: 0.01, position: 'absolute', left: -500 }}
          facing="front"
        />
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Pin')}>
        <Text style={[styles.pinLink, { color: theme.text4 }]}>SAISIR LE CODE PIN</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text4 }]}>🛡️  ZÉRO CLOUD / PRIVACY FIRST</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, overflow: 'hidden' },
  subtitle: { fontSize: 10, letterSpacing: 3, marginBottom: 60 },
  lockCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  protectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 6, height: 6, borderRadius: 3 },
  protectedText: { fontSize: 9, letterSpacing: 2 },
  bioButton: { width: '100%', padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 60, marginBottom: 28 },
  bioText: { fontSize: 14, flex: 1 },
  bioIcons: { fontSize: 22, marginLeft: 12 },
  pinLink: { fontSize: 11, letterSpacing: 2 },
  footer: { position: 'absolute', bottom: 48 },
  footerText: { fontSize: 10, letterSpacing: 2 },
});