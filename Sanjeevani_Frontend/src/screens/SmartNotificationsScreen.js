import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Switch, Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/translations';


const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_LIGHT   = '#4CAF72';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

// Dosha-specific reminder messages
const DOSHA_REMINDERS = {
  Vata: {
    morning:   { en: '🌅 Time for your warm oil massage (Abhyanga). Ground your Vata energy!',
                 hi: '🌅 अभ्यंग के लिए समय। अपनी वात ऊर्जा को स्थिर करें!',
                 mr: '🌅 अभ्यंगासाठी वेळ आला. तुमची वात ऊर्जा संतुलित करा!' },
    afternoon: { en: '☀️ Eat your main meal now. Warm, nourishing food balances Vata.',
                 hi: '☀️ अभी मुख्य भोजन करें। गर्म, पोषक भोजन वात को संतुलित करता है।',
                 mr: '☀️ आता मुख्य जेवण करा. उबदार, पौष्टिक अन्न वात संतुलित करते.' },
    evening:   { en: '🌙 Wind down with warm milk and nutmeg. Protect your Vata sleep.',
                 hi: '🌙 गर्म दूध और जायफल से आराम करें। वात की नींद की रक्षा करें।',
                 mr: '🌙 गरम दूध आणि जायफळाने विश्रांती घ्या. वात झोपेचे रक्षण करा.' },
  },
  Pitta: {
    morning:   { en: '🌅 Start with cool coconut water. Keep your Pitta fire balanced!',
                 hi: '🌅 ठंडे नारियल पानी से शुरुआत करें। पित्त को संतुलित रखें!',
                 mr: '🌅 थंड नारळ पाण्याने सुरुवात करा. तुमचा पित्त अग्नी संतुलित ठेवा!' },
    afternoon: { en: '☀️ Avoid spicy foods now. Bitter greens and cooling foods suit Pitta.',
                 hi: '☀️ मसालेदार भोजन से बचें। कड़वे साग और शीतल भोजन पित्त के लिए उचित है।',
                 mr: '☀️ आता मसालेदार अन्न टाळा. कडू भाज्या आणि थंड अन्न पित्तासाठी योग्य.' },
    evening:   { en: '🌙 Practice cooling pranayama — Sheetali breath for 5 minutes.',
                 hi: '🌙 शीतली प्राणायाम का अभ्यास करें — 5 मिनट के लिए।',
                 mr: '🌙 शीतली प्राणायाम करा — 5 मिनिटांसाठी.' },
  },
  Kapha: {
    morning:   { en: '🌅 Get up and move! 20 minutes of brisk walking energises Kapha.',
                 hi: '🌅 उठो और चलो! 20 मिनट की तेज सैर कफ को ऊर्जा देती है।',
                 mr: '🌅 उठा आणि चाला! 20 मिनिटांची जलद चाल कफाला ऊर्जा देते.' },
    afternoon: { en: '☀️ Skip heavy desserts. Light, spiced meals help Kapha metabolism.',
                 hi: '☀️ भारी मिठाई छोड़ें। हल्का, मसालेदार भोजन कफ चयापचय में मदद करता है।',
                 mr: '☀️ जड मिठाई टाळा. हलके, मसालेदार जेवण कफ चयापचयास मदत करते.' },
    evening:   { en: '🌙 Do not sleep before 10 PM. Engage your mind with reading or music.',
                 hi: '🌙 रात 10 बजे से पहले न सोएं। पढ़ने या संगीत से मन को व्यस्त रखें।',
                 mr: '🌙 रात्री 10 वाजण्यापूर्वी झोपू नका. वाचन किंवा संगीताने मन व्यस्त ठेवा.' },
  },
  'Vata-Pitta': {
    morning:   { en: '🌅 Keep a steady morning routine. Use almond oil for massage to calm and cool.', 
                 hi: '🌅 सुबह की दिनचर्या स्थिर रखें। बादाम के तेल का उपयोग करें।', 
                 mr: '🌅 सकाळची दिनचर्या स्थिर ठेवा. बदामाचे तेल वापरा.' },
    afternoon: { en: '☀️ Do not skip lunch! Eat something sweet and nourishing.', 
                 hi: '☀️ दोपहर का भोजन न छोड़ें! कुछ मीठा और पौष्टिक खाएं।', 
                 mr: '☀️ दुपारचे जेवण टाळू नका! काही गोड आणि पौष्टिक खा.' },
    evening:   { en: '🌙 Rest early tonight. Avoid overworking your mind before sleep.', 
                 hi: '🌙 आज रात जल्दी आराम करें। सोने से पहले दिमाग को ज्यादा न थकाएं।', 
                 mr: '🌙 आज रात्री लवकर विश्रांती घ्या. झोपेच्या आधी मनाला जास्त थकवू नका.' },
  },
  'Pitta-Kapha': {
    morning:   { en: '🌅 Wake up early before the heat. Exercise briskly but stay cool.', 
                 hi: '🌅 गर्मी से पहले जल्दी उठें। तेजी से व्यायाम करें लेकिन ठंडे रहें।', 
                 mr: '🌅 उष्णतेपूर्वी लवकर उठा. वेगाने व्यायाम करा पण थंड राहा.' },
    afternoon: { en: '☀️ Keep lunch light and cooling. Bitter greens are great today.', 
                 hi: '☀️ दोपहर का भोजन हल्का और शीतल रखें। कड़वे साग आज के लिए बढ़िया हैं।', 
                 mr: '☀️ दुपारचे जेवण हलके आणि थंड ठेवा. कडू भाज्या आजसाठी उत्तम आहेत.' },
    evening:   { en: '🌙 Engage in a relaxing hobby. Avoid heavy sweets before bed.', 
                 hi: '🌙 आराम करने वाले शौक अपनाएं। सोने से पहले भारी मिठाइयों से बचें।', 
                 mr: '🌙 विश्रांती घेणाऱ्या छंदांमध्ये गुंतून राहा. झोपण्यापूर्वी जड गोड पदार्थ टाळा.' },
  },
  'Vata-Kapha': {
    morning:   { en: '🌅 Drink warm spiced water. Get moving to shake off Kapha and ground Vata.', 
                 hi: '🌅 गर्म मसालेदार पानी पिएं। कफ को दूर करने और वात को स्थिर करने के लिए आगे बढ़ें।', 
                 mr: '🌅 गरम मसालेदार पाणी प्या. कफ दूर करण्यासाठी आणि वात स्थिर करण्यासाठी हालचाली करा.' },
    afternoon: { en: '☀️ Prefer warm, cooked meals. Avoid cold drinks to keep digestion strong.', 
                 hi: '☀️ गर्म, पका हुआ भोजन पसंद करें। पाचन को मजबूत रखने के लिए ठंडे पेय से बचें।', 
                 mr: '☀️ गरम, शिजवलेले जेवण पसंत करा. पचन मजबूत ठेवण्यासाठी थंड पेय टाळा.' },
    evening:   { en: '🌙 Stay warm tonight. Try some gentle yoga before a light early dinner.', 
                 hi: '🌙 आज रात गर्म रहें। हल्के शुरुआती रात के खाने से पहले कुछ कोमल योग का प्रयास करें।', 
                 mr: '🌙 आज रात्री उबदार राहा. लवकर हलके जेवण घेण्यापूर्वी काही हलके योग करा.' },
  },
  General: {
    morning:   { en: '🌅 Drink warm water with lemon to wake up your digestive fire.',
                 hi: '🌅 अपनी पाचन अग्नि जगाने के लिए नींबू के साथ गर्म पानी पिएं।',
                 mr: '🌅 पचन अग्नी जागृत करण्यासाठी लिंबाच्या रसासह गरम पाणी प्या.' },
    afternoon: { en: '☀️ Take a short walk after lunch to support your digestion.',
                 hi: '☀️ पाचन में सहायता के लिए दोपहर के भोजन के बाद थोड़ी देर चलें।',
                 mr: '☀️ पचनास मदत करण्यासाठी दुपारच्या जेवणानंतर थोडे चाला.' },
    evening:   { en: '🌙 Eat a light dinner before 7 PM. Let your body rest and repair.',
                 hi: '🌙 शाम 7 बजे से पहले हल्का रात का खाना खाएं।',
                 mr: '🌙 संध्याकाळी 7 वाजण्यापूर्वी हलके जेवण करा.' },
  },
};

