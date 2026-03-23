import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback, Image, Alert, LayoutAnimation } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useSound } from '../context/SoundContext';
import Slider from '@react-native-community/slider';

const AMBIANCES = ['PLUIE', 'FORÊT', 'CAFÉ', 'FEU', 'SILENCE'];
const MOODS = ['😌', '✨', '🦅', '🕯️', '🌊'];
const CAPSULE_OPTIONS = ['+1 semaine', '+1 mois', '+6 mois', '+1 an', '+5 ans'];
const CAPSULE_DELAYS = {
  '+1 semaine': 7, '+1 mois': 30, '+6 mois': 180, '+1 an': 365, '+5 ans': 1825,
};



export default function EditorScreen({ navigation, route }) {
  const { theme, accent } = useTheme();
  const { addNote, updateNote, deleteNote, getActiveNotes } = useNotes();
  const { playAmbiance, stopSound, isPlaying, volume, changeVolume } = useSound();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });

  const noteId = route?.params?.noteId;
  const allNotes = getActiveNotes();
  const existingNote = noteId ? allNotes.find(n => n.id === noteId) : null;

  const [titre, setTitre] = useState(existingNote?.titre || '');
  const [contenu, setContenu] = useState(existingNote?.contenu || '');
  const [ambianceIndex, setAmbianceIndex] = useState(
    existingNote ? Math.max(0, AMBIANCES.indexOf(existingNote.ambiance)) : 0
  );
  const [moodIndex, setMoodIndex] = useState(
    existingNote ? Math.max(0, MOODS.indexOf(existingNote.mood)) : 0
  );
  const [fontSize, setFontSize] = useState(15);
  const [lineHeight, setLineHeight] = useState(28);
  const [showTT, setShowTT] = useState(false);
  const [showCapsule, setShowCapsule] = useState(false);
  const [capsuleSelected, setCapsuleSelected] = useState(null);
  const [capsuleSealed, setCapsuleSealed] = useState(!!existingNote?.capsule);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [media, setMedia] = useState(existingNote?.media || []);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [bgImage, setBgImage] = useState(existingNote?.bgImage || null);

  const wordCount = contenu.trim() === '' ? 0 : contenu.trim().split(/\s+/).length;

  const cycleAmbiance = async () => {
    const nextIndex = (ambianceIndex + 1) % AMBIANCES.length;
    setAmbianceIndex(nextIndex);
    const nextAmbiance = AMBIANCES[nextIndex];
    if (nextAmbiance === 'SILENCE') {
      await stopSound();
    } else {
      await playAmbiance(nextAmbiance);
    }
  };

  const sealCapsule = (option) => {
    setCapsuleSelected(option);
    setCapsuleSealed(true);
    setShowCapsule(false);
  };

  const getCapsuleDate = (option) => {
    const days = CAPSULE_DELAYS[option] || 365;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleTerminer = async () => {
    if (!titre.trim() && !contenu.trim()) {
      setSaving(false);
      navigation.goBack();
      return;
    }

    setSaving(true);
    await stopSound();
    try {
      const capsuleDate = (capsuleSealed && capsuleSelected) ? getCapsuleDate(capsuleSelected) : (existingNote?.capsule || null);
      if (existingNote) {
        await updateNote(existingNote.id, {
          titre: titre || 'Sans titre',
          contenu,
          mood: MOODS[moodIndex],
          ambiance: AMBIANCES[ambianceIndex],
          capsule: capsuleDate,
          wordCount,
          capsule: capsuleDate,
          wordCount,
          media,
          bgImage,
        });
      } else {
        await addNote({
          titre: titre || 'Sans titre',
          contenu,
          mood: MOODS[moodIndex],
          ambiance: AMBIANCES[ambianceIndex],
          capsule: capsuleDate,
          media,
          bgImage,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const handleDelete = async () => {
    if (existingNote) {
      await deleteNote(existingNote.id);
      navigation.goBack();
    }
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled) {
      const asset = result.assets[0];
      const isVideo = asset.mediaType === 'video' || asset.type === 'video';
      
      if (isVideo) {
        if (asset.duration > 60000) {
          Alert.alert("Vidéo trop longue", "Les vidéos ne doivent pas dépasser 60 secondes.");
          return;
        }
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.size > 50 * 1024 * 1024) {
          Alert.alert("Fichier volumineux", "Cette vidéo dépasse 50 Mo. Elle sera sauvegardée localement et pourrait alourdir la taille de l'application.");
        }
      }

      setMedia([...media, {
        id: Date.now().toString(),
        uri: asset.uri,
        type: isVideo ? 'video' : 'image',
        duration: asset.duration,
        size: asset.fileSize
      }]);
    }
  } catch (err) {
    console.error('Failed to pick media', err);
  }
};

  const pickBgImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setBgImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error("BG Pick Error:", e);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Clean up previous recording if any
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {}
        setRecording(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!recording) return;
    try {
      const status = await recording.getStatusAsync();
      if (status.canRecord || status.isRecording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setMedia([...media, {
          id: Date.now().toString(),
          uri,
          type: 'audio',
        }]);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      setRecording(null);
    }
  };

  const removeMedia = (id) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.chiffreBadge}>
            <View style={[styles.chiffreDot, { backgroundColor: accent.teal }]} />
            <Text style={[styles.chiffreText, { color: accent.teal }]}>CHIFFRÉ DE BOUT EN BOUT</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {capsuleSealed && (
              <View style={[styles.capsuleBadge, { backgroundColor: accent.light, borderColor: accent.teal + '50' }]}>
                <Text style={[styles.capsuleBadgeText, { color: accent.teal }]}>⏳ {capsuleSelected}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.terminerBtn, { backgroundColor: saving ? theme.bg4 : accent.primary }]}
              onPress={handleTerminer}
              disabled={saving}
            >
              <Text style={[styles.terminerText, { color: saving ? theme.text3 : theme.bg }]}>
                {saving ? '...' : 'Terminer'}
              </Text>
            </TouchableOpacity>
            {existingNote && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Zone d'écriture */}
        <View style={{ flex: 1 }}>
          {bgImage && (
            <>
              <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            </>
          )}
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.titreInput, { color: accent.primary + '90' },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic' }]}
            placeholder="Titre de la pensée..."
            placeholderTextColor={accent.primary + '40'}
            value={titre}
            onChangeText={setTitre}
            multiline={false}
          />
          <Text style={[styles.dateLoc, { color: theme.text4 }]}>{dateStr}  •  LOMÉ, TG</Text>
          <TextInput
            style={[styles.contenuInput, { fontSize, lineHeight, color: theme.text2 }]}
            placeholder="Commencez à écrire votre vérité..."
            placeholderTextColor={theme.text4}
            value={contenu}
            onChangeText={setContenu}
            multiline={true}
            textAlignVertical="top"
          />

          {/* Media list */}
          {media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaList}>
              {media.map((m) => (
                <View key={m.id} style={styles.mediaItem}>
                  {m.type === 'image' && <Image source={{ uri: m.uri }} style={styles.mediaThumbnail} />}
                  {m.type === 'video' && (
                    <View style={[styles.mediaThumbnail, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 24 }}>🎥</Text>
                    </View>
                  )}
                  {m.type === 'audio' && (
                    <View style={[styles.mediaThumbnail, { backgroundColor: accent.light, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 24 }}>🎙️</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(m.id)}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ height: 200 }} />
        </ScrollView>
        </View>

        {/* Panneau typographie */}
        {showTT && (
          <View style={[styles.ttPanel, { backgroundColor: theme.bg3, borderTopColor: theme.border }]}>
            <Text style={[styles.ttPanelLabel, { color: theme.text3 }]}>TAILLE DU TEXTE</Text>
            <View style={styles.ttRow}>
              <TouchableOpacity style={[styles.ttBtn, { backgroundColor: theme.bg4, borderColor: theme.border }]}
                onPress={() => setFontSize(f => Math.max(12, f - 1))}>
                <Text style={[styles.ttBtnText, { color: theme.text }]}>A−</Text>
              </TouchableOpacity>
              <Text style={[styles.ttValue, { color: accent.primary }]}>{fontSize}px</Text>
              <TouchableOpacity style={[styles.ttBtn, { backgroundColor: theme.bg4, borderColor: theme.border }]}
                onPress={() => setFontSize(f => Math.min(24, f + 1))}>
                <Text style={[styles.ttBtnText, { color: theme.text }]}>A+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.ttPanelLabel, { color: theme.text3, marginTop: 12 }]}>INTERLIGNE</Text>
            <View style={styles.ttRow}>
              <TouchableOpacity style={[styles.ttBtn, { backgroundColor: theme.bg4, borderColor: theme.border }]}
                onPress={() => setLineHeight(l => Math.max(20, l - 2))}>
                <Text style={[styles.ttBtnText, { color: theme.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.ttValue, { color: accent.primary }]}>{lineHeight}px</Text>
              <TouchableOpacity style={[styles.ttBtn, { backgroundColor: theme.bg4, borderColor: theme.border }]}
                onPress={() => setLineHeight(l => Math.min(48, l + 2))}>
                <Text style={[styles.ttBtnText, { color: theme.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: theme.bg3, borderTopColor: theme.border }]}>
          <View style={styles.toolbarRow1}>
            <View style={styles.wordCountWrap}>
              <Text style={[styles.wordCountNum, { color: theme.text }]}>{wordCount}</Text>
              <Text style={[styles.wordCountLabel, { color: theme.text3 }]}>MOTS</Text>
            </View>
            <View style={styles.moodSelector}>
              {MOODS.map((m, i) => (
                <TouchableOpacity key={i}
                  style={[styles.moodBtn, { backgroundColor: theme.bg4 },
                    moodIndex === i && { backgroundColor: accent.light, borderWidth: 1.5, borderColor: accent.primary }]}
                  onPress={() => {
                    setMoodIndex(i);
                  }}>
                  <Text style={{ fontSize: 18 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.toolbarRow2}>
            <TouchableOpacity style={styles.toolBtn} onPress={pickMedia}>
              <Text style={{ fontSize: 16 }}>🎞️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={pickBgImage}>
              <Text style={{ fontSize: 16 }}>🎨</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolBtn, isRecording && { backgroundColor: 'rgba(229,85,85,0.2)', borderRadius: 10 }]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Text style={{ fontSize: 16, color: isRecording ? '#e55' : theme.text2 }}>🎙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, showTT && { backgroundColor: accent.light, borderRadius: 10 }]}
              onPress={() => setShowTT(!showTT)}>
              <Text style={[styles.ttText, { color: showTT ? accent.primary : theme.text2 }]}>TT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, capsuleSealed && { backgroundColor: accent.light, borderRadius: 10 }]}
              onPress={() => setShowCapsule(true)}>
              <Text style={{ fontSize: 16 }}>⏳</Text>
            </TouchableOpacity>
            <View style={styles.ambianceWrap}>
              <TouchableOpacity
                style={[styles.ambiancePill, { backgroundColor: isPlaying ? accent.primary : accent.light }]}
                onPress={cycleAmbiance}>
                <Text style={{ fontSize: 14 }}>🎧</Text>
                <Text style={[styles.ambianceLabel, { color: isPlaying ? theme.bg : accent.primary }]}>
                  {AMBIANCES[ambianceIndex]}
                </Text>
                {isPlaying && <View style={styles.playingDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Slider volume */}
          {isPlaying && (
            <View style={[styles.volumeRow, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
              <Text style={{ fontSize: 12 }}>🔈</Text>
              <Slider
                style={{ flex: 1, height: 30 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={changeVolume}
                minimumTrackTintColor={accent.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={accent.primary}
                step={0.05}
              />
              <Text style={{ fontSize: 12 }}>🔊</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modal Capsule */}
      <Modal visible={showCapsule} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCapsule(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.capsuleModal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.capsuleTitle, { color: accent.primary },
                  fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
                  Capsule Temporelle
                </Text>
                <Text style={[styles.capsuleDesc, { color: theme.text2 }]}>
                  Cette note sera scellée et invisible jusqu'à la date choisie.
                </Text>
                <View style={[styles.capsuleDivider, { backgroundColor: theme.border }]} />
                {CAPSULE_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt}
                    style={[styles.capsuleOption, capsuleSelected === opt && { backgroundColor: accent.light }]}
                    onPress={() => sealCapsule(opt)}>
                    <Text style={{ fontSize: 18 }}>⏳</Text>
                    <Text style={[styles.capsuleOptionText, { color: theme.text },
                      capsuleSelected === opt && { color: accent.primary }]}>
                      {opt}
                    </Text>
                    {capsuleSelected === opt && <Text style={{ color: accent.primary, marginLeft: 'auto' }}>✓</Text>}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.capsuleCancelBtn, { backgroundColor: theme.bg4 }]}
                  onPress={() => setShowCapsule(false)}>
                  <Text style={[styles.capsuleCancelText, { color: theme.text2 }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Suppression */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.capsuleModal, { backgroundColor: theme.bg3, borderColor: theme.border, padding: 24 }]}>
                <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 16 }}>🗑️</Text>
                <Text style={[styles.capsuleTitle, { color: theme.text, fontSize: 18 }]}>Supprimer cette pensée ?</Text>
                <Text style={[styles.capsuleDesc, { color: theme.text2 }]}>
                  Elle sera déplacée dans la corbeille.
                </Text>
                <TouchableOpacity 
                  style={[styles.capsuleCancelBtn, { backgroundColor: 'rgba(229,85,85,0.15)', marginBottom: 8 }]}
                  onPress={handleDelete}
                >
                  <Text style={{ color: '#e55', fontWeight: '600' }}>Supprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.capsuleCancelBtn, { backgroundColor: theme.bg4 }]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={{ color: theme.text2 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1 },
  chiffreBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chiffreDot: { width: 8, height: 8, borderRadius: 4 },
  chiffreText: { fontSize: 10, letterSpacing: 1.5 },
  terminerBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  terminerText: { fontSize: 13, fontWeight: '500' },
  capsuleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  capsuleBadgeText: { fontSize: 10, letterSpacing: 1 },
  body: { flex: 1, paddingHorizontal: 24 },
  titreInput: { fontSize: 32, marginBottom: 10, marginTop: 24 },
  dateLoc: { fontSize: 11, letterSpacing: 1.5, marginBottom: 28 },
  contenuInput: { minHeight: 300 },
  ttPanel: { borderTopWidth: 1, padding: 16 },
  ttPanelLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  ttRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ttBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  ttBtnText: { fontSize: 14, fontWeight: '500' },
  ttValue: { fontSize: 14, minWidth: 40, textAlign: 'center' },
  toolbar: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, borderTopWidth: 1 },
  toolbarRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  wordCountWrap: { marginRight: 4 },
  wordCountNum: { fontSize: 18, fontWeight: '500' },
  wordCountLabel: { fontSize: 9, letterSpacing: 1 },
  moodSelector: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'center' },
  moodBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toolbarRow2: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  toolBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  ttText: { fontSize: 13, fontWeight: '600' },
  ambianceWrap: { flex: 1 },
  ambiancePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  ambianceLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '500', flex: 1 },
  playingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  capsuleModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1 },
  capsuleTitle: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
  capsuleDesc: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  capsuleDivider: { height: 1, marginBottom: 8 },
  capsuleOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12 },
  capsuleOptionText: { fontSize: 15 },
  capsuleCancelBtn: { marginTop: 8, padding: 14, borderRadius: 12, alignItems: 'center' },
  capsuleCancelText: { fontSize: 14 },
  mediaList: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  mediaItem: { marginRight: 12, position: 'relative' },
  mediaThumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeMediaBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#e55', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});