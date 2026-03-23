import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';

export default function CapsulesScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { getSealedNotes, getTimeUntilOpen, formatDate, unsealCapsule, notes } = useNotes();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [selected, setSelected] = useState([]);

  const sealedNotes = getSealedNotes();
  const readyNotes = notes.filter(n => n.capsule && new Date(n.capsule) <= new Date());

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUnseal = async () => {
  await unsealCapsule(selected);
  setSelected([]);
};
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={fontsLoaded
          ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 20, color: accent.primary, fontStyle: 'italic' }
          : { fontSize: 20, color: accent.primary, fontStyle: 'italic' }}>
          Capsules Temporelles
        </Text>
        {sealedNotes.length > 0 ? (
          <TouchableOpacity onPress={() => {
            if (selected.length === sealedNotes.length) setSelected([]);
            else setSelected(sealedNotes.map(n => n.id));
          }}>
            <Text style={[styles.selectAll, { color: accent.primary }]}>
              {selected.length === sealedNotes.length ? 'Désélect.' : 'Tout'}
            </Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Prêtes à ouvrir */}
        {readyNotes.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: accent.teal }]}>
              ✨ PRÊTES À OUVRIR — {readyNotes.length}
            </Text>
            {readyNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[styles.capsuleCard, { backgroundColor: accent.light, borderColor: accent.primary + '60' }]}
                onPress={() => navigation.navigate('Editor', { noteId: note.id })}
              >
                <View style={styles.capsuleCardHeader}>
                  <Text style={{ fontSize: 24 }}>🔓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.capsuleTitle, { color: accent.primary },
                      fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}
                      numberOfLines={1}>
                      {note.titre}
                    </Text>
                    <Text style={[styles.capsuleMeta, { color: theme.text3 }]}>
                      Scellée le {formatDate(note.date)}
                    </Text>
                  </View>
                  <View style={[styles.readyBadge, { backgroundColor: accent.primary }]}>
                    <Text style={[styles.readyText, { color: theme.bg }]}>OUVRIR</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Capsules scellées */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>
          ⏳ SCELLÉES — {sealedNotes.length}
        </Text>

        {sealedNotes.length === 0 && readyNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={[styles.emptyTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              Aucune capsule temporelle
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.text3 }]}>
              Scellez une note dans l'éditeur avec ⏳ pour créer votre première capsule
            </Text>
          </View>
        ) : (
          sealedNotes.map(note => (
            <TouchableOpacity
              key={note.id}
              style={[styles.capsuleCard,
                { backgroundColor: theme.bg3, borderColor: theme.border },
                selected.includes(note.id) && { borderColor: accent.primary, backgroundColor: accent.light }
              ]}
              onPress={() => toggleSelect(note.id)}
              activeOpacity={0.8}
            >
              <View style={styles.capsuleCardHeader}>
                <View style={[styles.checkbox,
                  { borderColor: theme.border },
                  selected.includes(note.id) && { backgroundColor: accent.primary, borderColor: accent.primary }
                ]}>
                  {selected.includes(note.id) && <Text style={{ fontSize: 12, color: '#fff' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 20 }}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.capsuleTitle, { color: theme.text2 }]} numberOfLines={1}>
                    Note scellée
                  </Text>
                  <Text style={[styles.capsuleMeta, { color: theme.text3 }]}>
                    Scellée le {formatDate(note.date)}
                  </Text>
                </View>
                <View style={[styles.timerBadge, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                  <Text style={[styles.timerText, { color: accent.primary }]}>
                    {getTimeUntilOpen(note.capsule)}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressBar, { backgroundColor: theme.bg4 }]}>
                <View style={[styles.progressFill, {
                  backgroundColor: accent.primary,
                  width: `${Math.max(2, Math.min(100, (
                    (new Date() - new Date(note.date)) /
                    (new Date(note.capsule) - new Date(note.date))
                  ) * 100))}%`
                }]} />
              </View>

              <View style={styles.capsuleDates}>
                <Text style={[styles.capsuleDateText, { color: theme.text3 }]}>
                  📅 {formatDate(note.date)}
                </Text>
                <Text style={[styles.capsuleDateText, { color: accent.primary }]}>
                  🔓 {formatDate(note.capsule)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Barre d'actions */}
      {selected.length > 0 && (
        <View style={[styles.actionBar, { backgroundColor: theme.bg3, borderTopColor: theme.border }]}>
          <Text style={[styles.selectedCount, { color: theme.text3 }]}>
            {selected.length} sélectionné(s)
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}
            onPress={handleUnseal}
          >
            <Text style={[styles.actionBtnText, { color: accent.primary }]}>🔓 Desceller</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { fontSize: 14, width: 60 },
  selectAll: { fontSize: 13, width: 60, textAlign: 'right' },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  capsuleCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 18, padding: 16, borderWidth: 1 },
  capsuleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  capsuleTitle: { fontSize: 16, marginBottom: 2 },
  capsuleMeta: { fontSize: 11 },
  readyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  readyText: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  timerBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  timerText: { fontSize: 12, fontWeight: '500' },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  capsuleDates: { flexDirection: 'row', justifyContent: 'space-between' },
  capsuleDateText: { fontSize: 11 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, textAlign: 'center', marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  selectedCount: { fontSize: 12, flex: 1 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
});