import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';

const TEMPLATES = [
  { key: 'dark',    label: 'Sanctuaire', emoji: '🌙' },
  { key: 'minimal', label: 'Minimal',    emoji: '⬜' },
  { key: 'nature',  label: 'Nature',     emoji: '🌿' },
  { key: 'sunset',  label: 'Coucher',    emoji: '🌅' },
];

const TEMPLATE_STYLES = {
  dark:    { bg: '#0d0d0f', text: '#e8e8ea', accent: '#f0a090', border: '#2a2a2f', sub: '#5a5a60' },
  minimal: { bg: '#ffffff', text: '#1a1a1c', accent: '#1a1a1c', border: '#e0e0e0', sub: '#9a9a9e' },
  nature:  { bg: '#0d1a12', text: '#d4f0d4', accent: '#3ecf8e', border: '#1a3a22', sub: '#4a8a5a' },
  sunset:  { bg: '#1a0d0a', text: '#f5e0c8', accent: '#f97316', border: '#3a1a0a', sub: '#8a5a3a' },
};

export default function ShareNoteScreen({ navigation, route }) {
  const { theme, accent } = useTheme();
  const { note } = route.params || {};
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [selectedTemplate, setSelectedTemplate] = useState('dark');
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef(null);

  const t = TEMPLATE_STYLES[selectedTemplate];

  const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleShare = async () => {
    if (!viewShotRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager cette pensée',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  if (!note) return null;

  const excerpt = note.contenu?.slice(0, 280) || '';
  const isLong = (note.contenu?.length || 0) > 280;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accent.primary }]}>Partager</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Aperçu de la carte */}
        <View style={styles.previewWrap}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0 }}
            style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}
          >
            {/* Header de la carte */}
            <View style={[styles.cardHeader, { borderBottomColor: t.border }]}>
              <Text style={[styles.cardApp, { color: t.sub }]}>✦ MES PENSÉES</Text>
              <Text style={[styles.cardDate, { color: t.sub }]}>{formatDate(note.date)}</Text>
            </View>

            {/* Contenu */}
            <View style={styles.cardBody}>
              <Text style={[styles.cardMood, { color: t.accent }]}>{note.mood || '😌'}</Text>
              <Text style={[
                styles.cardTitle,
                { color: t.accent },
                fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' }
              ]}>
                {note.titre || 'Sans titre'}
              </Text>
              <Text style={[styles.cardText, { color: t.text }]}>
                {excerpt}{isLong ? '...' : ''}
              </Text>
            </View>

            {/* Footer */}
            <View style={[styles.cardFooter, { borderTopColor: t.border }]}>
              <Text style={[styles.cardFooterText, { color: t.sub }]}>
                🔐 ZÉRO NUAGE · DONNÉES PRIVÉES
              </Text>
            </View>
          </ViewShot>
        </View>

        {/* Sélecteur de template */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>STYLE DE CARTE</Text>
        <View style={styles.templatesRow}>
          {TEMPLATES.map(tp => (
            <TouchableOpacity
              key={tp.key}
              style={[
                styles.templateBtn,
                { backgroundColor: TEMPLATE_STYLES[tp.key].bg, borderColor: theme.border },
                selectedTemplate === tp.key && { borderColor: accent.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedTemplate(tp.key)}
            >
              <Text style={{ fontSize: 20 }}>{tp.emoji}</Text>
              <Text style={[styles.templateLabel, { color: TEMPLATE_STYLES[tp.key].text }]}>
                {tp.label}
              </Text>
              {selectedTemplate === tp.key && (
                <View style={[styles.templateCheck, { backgroundColor: accent.primary }]}>
                  <Text style={{ fontSize: 10, color: '#fff' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Note anonymisée */}
        <View style={[styles.infoCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={{ fontSize: 16 }}>🛡️</Text>
          <Text style={[styles.infoText, { color: theme.text2 }]}>
            La carte ne contient aucune métadonnée personnelle. Seuls le titre, l'extrait et la date sont visibles.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bouton partager */}
      <View style={[styles.shareWrap, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: sharing ? theme.bg4 : accent.primary }]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={[styles.shareBtnText, { color: sharing ? theme.text3 : theme.bg }]}>
            {sharing ? 'Génération...' : '🖼️  Partager cette pensée'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { fontSize: 14, width: 60 },
  headerTitle: { fontSize: 18, fontWeight: '500' },
  previewWrap: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  card: { width: 320, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  cardApp: { fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  cardDate: { fontSize: 10, letterSpacing: 1 },
  cardBody: { padding: 20 },
  cardMood: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 24, fontStyle: 'italic', marginBottom: 12, lineHeight: 30 },
  cardText: { fontSize: 14, lineHeight: 22 },
  cardFooter: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
  cardFooterText: { fontSize: 9, letterSpacing: 1.5 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  templatesRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  templateBtn: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 6, position: 'relative' },
  templateLabel: { fontSize: 11 },
  templateCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 20, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  shareWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  shareBtn: { padding: 16, borderRadius: 16, alignItems: 'center' },
  shareBtnText: { fontSize: 15, fontWeight: '500' },
});