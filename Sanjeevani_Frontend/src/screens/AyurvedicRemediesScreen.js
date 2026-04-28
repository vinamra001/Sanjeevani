import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Alert, StatusBar, Dimensions, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from '../components/BottomNavBar';
import { addHistoryEntry, getHistoryByUsername } from '../utils/DatabaseInit';

const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

const AyurvedicRemediesScreen = ({ route, navigation }) => {
  const { remedies = [], diseaseName = 'Natural Remedies' } = route.params || {};
  const [isGuestMode, setIsGuestMode]     = useState(false);
  const [savedRemedies, setSavedRemedies] = useState([]);
  const [activeTab, setActiveTab]         = useState('current'); // 'current' | 'history'
  const [pdfLoading, setPdfLoading]       = useState(false);

  useEffect(() => {
    const init = async () => {
      const guestFlag = await AsyncStorage.getItem('isGuest');
      if (guestFlag === 'true') setIsGuestMode(true);

      // Save current remedies to offline storage
      if (remedies.length > 0) {
        await saveRemediesToStorage(diseaseName, remedies);
      }

      // Load history
      await loadSavedRemedies();
    };
    init();
  }, []);

  const saveRemediesToStorage = async (disease, remedyList) => {
    try {
      const username = await AsyncStorage.getItem('userName') || 'guest';
      // Calling DatabaseInit wrapper
      await addHistoryEntry(disease, remedyList, username);
    } catch (e) {
      console.error('Save remedies error:', e);
    }
  };

  const loadSavedRemedies = async () => {
    try {
      const username = await AsyncStorage.getItem('userName') || 'guest';
      const history = await getHistoryByUsername(username);
      if (history) {
        // Parse the SQLite JSON strings into object
        const parsedHistory = history.map(h => ({
          ...h,
          remedies: JSON.parse(h.remediesJSON)
        }));
        setSavedRemedies(parsedHistory);
      }
    } catch (e) {
      console.error('Load remedies error:', e);
    }
  };

  const handleShare = async (remedy) => {
    try {
      await Share.share({
        message: `🌿 Sanjeevani AI Remedy for ${diseaseName}:\n\nHerb: ${remedy.name}\nPreparation: ${remedy.preparation}\nDosage: ${remedy.dosage}\n\nShared via Sanjeevani Ayurvedic App.`,
      });
    } catch {
      Alert.alert('Error', 'Could not share the remedy.');
    }
  };

  const handleDownloadPDF = async (remedyList = remedies, disease = diseaseName) => {
    setPdfLoading(true);
    try {
      const remediesHTML = remedyList.map((remedy, i) => `
        <div style="background:#fff; border-radius:12px; padding:20px; margin-bottom:16px; border:1px solid #e0e0e0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="color:#1E5C33; margin:0; font-size:18px;">${i + 1}. ${remedy.name}</h3>
            ${remedy.sanskrit_name ? `<span style="background:#EAF4EC; color:#2D7D46; padding:4px 10px; border-radius:6px; font-size:11px; font-style:italic;">${remedy.sanskrit_name}</span>` : ''}
          </div>
          <p style="color:#5A6E60; font-size:13px; line-height:1.6; margin-bottom:12px;"><b>About:</b> ${remedy.description}</p>
          ${remedy.preparation ? `<p style="color:#5A6E60; font-size:13px; line-height:1.6; margin-bottom:12px;"><b>🥣 Preparation:</b> ${remedy.preparation}</p>` : ''}
          ${remedy.usage_instructions ? `<p style="color:#5A6E60; font-size:13px; line-height:1.6; margin-bottom:12px;"><b>📖 Usage:</b> ${remedy.usage_instructions}</p>` : ''}
          <div style="background:#EAF4EC; border-radius:10px; padding:12px; display:flex; align-items:center;">
            <span style="font-size:20px; margin-right:10px;">🕒</span>
            <div>
              <div style="font-size:10px; color:#2D7D46; font-weight:bold; letter-spacing:1px;">RECOMMENDED DOSAGE</div>
              <div style="color:#1E5C33; font-weight:bold; font-size:15px; margin-top:2px;">${remedy.dosage || 'As directed by practitioner'}</div>
            </div>
          </div>
        </div>
      `).join('');

      const htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 40px; background: #F7FAF8; color: #141F17; }
            .header { text-align: center; margin-bottom: 30px; padding: 24px; background: #1E5C33; border-radius: 16px; color: white; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
            .header p { margin: 6px 0 0; opacity: 0.8; font-size: 13px; }
            .disease-banner { background: #EAF4EC; border-left: 4px solid #2D7D46; padding: 14px 18px; border-radius: 10px; margin-bottom: 24px; }
            .disease-banner h2 { margin: 0; color: #1E5C33; font-size: 20px; }
            .disease-banner p { margin: 4px 0 0; color: #5A6E60; font-size: 12px; }
            .disclaimer { background: #FFF3CD; border: 1px solid #FFD700; border-radius: 10px; padding: 14px; margin-top: 24px; text-align: center; }
            .disclaimer p { margin: 0; color: #856404; font-size: 12px; line-height: 1.6; }
            .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌿 SANJEEVANI</h1>
            <p>Ayurvedic Health Report • ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="disease-banner">
            <h2>Treatment for: ${disease}</h2>
            <p>${remedyList.length} Ayurvedic remedy(ies) recommended based on your symptoms</p>
          </div>

          ${remediesHTML}

          <div class="disclaimer">
            <p>⚕️ <b>Medical Disclaimer:</b> These remedies are based on classical Ayurvedic literature and are for informational purposes only. Please consult a qualified Ayurvedic practitioner or healthcare professional before beginning any treatment.</p>
          </div>

          <div class="footer">
            <p>Generated by Sanjeevani Ayurvedic Recommender System • ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${disease} - Ayurvedic Remedies`,
      });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const displayRemedies = activeTab === 'current' ? remedies : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextCenter}>
          <Text style={styles.headerSubtitle}>TREATMENT FOR</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeTab === 'current' ? diseaseName : 'Remedy History'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoCircle}
          onPress={() => Alert.alert('Usage Guide', "Formulations are most effective when taken with 'Anupana' (mediums) like warm water or honey.")}
        >
          <Text style={styles.infoIcon}>i</Text>
        </TouchableOpacity>
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.tabActive]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
            🌿 Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📋 History ({savedRemedies.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── CURRENT TAB ── */}
        {activeTab === 'current' && (
          <>
            <View style={styles.prakritiBanner}>
              <Text style={styles.prakritiText}>
                ✨ These classical formulations are selected based on your reported symptoms.
              </Text>
            </View>

            {/* Download PDF Button */}
            {remedies.length > 0 && (
              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => handleDownloadPDF(remedies, diseaseName)}
                disabled={pdfLoading}
              >
                {pdfLoading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <>
                      <Text style={styles.pdfButtonIcon}>📄</Text>
                      <Text style={styles.pdfButtonText}>Download PDF Report</Text>
                    </>
                }
              </TouchableOpacity>
            )}

            {remedies.length > 0 ? (
              remedies.map((remedy, index) => (
                <RemedyCard
                  key={index}
                  remedy={remedy}
                  diseaseName={diseaseName}
                  onShare={() => handleShare(remedy)}
                />
              ))
            ) : (
              <EmptyState navigation={navigation} />
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <>
            {savedRemedies.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
                <Text style={styles.noDataTitle}>No History Yet</Text>
                <Text style={styles.noDataDesc}>
                  Your remedy searches will appear here for offline access.
                </Text>
              </View>
            ) : (
              savedRemedies.map((entry, i) => (
                <View key={entry.id || i} style={styles.historyCard}>
                  {/* History Entry Header */}
                  <View style={styles.historyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDisease}>{entry.diseaseName}</Text>
                      <Text style={styles.historyMeta}>
                        📅 {entry.date} • ⏰ {entry.time}
                      </Text>
                    </View>
                    <View style={styles.historyBadge}>
                      <Text style={styles.historyBadgeText}>{entry.remedies.length} remedy</Text>
                    </View>
                  </View>

                  {/* Remedy Names */}
                  <View style={styles.historyRemedyList}>
                    {entry.remedies.map((r, j) => (
                      <View key={j} style={styles.historyRemedyChip}>
                        <Text style={styles.historyRemedyName}>🌿 {r.name}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={styles.historyViewBtn}
                      onPress={() => {
                        setActiveTab('current');
                        // Navigate to show this history entry's remedies
                        navigation.replace('AyurvedicRemedies', {
                          remedies: entry.remedies,
                          diseaseName: entry.diseaseName,
                        });
                      }}
                    >
                      <Text style={styles.historyViewBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.historyPdfBtn}
                      onPress={() => handleDownloadPDF(entry.remedies, entry.diseaseName)}
                    >
                      <Text style={styles.historyPdfBtnText}>📄 PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen={isGuestMode ? 'Family' : ''} />
    </SafeAreaView>
  );
};

// ── Remedy Card Component ─────────────────────────────────────────────────────
const RemedyCard = ({ remedy, diseaseName, onShare }) => (
  <View style={styles.remedyCard}>
    <View style={styles.cardHeader}>
      <View style={styles.herbInfo}>
        <Text style={styles.herbName}>{remedy.name}</Text>
        <View style={styles.sanskritBadge}>
          <Text style={styles.sanskritText}>
            {remedy.sanskrit_name || 'Classical Formula'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onShare} style={styles.shareIconCircle}>
        <Text style={{ fontSize: 15 }}>📤</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>📋 ABOUT</Text>
      <Text style={styles.rowValue}>{remedy.description}</Text>
    </View>

    {remedy.preparation ? (
      <View style={styles.detailRow}>
        <Text style={styles.rowLabel}>🥣 PREPARATION</Text>
        <Text style={styles.rowValue}>{remedy.preparation}</Text>
      </View>
    ) : null}

    {remedy.usage_instructions ? (
      <View style={styles.detailRow}>
        <Text style={styles.rowLabel}>📖 USAGE</Text>
        <Text style={styles.rowValue}>{remedy.usage_instructions}</Text>
      </View>
    ) : null}

    <View style={styles.dosageBanner}>
      <View style={styles.dosageIconBg}>
        <Text style={{ fontSize: 18 }}>🕒</Text>
      </View>
      <View>
        <Text style={styles.dosageTitle}>RECOMMENDED DOSAGE</Text>
        <Text style={styles.dosageText}>{remedy.dosage || 'As directed by practitioner'}</Text>
      </View>
    </View>
  </View>
);

// ── Empty State Component ─────────────────────────────────────────────────────
const EmptyState = ({ navigation }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconCircle}>
      <Text style={{ fontSize: 40 }}>🍃</Text>
    </View>
    <Text style={styles.noDataTitle}>No Specific Remedies Found</Text>
    <Text style={styles.noDataDesc}>
      Our AI assistant can provide a deeper analysis based on your unique body type.
    </Text>
    <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat')}>
      <Text style={styles.chatButtonText}>Consult Sanjeevani AI</Text>
    </TouchableOpacity>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: BACKGROUND,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 5,
  },
  backArrow:        { color: TEXT_PRIMARY, fontSize: 22, fontWeight: '300' },
  headerTextCenter: { flex: 1, alignItems: 'center' },
  headerSubtitle:   { fontSize: 10, color: '#AAA', fontWeight: '800', letterSpacing: 1 },
  headerTitle:      { color: THEME_COLOR, fontSize: 17, fontWeight: 'bold' },
  infoCircle: {
    width: 30, height: 30, borderRadius: 10,
    borderWidth: 1, borderColor: '#EBEBEB',
    justifyContent: 'center', alignItems: 'center',
  },
  infoIcon: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: 'bold' },

  // ── Tabs
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20,
    marginBottom: 4, backgroundColor: THEME_SURFACE,
    borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center',
  },
  tabActive:     { backgroundColor: '#FFF', elevation: 2, shadowColor: THEME_DARK, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tabText:       { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },
  tabTextActive: { color: THEME_DARK, fontWeight: 'bold' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  prakritiBanner: {
    backgroundColor: THEME_SURFACE, padding: 16, borderRadius: 14,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: THEME_COLOR,
  },
  prakritiText: { color: THEME_DARK, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // ── PDF Button
  pdfButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: THEME_COLOR, borderRadius: 14,
    paddingVertical: 14, marginBottom: 16,
    elevation: 4, shadowColor: THEME_DARK,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  pdfButtonIcon: { fontSize: 18, marginRight: 8 },
  pdfButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // ── Remedy Card
  remedyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 4, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 18,
  },
  herbInfo:  { flex: 1 },
  herbName:  { fontSize: 21, fontWeight: 'bold', color: TEXT_PRIMARY },
  sanskritBadge: {
    backgroundColor: THEME_SURFACE, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginTop: 5, alignSelf: 'flex-start',
  },
  sanskritText:    { fontSize: 11, fontStyle: 'italic', color: TEXT_SECONDARY, fontWeight: '600' },
  shareIconCircle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center',
  },
  detailRow: { marginBottom: 16 },
  rowLabel:  { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1, marginBottom: 6 },
  rowValue:  { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 },
  dosageBanner: {
    marginTop: 5, padding: 14, backgroundColor: THEME_SURFACE,
    borderRadius: 16, flexDirection: 'row', alignItems: 'center',
  },
  dosageIconBg: {
    width: 40, height: 40, borderRadius: 11, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  dosageTitle: { fontSize: 10, color: THEME_COLOR, fontWeight: '800', letterSpacing: 0.5 },
  dosageText:  { color: THEME_DARK, fontWeight: 'bold', fontSize: 15, marginTop: 2 },

  // ── History Card
  historyCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 14,
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  historyHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  historyDisease: { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY },
  historyMeta:    { fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 },
  historyBadge: {
    backgroundColor: THEME_SURFACE, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  historyBadgeText: { fontSize: 11, color: THEME_DARK, fontWeight: 'bold' },
  historyRemedyList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  historyRemedyChip: {
    backgroundColor: THEME_SURFACE, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  historyRemedyName: { fontSize: 12, color: THEME_DARK, fontWeight: '600' },
  historyActions:    { flexDirection: 'row', gap: 10 },
  historyViewBtn: {
    flex: 1, backgroundColor: THEME_COLOR, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  historyViewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  historyPdfBtn: {
    backgroundColor: THEME_SURFACE, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  historyPdfBtnText: { color: THEME_DARK, fontWeight: 'bold', fontSize: 13 },

  // ── Empty State
  emptyState:      { alignItems: 'center', marginTop: 50, paddingHorizontal: 30 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  noDataTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 10 },
  noDataDesc:  { textAlign: 'center', color: TEXT_SECONDARY, fontSize: 14, marginBottom: 25, lineHeight: 20 },
  chatButton: {
    backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 15,
    borderRadius: 100, elevation: 5, shadowColor: THEME_DARK,
    shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  chatButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default AyurvedicRemediesScreen;
