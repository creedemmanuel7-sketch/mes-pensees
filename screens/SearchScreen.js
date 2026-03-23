import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';

const MOOD_DOTS = {
  '😌': '#3ecf8e', '✨': '#f0c040',
  '🦅': '#f09040', '🕯️': '#f0a090', '🌊': '#4080f0',
};

export default function SearchScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { getVisibleNotes, formatDate, formatTime } = useNotes();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const allNotes = getVisibleNotes();

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const q = query.toLowerCase().trim();
    const found = allNotes.filter(note =>
      note.titre?.toLowerCase().includes(q) ||
      note.contenu?.toLowerCase().includes(q)
    );
    setResults(found);
    setHasSearched(true);
  }, [query]);

  const highlight = (text, query) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <Text key={i} style={{ backgroundColor: accent.primary + '40', color: accent.primary }}>{part}</Text>
        : part
    );
  };

  const getExcerpt = (contenu, query) => {
    if (!contenu) return '';
    if (!query.trim()) return contenu.slice(0, 100) + '...';
    const idx = contenu.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return contenu.slice(0, 100) + '...';
    const start = Math.max(0, idx - 40);
    const end = Math.min(contenu.length, idx + 80);
    return (start > 0 ? '...' : '') + contenu.slice(start, end) + (end < contenu.length ? '...' : '');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={fontsLoaded
          ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 20, color: accent.primary, fontStyle: 'italic' }
          : { fontSize: 20, color: accent.primary, fontStyle: 'italic' }}>
          Recherche
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Chercher dans vos pensées..."
          placeholderTextColor={theme.text3}
          value={query}
          onChangeText={setQuery}
          autoFocus={true}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={[styles.clearBtn, { color: theme.text3 }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Résultats */}
      <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Compteur */}
        {hasSearched && (
          <Text style={[styles.resultCount, { color: theme.text3 }]}>
            {results.length === 0
              ? 'Aucun résultat'
              : `${results.length} pensée${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`}
          </Text>
        )}

        {/* Pas encore cherché */}
        {!hasSearched && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              Cherchez dans vos pensées
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.text3 }]}>
              Tapez un mot, un titre ou une phrase pour retrouver vos notes
            </Text>
            {/* Suggestions rapides */}
            <View style={styles.suggestionsWrap}>
              <Text style={[styles.suggestionsLabel, { color: theme.text3 }]}>SUGGESTIONS</Text>
              <View style={styles.suggestions}>
                {['amour', 'bonheur', 'travail', 'rêve', 'famille'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.suggestionChip, { backgroundColor: theme.bg3, borderColor: theme.border }]}
                    onPress={() => setQuery(s)}
                  >
                    <Text style={[styles.suggestionText, { color: theme.text2 }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Aucun résultat */}
        {hasSearched && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💭</Text>
            <Text style={[styles.emptyTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              Aucune pensée trouvée
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.text3 }]}>
              Essayez avec d'autres mots-clés
            </Text>
          </View>
        )}

        {/* Liste des résultats */}
        {results.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={[styles.resultCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Editor', { noteId: note.id })}
          >
            <View style={styles.resultHeader}>
              <View style={[styles.moodDot, { backgroundColor: MOOD_DOTS[note.mood] || accent.primary }]} />
              <Text style={[styles.resultTitle, { color: accent.primary },
                fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}
                numberOfLines={1}>
                {highlight(note.titre, query)}
              </Text>
              <Text style={[styles.resultDate, { color: theme.text3 }]}>
                {formatTime(note.date)}
              </Text>
            </View>
            <Text style={[styles.resultMeta, { color: theme.text3 }]}>
              {formatDate(note.date)}
            </Text>
            <Text style={[styles.resultExcerpt, { color: theme.text2 }]} numberOfLines={3}>
              {highlight(getExcerpt(note.contenu, query), query)}
            </Text>
            {note.pinned && (
              <Text style={[styles.pinnedBadge, { color: accent.primary }]}>📌 Épinglée</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 60 },
  backText: { fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  clearBtn: { fontSize: 14, padding: 4 },
  results: { flex: 1, paddingHorizontal: 20 },
  resultCount: { fontSize: 11, letterSpacing: 1.5, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, textAlign: 'center', marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  suggestionsWrap: { width: '100%' },
  suggestionsLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  suggestionText: { fontSize: 13 },
  resultCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  moodDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  resultTitle: { flex: 1, fontSize: 18 },
  resultDate: { fontSize: 11 },
  resultMeta: { fontSize: 9, letterSpacing: 1.5, marginBottom: 8 },
  resultExcerpt: { fontSize: 13, lineHeight: 20 },
  pinnedBadge: { fontSize: 10, letterSpacing: 1, marginTop: 8 },
});