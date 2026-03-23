import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';

const DEFAULT_WORDS = ["Soleil", "Lune", "Étoile", "Mer", "Forêt", "Vent", "Pluie", "Terre", "Ciel", "Feu", "Rêve", "Amour"];

export default function RecoveryScreen({ navigation, route }) {
  const { theme, accent } = useTheme();
  const { recoveryKeywords, setRecoveryKeywords, savePin } = useAuth();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [isResetMode, setIsResetMode] = useState(route.params?.reset || false);
  const [inputWords, setInputWords] = useState(Array(3).fill(''));
  const [tempWords, setTempWords] = useState(recoveryKeywords || []);
  const [showSetup, setShowSetup] = useState(!recoveryKeywords);

  const handleSaveSetup = async () => {
    if (tempWords.length < 3) {
      Alert.alert('Erreur', 'Veuillez choisir au moins 3 mots-clés.');
      return;
    }
    await setRecoveryKeywords(tempWords);
    Alert.alert('Succès', 'Vos mots-clés de récupération ont été enregistrés.');
    navigation.goBack();
  };

  const handleResetPin = async () => {
    const isCorrect = inputWords.every((word, i) => word.toLowerCase().trim() === recoveryKeywords[i]?.toLowerCase().trim());
    if (isCorrect) {
      navigation.navigate('Pin', { mode: 'reset' });
    } else {
      Alert.alert('Erreur', 'Les mots-clés ne correspondent pas.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accent.primary }]}>Récupération</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 40 }}>🔑</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }, fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' }]}>
          {isResetMode ? 'Réinitialiser le PIN' : 'Mots-clés de secours'}
        </Text>

        <Text style={[styles.desc, { color: theme.text3 }]}>
          {isResetMode 
            ? 'Entrez vos 3 mots-clés secrets pour définir un nouveau code PIN.'
            : 'Choisissez 3 mots-clés personnels. Ils vous permettront de réinitialiser votre accès en cas d\'oubli.'}
        </Text>

        {isResetMode ? (
          <View style={styles.inputArea}>
            {[0, 1, 2].map(i => (
              <TextInput
                key={i}
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg3 }]}
                placeholder={`Mot-clé #${i + 1}`}
                placeholderTextColor={theme.text4}
                value={inputWords[i]}
                onChangeText={text => {
                  const val = [...inputWords];
                  val[i] = text;
                  setInputWords(val);
                }}
              />
            ))}
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: accent.primary }]} onPress={handleResetPin}>
              <Text style={{ color: theme.bg, fontWeight: '600' }}>VÉRIFIER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.setupArea}>
            <View style={styles.keywordsGrid}>
              {DEFAULT_WORDS.map(word => {
                const isSelected = tempWords.includes(word);
                return (
                  <TouchableOpacity
                    key={word}
                    style={[styles.keywordChip, { 
                      borderColor: isSelected ? accent.primary : theme.border,
                      backgroundColor: isSelected ? accent.light : theme.bg3
                    }]}
                    onPress={() => {
                      if (isSelected) setTempWords(tempWords.filter(w => w !== word));
                      else if (tempWords.length < 3) setTempWords([...tempWords, word]);
                    }}
                  >
                    <Text style={{ color: isSelected ? accent.primary : theme.text2 }}>{word}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.selectionCount, { color: theme.text3 }]}>
              {tempWords.length} / 3 sélectionnés
            </Text>
            <TouchableOpacity 
              style={[styles.mainBtn, { backgroundColor: accent.primary, opacity: tempWords.length === 3 ? 1 : 0.5 }]} 
              disabled={tempWords.length !== 3}
              onPress={handleSaveSetup}
            >
              <Text style={{ color: theme.bg, fontWeight: '600' }}>ENREGISTRER</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '500' },
  backBtn: { fontSize: 14, width: 60 },
  content: { padding: 30, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 28, textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  inputArea: { width: '100%', gap: 12 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  mainBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  setupArea: { width: '100%', alignItems: 'center' },
  keywordsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  keywordChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  selectionCount: { marginTop: 20, marginBottom: 10, fontSize: 13 },
});
