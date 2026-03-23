import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
  { icon: '📖', label: 'Journal', screen: 'Timeline' },
  { icon: '📈', label: 'Statistiques', screen: 'Stats' },
  { icon: '🔐', label: 'Le Coffre', screen: 'Coffre' },
  { icon: '🎨', label: 'Personnalisation', screen: 'Personnalisation' },
  { icon: '🔔', label: 'Rappels', screen: 'Notifications' },
  { icon: '⏳', label: 'Capsules Temporelles', screen: 'Capsules' },
  { icon: '🗑️', label: 'Corbeille', screen: 'Trash' },
];

export default function DrawerScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { lock } = useAuth();
  const { notes, getTotalWords } = useNotes();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  };

  const handleNavigate = (screen) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      navigation.goBack();
      setTimeout(() => navigation.navigate(screen), 50);
    });
  };

  const handleLock = () => {
    lock();
    handleClose();
    setTimeout(() => navigation.replace('Lock'), 300);
  };

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { backgroundColor: theme.bg2, transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.drawerLogo,
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' },
              { color: accent.primary }]}>
              Mes Pensées
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.text2 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats rapides */}
          <View style={[styles.quickStats, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: accent.primary }]}>{notes.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>PENSÉES</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: accent.primary }]}>{getTotalWords()}</Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>MOTS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: accent.primary }]}>
                {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>MOIS</Text>
            </View>
          </View>

          {/* Menu items */}
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => handleNavigate(item.screen)}
              >
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={[styles.menuItemLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.menuItemArrow, { color: theme.text3 }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bouton verrouiller */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={[styles.lockBtn, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}
              onPress={handleLock}
            >
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text style={[styles.lockBtnText, { color: accent.primary }]}>Verrouiller l'app</Text>
            </TouchableOpacity>
            <Text style={[styles.drawerFooterText, { color: theme.text4 }]}>
              🛡️  ZÉRO CLOUD / PRIVACY FIRST
            </Text>
          </View>

        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.78, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
  drawerLogo: { fontSize: 24, fontStyle: 'italic' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18 },
  quickStats: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 20, borderRadius: 16, padding: 16, borderWidth: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '300', marginBottom: 4 },
  statLabel: { fontSize: 8, letterSpacing: 2 },
  statDivider: { width: 1, marginHorizontal: 8 },
  menuList: { paddingHorizontal: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 16, borderBottomWidth: 1, gap: 14 },
  menuItemIcon: { fontSize: 22, width: 30 },
  menuItemLabel: { fontSize: 16, flex: 1 },
  menuItemArrow: { fontSize: 20 },
  drawerFooter: { position: 'absolute', bottom: 40, left: 20, right: 20, gap: 16 },
  lockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  lockBtnText: { fontSize: 14, fontWeight: '500' },
  drawerFooterText: { fontSize: 9, letterSpacing: 2, textAlign: 'center' },
});