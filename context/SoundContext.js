import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';


const SoundContext = createContext();

const AMBIANCES = {
  PLUIE: require('../assets/sounds/pluie.mp3'),
  FORÊT: require('../assets/sounds/foret.mp3'),
  CAFÉ:  require('../assets/sounds/cafe.mp3'),
  FEU:   require('../assets/sounds/feu.mp3'),
  SILENCE: null,
};

export function SoundProvider({ children }) {
  const soundRef = useRef(null);
  const [currentAmbiance, setCurrentAmbiance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => { stopSound(); };
  }, []);

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (e) {
      console.error(e);
    }
  };

  const playAmbiance = async (name) => {
  try {
    await stopSound();
    if (!name || name === 'SILENCE' || !AMBIANCES[name]) {
      setCurrentAmbiance('SILENCE');
      setIsPlaying(false);
      return;
    }

    setCurrentAmbiance(name);
    const { sound } = await Audio.Sound.createAsync(
      AMBIANCES[name],
      { shouldPlay: true, isLooping: true, volume }
    );
    soundRef.current = sound;
    setIsPlaying(true);
  } catch (e) {
    console.error('Erreur audio:', e);
    setIsPlaying(false);
  }
};
  const changeVolume = async (newVolume) => {
    setVolume(newVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  return (
    <SoundContext.Provider value={{
      currentAmbiance, isPlaying, volume,
      playAmbiance, stopSound, changeVolume,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);