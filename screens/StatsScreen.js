import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';

function MoodChart({ accent, notes }) {
  const last30 = notes.slice(0, 30).reverse();
  const moodValues = { '😌': 80, '✨': 90, '🦅': 70, '🕯️': 50, '🌊': 60 };

  const points = last30.length > 1
    ? last30.map((n, i) => {
        const x = (i / (last30.length - 1)) * 300;
        const y = 100 - ((moodValues[n.mood] || 65) / 100) * 80;
        return `${x},${y}`;
      })
    : ['0,65', '75,40', '150,55', '225,30', '300,45'];

  const pathD = `M${points.join(' C').replace(/ C/g, ' ')}`;

  return (
    <Svg width="100%" height="100" viewBox="0 0 300 100">
      <Defs>
        <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent.teal} stopOpacity="0.3" />
          <Stop offset="1" stopColor={accent.teal} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={pathD} fill="none" stroke={accent.teal} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M0,70 C40,70 70,50 100,55 C130,60 160,75 200,65 C230,57 260,45 300,50"
        fill="none" stroke={accent.primary} strokeWidth="1.5"
        strokeLinecap="round" strokeDasharray="4,3" opacity="0.5" />
      {last30.length > 0 && (
        <Circle
          cx={(last30.length > 1 ? 300 : 250)}
          cy={100 - ((moodValues[last30[last30.length - 1]?.mood] || 65) / 100) * 80}
          r="4" fill={accent.primary} opacity="0.8"
        />
      )}
    </Svg>
  );
}

