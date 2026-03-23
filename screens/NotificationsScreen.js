import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { scheduleDaily, cancelNotifications, loadNotifSettings, requestPermissions } from '../utils/notifications';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const QUICK_TIMES = [
  { label: 'Matin', sublabel: '08:00', hour: 8, minute: 0, icon: '🌅' },
  { label: 'Midi', sublabel: '12:00', hour: 12, minute: 0, icon: '☀️' },
  { label: 'Soir', sublabel: '20:00', hour: 20, minute: 0, icon: '🌆' },
  { label: 'Nuit', sublabel: '22:00', hour: 22, minute: 0, icon: '🌙' },
];

export default function NotificationsScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    loadNotifSettings().then(settings => {
      setEnabled(settings.enabled);
      setHour(settings.hour);
      setMinute(settings.minute);
    });
  }, []);

  const handleToggle = async (val) => {
    if (val) {
      const granted = await requestPermissions();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
    }
    setEnabled(val);
    if (!val) await cancelNotifications();
  };

  const handleSave = async (h, m) => {
    setSaving(true);
    setHour(h);
    setMinute(m);
    const result = await scheduleDaily(h, m);
    setSaving(false);
    if (result.success) {
      setEnabled(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else if (result.reason === 'permission') {
      setPermissionDenied(true);
    }
  };

  const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.text2 }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accent.primary }]}>Rappels</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Toggle principal */}
        <View style={[styles.mainCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={styles.mainCardLeft}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔔</Text>
            <Text style={[styles.mainCardTitle, { color: theme.text }]}>Rappels d'écriture</Text>
            <Text style={[styles.mainCardDesc, { color: theme.text3 }]}>
              {enabled
                ? `Rappel actif à ${formatTime(hour, minute)} chaque jour`
                : 'Activez pour ne jamais oublier d\'écrire'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: theme.bg5, true: accent.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Alerte permission */}
        {permissionDenied && (
          <View style={[styles.alertCard, { backgroundColor: 'rgba(229,85,85,0.1)', borderColor: 'rgba(229,85,85,0.3)' }]}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={[styles.alertText, { color: '#e55' }]}>
              Autorisez les notifications dans les paramètres de votre téléphone pour activer les rappels.
            </Text>
          </View>
        )}

        {/* Message succès */}
        {saved && (
          <View style={[styles.alertCard, { backgroundColor: accent.light, borderColor: accent.primary + '40' }]}>
            <Text style={{ fontSize: 16 }}>✅</Text>
            <Text style={[styles.alertText, { color: accent.primary }]}>
              Rappel programmé à {formatTime(hour, minute)} chaque jour !
            </Text>
          </View>
        )}

        {/* Horaires rapides */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>HORAIRES RAPIDES</Text>
        <View style={styles.quickGrid}>
          {QUICK_TIMES.map((qt) => (
            <TouchableOpacity
              key={qt.label}
              style={[styles.quickCard,
                { backgroundColor: theme.bg3, borderColor: theme.border },
                hour === qt.hour && minute === qt.minute && enabled && {
                  borderColor: accent.primary, backgroundColor: accent.light
                }
              ]}
              onPress={() => handleSave(qt.hour, qt.minute)}
            >
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{qt.icon}</Text>
              <Text style={[styles.quickLabel, { color: theme.text }]}>{qt.label}</Text>
              <Text style={[styles.quickSublabel, { color: theme.text3 }]}>{qt.sublabel}</Text>
              {hour === qt.hour && minute === qt.minute && enabled && (
                <View style={[styles.activeDot, { backgroundColor: accent.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Heure personnalisée */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>HEURE PERSONNALISÉE</Text>
        <View style={[styles.customCard, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <Text style={[styles.customLabel, { color: theme.text3 }]}>CHOISIR L'HEURE</Text>
          <View style={styles.hourGrid}>
            {HOURS.map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.hourBtn,
                  { backgroundColor: theme.bg4 },
                  hour === h && { backgroundColor: accent.primary }
                ]}
                onPress={() => setHour(h)}
              >
                <Text style={[styles.hourText,
                  { color: theme.text2 },
                  hour === h && { color: theme.bg, fontWeight: '600' }
                ]}>
                  {String(h).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.minuteRow}>
            {[0, 15, 30, 45].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.minuteBtn,
                  { backgroundColor: theme.bg4, borderColor: theme.border },
                  minute === m && { backgroundColor: accent.primary, borderColor: accent.primary }
                ]}
                onPress={() => setMinute(m)}
              >
                <Text style={[styles.minuteText,
                  { color: theme.text2 },
                  minute === m && { color: theme.bg }
                ]}>
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? theme.bg4 : accent.primary }]}
            onPress={() => handleSave(hour, minute)}
            disabled={saving}
          >
            <Text style={[styles.saveBtnText, { color: saving ? theme.text3 : theme.bg }]}>
              {saving ? 'Programmation...' : `Programmer à ${formatTime(hour, minute)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Désactiver */}
        {enabled && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.text3 }]}>GESTION</Text>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.bg3, borderColor: theme.border }]}
              onPress={async () => {
                await cancelNotifications();
                setEnabled(false);
              }}
            >
              <Text style={{ fontSize: 16 }}>🔕</Text>
              <Text style={[styles.cancelBtnText, { color: '#e55' }]}>Désactiver tous les rappels</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backText: { fontSize: 14, width: 60 },
  headerTitle: { fontSize: 18, fontWeight: '500' },
  mainCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 20, padding: 20, borderRadius: 18, borderWidth: 1 },
  mainCardLeft: { flex: 1 },
  mainCardTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  mainCardDesc: { fontSize: 12, lineHeight: 18 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  alertText: { fontSize: 13, flex: 1, lineHeight: 18 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 10, marginBottom: 8 },
  quickCard: { width: '47%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', position: 'relative' },
  quickLabel: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  quickSublabel: { fontSize: 12 },
  activeDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  customCard: { marginHorizontal: 20, marginBottom: 14, padding: 18, borderRadius: 18, borderWidth: 1 },
  customLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 14 },
  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  hourBtn: { width: 42, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hourText: { fontSize: 13 },
  minuteRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  minuteBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  minuteText: { fontSize: 14 },
  saveBtn: { padding: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '500' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  cancelBtnText: { fontSize: 14 },
});