import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { encryptAllNotes, decryptAllNotes, initEncryption, reEncryptAllNotes } from '../utils/encryption';
import { scheduleCapsuleNotification } from '../utils/notifications';

const NotesContext = createContext();

const DECOY_NOTES = [
  { id: 'decoy_1', titre: 'Liste de courses', contenu: 'Acheter du pain, du lait, des œufs, du fromage, des fruits et légumes.', mood: '😌', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), pinned: false, capsule: null, wordCount: 18 },
  { id: 'decoy_2', titre: 'Idées pour le jardin', contenu: 'Planter des tomates cette année. Regarder des tutoriels sur YouTube.', mood: '✨', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), pinned: false, capsule: null, wordCount: 14 },
  { id: 'decoy_3', titre: 'Recette tarte aux pommes', contenu: 'Ingrédients : 4 pommes, 200g de farine, 100g de beurre, 2 œufs, 50g de sucre.', mood: '🕯️', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), pinned: false, capsule: null, wordCount: 18 },
  { id: 'decoy_4', titre: 'Rendez-vous semaine prochaine', contenu: 'Lundi : dentiste à 14h. Mercredi : réunion au bureau. Vendredi : dîner chez les parents.', mood: '🦅', date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), pinned: true, capsule: null, wordCount: 16 },
  { id: 'decoy_5', titre: 'Films à regarder', contenu: 'Inception, Interstellar, The Revenant, Parasite, Everything Everywhere All at Once.', mood: '🌊', date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), pinned: false, capsule: null, wordCount: 12 },
];

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDecoy, setIsDecoy] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [cityFilter, setCityFilter] = useState(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => {
    updateStreak();
  }, [notes]);

  const updateStreak = () => {
    if (notes.length === 0) {
      setStreak(0);
      return;
    }

    const uniqueDays = [...new Set(notes.map(n => n.date.split('T')[0]))].sort().reverse();
    if (uniqueDays.length === 0) {
      setStreak(0);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Si on n'a rien écrit aujourd'hui ni hier, la série est brisée
    if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
      setStreak(0);
      return;
    }

    let currentStreak = 0;
    let checkDate = new Date(uniqueDays[0]);

    for (let day of uniqueDays) {
      const d = new Date(day);
      const diff = Math.floor((checkDate - d) / (1000 * 60 * 60 * 24));
      
      if (diff === 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  };

  const getMoodStats = () => {
    const activeNotes = getActiveNotes();
    const moods = ['😌', '✨', '🦅', '🕯️', '🌊'];
    const moodNames = ['Sérénité', 'Productivité', 'Élan', 'Réflexion', 'Flot'];
    const counts = moods.map(m => activeNotes.filter(n => n.mood === m).length);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return moods.map((m, i) => ({
      emoji: m, name: moodNames[i],
      pct: Math.round((counts[i] / total) * 100) + '%',
      count: counts[i],
    })).sort((a, b) => b.count - a.count);
  };

  const initWithPin = async (pin) => {
    try {
      const key = await initEncryption(pin);
      if (!key) return false;
      setEncryptionKey(key);
      setEncryptionReady(true);
      await reloadNotesWithKey(key);
      return true;
    } catch (e) { return false; }
  };

  const reEncryptNotes = async (newPin) => {
    try {
      const newKey = await initEncryption(newPin);
      if (!newKey || !encryptionKey) return false;
      
      const reEncryptedNotes = reEncryptAllNotes(notes, encryptionKey, newKey);
      const reEncryptedTrash = reEncryptAllNotes(trash, encryptionKey, newKey);
      
      setEncryptionKey(newKey);
      await saveNotes(reEncryptedNotes);
      await saveTrash(reEncryptedTrash);
      
      return true;
    } catch (e) { console.error("Re-encryption error:", e); return false; }
  };

  const reloadNotesWithKey = async (key) => {
    try {
      const data = await AsyncStorage.getItem('notes');
      const tData = await AsyncStorage.getItem('trash');
      if (data) {
        const stored = JSON.parse(data);
        setNotes(decryptAllNotes(stored, key));
      }
      if (tData) {
        const tStored = JSON.parse(tData);
        setTrash(decryptAllNotes(tStored, key));
      }
    } catch (e) { console.error(e); }
  };

  const loadNotes = async () => {
    try {
      const data  = await AsyncStorage.getItem('notes');
      const tData = await AsyncStorage.getItem('trash');
      
      if (data) setNotes(JSON.parse(data));
      if (tData) setTrash(JSON.parse(tData));

      if (encryptionKey) {
        if (data) setNotes(decryptAllNotes(JSON.parse(data), encryptionKey));
        if (tData) setTrash(decryptAllNotes(JSON.parse(tData), encryptionKey));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveNotes = async (newNotes) => {
    try {
      const toStore = encryptionKey ? encryptAllNotes(newNotes, encryptionKey) : newNotes;
      await AsyncStorage.setItem('notes', JSON.stringify(toStore));
      setNotes(newNotes);
    } catch (e) { console.error(e); }
  };

  const saveTrash = async (newTrash) => {
    try {
      const toStore = encryptionKey ? encryptAllNotes(newTrash, encryptionKey) : newTrash;
      await AsyncStorage.setItem('trash', JSON.stringify(toStore));
      setTrash(newTrash);
    } catch (e) { console.error(e); }
  };

  const activateDecoyMode  = () => setIsDecoy(true);
  const deactivateDecoyMode = () => setIsDecoy(false);
  const getActiveNotes = () => isDecoy ? DECOY_NOTES : notes;

  const addNote = async ({ titre, contenu, mood, ambiance, location: manualLocation, capsule, media = [], bgImage = null }) => {
    if (isDecoy) return null;

    let finalLocation = manualLocation || 'LOMÉ, TG';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const reverse = await Location.reverseGeocodeAsync(loc.coords);
        if (reverse[0]) {
          const { city, isoCountryCode } = reverse[0];
          finalLocation = `${city?.toUpperCase() || 'LOMÉ'}, ${isoCountryCode || 'TG'}`;
        }
      }
    } catch (e) {
      console.warn("Location error:", e);
    }

    const newNote = {
      id: Date.now().toString(),
      titre: titre || 'Sans titre',
      contenu, mood, ambiance,
      location: finalLocation,
      date: new Date().toISOString(),
      pinned: false, capsule,
      media, bgImage,
      wordCount: contenu.trim() === '' ? 0 : contenu.trim().split(/\s+/).length,
    };
    
    if (capsule) {
      await scheduleCapsuleNotification(new Date(capsule), titre || 'Une pensée scellée');
    }
    
    await saveNotes([newNote, ...notes]);
    return newNote;
  };

  const updateNote = async (id, changes) => {
    if (isDecoy) return;
    await saveNotes(notes.map(n => n.id === id ? { ...n, ...changes } : n));
  };

  const deleteNote = async (id) => {
    if (isDecoy) return;
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const deletedNote = { ...note, deletedAt: new Date().toISOString() };
    await saveTrash([deletedNote, ...trash]);
    await saveNotes(notes.filter(n => n.id !== id));
  };

  const restoreNote = async (id) => {
    const note = trash.find(n => n.id === id);
    if (!note) return;
    const { deletedAt, ...restored } = note;
    await saveNotes([restored, ...notes]);
    await saveTrash(trash.filter(n => n.id !== id));
  };

  const restoreSelected = async (ids) => {
    const toRestore = trash.filter(n => ids.includes(n.id));
    const cleaned = toRestore.map(({ deletedAt, ...note }) => note);
    await saveNotes([...cleaned, ...notes]);
    await saveTrash(trash.filter(n => !ids.includes(n.id)));
  };

  const deleteForever = async (id) => {
    await saveTrash(trash.filter(n => n.id !== id));
  };

  const deleteSelectedForever = async (ids) => {
    await saveTrash(trash.filter(n => !ids.includes(n.id)));
  };

  const emptyTrash = async () => {
    await saveTrash([]);
  };

  const togglePin = async (id) => {
    if (isDecoy) return;
    await saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const sealCapsule = async (id, date) => {
    if (isDecoy) return;
    await saveNotes(notes.map(n => n.id === id ? { ...n, capsule: date } : n));
  };

  const unsealCapsule = async (ids) => {
    if (isDecoy) return;
    const idArray = Array.isArray(ids) ? ids : [ids];
    await saveNotes(notes.map(n =>
      idArray.includes(n.id) ? { ...n, capsule: null } : n
    ));
  };

  const getTotalWords = () => getActiveNotes().reduce((sum, n) => sum + (n.wordCount || 0), 0);

  const getVisibleNotes = () => {
    const active = getActiveNotes();
    if (isDecoy) return active;
    const now = new Date();
    return active.filter(n => !n.capsule || new Date(n.capsule) <= now);
  };

  const getSealedNotes = () => {
    if (isDecoy) return [];
    const now = new Date();
    return notes.filter(n => n.capsule && new Date(n.capsule) > now);
  };

  const getTimeUntilOpen = (capsuleDate) => {
    const diff = new Date(capsuleDate) - new Date();
    if (diff <= 0) return 'Prête à ouvrir';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 365) return `${Math.floor(days / 365)} an(s)`;
    if (days > 30)  return `${Math.floor(days / 30)} mois`;
    if (days > 0)   return `${days} jour(s)`;
    return `${Math.floor((diff % (1000*60*60*24)) / (1000*60*60))}h`;
  };

  const filterByCity = (city) => {
    setCityFilter(city);
  };

  const groupNotesByDate = () => {
    const visible = getVisibleNotes();
    let filtered = visible;
    if (cityFilter) {
      filtered = visible.filter(n => n.location?.toLowerCase().includes(cityFilter.toLowerCase()));
    }

    const pinned   = filtered.filter(n => n.pinned);
    const unpinned = filtered.filter(n => !n.pinned);
    
    const groups = {};
    if (pinned.length > 0) {
      groups['ÉPINGLÉES'] = pinned;
    }

    unpinned.forEach(note => {
      const d = new Date(note.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let label;
      if (d.toDateString() === today.toDateString())     label = "AUJOURD'HUI";
      else if (d.toDateString() === yesterday.toDateString()) label = 'HIER';
      else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }).toUpperCase();
      if (!groups[label]) groups[label] = [];
      groups[label].push(note);
    });
    return groups;
  };

  const formatDate = (isoDate) => new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).toUpperCase();

  const formatTime = (isoDate) => new Date(isoDate).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <NotesContext.Provider value={{
      notes, trash, loading, isDecoy, encryptionKey, encryptionReady,
      addNote, updateNote, deleteNote, restoreNote, restoreSelected, deleteForever, deleteSelectedForever, emptyTrash,
      togglePin, sealCapsule, unsealCapsule, saveNotes,
      getMoodStats, getTotalWords,
      getVisibleNotes, groupNotesByDate,
      getSealedNotes, getTimeUntilOpen,
      formatDate, formatTime,
      activateDecoyMode, deactivateDecoyMode, getActiveNotes,
      initWithPin, reEncryptNotes,
      cityFilter, filterByCity,
      streak,
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);