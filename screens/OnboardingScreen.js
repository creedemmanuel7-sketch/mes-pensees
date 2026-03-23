import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'sanctuaire',
    visual: (accent, theme) => (
      <View style={styles.visualWrap}>
        <View style={[styles.outerRing, { borderColor: accent.teal + '25' }]} />
        <View style={[styles.innerRing, { borderColor: accent.teal + '12' }]} />
        <View style={[styles.iconCircle, { backgroundColor: theme.bg3, borderColor: theme.border, overflow: 'hidden' }]}>
          <Image source={require('../assets/icon.png')} style={{ width: '100%', height: '100%' }} />
        </View>
      </View>
    ),
    title: 'Le Gardien de\nvos Pensées',
    desc: 'Un sanctuaire sacré, gravé uniquement dans la mémoire de votre téléphone. Zéro nuage, totale sérénité.',
    badge: '🔒 SÉCURITÉ LOCALE',
  },
  {
    key: 'securite',
    visual: (accent, theme) => (
      <View style={styles.visualWrap}>
        <View style={[styles.iconSquare, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={{ fontSize: 64 }}>🫆</Text>
          <View style={[styles.shieldBadge, { backgroundColor: accent.light, borderColor: accent.teal + '50' }]}>
            <Text style={{ fontSize: 14 }}>🛡️</Text>
          </View>
        </View>
      </View>
    ),
    title: 'Le Sceau\nBiométrique',
    desc: 'Protégez vos secrets par FaceID ou Empreinte. Un verrouillage instantané pour un journal vraiment intime.',
    badge: '🤳 FACEID / BIOMETRY READY',
  },
  {
    key: 'ecriture',
    visual: (accent, theme) => (
      <View style={styles.visualWrap}>
        <View style={[styles.iconSquare, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: accent.teal }} />
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            <View style={{ width: 100, height: 3, backgroundColor: accent.primary, opacity: 0.6, borderRadius: 2 }} />
            <View style={{ width: 80, height: 3, backgroundColor: accent.primary, opacity: 0.4, borderRadius: 2 }} />
            <View style={{ width: 60, height: 3, backgroundColor: accent.primary, opacity: 0.3, borderRadius: 2 }} />
            <View style={{ width: 24, height: 24, backgroundColor: accent.primary, opacity: 0.3, borderRadius: 6, marginTop: 4 }} />
          </View>
        </View>
      </View>
    ),
    title: 'Raviver la Flamme\ndu Souvenir',
    desc: 'Écrivez sous la pluie ou au coin du feu. Nos ambiances sonores immersives libèrent votre vérité intérieure.',
    badge: '🎵 ATMOSPHÈRES SENSORIELLES',
  },
  {
    key: 'livre',
    visual: (accent, theme) => (
      <View style={styles.visualWrap}>
        <View style={{ position: 'relative', width: 200, height: 160 }}>
          <View style={[styles.iconSquare, { position: 'absolute', right: 0, bottom: 0, width: 150, height: 140, backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <View style={[{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: accent.light, borderWidth: 1, borderColor: accent.teal + '50' }]}>
              <Text style={{ fontSize: 18 }}>✅</Text>
            </View>
            <Text style={{ fontSize: 9, letterSpacing: 1.5, color: theme.text3, marginTop: 6 }}>EXPORT SÉCURISÉ</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <View style={[styles.exportTag, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                <Text style={[styles.exportTagText, { color: theme.text2 }]}>PDF</Text>
              </View>
              <View style={[styles.exportTag, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                <Text style={[styles.exportTagText, { color: theme.text2 }]}>TXT</Text>
              </View>
            </View>
          </View>
          <View style={[styles.iconSquare, { position: 'absolute', left: 0, top: 0, width: 60, height: 100, opacity: 0.5, backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={{ fontSize: 22 }}>📖</Text>
          </View>
        </View>
      </View>
    ),
    title: 'Votre Héritage\nScellé',
    desc: 'Exportez vos mémoires en PDF élégants ou texte brut. Vous possédez les clés de votre propre livre de vie.',
    badge: '📜 POSSESSION TOTALE',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme, accent, markLaunched } = useTheme();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [current, setCurrent] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const next = async () => {
    if (isLast) {
      await markLaunched();
      navigation.replace('Lock');
    } else {
      animateTransition(() => setCurrent(current + 1));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <Text style={{ fontSize: 16 }}>🔐</Text>
          <Text style={fontsLoaded
            ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 16, color: accent.primary }
            : { fontSize: 16, color: accent.primary, fontStyle: 'italic' }}>
            Mes Pensées
          </Text>
        </View>
        {current > 0 && (
          <Text style={[styles.stepText, { color: theme.text3 }]}>
            ÉTAPE {String(current + 1).padStart(2, '0')} / 04
          </Text>
        )}
      </View>

      {/* Visual animé */}
      <Animated.View style={[styles.visualContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {slide.visual(accent, theme)}
      </Animated.View>

      {/* Texte animé */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={[styles.title, { color: accent.primary },
          fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' }]}>
          {slide.title}
        </Text>

        {slide.badge && (
          <View style={[styles.badge, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.badgeText, { color: theme.text2 }]}>{slide.badge}</Text>
          </View>
        )}

        <View style={[styles.descCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={[styles.descText, { color: theme.text2 }]}>{slide.desc}</Text>
        </View>
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottomBar}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View key={i} style={[
              styles.dot,
              { backgroundColor: theme.bg4 },
              i === current && { backgroundColor: accent.primary, width: 22 }
            ]} />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: accent.light, borderWidth: 1, borderColor: accent.primary + '40' }]}
          onPress={next}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextArrow, { color: accent.primary }]}>{isLast ? '✓' : '→'}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 20 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepText: { fontSize: 10, letterSpacing: 2 },
  visualContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  visualWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 200, height: 200 },
  outerRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1 },
  innerRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconSquare: { width: 160, height: 160, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  shieldBadge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, fontStyle: 'italic', textAlign: 'center', lineHeight: 48, marginBottom: 16 },
  badge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignSelf: 'stretch' },
  badgeText: { fontSize: 10, letterSpacing: 1.5, textAlign: 'center' },
  descCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 24 },
  descText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  nextBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  nextArrow: { fontSize: 20 },
  exportTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  exportTagText: { fontSize: 10 },
});