function NavButton({ onPress, icon, label, isActive, accent, theme }) {
  return (
    <TouchableOpacity
      style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 20, opacity: isActive ? 1 : 0.4 }}>{icon}</Text>
      <Text style={{ fontSize: 8, letterSpacing: 1.5, color: isActive ? accent.primary : theme.text3 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
export default function StatsScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { notes, getMoodStats, getTotalWords, getVisibleNotes, streak } = useNotes();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });

  const moodStats = getMoodStats();
  const totalWords = getTotalWords();
  const totalNotes = getVisibleNotes().length;
  const topMood = moodStats[0];

  const getMonthName = () => {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' });
  };

  const getMoodLabel = () => {
    if (totalNotes === 0) return 'Vierge et prêt';
    const top = moodStats[0];
    if (!top || top.count === 0) return 'Équilibré';
    const labels = {
      '😌': 'Calme et serein',
      '✨': 'Lumineux et créatif',
      '🦅': 'Ambitieux et libre',
      '🕯️': 'Introspectif',
      '🌊': 'En plein flux',
    };
    return labels[top.emoji] || 'Équilibré';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Drawer')}>
  <Text style={[styles.menuIcon, { color: theme.text2 }]}>☰</Text>
</TouchableOpacity>
        <Text style={fontsLoaded
          ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 22, color: accent.primary }
          : { fontSize: 22, color: accent.primary, fontStyle: 'italic' }}>
          Mes Pensées
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Personnalisation')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Titre */}
        <View style={styles.statsHeader}>
          <Text style={[styles.statsTitle, { color: theme.text }]}>Statistiques</Text>
          <Text style={[styles.statsDesc, { color: theme.text2 }]}>
            Votre mois de{' '}
            <Text style={[{ fontStyle: 'italic' }, fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' }, { color: accent.primary }]}>
              {getMonthName()}{' '}
            </Text>
            se dessine comme un
            <Text style={{ color: accent.teal }}> {getMoodLabel()}.</Text>
          </Text>
        </View>

        {/* Chiffres clés */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: accent.primary }]}>{totalNotes}</Text>
            <Text style={[styles.metricLabel, { color: theme.text3 }]}>PENSÉES</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: accent.primary }]}>{totalWords}</Text>
            <Text style={[styles.metricLabel, { color: theme.text3 }]}>MOTS</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: accent.primary }]}>🔥 {streak}</Text>
            <Text style={[styles.metricLabel, { color: theme.text3 }]}>SÉRIE</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: accent.primary }]}>{topMood?.emoji || '—'}</Text>
            <Text style={[styles.metricLabel, { color: theme.text3 }]}>TOP</Text>
          </View>
        </View>

        {/* Graphique */}
        <View style={[styles.card, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={styles.cardLabelRow}>
            <Text style={[styles.cardLabel, { color: theme.text3 }]}>FLUCTUATIONS ÉMOTIONNELLES</Text>
            <View style={styles.syncBadge}>
              <View style={[styles.syncDot, { backgroundColor: accent.teal }]} />
              <Text style={[styles.syncText, { color: accent.teal }]}>LOCAL</Text>
            </View>
          </View>
          <MoodChart accent={accent} notes={notes} />
          <View style={styles.weekLabels}>
            {['SEMAINE 01', 'SEMAINE 02', 'SEMAINE 03', 'SEMAINE 04'].map(w => (
              <Text key={w} style={[styles.weekLabel, { color: theme.text3 }]}>{w}</Text>
            ))}
          </View>
        </View>

        {/* Légende humeur */}
        <View style={[styles.card, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.text3 }]}>RÉPARTITION D'HUMEUR</Text>
          {totalNotes === 0 ? (
            <Text style={[styles.emptyStats, { color: theme.text3 }]}>Écrivez vos premières pensées pour voir vos statistiques d'humeur.</Text>
          ) : (
            moodStats.map((item, i) => (
              <View key={item.name} style={[styles.moodRow,
                { borderBottomColor: theme.border },
                i === moodStats.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.moodEmoji, {
                  backgroundColor: i === 0 ? accent.light : theme.bg4
                }]}>
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                </View>
                <Text style={[styles.moodName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.moodPct, { color: theme.text2 },
                  fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
                  {item.pct}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Analyse Obsidienne */}
        <View style={[styles.card, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.text3 }]}>ANALYSE DE L'OBSIDIENNE</Text>
          <Text style={[styles.insightQuote, { color: theme.text },
            fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
            {totalNotes === 0
              ? '"Votre sanctuaire vous attend. Commencez à écrire pour révéler vos patterns."'
              : totalNotes < 5
              ? '"Vos premières pensées tracent le chemin. Continuez à écrire pour dévoiler vos tendances."'
              : `"Vous avez écrit ${totalWords} mots en ${totalNotes} entrées. Votre humeur dominante est ${topMood?.name?.toLowerCase() || 'équilibrée'}."`
            }
          </Text>
          <View style={styles.insightFooter}>
            <Text style={{ fontSize: 12 }}>🔒</Text>
            <Text style={[styles.insightFooterText, { color: accent.teal }]}>DONNÉES LOCALES SÉCURISÉES</Text>
          </View>
        </View>

        {/* Temps total */}
        <View style={[styles.card, styles.medCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.cardLabel, { color: theme.text3 }]}>TOTAL DES MOTS</Text>
            <Text style={[styles.medTime, { color: theme.text }]}>{totalWords} mots</Text>
          </View>
          <Svg width="52" height="52" viewBox="0 0 52 52">
            <Circle cx="26" cy="26" r="20" fill="none" stroke={accent.light} strokeWidth="4" />
            <Circle cx="26" cy="26" r="20" fill="none" stroke={accent.teal} strokeWidth="4"
              strokeDasharray={`${Math.min((totalNotes / 30) * 126, 126)} 126`}
              strokeLinecap="round" />
          </Svg>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bg2, borderTopColor: theme.border }]}>
        <NavButton onPress={() => navigation.navigate('Timeline')} icon="📖" label="JOURNAL" isActive={false} accent={accent} theme={theme} />
        <NavButton onPress={() => navigation.navigate('Stats')} icon="📈" label="STATS" isActive={true} accent={accent} theme={theme} />
        <NavButton onPress={() => navigation.navigate('Coffre')} icon="🔐" label="COFFRE" isActive={false} accent={accent} theme={theme} />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  menuIcon: { fontSize: 18, width: 28 },
  settingsIcon: { fontSize: 18, width: 28, textAlign: 'right' },
  statsHeader: { paddingHorizontal: 20, paddingBottom: 16 },
  statsTitle: { fontSize: 36, fontWeight: '300', marginBottom: 8 },
  statsDesc: { fontSize: 14, lineHeight: 22 },
  metricsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, gap: 10 },
  metricCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: '300', marginBottom: 4 },
  metricLabel: { fontSize: 8, letterSpacing: 2 },
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 18, padding: 18, borderWidth: 1 },
  cardLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 9, letterSpacing: 1 },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekLabel: { fontSize: 8, letterSpacing: 1 },
  emptyStats: { fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  moodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  moodEmoji: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  moodName: { fontSize: 14, flex: 1 },
  moodPct: { fontSize: 18 },
  insightQuote: { fontSize: 16, lineHeight: 26, marginBottom: 14 },
  insightFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightFooterText: { fontSize: 9, letterSpacing: 1.5 },
  medCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medTime: { fontSize: 24, fontWeight: '300' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 20, paddingTop: 10 },
});