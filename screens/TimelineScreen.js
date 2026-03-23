import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, Animated, Pressable, LayoutAnimation } from 'react-native';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

const CONTEXT_MENU = [
  { icon: '🗑️', label: 'Supprimer', color: '#e55' },
  { icon: '📌', label: 'Épingler', color: null },
  { icon: '⏳', label: 'Sceller en Capsule', color: null },
  { icon: '🖼️', label: 'Partager (anonymisé)', color: null },
];



const MOOD_DOTS = {
  '😌': '#3ecf8e', '✨': '#f0c040',
  '🦅': '#f09040', '🕯️': '#f0a090', '🌊': '#4080f0',
};

const CAPSULE_OPTIONS = [
  { label: '+1 semaine', days: 7 },
  { label: '+1 mois', days: 30 },
  { label: '+6 mois', days: 180 },
  { label: '+1 an', days: 365 },
  { label: '+5 ans', days: 1825 },
];

function NoteCard({ note, onPress, onLongPress, accent, theme, fontsLoaded, formatDate, formatTime }) {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={[styles.noteCard,
          { backgroundColor: theme.bg3, borderColor: theme.border },
          note.pinned && { borderColor: accent.primary + '60', backgroundColor: accent.light }
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {note.pinned && <Text style={[styles.pinBadge, { color: accent.primary }]}>📌 ÉPINGLÉE</Text>}
        <Text style={[styles.noteMeta, { color: theme.text3 }]}>
          {formatDate(note.date)} • {formatTime(note.date)} {note.location ? ` • 📍 ${note.location}` : ''}
        </Text>
        <View style={styles.noteHeader}>
          <Text style={fontsLoaded
            ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 20, color: accent.primary, flex: 1, fontStyle: 'italic' }
            : { fontSize: 20, fontStyle: 'italic', color: accent.primary, flex: 1 }}
            numberOfLines={1}>
            {note.titre}
          </Text>
          <View style={[styles.moodBadge, { backgroundColor: theme.bg5 }]}>
            <Text style={{ fontSize: 16 }}>{note.mood || '😌'}</Text>
          </View>
        </View>
        <Text style={[styles.noteExcerpt, { color: theme.text2 }]} numberOfLines={2}>
          {note.contenu || '...'}
        </Text>
        {note.capsule && (
          <View style={[styles.capsuleTag, { backgroundColor: accent.light }]}>
            <Text style={[styles.capsuleTagText, { color: accent.primary }]}>⏳ Scellée</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function FAB({ onPress, accent, theme }) {
  return (
    <TouchableOpacity
      style={[styles.fabWrap, styles.fab, { backgroundColor: accent.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 24, color: theme.bg }}>✏️</Text>
    </TouchableOpacity>
  );
}

function NavButton({ onPress, icon, label, isActive, accent, theme }) {
  return (
    <TouchableOpacity
      style={styles.navBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.navBtnInner}>
        <Text style={[styles.navIcon, { opacity: isActive ? 1 : 0.4 }]}>{icon}</Text>
        <Text style={[styles.navLabel, { color: isActive ? accent.primary : theme.text3 }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TimelineScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const { notes, getActiveNotes, togglePin, deleteNote, sealCapsule, streak, formatDate, formatTime, cityFilter, filterByCity, groupNotesByDate } = useNotes();
  const { isDecoyMode } = useAuth();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const [selectedNote, setSelectedNote] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [retroVisible, setRetroVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [capsuleModalVisible, setCapsuleModalVisible] = useState(false);
  const [noteToSeal, setNoteToSeal] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('flux'); // 'flux' | 'carte'
const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);

  const currentGroups = useMemo(() => {
    const allGroups = groupNotesByDate();
    if (!activeFilter) return allGroups;
    
    const filtered = {};
    Object.entries(allGroups).forEach(([date, notes]) => {
      const filteredNotes = notes.filter(note => {
        if (activeFilter === 'pinned') return note.pinned;
        if (activeFilter === 'capsule') return note.capsule;
        return note.mood === activeFilter;
      });
      if (filteredNotes.length > 0) filtered[date] = filteredNotes;
    });
    return filtered;
  }, [notes, activeFilter, cityFilter]);
  const hasNotes = Object.keys(currentGroups).length > 0;

  const openMenu = (note) => { 
    setSelectedNote(note); 
    setMenuVisible(true);
  };
  const closeMenu = () => { setMenuVisible(false); setSelectedNote(null); };

  const handleMenuAction = async (action) => {
    if (!selectedNote) return;

    if (action === 'Supprimer') {
      const noteToDelete = selectedNote;
      setDeleteConfirmNote(noteToDelete);
      closeMenu();
      setTimeout(() => {
        setDeleteConfirmVisible(true);
      }, 300);
      return;
    }
    if (action === 'Épingler' || action === 'Désépingler') {
      await togglePin(selectedNote.id);
      closeMenu();
      return;
    }
    if (action === 'Sceller en Capsule') {
      const note = selectedNote;
      closeMenu();
      setTimeout(() => {
        setNoteToSeal(note);
        setCapsuleModalVisible(true);
      }, 300);
      return;
    }
    if (action === 'Partager (anonymisé)') {
      const noteToShare = selectedNote;
      closeMenu();
      setTimeout(() => navigation.navigate('ShareNote', { note: noteToShare }), 300);
      return;
    }

    closeMenu();
  };

  {/* Modal confirmation suppression */}
<Modal visible={deleteConfirmVisible} transparent animationType="fade">
  <TouchableWithoutFeedback onPress={() => setDeleteConfirmVisible(false)}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={[styles.contextMenu, { backgroundColor: theme.bg3, borderColor: theme.border, padding: 20 }]}>
          <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🗑️</Text>
          <Text style={[styles.contextTitle, { color: theme.text, fontSize: 16, fontWeight: '500' }]}>
            Supprimer cette note ?
          </Text>
          <Text style={[{ color: theme.text3, fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 18 }]}>
            La note sera déplacée dans la corbeille. Vous pourrez la restaurer pendant 30 jours.
          </Text>
          <TouchableOpacity
            style={[{ padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(229,85,85,0.15)', marginBottom: 8 }]}
            onPress={async () => {
              if (deleteConfirmNote) {
                await deleteNote(deleteConfirmNote.id);
              }
              setDeleteConfirmVisible(false);
              setDeleteConfirmNote(null);
            }}
          >
            <Text style={{ color: '#e55', fontWeight: '500', fontSize: 14 }}>Déplacer en corbeille</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.bg4 }]}
            onPress={() => setDeleteConfirmVisible(false)}
          >
            <Text style={{ color: theme.text2, fontSize: 14 }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Drawer')}>
          <Text style={[styles.menuIcon, { color: theme.text2 }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[fontsLoaded
          ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 22, color: accent.primary, fontStyle: 'italic' }
          : { fontSize: 22, color: accent.primary, fontStyle: 'italic' }, { flex: 1, textAlign: 'center' }]}>
          Mes Pensées
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: accent.light }]}>
              <Text style={{ fontSize: 12 }}>🔥 {streak}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={{ fontSize: 18, color: theme.text2 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Personnalisation')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toggle Flux/Carte */}
      <View style={styles.toggleWrap}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'flux' ? { backgroundColor: accent.primary } : { backgroundColor: theme.bg4 }]}
          onPress={() => setActiveTab('flux')}
        >
          <Text style={[styles.toggleText, { color: activeTab === 'flux' ? theme.bg : theme.text3 }]}>FLUX</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'carte' ? { backgroundColor: accent.primary } : { backgroundColor: theme.bg4 }]}
          onPress={() => setActiveTab('carte')}
        >
          <Text style={[styles.toggleText, { color: activeTab === 'carte' ? theme.bg : theme.text3 }]}>CARTE</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip,
            { backgroundColor: theme.bg3, borderColor: theme.border },
            activeFilter === null && { backgroundColor: accent.primary, borderColor: accent.primary }
          ]}
          onPress={() => setActiveFilter(null)}
        >
          <Text style={[styles.filterText, { color: activeFilter === null ? theme.bg : theme.text2 }]}>
            Tout
          </Text>
        </TouchableOpacity>
        {['😌', '✨', '🦅', '🕯️', '🌊'].map(mood => (
          <TouchableOpacity
            key={mood}
            style={[styles.filterChip,
              { backgroundColor: theme.bg3, borderColor: theme.border },
              activeFilter === mood && { backgroundColor: accent.light, borderColor: accent.primary }
            ]}
            onPress={() => setActiveFilter(activeFilter === mood ? null : mood)}
          >
            <Text style={{ fontSize: 16 }}>{mood}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip,
            { backgroundColor: theme.bg3, borderColor: theme.border },
            activeFilter === 'pinned' && { backgroundColor: accent.light, borderColor: accent.primary }
          ]}
          onPress={() => setActiveFilter(activeFilter === 'pinned' ? null : 'pinned')}
        >
          <Text style={[styles.filterText, { color: activeFilter === 'pinned' ? accent.primary : theme.text2 }]}>
            📌 Épinglées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip,
            { backgroundColor: theme.bg3, borderColor: theme.border },
            activeFilter === 'capsule' && { backgroundColor: accent.light, borderColor: accent.primary }
          ]}
          onPress={() => setActiveFilter(activeFilter === 'capsule' ? null : 'capsule')}
        >
          <Text style={[styles.filterText, { color: activeFilter === 'capsule' ? accent.primary : theme.text2 }]}>
            ⏳ Capsules
          </Text>
        </TouchableOpacity>
        {cityFilter && (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: accent.light, borderColor: accent.primary }]}
            onPress={() => filterByCity(null)}
          >
            <Text style={[styles.filterText, { color: accent.primary }]}>📍 {cityFilter} ✕</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bannière Mode Leurre */}
      {isDecoyMode && (
        <View style={[styles.decoyBanner, { backgroundColor: 'rgba(62,207,142,0.08)', borderColor: accent.teal + '40' }]}>
          <Text style={{ fontSize: 16 }}>🎭</Text>
          <Text style={[styles.decoyBannerText, { color: accent.teal }]}>Mode Leurre Actif</Text>
        </View>
      )}

      {/* Rétrospective */}
      <TouchableOpacity
        style={[styles.retroBanner, { backgroundColor: theme.bg3, borderColor: theme.border }]}
        onPress={() => setRetroVisible(true)}>
        <View style={[styles.retroIconWrap, { backgroundColor: theme.bg5 }]}>
          <Text style={{ fontSize: 18 }}>🕰️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.retroTitle, { color: accent.primary }]}>Rétrospective : Il y a un an...</Text>
          <Text style={[styles.retroPreview, { color: theme.text2 }]}>"Sous les premiers frimas d'octobre,...</Text>
        </View>
        <Text style={[styles.retroArrow, { color: theme.text3 }]}>›</Text>
      </TouchableOpacity>

      {/* Liste */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {activeTab === 'carte' ? (
          <View style={styles.mapAlternative}>
            <View style={[styles.mapIconCircle, { backgroundColor: theme.bg3, borderColor: accent.primary + '30' }]}>
              <Text style={{ fontSize: 40 }}>🗺️</Text>
            </View>
            <Text style={[styles.mapTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              Vos mémoires géographiques
            </Text>
            <Text style={[styles.mapDesc, { color: theme.text3 }]}>
              Cette fonctionnalité vous permettra bientôt de visualiser vos pensées sur une carte interactive.
            </Text>
            <View style={[styles.locationSummary, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
               <Text style={{ color: theme.text2, fontSize: 13, marginBottom: 8 }}>VILLES EXPLORÉES (cliquez pour filtrer) :</Text>
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                 {Array.from(new Set(Object.values(currentGroups).flat().map(n => n.location?.split(',')[0]).filter(Boolean))).map(city => (
                   <TouchableOpacity 
                     key={city} 
                     style={[styles.cityBadge, { backgroundColor: theme.bg4, borderColor: theme.border }, cityFilter === city && { borderColor: accent.primary }]}
                     onPress={() => {
                        filterByCity(city);
                        setActiveTab('flux');
                     }}
                    >
                     <Text style={{ color: accent.primary, fontSize: 12 }}>📍 {city}</Text>
                   </TouchableOpacity>
                 ))}
                 {Object.values(currentGroups).flat().length === 0 && <Text style={{ color: theme.text4, fontStyle: 'italic' }}>Aucune donnée pour le moment</Text>}
               </View>
            </View>
          </View>
        ) : !hasNotes ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyCircle, { backgroundColor: theme.bg3, borderColor: accent.primary + '30' }]}>
              <Text style={{ fontSize: 44 }}>{activeFilter ? '🔍' : '🕯️'}</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: accent.primary },
              fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
              {activeFilter ? 'Aucune pensée trouvée' : 'Le silence est un sanctuaire'}
            </Text>
            <Text style={[styles.emptyQuote, { color: theme.text3 }]}>
              {activeFilter
                ? 'Essayez d\'élargir vos horizons ou de changer de filtre.'
                : '“Les pensées sont les ombres de nos sentiments ; elles sont toujours plus obscures, plus vides et plus simples que ceux-ci.”'}
            </Text>
            {!activeFilter && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}
                onPress={() => navigation.navigate('Editor', { noteId: null })}
              >
                <Text style={{ color: accent.primary, fontSize: 13, letterSpacing: 1 }}>ÉCRIRE VOTRE VÉRITÉ</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          Object.entries(currentGroups).map(([dateLabel, groupNotes]) => (
            <View key={dateLabel}>
              <Text style={[styles.daySep, { color: theme.text3 }, dateLabel === 'ÉPINGLÉES' && { color: accent.primary, fontWeight: '600' }]}>
                {dateLabel === 'ÉPINGLÉES' ? '📌 NOTES ÉPINGLÉES' : dateLabel}
              </Text>
              {groupNotes.map((note) => (
                <View key={note.id} style={styles.noteRow}>
                  <View style={[styles.dot, { backgroundColor: dateLabel === 'ÉPINGLÉES' ? accent.primary : (MOOD_DOTS[note.mood] || accent.primary) }]} />
                  <NoteCard
                    note={note}
                    onPress={() => navigation.navigate('Editor', { noteId: note.id })}
                    onLongPress={() => openMenu(note)}
                    accent={accent}
                    theme={theme}
                    fontsLoaded={fontsLoaded}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                </View>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => navigation.navigate('Editor', { noteId: null })} accent={accent} theme={theme} />

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bg2, borderTopColor: theme.border }]}>
        <NavButton onPress={() => navigation.navigate('Timeline')} icon="📖" label="JOURNAL" isActive={true} accent={accent} theme={theme} />
        <NavButton onPress={() => navigation.navigate('Stats')} icon="📈" label="STATS" isActive={false} accent={accent} theme={theme} />
        <NavButton onPress={() => navigation.navigate('Coffre')} icon="🔐" label="COFFRE" isActive={false} accent={accent} theme={theme} />
      </View>

      {/* Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.contextMenu, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                {selectedNote && (
                  <Text style={[styles.contextTitle, { color: accent.primary },
                    fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
                    {selectedNote.titre}
                  </Text>
                )}
                <View style={[styles.contextDivider, { backgroundColor: theme.border }]} />
                {CONTEXT_MENU.map((item) => {
                  let label = item.label;
                  if (label === 'Épingler' && selectedNote?.pinned) label = 'Désépingler';
                  
                  return (
                    <TouchableOpacity key={item.label} style={styles.contextItem}
                      onPress={() => handleMenuAction(label)}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                      <Text style={[styles.contextLabel, { color: item.color || accent.primary }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Capsule */}
      <Modal visible={capsuleModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setCapsuleModalVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.capsuleModal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.capsuleModalTitle, { color: accent.primary },
                  fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
                  Capsule Temporelle
                </Text>
                <Text style={[styles.capsuleModalDesc, { color: theme.text2 }]}>
                  Cette note sera scellée et invisible jusqu'à la date choisie.
                </Text>
                <View style={[styles.capsuleDivider, { backgroundColor: theme.border }]} />
                {CAPSULE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.capsuleOption, { borderBottomColor: theme.border }]}
                    onPress={async () => {
                      if (!noteToSeal) return;
                      const future = new Date();
                      future.setDate(future.getDate() + opt.days);
                      await sealCapsule(noteToSeal.id, future.toISOString());
                      setCapsuleModalVisible(false);
                      setNoteToSeal(null);
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>⏳</Text>
                    <Text style={[styles.capsuleOptionText, { color: theme.text }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.capsuleCancelBtn, { backgroundColor: theme.bg4 }]}
                  onPress={() => setCapsuleModalVisible(false)}
                >
                  <Text style={[styles.capsuleCancelText, { color: theme.text2 }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rétrospective Modal */}
      <Modal visible={retroVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setRetroVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.retroModal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.retroModalLabel, { color: theme.text3 }]}>IL Y A UN AN</Text>
                <View style={[styles.retroSepiaCard, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                  <Text style={[styles.retroModalTitle, { color: accent.primary },
                    fontsLoaded && { fontFamily: 'CormorantGaramond_300Italic', fontStyle: 'italic' }]}>
                    Sous les premiers frimas...
                  </Text>
                  <Text style={[styles.retroModalText, { color: theme.text2 }]}>
                    Sous les premiers frimas d'octobre, je me suis souvenu pourquoi j'aimais cette saison...
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.retroCloseBtn, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}
                  onPress={() => setRetroVisible(false)}>
                  <Text style={[styles.retroCloseBtnText, { color: accent.primary }]}>Fermer</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  menuIcon: { fontSize: 18, width: 28 },
  settingsIcon: { fontSize: 18 },
  toggleWrap: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
  toggleActive: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  toggleActiveText: { fontSize: 12, letterSpacing: 1, fontWeight: '500' },
  toggleInactive: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  toggleInactiveText: { fontSize: 12, letterSpacing: 1 },
  filtersScroll: { maxHeight: 48, marginBottom: 12 },
  filtersContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterText: { fontSize: 12, fontWeight: '500' },
  decoyBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  decoyBannerText: { fontSize: 11, letterSpacing: 1.5, fontWeight: '500' },
  retroBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  retroIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  retroTitle: { fontSize: 11, fontStyle: 'italic', marginBottom: 2 },
  retroPreview: { fontSize: 12 },
  retroArrow: { fontSize: 18 },
  list: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 28, textAlign: 'center', marginBottom: 16 },
  emptyQuote: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginBottom: 32 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
  daySep: { fontSize: 13, fontStyle: 'italic', marginTop: 20, marginBottom: 12, marginLeft: 22 },
  toggleBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  toggleText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  mapAlternative: { alignItems: 'center', padding: 40 },
  mapIconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mapTitle: { fontSize: 22, textAlign: 'center', marginBottom: 12 },
  mapDesc: { fontSize: 14, textAlign: 'center', color: '#888', lineHeight: 20, marginBottom: 24 },
  locationSummary: { width: '100%', padding: 16, borderRadius: 16, borderWidth: 1 },
  cityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 22, flexShrink: 0 },
  noteCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1 },
  pinBadge: { fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  noteMeta: { fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  streakBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minWidth: 28, alignItems: 'center' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  moodBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  noteExcerpt: { fontSize: 13, lineHeight: 20 },
  capsuleTag: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  capsuleTagText: { fontSize: 10, letterSpacing: 1 },
  fabWrap: { position: 'absolute', bottom: 80, right: 24 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 20, paddingTop: 10 },
  navBtn: { flex: 1 },
  navBtnInner: { alignItems: 'center', gap: 4, paddingVertical: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 8, letterSpacing: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { width: 280, borderRadius: 20, padding: 8, borderWidth: 1 },
  contextTitle: { fontSize: 16, textAlign: 'center', padding: 12 },
  contextDivider: { height: 1, marginBottom: 4 },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12 },
  contextLabel: { fontSize: 15 },
  capsuleModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1 },
  capsuleModalTitle: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
  capsuleModalDesc: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  capsuleDivider: { height: 1, marginBottom: 8 },
  capsuleOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12 },
  capsuleOptionText: { fontSize: 15 },
  capsuleCancelBtn: { marginTop: 8, padding: 14, borderRadius: 12, alignItems: 'center' },
  capsuleCancelText: { fontSize: 14 },
  retroModal: { width: 320, borderRadius: 20, padding: 20, borderWidth: 1 },
  retroModalLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 14 },
  retroSepiaCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  retroModalTitle: { fontSize: 20, marginBottom: 10 },
  retroModalText: { fontSize: 14, lineHeight: 22 },
  retroCloseBtn: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  retroCloseBtnText: { fontSize: 14 },
});