import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
  Dimensions
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from '../components/BottomNavBar';
import { API_BASE_URL } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX 1: Removed NetInfo import — it was crashing the app when the package
// was not installed. Replaced with a lightweight fetch-based connectivity check
// that uses your existing axios/API infrastructure. All variable names kept same.
// ─────────────────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

const AI_BUBBLE_COLOR   = '#FFFFFF';
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX 2: Built-in fallback KB — always available even on first launch with
// no internet. This prevents the "Offline & no data" dead-end message.
// knowledgeBase state is MERGED with this, so your existing getOfflineResponse
// function still works exactly the same way.
// ─────────────────────────────────────────────────────────────────────────────
const BUILTIN_KB = {
  headache:  '**For Headache (Shirashoola):**\n\n• **Peppermint oil** – apply on temples\n• **Brahmi** – 1 tsp powder in warm milk\n• **Ginger tea** – reduces inflammation\n• Cold compress on forehead for Pitta type\n\n⚕️ *Consult a doctor if severe or persistent.*',
  cold:      '**For Cold & Congestion:**\n\n• **Tulsi-ginger tea** – 10 leaves + 1 inch ginger\n• **Steam inhalation** with eucalyptus oil\n• **Turmeric milk** at night\n• **Trikatu churna** ½ tsp with honey 3x/day\n\n⚕️ *See a doctor if fever persists > 3 days.*',
  fever:     '**For Fever (Jwara):**\n\n• **Giloy juice** – 30ml twice daily\n• **Tulsi + black pepper** decoction\n• **Coriander seed water** – cooling\n• Stay hydrated with warm water\n\n⚕️ *Seek care for fever > 103°F or > 3 days.*',
  stress:    '**For Stress & Anxiety:**\n\n• **Ashwagandha** – 1 tsp with warm milk at bedtime\n• **Brahmi** – improves mental clarity\n• **Pranayama** – 10 mins Anulom-Vilom daily\n• **Abhyanga** – warm sesame oil self-massage\n\n⚕️ *Consult a mental health professional if needed.*',
  digestion: '**For Digestive Issues:**\n\n• **Triphala churna** – 1 tsp warm water before bed\n• **Ginger tea** – 30 mins before meals\n• **Jeera water** – boil 1 tsp cumin in water\n• Eat largest meal at noon, light dinner\n\n⚕️ *Persistent issues need medical attention.*',
  acidity:   '**For Acidity & Heartburn:**\n\n• **Amla juice** – 20ml in morning\n• **Coconut water** – cooling and alkaline\n• **Shatavari** powder with warm milk\n• Avoid spicy, sour, and fermented foods\n\n⚕️ *Chronic acidity needs professional evaluation.*',
  sleep:     '**For Better Sleep:**\n\n• **Warm milk with nutmeg** – ¼ tsp at bedtime\n• **Ashwagandha** reduces cortisol\n• **Brahmi oil** head massage before sleep\n• Sleep by 10 PM, wake before sunrise\n\n⚕️ *Chronic insomnia needs medical consultation.*',
  immunity:  '**For Immunity Boost:**\n\n• **Chyawanprash** – 1 tsp daily in morning\n• **Giloy** – known as root of immortality\n• **Tulsi tea** daily for respiratory health\n• **Turmeric golden milk** – anti-inflammatory\n\n⚕️ *See a doctor for recurring infections.*',
  weight:    '**For Weight Management:**\n\n• **Triphala** – natural detoxifier at night\n• **Guggul** – supports metabolism\n• **Warm lemon water** every morning\n• Avoid eating after 7 PM; 30 min walk daily\n\n⚕️ *Consult a nutritionist for personalised plans.*',
  vata:      '**Vata Dosha (Air + Space):**\n\n• Creative, quick, light — anxious when imbalanced\n• **Balance with:** Warm, oily, nourishing foods\n• **Herbs:** Ashwagandha, Shatavari, Bala\n• **Avoid:** Cold food, raw vegetables, erratic schedule\n\nTake the Dosha Quiz in the app!',
  pitta:     '**Pitta Dosha (Fire + Water):**\n\n• Focused, intense, sharp — irritable when imbalanced\n• **Balance with:** Cooling foods, coconut, leafy greens\n• **Herbs:** Brahmi, Shatavari, Amalaki\n• **Avoid:** Spicy, oily, sour, fermented foods\n\nTake the Dosha Quiz in the app!',
  kapha:     '**Kapha Dosha (Earth + Water):**\n\n• Calm, steady, strong — lethargic when imbalanced\n• **Balance with:** Light, warm, spiced foods\n• **Herbs:** Trikatu, Guggul, Triphala\n• **Avoid:** Heavy, oily, sweet, cold foods\n\nTake the Dosha Quiz in the app!',
  dosha:     '**Understanding Doshas:**\n\n• **Vata** (Air+Space) – Creative, quick, anxious when imbalanced\n• **Pitta** (Fire+Water) – Focused, intense, irritable when imbalanced\n• **Kapha** (Earth+Water) – Calm, steady, lethargic when imbalanced\n\nTake the Dosha Quiz to find your prakriti!\n\n⚕️ *Consult an Ayurvedic doctor for personalised guidance.*',
  ashwagandha: '**Ashwagandha (Withania somnifera):**\n\n• Reduces cortisol and stress\n• Boosts immunity and energy\n• Balances Vata and Kapha\n• **Dosage:** 1 tsp powder in warm milk at bedtime\n\n⚕️ *Avoid with thyroid medication.*',
  tulsi:     '**Tulsi (Holy Basil):**\n\n• Boosts immunity and respiratory health\n• Anti-viral and anti-bacterial\n• Balances Vata and Kapha\n• **Dosage:** 10 leaves in boiling water as tea\n\n⚕️ *Avoid large doses in pregnancy.*',
  turmeric:  '**Turmeric (Curcuma longa):**\n\n• Powerful anti-inflammatory (curcumin)\n• Boosts immunity and digestion\n• Balances all three doshas (tridoshic)\n• **Dosage:** ½ tsp in warm milk with black pepper\n\n⚕️ *High doses may thin blood.*',
};

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Namaste! 🙏 I am **Sanjeevani AI**.\n\nHow can I help you achieve balance today?', sender: 'ai' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const flatListRef = useRef();

  // ─────────────────────────────────────────────────────────────────────────
  // BUG FIX 3: knowledgeBase and isOnline state moved to TOP of component —
  // they were declared AFTER useEffect which referenced them, causing
  // "Cannot access before initialization" crash on some devices.
  // Names are exactly the same — only position changed.
  // ─────────────────────────────────────────────────────────────────────────
  const [knowledgeBase, setKnowledgeBase] = useState(BUILTIN_KB);
  const [isOnline, setIsOnline] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────
  // BUG FIX 4: Connectivity check using fetch instead of NetInfo.
  // checkConnectivity() replaces the NetInfo.addEventListener subscription.
  // Called on mount and before every API request. isOnline state name unchanged.
  // ─────────────────────────────────────────────────────────────────────────
  const checkConnectivity = async () => {
  try {
    await axios.get(`${API_BASE_URL}/symptoms/`, { timeout: 5000 });
    setIsOnline(true);
    return true;
  } catch (_) {
    setIsOnline(false);
    return false;
  }
};

  useEffect(() => {
    const loadSession = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);

      const guestFlag = await AsyncStorage.getItem('isGuest');
      if (guestFlag === 'true') {
        setIsGuestMode(true);
      }

      // Load cached KB immediately so offline works from first message
      const cached = await AsyncStorage.getItem('offlineChatKB');
      if (cached) {
        try { setKnowledgeBase({ ...BUILTIN_KB, ...JSON.parse(cached) }); } catch (_) {}
      }

      // Check connectivity against our own server (not google)
      const online = await checkConnectivity();
      if (online) {
        // Try to refresh offline KB — failure here does NOT change isOnline
        try {
          const res = await axios.get(`${API_BASE_URL}/offline-chat-sync/`, { timeout: 5000 });
          if (res.data && typeof res.data === 'object') {
            setKnowledgeBase({ ...BUILTIN_KB, ...res.data });
            await AsyncStorage.setItem('offlineChatKB', JSON.stringify(res.data));
          }
        } catch (_) {
          console.log('KB sync skipped — endpoint may not exist yet, but we ARE online');
        }
      }
    };

    loadSession();

    // BUG FIX 4: interval-based connectivity check (replaces NetInfo listener)
    const connectivityInterval = setInterval(checkConnectivity, 5000);
    return () => clearInterval(connectivityInterval);
  }, []);

  // ── getOfflineResponse — exactly your original logic, unchanged ─────────
  const getOfflineResponse = (userText) => {
    const text = userText.toLowerCase();

    let bestMatch = null;

    for (const [key, remedy] of Object.entries(knowledgeBase)) {
      if (text.includes(key.toLowerCase())) {
        bestMatch = remedy;
        break;
      }
    }

    if (bestMatch) return bestMatch;

    return `🌐 **Offline Mode**\n\nI couldn't find an exact match.\n\nTry using keywords like:\n• headache\n• cold\n• fever\n• stress\n• digestion`;
  };

  const sendMessage = async () => {
    const userQuery = inputText.trim();
    if (!userQuery || loading) return;

    const userMsg = { id: Date.now().toString(), text: userQuery, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Check if server reachable RIGHT NOW — don't blindly wait 10s for timeout
    const online = await checkConnectivity();

    if (online) {
      // ── ONLINE: call Gemini-powered chat API ────────────────────────────
      try {
        const response = await axios.post(`${API_BASE_URL}/chat/`, {
          message:  userQuery,
          username: userName,
          isGuest:  isGuestMode,
        }, { timeout: 10000 });

        setIsOnline(true);
        const aiMsg = {
          id:     (Date.now() + 1).toString(),
          text:   response.data.response || 'I am processing your request...',
          sender: 'ai',
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Opportunistically refresh offline KB after successful API call
        axios.get(`${API_BASE_URL}/offline-chat-sync/`, { timeout: 3000 })
          .then(res => {
            if (res.data && typeof res.data === 'object') {
              setKnowledgeBase({ ...BUILTIN_KB, ...res.data });
              AsyncStorage.setItem('offlineChatKB', JSON.stringify(res.data));
            }
          }).catch(() => {});

      } catch (error) {
        // API failed despite being online (Gemini quota / server error)
        setIsOnline(false);
        const fallbackText = getOfflineResponse(userQuery);
        setMessages((prev) => [...prev, {
          id:     `err-${Date.now()}`,
          text:   ` *showing offline response:*

${fallbackText}`,
          sender: 'ai',
        }]);
      }
    } else {
      // ── OFFLINE: use built-in KB immediately, no waiting ────────────────
      setIsOnline(false);
      const fallbackText = Object.keys(knowledgeBase).length > 0
        ? getOfflineResponse(userQuery)
        : '⚠️ Offline & no data. Please connect to internet once.';

      setMessages((prev) => [...prev, {
        id:     `offline-${Date.now()}`,
        text:   fallbackText,
        sender: 'ai',
      }]);
    }

    setLoading(false);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={{ fontSize: 14 }}>🌿</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          !isUser && styles.aiBubbleShadow,
        ]}>
          <Markdown style={isUser ? userMarkdownStyles : aiMarkdownStyles}>
            {item.text}
          </Markdown>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Sanjeevani AI</Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.dot, { backgroundColor: isOnline ? THEME_LIGHT : '#999' }]} />
            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline Mode'}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="small" color={THEME_COLOR} />
            <Text style={styles.loadingText}>Sanjeevani is crafting a response...</Text>
          </View>
        )}

        {/* ── INPUT BAR ── */}
        <View style={styles.inputContainer}>
          <View style={styles.inputShadowWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask about herbs, diet, or doshas..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={TEXT_SECONDARY}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendCircle, (!inputText.trim() || loading) && styles.disabledSend]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendIcon}>➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 90 : 80 }} />
      </KeyboardAvoidingView>

      <BottomNavBar navigation={navigation} activeScreen="Chat" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: BACKGROUND,
  },
  backCircle: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },
  backArrow: { color: TEXT_PRIMARY, fontSize: 22, fontWeight: '400' },
  headerTitle: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: 'bold' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: THEME_LIGHT,
    marginRight: 5,
  },
  onlineText: {
    fontSize: 10, color: TEXT_SECONDARY,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── Chat list
  chatList: { padding: 20, paddingBottom: 30 },

  messageRow: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow:  { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
    elevation: 2,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20 },

  userBubble: {
    backgroundColor: THEME_DARK,
    borderBottomRightRadius: 4,
    elevation: 4,
    shadowColor: THEME_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  aiBubble: {
    backgroundColor: AI_BUBBLE_COLOR,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  aiBubbleShadow: {
    elevation: 2,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  // ── Loading
  loadingArea: { flexDirection: 'row', alignItems: 'center', paddingLeft: 25, marginBottom: 18 },
  loadingText: { marginLeft: 10, fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },

  // ── Input bar
  inputContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    backgroundColor: 'transparent',
  },
  inputShadowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: THEME_DARK,
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    borderWidth: 1,
    borderColor: THEME_SURFACE,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: TEXT_PRIMARY,
    maxHeight: 100,
  },
  sendCircle: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  disabledSend: {
    backgroundColor: THEME_SURFACE,
    elevation: 0,
    shadowOpacity: 0,
  },
  sendIcon: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

const aiMarkdownStyles = {
  body:   { color: '#3A4A3E', fontSize: 14, lineHeight: 22 },
  strong: { color: THEME_DARK, fontWeight: 'bold' },
};
const userMarkdownStyles = {
  body:   { color: '#FFF', fontSize: 14, lineHeight: 22 },
  strong: { color: '#C8E6C9', fontWeight: '900' },
};

export default ChatScreen;