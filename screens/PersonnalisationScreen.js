import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ACCENTS } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

const ACCENT_LABELS = {
  rose:   { label: 'Rose Vif',   emoji: '🌸' },
  bleu:   { label: 'Bleu Ciel',  emoji: '🩵' },
  violet: { label: 'Violet Pur', emoji: '💜' },
  noir:   { label: 'Minuit',     emoji: '🖤' },
  vert:   { label: 'Émeraude',   emoji: '💚' },
};

const MODE_OPTIONS = [
  { key: 'dark',     label: 'Sombre',    emoji: '🌙' },
  { key: 'light',    label: 'Clair',     emoji: '☀️' },
  { key: 'adaptive', label: 'Adaptatif', emoji: '📱' },
];

function Toggle({ value, onPress, accent, theme }) {
  return (
    <TouchableOpacity
      style={{
        width: 50, height: 28, borderRadius: 14,
        backgroundColor: value ? accent.primary : theme.bg5,
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#fff',
        transform: [{ translateX: value ? 22 : 0 }],
      }} />
    </TouchableOpacity>
  );
}

export default function PersonnalisationScreen({ navigation }) {
  const {
    theme, accent, mode, accentKey, resolvedMode,
    seasonalMode, currentSeason, getSeasonalEmoji,
    setThemeMode, setAccent, setSeasonalMode,
  } = useTheme();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const {
    biometricAvailable, intrusionAlert, toggleIntrusionAlert,
    pin, decoyPin, savePin, saveDecoyPin,
  } = useAuth();

  const { reEncryptNotes } = useNotes();

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit faire au moins 4 chiffres.');
      return;
    }
    setIsChangingPin(true);
    try {
      const success = await reEncryptNotes(newPin);
      if (success) {
        await savePin(newPin);
        Alert.alert('Succès', 'Votre code PIN a été modifié et vos notes re-chiffrées.');
        setPinModalVisible(false);
        setNewPin('');
      } else {
        Alert.alert('Erreur', 'Impossible de re-chiffrer les notes. Vérifiez votre accès.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accent.primary }]}>Personnalisation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Thème Saisonnier */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>THÈME SAISONNIER</Text>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
            <Text style={{ fontSize: 28 }}>{getSeasonalEmoji(currentSeason)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                Mode {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
              </Text>
              <Text style={[styles.optionDesc, { color: theme.text3 }]}>
                {seasonalMode
                  ? `Actif — couleurs d'${currentSeason} appliquées`
                  : 'Couleurs adaptées automatiquement à la saison'}
              </Text>
            </View>
            <Toggle
              value={seasonalMode}
              onPress={() => setSeasonalMode(!seasonalMode)}
              accent={accent}
              theme={theme}
            />
          </View>
        </View>

        {/* Mode d'affichage */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>MODE D'AFFICHAGE</Text>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          {MODE_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionRow,
                { borderBottomColor: theme.border },
                i === MODE_OPTIONS.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => setThemeMode(opt.key)}
            >
              <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                {opt.key === 'adaptive' && (
                  <Text style={[styles.optionDesc, { color: theme.text3 }]}>
                    Suit le mode de votre téléphone
                  </Text>
                )}
              </View>
              <View style={[
                styles.radio,
                { borderColor: theme.border },
                mode === opt.key && { borderColor: accent.primary, backgroundColor: accent.primary }
              ]}>
                {mode === opt.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Couleur d'accent */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>COULEUR D'ACCENT</Text>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          {Object.entries(ACCENT_LABELS).map(([key, val], i) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.optionRow,
                { borderBottomColor: theme.border },
                i === Object.keys(ACCENT_LABELS).length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => setAccent(key)}
            >
              <View style={[styles.colorDot, { backgroundColor: ACCENTS[key].primary }]} />
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                {val.emoji}  {val.label}
              </Text>
              <View style={[
                styles.radio,
                { borderColor: theme.border },
                accentKey === key && { borderColor: ACCENTS[key].primary, backgroundColor: ACCENTS[key].primary }
              ]}>
                {accentKey === key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Aperçu */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>APERÇU</Text>
        <View style={[styles.previewCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={[styles.previewHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.previewTitle, { color: accent.primary }]}>Mes Pensées</Text>
            <Text style={[styles.previewSub, { color: theme.text3 }]}>CHIFFREMENT ACTIF</Text>
          </View>
          <View style={styles.previewNotes}>
            {["L'éclat du matin", 'Mélancolie douce', 'Architecture mentale'].map((t, i) => (
              <View key={i} style={[styles.previewNote, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                <View style={[styles.previewDot, { backgroundColor: accent.primary, opacity: 1 - i * 0.25 }]} />
                <Text style={[styles.previewNoteText, { color: theme.text }]}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.previewBtn, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}>
            <Text style={[styles.previewBtnText, { color: accent.primary }]}>
              {seasonalMode
                ? `Thème ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`
                : `Thème ${resolvedMode === 'dark' ? 'Sombre' : 'Clair'} · ${ACCENT_LABELS[accentKey]?.label || accentKey}`
              }
            </Text>
          </View>
        </View>

        {/* Typographie */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>TYPOGRAPHIE</Text>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
            <Text style={{ fontSize: 20 }}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>Cormorant Garamond</Text>
              <Text style={[styles.optionDesc, { color: theme.text3 }]}>Élégante & italique pour les titres</Text>
            </View>
            <View style={[styles.radio, { borderColor: accent.primary, backgroundColor: accent.primary }]}>
              <View style={styles.radioDot} />
            </View>
          </View>
        </View>

        {/* Sécurité */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>SÉCURITÉ & CONFIDENTIALITÉ</Text>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setPinModalVisible(true)}>
            <Text style={{ fontSize: 20 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>Changer le code PIN</Text>
              <Text style={[styles.optionDesc, { color: theme.text3 }]}>Re-chiffre toutes vos notes existantes</Text>
            </View>
            <Text style={{ color: theme.text4 }}>❯</Text>
          </TouchableOpacity>

          <View style={styles.optionRow}>
            <Text style={{ fontSize: 20 }}>📸</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>Alerte Intrusion</Text>
              <Text style={[styles.optionDesc, { color: theme.text3 }]}>Capture une photo après 3 échecs</Text>
            </View>
            <Toggle
              value={intrusionAlert}
              onPress={() => toggleIntrusionAlert(!intrusionAlert)}
              accent={accent}
              theme={theme}
            />
          </View>

          {biometricAvailable && (
            <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 20 }}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Biométrie (FaceID/TouchID)</Text>
                <Text style={[styles.optionDesc, { color: theme.text3 }]}>Déverrouillage rapide</Text>
              </View>
              <Toggle
                value={true} // À lier à un state si besoin de désactiver
                onPress={() => {}}
                accent={accent}
                theme={theme}
              />
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal Changement PIN */}
      <Modal visible={pinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: accent.primary }]}>Nouveau Code PIN</Text>
            <Text style={[styles.modalDesc, { color: theme.text2 }]}>
              Le changement de PIN re-chiffrera toutes vos notes avec la nouvelle clé.
            </Text>
            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg4 }]}
              placeholder="Ex: 1234"
              placeholderTextColor={theme.text4}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              value={newPin}
              onChangeText={setNewPin}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.bg4 }]}
                onPress={() => { setPinModalVisible(false); setNewPin(''); }}
                disabled={isChangingPin}
              >
                <Text style={{ color: theme.text2 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: accent.primary }]}
                onPress={handleChangePin}
                disabled={isChangingPin}
              >
                {isChangingPin ? (
                  <ActivityIndicator color={theme.bg} size="small" />
                ) : (
                  <Text style={{ color: theme.bg, fontWeight: '600' }}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: 14, width: 60 },
  headerTitle: { fontSize: 18, fontWeight: '500' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20
  },
  pinModal: {
    width: '100%', maxWidth: 320, borderRadius: 24,
    padding: 24, borderWidth: 1, gap: 16
  },
  modalTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  modalDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  pinInput: {
    height: 50, borderRadius: 12, borderWidth: 1,
    textAlign: 'center', fontSize: 24, letterSpacing: 8
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: {
    flex: 1, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  sectionLabel: {
    fontSize: 9, letterSpacing: 2,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  group: {
    marginHorizontal: 20, borderRadius: 18,
    borderWidth: 1, overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 14,
  },
  optionLabel: { fontSize: 15 },
  optionDesc: { fontSize: 11, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  previewCard: {
    marginHorizontal: 20, borderRadius: 18,
    borderWidth: 1, overflow: 'hidden',
  },
  previewHeader: {
    padding: 16, borderBottomWidth: 1, alignItems: 'center',
  },
  previewTitle: { fontSize: 22, fontStyle: 'italic', marginBottom: 4 },
  previewSub: { fontSize: 9, letterSpacing: 2 },
  previewNotes: { padding: 12, gap: 8 },
  previewNote: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewNoteText: { fontSize: 13 },
  previewBtn: {
    margin: 12, padding: 10, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
  },
  previewBtnText: { fontSize: 11, letterSpacing: 1 },
});