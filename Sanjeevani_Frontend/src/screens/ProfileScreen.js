import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { translations } from '../utils/translations';
import BottomNavBar from '../components/BottomNavBar';
import { getHistoryByUsername } from '../utils/DatabaseInit';

const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

const API_BASE_URL = 'http://192.168.0.106:8000/api/v1';

// ALL keys written by any screen in the app that store profile data
const PROFILE_KEYS = ['userName', 'userEmail', 'userAge', 'userGender', 'userDosha', 'userPrakriti'];

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [lang, setLang]                     = useState('en');
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory]       = useState(false);
  const [totalRecords, setTotalRecords]     = useState(0);

  useEffect(() => {
    fetchProfileData();
    const unsubscribe = navigation.addListener('focus', fetchProfileData);
    return unsubscribe;
  }, [navigation]);

  // ── Read cached keys — checks new per-user keys first, falls back to old global
  //    keys so existing users (registered before this fix) still see their data ──
  const buildOfflineProfile = async (username) => {
    const pairs = await AsyncStorage.multiGet(PROFILE_KEYS);
    const m     = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
    const dosha = m['userDosha'] || m['userPrakriti'] || null;

    // Try new per-user key first, fall back to old global key for existing users
    const email  = await AsyncStorage.getItem(`userEmail_${username}`)  || m['userEmail']  || null;
    const age    = await AsyncStorage.getItem(`userAge_${username}`)    || m['userAge']    || null;
    const gender = await AsyncStorage.getItem(`userGender_${username}`) || m['userGender'] || null;

    // Migrate old global keys to per-user keys so next read uses the correct key
    if (email || age || gender) {
      const migrate = [];
      if (email)  migrate.push([`userEmail_${username}`,  email]);
      if (age)    migrate.push([`userAge_${username}`,    age]);
      if (gender) migrate.push([`userGender_${username}`, gender]);
      AsyncStorage.multiSet(migrate).catch(() => {});
    }

    return {
      username : username || m['userName'] || 'User',
      prakriti : dosha,
      email,
      age,
      gender,
    };
  };

  const fetchProfileData = async () => {
    try {
      const username  = await AsyncStorage.getItem('userName');
      const savedLang = await AsyncStorage.getItem('userLang') || 'en';
      setLang(savedLang);
      if (!username) { navigation.replace('Login'); return; }

      // STEP 1: show cached data immediately (works fully offline)
      const offline = await buildOfflineProfile(username);
      setProfile(offline);
      setLoading(false);

      // STEP 2: try server — update if we get better data
      try {
        const res   = await axios.get(
          `${API_BASE_URL}/get-profile/?username=${username}`,
          { timeout: 5000 }
        );
        const pData = res.data;

        // ── FIX 1: read email/age/gender that were saved during RegisterScreen ──
        // Tries both snake_case and camelCase variants in case backend differs
        const merged = {
          username : pData.username                         || offline.username,
          prakriti : (pData.prakriti && pData.prakriti !== 'Not Analyzed')
                       ? pData.prakriti                    : offline.prakriti,
          email    : pData.email    || pData.user_email    || offline.email,
          age      : pData.age      || pData.user_age      || offline.age,
          gender   : pData.gender   || pData.user_gender   || offline.gender,
        };
        setProfile(merged);

        // Cache merged data for next offline visit
        const toSave = [];
        if (merged.prakriti && merged.prakriti !== 'Not Analyzed') {
          toSave.push(['userDosha',    merged.prakriti]);
          toSave.push(['userPrakriti', merged.prakriti]);
        }
        // Persist email/age/gender per-user so next offline visit reads correct user's data
        if (merged.email)  toSave.push([`userEmail_${username}`,  merged.email]);
        if (merged.age)    toSave.push([`userAge_${username}`,    String(merged.age)]);
        if (merged.gender) toSave.push([`userGender_${username}`, merged.gender]);
        if (toSave.length) await AsyncStorage.multiSet(toSave);

      } catch (_) {
        // offline — already showing cached data, nothing to do
      }
    } catch (error) {
      console.log('Profile error:', error.message);
      setLoading(false);
    }
  };

  // ── History from local SQLite ─────────────────────────────────────────────
  const fetchHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setHistoryLoading(true);
    try {
      const username = await AsyncStorage.getItem('userName') || 'guest';
      const localHistory = await getHistoryByUsername(username);
      const parsed = localHistory.map(row => {
        let remedies = [];
        try { remedies = JSON.parse(row.remediesJSON); } catch (_) {}
        return { ...row, remedies };
      });
      setHistory(parsed);
      setTotalRecords(parsed.length);
      setShowHistory(true);
    } catch (error) {
      Alert.alert('Error', 'Could not load local history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── FIX 2: PDF export — always loads full history from SQLite first ────────
  const handleDownloadReport = async (item = null) => {
    if (!profile) return;

    try {
      // Always fetch fresh full history from local SQLite DB
      const username = await AsyncStorage.getItem('userName') || 'guest';
      const localHistory = await getHistoryByUsername(username);
      const fullHistory = localHistory.map(row => {
        let remedies = [];
        try { remedies = JSON.parse(row.remediesJSON); } catch (_) {}
        return { ...row, remedies };
      });

      // Single record PDF (from per-row PDF button) vs full history PDF
      const reportList = item ? [item] : fullHistory;

      if (reportList.length === 0) {
        Alert.alert('No History', 'No remedy history found to export.');
        return;
      }

      const historyHTML = reportList.map(h => {
        const remHTML = h.remedies && Array.isArray(h.remedies) && h.remedies.length > 0
          ? h.remedies.map(r =>
              `<div style="padding:5px 0;border-bottom:1px solid #eee;">
                <b>${r.name || ''}:</b> ${r.dosage || r.description || ''}
              </div>`).join('')
          : '<p style="color:#888;font-size:12px;">No remedy details saved.</p>';

        return `
          <div style="border:1px solid #ddd;border-radius:8px;padding:14px;margin-bottom:12px;">
            <h3 style="color:#1E5C33;margin-top:0;margin-bottom:6px;">
              📅 ${h.date} &nbsp;·&nbsp; ⏰ ${h.time}
            </h3>
            <p style="font-size:15px;font-weight:bold;color:#141F17;margin:0 0 10px 0;">
              ${h.diseaseName}
            </p>
            <div style="background:#EAF4EC;padding:10px;border-radius:6px;">
              <p style="font-size:11px;font-weight:bold;color:#2D7D46;margin:0 0 6px 0;">
                RECOMMENDED REMEDIES
              </p>
              ${remHTML}
            </div>
          </div>`;
      }).join('');

      const htmlContent = `
        <html>
          <body style="font-family:Helvetica;padding:40px;color:#141F17;">
            <h1 style="color:#2D7D46;text-align:center;margin-bottom:4px;">
              Sanjeevani AI Health Report
            </h1>
            <p style="text-align:center;color:#888;font-size:12px;margin-top:0;">
              Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <hr style="border:none;border-top:1px solid #EAF4EC;margin:16px 0;" />

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
              <tr>
                <td style="padding:4px 8px 4px 0;color:#888;">Name</td>
                <td style="padding:4px 0;font-weight:bold;">${profile?.username || 'User'}</td>
                <td style="padding:4px 8px 4px 16px;color:#888;">Prakriti</td>
                <td style="padding:4px 0;font-weight:bold;">${profile?.prakriti || 'Not Analyzed'}</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;color:#888;">Email</td>
                <td style="padding:4px 0;font-weight:bold;">${profile?.email || 'N/A'}</td>
                <td style="padding:4px 8px 4px 16px;color:#888;">Age</td>
                <td style="padding:4px 0;font-weight:bold;">${profile?.age ? profile.age + ' yrs' : 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;color:#888;">Gender</td>
                <td style="padding:4px 0;font-weight:bold;">${profile?.gender || 'N/A'}</td>
                <td style="padding:4px 8px 4px 16px;color:#888;">Total Records</td>
                <td style="padding:4px 0;font-weight:bold;">${reportList.length}</td>
              </tr>
            </table>

            <h2 style="color:#1E5C33;border-bottom:2px solid #EAF4EC;padding-bottom:8px;margin-bottom:16px;">
              📋 Remedy History Log
            </h2>
            ${historyHTML}

            <p style="font-size:10px;color:#bbb;text-align:center;margin-top:30px;">
              Generated by Sanjeevani Ayurvedic AI • ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);

    } catch (e) {
      console.error(e);
      Alert.alert('Export Failed', 'Could not generate PDF.');
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      lang === 'hi' ? 'लॉगआउट' : 'Logout',
      lang === 'hi' ? 'क्या आप बाहर निकलना चाहते हैं?' : 'Exit Sanjeevani?',
      [
        { text: lang === 'hi' ? 'नहीं' : 'No', style: 'cancel' },
        { text: lang === 'hi' ? 'हाँ' : 'Yes', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  const t = translations[lang];

  // Safe display — never "undefined yrs | undefined" or "null"
  const displayDosha  = (profile?.prakriti && profile.prakriti !== 'Not Analyzed')
    ? profile.prakriti : 'Dosha Not Set';
  const displayEmail  = profile?.email  || 'N/A';
  const displayAge    = profile?.age    ? `${profile.age} yrs` : '--';
  const displayGender = profile?.gender || '--';
  const displayDetail = `${displayAge} | ${displayGender}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── AVATAR ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarSymbol}>🧘</Text>
          </View>
          <Text style={styles.welcomeName}>{profile?.username || 'User'}</Text>
          <View style={[
            styles.doshaTagBox,
            displayDosha === 'Dosha Not Set' && { backgroundColor: '#9E9E9E' }
          ]}>
            <Text style={styles.doshaTag}>{displayDosha}</Text>
          </View>
        </View>

        {/* ── INFO CARDS ── */}
        <View style={styles.infoContainer}>
          <ProfileInfoCard label="Email"   value={displayEmail}  icon="✉️" />
          <ProfileInfoCard label="Details" value={displayDetail} icon="👤" />

          <Text style={styles.menuLabel}>Quick Actions</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DoshaQuiz')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF8E1' }]}><Text>🧭</Text></View>
            <Text style={styles.menuText}>Retake Prakriti Quiz</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleDownloadReport()}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E3F2FD' }]}><Text>📥</Text></View>
            <Text style={styles.menuText}>Download Health PDF</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>

          {/* ── HISTORY BUTTON ── */}
          <TouchableOpacity style={styles.menuItem} onPress={fetchHistory}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}><Text>📋</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Remedy History</Text>
              {totalRecords > 0 && (
                <Text style={{ fontSize: 11, color: THEME_COLOR }}>{totalRecords} records saved</Text>
              )}
            </View>
            <Text style={styles.arrow}>{showHistory ? '▲' : '➔'}</Text>
          </TouchableOpacity>

          {/* ── HISTORY LOADING ── */}
          {historyLoading && (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator color={THEME_COLOR} />
              <Text style={{ color: TEXT_SECONDARY, marginTop: 8, fontSize: 12 }}>
                Loading history...
              </Text>
            </View>
          )}

          {/* ── HISTORY CONTENT ── */}
          {showHistory && !historyLoading && (
            <View style={historyStyles.wrapper}>
              <Text style={historyStyles.heading}>
                📊 Total Records: {totalRecords}
              </Text>

              {history.length === 0 ? (
                <View style={historyStyles.emptyBox}>
                  <Text style={historyStyles.emptyEmoji}>🌿</Text>
                  <Text style={historyStyles.emptyText}>No local remedy history yet.</Text>
                  <Text style={historyStyles.emptySubText}>
                    Use the diagnosis feature to generate recommendations and save them to your device.
                  </Text>
                </View>
              ) : (
                history.map((record, index) => (
                  <View key={index} style={historyStyles.dateGroup}>
                    <View style={historyStyles.dateHeader}>
                      <Text style={historyStyles.dateText}>📅 {record.date}</Text>
                      <View style={historyStyles.countBadge}>
                        <Text style={historyStyles.countText}>
                          {record.remedies?.length ?? 0} remedies
                        </Text>
                      </View>
                    </View>
                    <View style={historyStyles.recordCard}>
                      <View style={historyStyles.recordTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={historyStyles.diseaseName}>{record.diseaseName}</Text>
                          <Text style={historyStyles.timeText}>⏰ {record.time}</Text>
                        </View>
                        <TouchableOpacity
                          style={{ padding: 10, backgroundColor: '#E0F2F1', borderRadius: 8 }}
                          onPress={() => handleDownloadReport(record)}
                        >
                          <Text style={{ fontSize: 13, color: '#00695C', fontWeight: 'bold' }}>PDF 📄</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F3EEF9' }]}><Text>ℹ️</Text></View>
            <Text style={styles.menuText}>About Sanjeevani</Text>
            <Text style={styles.arrow}>➔</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
};

const ProfileInfoCard = ({ label, value, icon }) => (
  <View style={styles.infoCard}>
    <View style={styles.iconBox}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <View style={styles.textDetails}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: BACKGROUND },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    backgroundColor: THEME_DARK, elevation: 8,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 19, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginVertical: 28 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 28, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 14,
  },
  avatarSymbol: { fontSize: 45 },
  welcomeName:  { fontSize: 22, fontWeight: 'bold', color: THEME_DARK, marginTop: 12 },
  doshaTagBox: {
    backgroundColor: THEME_COLOR, paddingHorizontal: 18, paddingVertical: 5,
    borderRadius: 100, marginTop: 10,
  },
  doshaTag: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  infoContainer: { gap: 12 },
  menuLabel: {
    fontSize: 13, fontWeight: '800', color: '#AAA', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 14, marginBottom: 4,
  },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB', elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  textDetails: { flex: 1 },
  infoLabel:   { fontSize: 11, color: TEXT_SECONDARY },
  infoValue:   { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY },
  menuItem: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB', elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  menuText: { flex: 1, fontWeight: '600', color: TEXT_PRIMARY },
  arrow:    { color: THEME_LIGHT, fontWeight: 'bold' },
  logoutButton: {
    marginTop: 28, padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#EF5350',
    alignItems: 'center', backgroundColor: '#FFF9F9',
  },
  logoutText: { color: '#EF5350', fontWeight: 'bold', fontSize: 15 },
});

// ─── History Styles ───────────────────────────────────────────────────────────
const historyStyles = StyleSheet.create({
  wrapper: { marginTop: 4 },
  heading: {
    fontSize: 13, fontWeight: '800', color: THEME_DARK, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyBox: {
    alignItems: 'center', padding: 30, backgroundColor: '#FFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#EBEBEB',
  },
  emptyEmoji:   { fontSize: 40, marginBottom: 10 },
  emptyText:    { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY },
  emptySubText: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 6 },
  dateGroup: {
    backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EBEBEB', marginBottom: 12, elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME_SURFACE, paddingHorizontal: 15, paddingVertical: 10,
  },
  dateText:  { fontWeight: 'bold', color: THEME_DARK, fontSize: 13 },
  countBadge: {
    backgroundColor: THEME_COLOR, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  countText:   { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  recordCard:  { padding: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  recordTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  diseaseName: { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 2 },
  doshaText:   { fontSize: 11, color: TEXT_SECONDARY },
  confidenceBadge: {
    backgroundColor: THEME_SURFACE, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: THEME_LIGHT,
  },
  confidenceText: { color: THEME_DARK, fontWeight: 'bold', fontSize: 13 },
  symptomsBox:    { backgroundColor: '#F8FAF8', borderRadius: 8, padding: 10, marginBottom: 8 },
  symptomsLabel:  { fontSize: 11, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 4 },
  symptomsText:   { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
  timeText:       { fontSize: 11, color: '#AAA' },
});

export default ProfileScreen;