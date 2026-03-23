import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TrashScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { trash, restoreNote, restoreSelected, deleteForever, deleteSelectedForever, emptyTrash, formatDate } = useNotes();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [selected, setSelected] = useState([]);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === trash.length) setSelected([]);
    else setSelected(trash.map(n => n.id));
  };

  const handleRestoreSelected = async () => {
    await restoreSelected(selected);
    setSelected([]);
  };

  const handleDeleteSelected = async () => {
    await deleteSelectedForever(selected);
    setSelected([]);
  };

  const getDaysLeft = (deletedAt) => {
    const diff = 30 - Math.floor((new Date() - new Date(deletedAt)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
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
          Corbeille
        </Text>
        {trash.length > 0 ? (
          <TouchableOpacity onPress={selectAll}>
            <Text style={[styles.selectAll, { color: accent.primary }]}>
              {selected.length === trash.length ? 'Désélect.' : 'Tout'}
            </Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      {/* Info */}
      {trash.length > 0 && (
        <View style={[styles.infoBar, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={{ fontSize: 14 }}>🗑️</Text>
          <Text style={[styles.infoText, { color: theme.text3 }]}>
            Les éléments sont supprimés définitivement après 30 jours
          </Text>
        </View>
      )}

      {/* Liste */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {trash.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗑️</Text>
            <Text style={[styles.emptyTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              Corbeille vide
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.text3 }]}>
              Les notes supprimées apparaîtront ici
            </Text>
          </View>
        ) : (
          trash.map(note => (
            <TouchableOpacity
              key={note.id}
              style={[styles.trashCard,
                { backgroundColor: theme.bg3, borderColor: theme.border },
                selected.includes(note.id) && { borderColor: accent.primary, backgroundColor: accent.light }
              ]}
              onPress={() => toggleSelect(note.id)}
              activeOpacity={0.8}
            >
              <View style={styles.trashCardHeader}>
                <View style={[styles.checkbox,
                  { borderColor: theme.border },
                  selected.includes(note.id) && { backgroundColor: accent.primary, borderColor: accent.primary }
                ]}>
                  {selected.includes(note.id) && <Text style={{ fontSize: 12, color: '#fff' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trashTitle, { color: selected.includes(note.id) ? accent.primary : theme.text },
                    fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}
                    numberOfLines={1}>
                    {note.titre}
                  </Text>
                  <Text style={[styles.trashMeta, { color: theme.text3 }]}>
                    {formatDate(note.date)} · {note.mood || '😌'}
                  </Text>
                </View>
                <View style={[styles.daysLeft, {
                  backgroundColor: getDaysLeft(note.deletedAt) <= 7
                    ? 'rgba(229,85,85,0.15)' : theme.bg4,
                  borderColor: getDaysLeft(note.deletedAt) <= 7
                    ? 'rgba(229,85,85,0.3)' : theme.border
                }]}>
                  <Text style={[styles.daysLeftText, {
                    color: getDaysLeft(note.deletedAt) <= 7 ? '#e55' : theme.text3
                  }]}>
                    {getDaysLeft(note.deletedAt)}j
                  </Text>
                </View>
              </View>
              {note.contenu ? (
                <Text style={[styles.trashExcerpt, { color: theme.text3 }]} numberOfLines={2}>
                  {note.contenu}
                </Text>
              ) : null}
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
            onPress={handleRestoreSelected}
          >
            <Text style={[styles.actionBtnText, { color: accent.primary }]}>♻️ Restaurer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(229,85,85,0.1)', borderColor: 'rgba(229,85,85,0.3)' }]}
            onPress={handleDeleteSelected}
          >
            <Text style={[styles.actionBtnText, { color: '#e55' }]}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Vider la corbeille */}
      {trash.length > 0 && selected.length === 0 && (
        <View style={[styles.emptyBtn, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.emptyBtnInner, { backgroundColor: 'rgba(229,85,85,0.1)', borderColor: 'rgba(229,85,85,0.3)' }]}
            onPress={() => setShowEmptyConfirm(true)}
          >
            <Text style={[styles.emptyBtnText, { color: '#e55' }]}>🗑️ Vider la corbeille</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation vider */}
      <Modal visible={showEmptyConfirm} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowEmptyConfirm(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={styles.confirmIcon}>⚠️</Text>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>Vider la corbeille ?</Text>
                <Text style={[styles.confirmDesc, { color: theme.text2 }]}>
                  {trash.length} note(s) seront supprimées définitivement. Cette action est irréversible.
                </Text>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: 'rgba(229,85,85,0.2)' }]}
                  onPress={async () => {
                    await emptyTrash();
                    setShowEmptyConfirm(false);
                    setSelected([]);
                  }}
                >
                  <Text style={[styles.confirmBtnText, { color: '#e55' }]}>Supprimer définitivement</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEmptyConfirm(false)}>
                  <Text style={[styles.cancelBtnText, { color: theme.text2 }]}>Annuler</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { fontSize: 14, width: 60 },
  selectAll: { fontSize: 13, width: 60, textAlign: 'right' },
  infoBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 12, flex: 1 },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, textAlign: 'center', marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  trashCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 10 },
  trashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  trashTitle: { fontSize: 16 },
  trashMeta: { fontSize: 11, marginTop: 2 },
  daysLeft: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  daysLeftText: { fontSize: 11, fontWeight: '600' },
  trashExcerpt: { fontSize: 12, lineHeight: 18, paddingLeft: 34 },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  selectedCount: { fontSize: 12, flex: 1 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
  emptyBtnInner: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyBtnText: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  confirmModal: { width: 300, borderRadius: 20, padding: 24, borderWidth: 1 },
  confirmIcon: { fontSize: 32, textAlign: 'center', marginBottom: 12 },
  confirmTitle: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 8 },
  confirmDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  confirmBtnText: { fontSize: 14, fontWeight: '500' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14 },
});