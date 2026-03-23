import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Modal, TouchableWithoutFeedback, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, CormorantGaramond_300Italic } from '@expo-google-fonts/cormorant-garamond';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { exportToPDF, exportToTXT } from '../utils/exportPDF';


export default function CoffreScreen({ navigation }) {
  const { theme, accent } = useTheme();
  const [fontsLoaded] = useFonts({ CormorantGaramond_300Italic });
  const { notes, saveNotes, emptyTrash } = useNotes();
  const {
    savePin, saveDecoyPin, toggleAutoDestruct, autoDestructEnabled,
    incognitoMode, intrusionAlert, intrusionPhotos, clearIntrusionPhotos,
    toggleIncognito, toggleIntrusionAlert, biometricAvailable,
  } = useAuth();

  const { autoLockMinutes, AUTO_LOCK_OPTIONS, setAutoLock } = useAuth();
  const [biometrie, setBiometrie] = useState(biometricAvailable);
  const [leurre, setLeurre] = useState(false);
  const [showAutoDestruct, setShowAutoDestruct] = useState(false);
  const [showChangePIN, setShowChangePIN] = useState(false);
  const [showLeurreConfig, setShowLeurreConfig] = useState(false);
  const [showDecoyPinModal, setShowDecoyPinModal] = useState(false);
  const [autoDestructConfirm, setAutoDestructConfirm] = useState('');
  const [autoDestructDone, setAutoDestructDone] = useState(autoDestructEnabled);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChanged, setPinChanged] = useState(false);
  const [decoyPinInput, setDecoyPinInput] = useState('');
  const [decoyPinConfirm, setDecoyPinConfirm] = useState('');
  const [decoyPinSaved, setDecoyPinSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [oldPinInput, setOldPinInput] = useState('');
  const [showIntrusionGallery, setShowIntrusionGallery] = useState(false);

  const confirmAutoDestruct = async () => {
    if (autoDestructConfirm === 'SUPPRIMER') {
      await toggleAutoDestruct(true);
      setAutoDestructDone(true);
      setShowAutoDestruct(false);
      setAutoDestructConfirm('');
    }
  };

  const { pin } = useAuth();
  const saveNewPin = async () => {
    if (oldPinInput !== pin) {
      Alert.alert('Erreur', 'L\'ancien code PIN est incorrect.');
      return;
    }
    if (newPin.length === 4 && newPin === confirmPin) {
      await savePin(newPin);
      setPinChanged(true);
      setShowChangePIN(false);
      setNewPin('');
      setConfirmPin('');
      setOldPinInput('');
    }
  };

  const saveNewDecoyPin = async () => {
    if (decoyPinInput.length === 4 && decoyPinInput === decoyPinConfirm) {
      await saveDecoyPin(decoyPinInput);
      setDecoyPinSaved(true);
      setShowDecoyPinModal(false);
      setDecoyPinInput('');
      setDecoyPinConfirm('');
    }
  };

  const SectionLabel = ({ children }) => (
    <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{children}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg2 }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Drawer')}>
          <Text style={[styles.menuIcon, { color: theme.text2 }]}>☰</Text>
        </TouchableOpacity>
        <Text style={fontsLoaded
          ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 22, color: accent.primary }
          : { fontSize: 22, color: accent.primary, fontStyle: 'italic' }}>
          Mes Pensées
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Personnalisation')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Titre */}
        <View style={styles.coffreHeader}>
          <View style={[styles.coffreIconWrap, { backgroundColor: accent.light, borderColor: accent.teal + '50' }]}>
            <Text style={{ fontSize: 26 }}>🔐</Text>
          </View>
          <Text style={fontsLoaded
            ? { fontFamily: 'CormorantGaramond_300Italic', fontSize: 32, color: accent.primary, fontWeight: '300' }
            : { fontSize: 32, color: accent.primary, fontStyle: 'italic' }}>
            Le Coffre
          </Text>
          <Text style={[styles.coffreSub, { color: theme.text3 }]}>CRYPTAGE MILITAIRE ACTIF</Text>
        </View>

        {/* Accès & Biométrie */}
        <SectionLabel>ACCÈS & BIOMÉTRIE</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <Text style={styles.settingIcon}>🫆</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Biométrie active</Text>
              <Text style={[styles.settingDesc, { color: theme.text3 }]}>
                {biometricAvailable ? 'Disponible sur cet appareil' : 'Non disponible sur cet appareil'}
              </Text>
            </View>
            <Switch
              value={biometrie}
              onValueChange={setBiometrie}
              trackColor={{ false: theme.bg5, true: accent.primary }}
              thumbColor="#fff"
              disabled={!biometricAvailable}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <Text style={styles.settingIcon}>🙈</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Mode Incognito</Text>
              <Text style={[styles.settingDesc, { color: theme.text3 }]}>
                {incognitoMode ? 'Actif — verrouillage en arrière-plan' : "Masque l'aperçu multitâche"}
              </Text>
            </View>
            <Switch
              value={incognitoMode}
              onValueChange={toggleIncognito}
              trackColor={{ false: theme.bg5, true: accent.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingIcon}>📷</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Alerte d'Intrusion</Text>
              <Text style={[styles.settingDesc, { color: theme.text3 }]}>
                {intrusionPhotos.length > 0
                  ? `${intrusionPhotos.length} tentative(s) enregistrée(s)`
                  : 'Journal des tentatives échouées'}
              </Text>
            </View>
            <Switch
              value={intrusionAlert}
              onValueChange={toggleIntrusionAlert}
              trackColor={{ false: theme.bg5, true: accent.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Intrusion log */}
        {intrusionPhotos.length > 0 && (
          <>
            <SectionLabel>JOURNAL D'INTRUSION</SectionLabel>
            <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
              {intrusionPhotos.slice(0, 3).map((log, i) => (
                <View key={log.id} style={[styles.settingRow,
                  { borderBottomColor: theme.border },
                  i === Math.min(intrusionPhotos.length, 3) - 1 && !log.photo && { borderBottomWidth: 0 }
                ]}>
                  <Text style={styles.settingIcon}>⚠️</Text>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingName, { color: theme.text }]}>Tentative échouée</Text>
                    <Text style={[styles.settingDesc, { color: theme.text3 }]}>
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  {log.photo && <Text style={{ fontSize: 18 }}>📸</Text>}
                </View>
              ))}
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border }}>
                <TouchableOpacity style={[styles.configLeurreBtn, { flex: 1 }]} onPress={() => setShowIntrusionGallery(true)}>
                  <Text style={[styles.configLeurreText, { color: accent.primary }]}>
                    Voir tout
                  </Text>
                </TouchableOpacity>
                <View style={{ width: 1, backgroundColor: theme.border }} />
                <TouchableOpacity style={[styles.configLeurreBtn, { flex: 1 }]} onPress={clearIntrusionPhotos}>
                  <Text style={[styles.configLeurreText, { color: '#e55', opacity: 0.8 }]}>
                    Vider l'historique
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Decoy Mode */}
        <SectionLabel>LE FAUX CODE PIN (DECOY MODE)</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <Text style={styles.settingIcon}>🎭</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Mode Leurre Actif</Text>
              <Text style={[styles.settingDesc, { color: theme.text3 }]}>
                {decoyPinSaved ? '✓ Code leurre configuré' : 'Code PIN secondaire → journal fictif'}
              </Text>
            </View>
            <Switch
              value={leurre}
              onValueChange={(val) => {
                setLeurre(val);
                if (val) setShowDecoyPinModal(true);
                else saveDecoyPin('');
              }}
              trackColor={{ false: theme.bg5, true: accent.primary }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={styles.configLeurreBtn} onPress={() => setShowLeurreConfig(true)}>
            <Text style={[styles.configLeurreText, { color: accent.primary }]}>
              Configurer le contenu du leurre
            </Text>
          </TouchableOpacity>
        </View>

        {/* Codes sécurité */}
        <SectionLabel>CODES DE SÉCURITÉ</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => setShowChangePIN(true)}>
            <Text style={styles.settingIcon}>⌨️</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Changer le PIN de secours</Text>
              {pinChanged && <Text style={[styles.settingSuccess, { color: accent.teal }]}>✓ PIN mis à jour</Text>}
            </View>
            <Text style={[styles.chevron, { color: theme.text3 }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Recovery')}>
            <Text style={styles.settingIcon}>🔑</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>Mots-clés de récupération</Text>
              <Text style={[styles.settingDesc, { color: theme.text3 }]}>Pour réinitialiser le PIN en cas d'oubli</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.text3 }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Verrouillage Automatique */}
        <SectionLabel>VERROUILLAGE AUTOMATIQUE</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          {AUTO_LOCK_OPTIONS.map((min, i) => (
            <TouchableOpacity
              key={min}
              style={[styles.settingRow,
                { borderBottomColor: theme.border },
                i === AUTO_LOCK_OPTIONS.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => setAutoLock(min)}
            >
              <Text style={styles.settingIcon}>⏱️</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingName, { color: theme.text }]}>
                  {min === 1 ? '1 minute' : `${min} minutes`}
                </Text>
              </View>
              {autoLockMinutes === min && (
                <Text style={[{ color: accent.primary, fontSize: 18 }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone critique */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerTitle}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={styles.dangerTitleText}>ZONE CRITIQUE</Text>
          </View>
          {autoDestructDone ? (
            <View style={styles.destructDoneWrap}>
              <Text style={[styles.destructDoneText, { color: accent.teal }]}>✓ Auto-destruction activée</Text>
              <Text style={[styles.destructDoneDesc, { color: theme.text2 }]}>
                Toutes les données seront effacées après 3 tentatives erronées.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.dangerDesc, { color: theme.text2 }]}>
                L'option <Text style={[styles.dangerBold, { color: theme.text }]}>Auto-destruction</Text> effacera
                définitivement toutes vos pensées après 3 tentatives de PIN erronées. Cette action est irréversible.
              </Text>
              <TouchableOpacity
                style={[styles.autoDestructBtn, { backgroundColor: accent.light, marginBottom: 12 }]}
                onPress={() => setShowAutoDestruct(true)}>
                <Text style={[styles.autoDestructText, { color: accent.primary }]}>Option Auto-destruction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.autoDestructBtn, { backgroundColor: 'rgba(229,85,85,0.1)' }]}
                onPress={() => {
                  Alert.alert(
                    "Réinitialisation Totale",
                    "Cela supprimera TOUTES vos données (Notes, Photos d'intrusions, PIN). Cette action est irréversible. Voulez-vous continuer ?",
                    [
                      { text: "Annuler", style: "cancel" },
                      { 
                        text: "TOUT EFFACER", 
                        style: "destructive",
                        onPress: async () => {
                          await AsyncStorage.clear();
                          alert("Application remise à zéro. Veuillez redémarrer l'application.");
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={[styles.autoDestructText, { color: '#e55' }]}>RÉINITIALISER L'APPLICATION</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Gestion données */}
        <SectionLabel>GESTION DES DONNÉES</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={async () => {
              setExporting(true);
              await exportToTXT(notes);
              setExporting(false);
            }}
          >
            <Text style={styles.settingIcon}>📄</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>
                {exporting ? 'Export en cours...' : 'Tout Exporter (Texte brut)'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={async () => {
              setExporting(true);
              await exportToPDF(notes, accent.primary);
              setExporting(false);
            }}
          >
            <Text style={styles.settingIcon}>📖</Text>
            <View style={styles.settingText}>
              <Text style={[styles.settingName, { color: theme.text }]}>
                {exporting ? 'Génération en cours...' : 'Générer un Livre de Vie (PDF)'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.text3 }]}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      {/* Footer permanent */}
        <View style={styles.coffreFooter}>
          <Text style={[styles.footerLabel, { color: theme.text3 }]}>PROTÉGÉ PAR LE PROTOCOLE</Text>
          <View style={styles.footerNames}>
            <Text style={[styles.footerName, { color: theme.text3 }]}>Aurore</Text>
            <View style={[styles.footerLine, { backgroundColor: theme.text3 }]} />
            <Text style={[styles.footerName, { color: theme.text3 }]}>Midnight</Text>
          </View>
        </View>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.bg2, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Timeline')}>
          <Text style={[styles.navIcon, { opacity: 0.4 }]}>📖</Text>
          <Text style={[styles.navLabel, { color: theme.text3 }]}>JOURNAL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Stats')}>
          <Text style={[styles.navIcon, { opacity: 0.4 }]}>📈</Text>
          <Text style={[styles.navLabel, { color: theme.text3 }]}>STATS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Coffre')}>
          <Text style={styles.navIconActive}>🔐</Text>
          <Text style={[styles.navLabelActive, { color: accent.primary }]}>COFFRE</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Auto-destruction */}
      <Modal visible={showAutoDestruct} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAutoDestruct(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={styles.modalIcon}>⚠️</Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Confirmer l'Auto-destruction</Text>
                <Text style={[styles.modalDesc, { color: theme.text2 }]}>
                  Tapez <Text style={{ color: '#e55', fontWeight: '600' }}>SUPPRIMER</Text> pour confirmer.
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border }]}
                  placeholder="SUPPRIMER"
                  placeholderTextColor={theme.text4}
                  value={autoDestructConfirm}
                  onChangeText={setAutoDestructConfirm}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, autoDestructConfirm !== 'SUPPRIMER' && { opacity: 0.4 }]}
                  onPress={confirmAutoDestruct}>
                  <Text style={styles.modalConfirmText}>Activer l'Auto-destruction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAutoDestruct(false)}>
                  <Text style={[styles.modalCancelText, { color: theme.text2 }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Changer PIN */}
      <Modal visible={showChangePIN} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowChangePIN(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: theme.bg3, borderColor: theme.border, paddingBottom: 32 }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Changer le PIN</Text>
                <Text style={[styles.modalDesc, { color: theme.text2 }]}>Veuillez confirmer votre identité.</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                  placeholder="Ancien PIN"
                  placeholderTextColor={theme.text4}
                  value={oldPinInput}
                  onChangeText={t => setOldPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric" secureTextEntry maxLength={4}
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border }]}
                  placeholder="Nouveau PIN"
                  placeholderTextColor={theme.text4}
                  value={newPin}
                  onChangeText={t => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric" secureTextEntry maxLength={4}
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
                  placeholder="Confirmer le PIN"
                  placeholderTextColor={theme.text4}
                  value={confirmPin}
                  onChangeText={t => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric" secureTextEntry maxLength={4}
                />
                {confirmPin.length === 4 && newPin !== confirmPin && (
                  <Text style={styles.pinError}>Les codes ne correspondent pas</Text>
                )}
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: accent.primary, marginTop: 16 },
                    (newPin.length < 4 || newPin !== confirmPin) && { opacity: 0.4 }]}
                  onPress={saveNewPin}>
                  <Text style={[styles.modalConfirmText, { color: theme.bg }]}>Enregistrer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowChangePIN(false)}>
                  <Text style={[styles.modalCancelText, { color: theme.text2 }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Decoy PIN */}
      <Modal visible={showDecoyPinModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowDecoyPinModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: theme.bg3, borderColor: theme.border, paddingBottom: 32 }]}>
                <Text style={styles.modalIcon}>🎭</Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Code PIN Leurre</Text>
                <Text style={[styles.modalDesc, { color: theme.text2 }]}>
                  Ce code ouvrira un journal fictif à la place de vos vraies pensées.
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border }]}
                  placeholder="Code leurre (4 chiffres)"
                  placeholderTextColor={theme.text4}
                  value={decoyPinInput}
                  onChangeText={t => setDecoyPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric" secureTextEntry maxLength={4}
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.bg4, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
                  placeholder="Confirmer le code leurre"
                  placeholderTextColor={theme.text4}
                  value={decoyPinConfirm}
                  onChangeText={t => setDecoyPinConfirm(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric" secureTextEntry maxLength={4}
                />
                {decoyPinConfirm.length === 4 && decoyPinInput !== decoyPinConfirm && (
                  <Text style={styles.pinError}>Les codes ne correspondent pas</Text>
                )}
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: accent.primary, marginTop: 16 },
                    (decoyPinInput.length < 4 || decoyPinInput !== decoyPinConfirm) && { opacity: 0.4 }]}
                  onPress={saveNewDecoyPin}>
                  <Text style={[styles.modalConfirmText, { color: theme.bg }]}>Activer le Mode Leurre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => {
                  setShowDecoyPinModal(false);
                  setLeurre(false);
                }}>
                  <Text style={[styles.modalCancelText, { color: theme.text2 }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Leurre Config */}
      <Modal visible={showLeurreConfig} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowLeurreConfig(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Contenu du Journal Leurre</Text>
                <Text style={[styles.modalDesc, { color: theme.text2 }]}>
                  Ces notes fictives s'afficheront quand le faux PIN est saisi.
                </Text>
                <View style={[styles.leurrePreview, { backgroundColor: theme.bg4 }]}>
                  {['📝 Liste de courses du 12 octobre', '📝 Idées pour le jardin', '📝 Recette de tarte aux pommes'].map(n => (
                    <Text key={n} style={[styles.leurreNote, { color: theme.text2 }]}>{n}</Text>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: accent.primary }]}
                  onPress={() => setShowLeurreConfig(false)}>
                  <Text style={[styles.modalConfirmText, { color: theme.bg }]}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Historique Intrusion */}
      <Modal visible={showIntrusionGallery} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowIntrusionGallery(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: theme.bg3, borderColor: theme.border, width: '90%', height: '80%' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Historique d'Intrusion</Text>
                <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
                  {intrusionPhotos.map(log => (
                    <View key={log.id} style={[styles.logCard, { backgroundColor: theme.bg4, borderColor: theme.border }]}>
                      <View style={styles.logHeader}>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Tentative échouée</Text>
                        <Text style={{ color: theme.text3, fontSize: 11 }}>
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </Text>
                      </View>
                      {log.photo && (
                        <View style={styles.logPhotoWrap}>
                           <Text style={{ color: theme.text3, fontStyle: 'italic', fontSize: 12 }}>📸 Photo capturée</Text>
                           {/* Ici on pourrait afficher l'image avec un composant Image, 
                           mais comme c'est local on peut afficher le chemin pour l'instant */}
                        </View>
                      )}
                    </View>
                  ))}
                  {intrusionPhotos.length === 0 && <Text style={{ textAlign: 'center', color: theme.text4 }}>Aucun log disponible.</Text>}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: accent.primary }]}
                  onPress={() => setShowIntrusionGallery(false)}>
                  <Text style={[styles.modalConfirmText, { color: theme.bg }]}>Fermer</Text>
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
  settingsIcon: { fontSize: 18, width: 28, textAlign: 'right' },
  coffreHeader: { alignItems: 'center', paddingVertical: 20 },
  coffreIconWrap: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  coffreSub: { fontSize: 9, letterSpacing: 2, marginTop: 4 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  group: { marginHorizontal: 20, marginBottom: 14, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  settingIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingText: { flex: 1 },
  settingName: { fontSize: 14 },
  settingDesc: { fontSize: 11, marginTop: 2 },
  settingSuccess: { fontSize: 11, marginTop: 2 },
  chevron: { fontSize: 18 },
  configLeurreBtn: { padding: 14, alignItems: 'center' },
  configLeurreText: { fontSize: 12, fontWeight: '500' },
  dangerZone: { marginHorizontal: 20, marginBottom: 14, backgroundColor: 'rgba(200,50,50,0.07)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(200,50,50,0.2)' },
  dangerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dangerTitleText: { fontSize: 12, letterSpacing: 1.5, color: '#e55', fontWeight: '500' },
  dangerDesc: { fontSize: 12, lineHeight: 20, marginBottom: 16 },
  dangerBold: { fontWeight: '600' },
  autoDestructBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  autoDestructText: { fontSize: 14 },
  destructDoneWrap: { alignItems: 'center', paddingVertical: 8 },
  destructDoneText: { fontSize: 14, marginBottom: 6 },
  destructDoneDesc: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  coffreFooter: { alignItems: 'center', paddingVertical: 20 },
  footerLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  footerNames: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerName: { fontStyle: 'italic', fontSize: 13 },
  footerLine: { width: 30, height: 1, opacity: 0.4 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 20, paddingTop: 10 },
  navBtn: { flex: 1, alignItems: 'center', gap: 4 },
  navIconActive: { fontSize: 20 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 8, letterSpacing: 1.5 },
  navLabelActive: { fontSize: 8, letterSpacing: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 320, borderRadius: 20, padding: 24, borderWidth: 1 },
  modalIcon: { fontSize: 32, textAlign: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, textAlign: 'center', marginBottom: 8, fontWeight: '500' },
  modalDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, textAlign: 'center', letterSpacing: 2 },
  modalConfirmBtn: { marginTop: 16, padding: 14, backgroundColor: 'rgba(229,85,85,0.2)', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(229,85,85,0.3)' },
  modalConfirmText: { fontSize: 14, color: '#e55', fontWeight: '500' },
  modalCancelBtn: { marginTop: 10, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 14 },
  pinError: { fontSize: 11, color: '#e55', textAlign: 'center', marginTop: 6 },
  leurrePreview: { borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  leurreNote: { fontSize: 13 },
});