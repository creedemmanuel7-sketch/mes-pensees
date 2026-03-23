import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_STORAGE = 'encryption_key';

export const generateKey = (pin) => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: 5000,
  });
  return { key: key.toString(), salt: salt.toString() };
};

export const saveEncryptionKey = async (pin) => {
  try {
    const { key, salt } = generateKey(pin);
    await AsyncStorage.setItem(KEY_STORAGE, JSON.stringify({ key, salt }));
    return key;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const loadEncryptionKey = async (pin) => {
  try {
    const stored = await AsyncStorage.getItem(KEY_STORAGE);
    if (!stored) return null;
    const { key, salt } = JSON.parse(stored);
    const derived = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
      keySize: 256 / 32,
      iterations: 5000,
    });
    return derived.toString() === key ? key : null;
  } catch (e) {
    return null;
  }
};

export const encryptNote = (note, key) => {
  try {
    if (!key || !note) return note;
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(note),
      key
    ).toString();
    return { encrypted: true, data: encrypted, id: note.id, date: note.date };
  } catch (e) {
    console.error(e);
    return note;
  }
};

export const decryptNote = (encryptedNote, key) => {
  try {
    if (!encryptedNote?.encrypted || !key) return encryptedNote;
    const bytes = CryptoJS.AES.decrypt(encryptedNote.data, key);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decrypted;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const encryptAllNotes = (notes, key) => {
  if (!key) return notes;
  return notes.map(note => encryptNote(note, key));
};

export const decryptAllNotes = (notes, key) => {
  if (!key) return notes;
  return notes.map(note => {
    if (note?.encrypted) return decryptNote(note, key);
    return note;
  }).filter(Boolean);
};

export const reEncryptAllNotes = (notes, oldKey, newKey) => {
  if (!oldKey || !newKey) return notes;
  const decrypted = decryptAllNotes(notes, oldKey);
  return encryptAllNotes(decrypted, newKey);
};

export const initEncryption = async (pin) => {
  try {
    const stored = await AsyncStorage.getItem(KEY_STORAGE);
    if (!stored) {
      const key = await saveEncryptionKey(pin);
      return key;
    }
    return await loadEncryptionKey(pin);
  } catch (e) {
    return null;
  }
};