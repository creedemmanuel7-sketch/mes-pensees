import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MESSAGES = [
  { title: 'Mes Pensées ✨', body: 'Votre sanctuaire vous attend. Qu\'avez-vous ressenti aujourd\'hui ?' },
  { title: 'Un moment pour vous 🕯️', body: 'Prenez quelques minutes pour écrire vos pensées du jour.' },
  { title: 'Votre journal vous manque 📖', body: 'Il est temps de capturer ce moment avant qu\'il ne s\'envole.' },
  { title: 'Mes Pensées 🌙', body: 'La nuit est propice à la réflexion. Écrivez ce que vous ressentez.' },
  { title: 'Un instant d\'introspection 💭', body: 'Quelques mots suffisent pour garder trace de votre journée.' },
  { title: 'Votre vérité vous attend 🔐', body: 'Ouvrez votre sanctuaire et libérez vos pensées.' },
];

export const requestPermissions = async () => {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleDaily = async (hour, minute) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const granted = await requestPermissions();
    if (!granted) return { success: false, reason: 'permission' };

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    await AsyncStorage.setItem('notif_hour', hour.toString());
    await AsyncStorage.setItem('notif_minute', minute.toString());
    await AsyncStorage.setItem('notif_enabled', 'true');

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
};

export const cancelNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('notif_enabled', 'false');
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
};

export const scheduleCapsuleNotification = async (date, title) => {
  try {
    const granted = await requestPermissions();
    if (!granted) return { success: false };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Capsule Temporelle ⏳',
        body: `Une de vos pensées scellée ("${title}") est maintenant prête à être lue.`,
        sound: true,
      },
      trigger: {
        date,
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
};

export const loadNotifSettings = async () => {
  try {
    const hour    = await AsyncStorage.getItem('notif_hour');
    const minute  = await AsyncStorage.getItem('notif_minute');
    const enabled = await AsyncStorage.getItem('notif_enabled');
    return {
      hour: hour ? parseInt(hour) : 20,
      minute: minute ? parseInt(minute) : 0,
      enabled: enabled === 'true',
    };
  } catch (e) {
    return { hour: 20, minute: 0, enabled: false };
  }
};