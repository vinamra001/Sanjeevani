import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, ActivityIndicator, Alert, Image, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get('window');
const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

// Offline herb database — shown when no network or identification fails
const HERB_DATABASE = {
  'Tulsi':        { sanskrit: 'Ocimum tenuiflorum', dosha: 'Vata, Kapha', uses: 'Immunity, respiratory health, stress relief', preparation: 'Tulsi tea: 10 leaves in boiling water for 5 minutes', caution: 'Avoid in pregnancy in large doses' },
  'Ashwagandha':  { sanskrit: 'Withania somnifera', dosha: 'Vata, Kapha', uses: 'Stress relief, energy, immunity boost', preparation: '1 tsp powder in warm milk at bedtime', caution: 'Avoid with thyroid medication' },
  'Neem':         { sanskrit: 'Azadirachta indica', dosha: 'Pitta, Kapha', uses: 'Blood purifier, skin health, anti-bacterial', preparation: 'Neem tea or external paste application', caution: 'Avoid internally during pregnancy' },
  'Brahmi':       { sanskrit: 'Bacopa monnieri',    dosha: 'Vata, Pitta', uses: 'Memory, focus, anxiety reduction', preparation: 'Brahmi oil for head massage or 1 tsp in warm milk', caution: 'May slow heart rate — consult doctor' },
  'Turmeric':     { sanskrit: 'Curcuma longa',      dosha: 'All (tridoshic)', uses: 'Anti-inflammatory, immunity, digestion', preparation: 'Golden milk: ½ tsp in warm milk with black pepper', caution: 'High doses may thin blood' },
  'Ginger':       { sanskrit: 'Zingiber officinale', dosha: 'Vata, Kapha', uses: 'Digestion, nausea, circulation', preparation: 'Fresh ginger tea: slice 1 inch in hot water', caution: 'Avoid with blood thinners' },
  'Triphala':     { sanskrit: 'Terminalia combo',   dosha: 'All (tridoshic)', uses: 'Colon cleanse, detox, eye health', preparation: '1 tsp powder in warm water before bed', caution: 'Avoid during pregnancy' },
  'Shatavari':    { sanskrit: 'Asparagus racemosus', dosha: 'Vata, Pitta', uses: 'Hormonal balance, digestion, immunity', preparation: '1 tsp powder in warm milk twice daily', caution: 'Avoid with estrogen-sensitive conditions' },
};