const TIME_PRESETS = {
  morning:   ['06:00', '06:30', '07:00', '07:30', '08:00'],
  afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00'],
  evening:   ['19:00', '19:30', '20:00', '20:30', '21:00'],
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // This enables the audible alarm
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH, // Force high priority
  }),
});

const SmartNotificationsScreen = ({ navigation, route }) => {
  const { userName = '' } = route.params || {};
  const [dosha, setDosha] = useState(route.params?.dosha || 'General');
  const [lang, setLang] = useState(route.params?.lang || 'en');
  const t = translations[lang] || translations['en'];

  useFocusEffect(
    useCallback(() => {
      const fetchGlobal = async () => {
        const p = await AsyncStorage.getItem('userPrakriti');
        const l = await AsyncStorage.getItem('userLang');
        if (p) setDosha(p);
        if (l) setLang(l);
      };
      fetchGlobal();
    }, [])
  );

  const reminders = DOSHA_REMINDERS[dosha] || DOSHA_REMINDERS.General;

  const [enabled,  setEnabled]  = useState(false);
  const [times,    setTimes]    = useState({ morning: '07:00', afternoon: '13:00', evening: '20:00' });
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
  // Add the Android Channel configuration here
  const setupNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX, // Ensures "MAX" priority for alarms
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D7D46', // Your Sanjeevani theme color
      });
    }
  };

  setupNotifications();

  // Your existing code to load settings
  AsyncStorage.getItem('notifSettings').then(val => {
    if (val) {
      const parsed = JSON.parse(val);
      setEnabled(parsed.enabled || false);
      setTimes(parsed.times || times);
    }
  });
}, []);

  const handleSave = async () => {
  try {
    // 2. Request System Permissions (Required for Android 13+ and iOS)
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied", 
        "Sanjeevani needs notification permissions to send you Ayurvedic reminders."
      );
      return;
    }

    // 3. Cancel all previously scheduled alarms to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 4. Save settings to AsyncStorage for UI persistence
    const settings = { enabled, times, dosha };
    await AsyncStorage.setItem('notifSettings', JSON.stringify(settings));

    if (enabled) {
      const slots = ['morning', 'afternoon', 'evening'];
      
      for (const slot of slots) {
        const [hours, minutes] = times[slot].split(':').map(Number);
        
        // Get the translated message based on current language and Dosha
        const message = reminders[slot][lang] || reminders[slot]['en'];

        // 5. Schedule the Daily Recurring Alarm
       for (const slot of slots) {
  const [hours, minutes] = times[slot].split(':').map(Number);
  const message = reminders[slot][lang] || reminders[slot]['en'];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌿 Sanjeevani ${slot.charAt(0).toUpperCase() + slot.slice(1)} Ritual`,
      body: message,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      channelId: 'default', // Matches the channel created in your useEffect
    },
    trigger: {
      type: 'daily', // Changed from 'calendar' to 'daily' for Android stability
      hour: hours,
      minute: minutes,
      // repeats: true is automatically handled by the 'daily' type
    },
  });
}
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      
      Alert.alert(
        t.notif_saved || "Success", 
        "Your daily Ayurvedic alarms have been synchronized."
      );
    }
  } catch (e) {
    Alert.alert('Error', 'Failed to schedule alarms. Please try again.');
    console.error(e);
  }
};

  const SLOTS = [
    { key: 'morning',   label: t.notif_morning,   icon: '🌅', color: '#FF9800' },
    { key: 'afternoon', label: t.notif_afternoon,  icon: '☀️', color: '#F57C00' },
    { key: 'evening',   label: t.notif_evening,    icon: '🌙', color: '#1E5C33' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.notif_title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Dosha badge */}
        <View style={styles.doshaBanner}>
          <Text style={styles.doshaBannerText}>🌿 {dosha} Dosha Reminders</Text>
        </View>

        {/* Master toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>{enabled ? t.notif_enabled : t.notif_enable}</Text>
            <Text style={styles.toggleSub}>{t.notif_subtitle}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#E0E0E0', true: THEME_LIGHT }}
            thumbColor={enabled ? THEME_COLOR : '#FFF'}
          />
        </View>

        {/* Time slots */}
        {SLOTS.map(slot => (
          <View key={slot.key} style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotIcon}>{slot.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotMessage} numberOfLines={2}>
                  {reminders[slot.key][lang] || reminders[slot.key]['en']}
                </Text>
              </View>
            </View>

            {/* Time preset buttons */}
            <View style={styles.timeRow}>
              {TIME_PRESETS[slot.key].map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.timeChip,
                    times[slot.key] === preset && { backgroundColor: slot.color, borderColor: slot.color },
                  ]}
                  onPress={() => setTimes({ ...times, [slot.key]: preset })}
                >
                  <Text style={[
                    styles.timeChipText,
                    times[slot.key] === preset && { color: '#FFF' },
                  ]}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Permission note */}
        <Text style={styles.permNote}>
          ⓘ {t.notif_permission}
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, saved && { backgroundColor: THEME_DARK }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? t.notif_saved : t.notif_save}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  backBtn:     { padding: 4 },
  backArrow:   { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  scroll:      { padding: 20 },

  doshaBanner: {
    backgroundColor: THEME_SURFACE, borderRadius: 12, padding: 12,
    marginBottom: 18, borderWidth: 1, borderColor: '#C8E6C9', alignItems: 'center',
  },
  doshaBannerText: { color: THEME_DARK, fontWeight: '700', fontSize: 14 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#EBEBEB', elevation: 2,
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  toggleSub:   { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },

  slotCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#EBEBEB', elevation: 2,
  },
  slotHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  slotIcon:    { fontSize: 22, marginRight: 12, marginTop: 2 },
  slotLabel:   { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  slotMessage: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },

  timeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                   borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#F9F9F9' },
  timeChipText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },

  permNote: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center',
               marginBottom: 20, paddingHorizontal: 10, lineHeight: 18 },

  saveBtn: {
    backgroundColor: THEME_COLOR, paddingVertical: 17, borderRadius: 14,
    alignItems: 'center', elevation: 4,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default SmartNotificationsScreen;