const ARHerbIdentifierScreen = ({ navigation, route }) => {
  const { lang = 'en' } = route.params || {};
  const [image,       setImage]       = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [result,      setResult]      = useState(null);
  const [history,     setHistory]     = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('herb_history').then(h => { if (h) setHistory(JSON.parse(h)); });
  }, []);

  const pickImage = async (useCamera) => {
    let permission;
    if (useCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission needed', 'Camera permission is required.'); return; }
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission needed', 'Gallery permission is required.'); return; }
    }

    const picker = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setResult(null);
      identifyHerb(asset.base64, asset.uri);
    }
  };

  const identifyHerb = async (base64, uri) => {
    setIdentifying(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/identify-herb/`, {
        image_base64: base64,
      }, { timeout: 20000 });

      if (res.data && res.data.herb_name) {
        const herbInfo = res.data;
        setResult(herbInfo);
        // Save to history
        const entry = { uri, name: herbInfo.herb_name, time: new Date().toLocaleTimeString() };
        const updated = [entry, ...history].slice(0, 10);
        setHistory(updated);
        await AsyncStorage.setItem('herb_history', JSON.stringify(updated));
      } else throw new Error('No herb identified');
    } catch (e) {
      // Show manual search UI
      setResult({ herb_name: null, error: true });
    } finally {
      setIdentifying(false);
    }
  };

  const handleManualSearch = (herbName) => {
    const info = HERB_DATABASE[herbName];
    if (info) setResult({ herb_name: herbName, ...info, source: 'database' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AR Herb Identifier</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Camera buttons */}
        <View style={styles.cameraRow}>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
            <Text style={styles.cameraBtnIcon}>📷</Text>
            <Text style={styles.cameraBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cameraBtn, { borderColor: '#7B61FF' }]} onPress={() => pickImage(false)}>
            <Text style={styles.cameraBtnIcon}>🖼️</Text>
            <Text style={styles.cameraBtnText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Image preview */}
        {image && (
          <View style={styles.imageCard}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            {identifying && (
              <View style={styles.identifyingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.identifyingText}>Identifying herb...</Text>
              </View>
            )}
          </View>
        )}

        {/* Result */}
        {result && !identifying && (
          result.error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not identify automatically</Text>
              <Text style={styles.errorSub}>Search from our herb database:</Text>
              <View style={styles.herbGrid}>
                {Object.keys(HERB_DATABASE).map(name => (
                  <TouchableOpacity key={name} style={styles.herbChip} onPress={() => handleManualSearch(name)}>
                    <Text style={styles.herbChipText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{result.herb_name}</Text>
                  {result.sanskrit && <Text style={styles.resultSanskrit}>{result.sanskrit}</Text>}
                  {result.source === 'database' && (
                    <Text style={styles.resultSource}>📦 From herb database</Text>
                  )}
                </View>
              </View>

              {result.dosha && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Balances Dosha</Text>
                  <Text style={styles.infoValue}>{result.dosha}</Text>
                </View>
              )}
              {result.uses && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Medicinal Uses</Text>
                  <Text style={styles.infoValue}>{result.uses}</Text>
                </View>
              )}
              {result.preparation && (
                <View style={[styles.infoRow, { backgroundColor: THEME_SURFACE, borderRadius: 10, padding: 12 }]}>
                  <Text style={styles.infoLabel}>🧪 How to Prepare</Text>
                  <Text style={styles.infoValue}>{result.preparation}</Text>
                </View>
              )}
              {result.caution && (
                <View style={[styles.infoRow, { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12 }]}>
                  <Text style={[styles.infoLabel, { color: '#E65100' }]}>⚠️ Caution</Text>
                  <Text style={[styles.infoValue, { color: '#BF360C' }]}>{result.caution}</Text>
                </View>
              )}
            </View>
          )
        )}

        {/* Placeholder state */}
        {!image && !result && (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderEmoji}>🌱</Text>
            <Text style={styles.placeholderTitle}>Point & Identify</Text>
            <Text style={styles.placeholderSub}>Take a photo of any herb or plant to get instant Ayurvedic identification and usage information.</Text>
          </View>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {history.map((h, i) => (
                <TouchableOpacity key={i} style={styles.historyCard}
                  onPress={() => { setImage(h.uri); handleManualSearch(h.name); }}>
                  <Image source={{ uri: h.uri }} style={styles.historyImage} />
                  <Text style={styles.historyName} numberOfLines={1}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Herb database */}
        <Text style={styles.sectionTitle}>Herb Database ({Object.keys(HERB_DATABASE).length})</Text>
        {Object.entries(HERB_DATABASE).map(([name, info]) => (
          <TouchableOpacity key={name} style={styles.dbRow} onPress={() => handleManualSearch(name)}>
            <View style={styles.dbIconBox}><Text style={{ fontSize: 20 }}>🌿</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dbName}>{name}</Text>
              <Text style={styles.dbUses} numberOfLines={1}>{info.uses}</Text>
            </View>
            <Text style={styles.dbArrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 14, backgroundColor: THEME_DARK, elevation: 6,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn:     { padding: 4 },
  backArrow:   { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  scroll:      { padding: 20 },

  cameraRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  cameraBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 18,
                alignItems: 'center', borderWidth: 1.5, borderColor: THEME_COLOR,
                elevation: 2 },
  cameraBtnIcon: { fontSize: 28, marginBottom: 6 },
  cameraBtnText: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },

  imageCard:  { borderRadius: 18, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  previewImage: { width: '100%', height: 240 },
  identifyingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                         backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  identifyingText: { color: '#FFF', marginTop: 12, fontSize: 15, fontWeight: '600' },

  resultCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16,
                 borderWidth: 1, borderColor: '#EBEBEB', elevation: 3 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultEmoji:  { fontSize: 36, marginRight: 14 },
  resultName:   { fontSize: 22, fontWeight: 'bold', color: TEXT_PRIMARY },
  resultSanskrit: { fontSize: 13, color: TEXT_SECONDARY, fontStyle: 'italic', marginTop: 2 },
  resultSource: { fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 },
  infoRow:      { marginBottom: 12 },
  infoLabel:    { fontSize: 11, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase',
                   letterSpacing: 0.5, marginBottom: 4 },
  infoValue:    { fontSize: 14, color: TEXT_PRIMARY, lineHeight: 21 },

  errorCard:    { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 16,
                   borderWidth: 1, borderColor: '#FFCCBC' },
  errorTitle:   { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 6 },
  errorSub:     { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 14 },
  herbGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  herbChip:     { backgroundColor: THEME_SURFACE, paddingHorizontal: 14, paddingVertical: 8,
                   borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9' },
  herbChipText: { color: THEME_DARK, fontSize: 13, fontWeight: '600' },

  placeholderBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  placeholderEmoji: { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 8 },
  placeholderSub:   { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 12, marginTop: 8 },
  historyCard:  { width: 90, marginRight: 12, alignItems: 'center' },
  historyImage: { width: 80, height: 80, borderRadius: 14, marginBottom: 6 },
  historyName:  { fontSize: 12, fontWeight: '600', color: TEXT_PRIMARY, textAlign: 'center' },

  dbRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14,
               padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EBEBEB', elevation: 1 },
  dbIconBox:{ width: 40, height: 40, backgroundColor: THEME_SURFACE, borderRadius: 12,
               justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dbName:   { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  dbUses:   { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  dbArrow:  { color: TEXT_SECONDARY, fontSize: 16 },
});

export default ARHerbIdentifierScreen;
