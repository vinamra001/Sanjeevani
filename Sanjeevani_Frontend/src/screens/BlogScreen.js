import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Modal, ActivityIndicator, RefreshControl
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from '../components/BottomNavBar';
import { getAllBlogs, addLocalBlog } from '../utils/DatabaseInit';
import { TextInput } from 'react-native';
import { initDatabase } from '../utils/DatabaseInit';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = `${API_BASE_URL}/blogs/`;

// ── Category tag color map (backend returns category string)
const CATEGORY_COLORS = {
  Herbs:     { bg: '#E3F2FD', text: '#1565C0' },
  Wellness:  { bg: THEME_SURFACE, text: THEME_DARK },
  Diet:      { bg: '#FFF4E4', text: '#E65100' },
  Lifestyle: { bg: '#F3EEF9', text: '#6A1B9A' },
  Default:   { bg: THEME_SURFACE, text: THEME_DARK },
};

const getCategoryStyle = (category) =>
  CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;

const BlogScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([
  {
    id: '1',
    title: 'The Healing Power of Tulsi',
    excerpt: 'Discover how Tulsi leaves can boost immunity and reduce stress naturally.',
    category: 'Herbs',
    author: 'Dr. Sharma',
    readTime: '5 min',
    emoji: '🌿',
    content: 'Tulsi, also known as Holy Basil, has been revered in Ayurveda for centuries. Its leaves contain compounds that support the immune system, reduce stress, and promote overall wellness. Regular consumption in tea or as a supplement can improve respiratory health and aid in digestion.',
    diagram_caption: 'Tulsi leaves and their benefits',
  },
  {
    id: '2',
    title: 'Morning Routines for Wellness',
    excerpt: 'Simple Ayurvedic morning habits to energize your body and mind.',
    category: 'Wellness',
    author: 'Anita Kapoor',
    readTime: '7 min',
    emoji: '☀️',
    content: 'Start your day with a glass of warm water and a few deep breaths. Follow with gentle stretching or yoga, and practice mindfulness meditation for 5–10 minutes. Incorporating these habits daily can improve mental clarity, digestion, and energy levels.',
    diagram_caption: '',
  }
]);

  
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');

  const fetchBlogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const localBlogs = await getAllBlogs();
      let remoteBlogs = [];
      try {
          const response = await axios.get(API_URL, { timeout: 3000 });
          remoteBlogs = response.data || [];
      } catch (e) {
          console.warn("Could not load backend blogs. Using only local ones.");
      }
      
      const allBlogs = [...localBlogs, ...remoteBlogs];
      setPosts(allBlogs);
    } catch (e) {
      setError('Could not load articles. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  const handlePublishOffline = async () => {
    if (!newBlogTitle.trim() || !newBlogContent.trim()) {
      Alert.alert('Incomplete', 'Please enter both title and content.');
      return;
    }
    
    await addLocalBlog(newBlogTitle, 'Wellness', 'You (Offline)', 'A local reflection on wellness.', newBlogContent);
    setIsWriteModalVisible(false);
    setNewBlogTitle('');
    setNewBlogContent('');
    fetchBlogs();
  };

  useEffect(() => {
  const setup = async () => {
    await initDatabase();   // Initialize DB first
    fetchBlogs();           // Now safe to fetch blogs
  };
  setup();
}, []);

  // ── Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ayurvedic Insights</Text>
          <View style={styles.searchIcon}><Text style={{ fontSize: 18 }}>🔍</Text></View>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.centerStateText}>Loading articles...</Text>
        </View>
        <BottomNavBar navigation={navigation} activeScreen="Blog" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayurvedic Insights</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBlogs(true)}
            colors={[THEME_COLOR]}
            tintColor={THEME_COLOR}
          />
        }
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
           <Text style={styles.sectionHeading}>Featured Stories</Text>
           <TouchableOpacity 
              style={{ backgroundColor: THEME_COLOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
              onPress={() => setIsWriteModalVisible(true)}
           >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>+ Write Blog</Text>
           </TouchableOpacity>
        </View>

        {/* ── ERROR STATE ── */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>🌿</Text>
            <Text style={styles.errorTitle}>Couldn't load articles</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBlogs()}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          // ── EMPTY STATE ──
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>📖</Text>
            <Text style={styles.errorTitle}>No articles yet</Text>
            <Text style={styles.errorBody}>Check back soon for Ayurvedic insights.</Text>
          </View>
        ) : (
          // ── BLOG CARDS ──
          posts.map((post) => {
            const catStyle = getCategoryStyle(post.category);
            return (
              <TouchableOpacity
                key={post.id}
                style={styles.blogCard}
                activeOpacity={0.95}
                onPress={() => setSelectedPost(post)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.textSection}>
                    <View style={[styles.tag, { backgroundColor: catStyle.bg }]}>
                      <Text style={[styles.tagText, { color: catStyle.text }]}>{post.category}</Text>
                    </View>
                    <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                    <Text style={styles.excerpt} numberOfLines={2}>{post.excerpt}</Text>
                  </View>
                  <View style={styles.emojiContainer}>
                    <Text style={styles.cardEmoji}>{post.emoji || '🌿'}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>By {post.author} • {post.readTime}</Text>
                  <Text style={styles.readMoreText}>Read Now</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── READING MODAL ── */}
      <Modal
        animationType="slide"
        visible={selectedPost !== null}
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeCircle}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Article</Text>
            <TouchableOpacity><Text style={{ fontSize: 20 }}>📤</Text></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalCategory}>{selectedPost?.category}</Text>
            <Text style={styles.modalTitle}>{selectedPost?.title}</Text>

            <View style={styles.authorBadge}>
              <View style={styles.authorAvatar}><Text>👨‍⚕️</Text></View>
              <View>
                <Text style={styles.modalAuthor}>{selectedPost?.author}</Text>
                <Text style={styles.modalTime}>{selectedPost?.readTime} read</Text>
              </View>
            </View>

            {selectedPost?.diagram_caption && (
              <View style={styles.diagramArea}>
                <Text style={styles.diagramCaption}>{selectedPost.diagram_caption}</Text>
              </View>
            )}

            <Text style={styles.fullContentText}>{selectedPost?.content}</Text>

            <View style={styles.articleEnd}>
              <View style={styles.divider} />
              <Text style={styles.endText}>End of Article</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── WRITE BLOG MODAL ── */}
      <Modal
        animationType="slide"
        visible={isWriteModalVisible}
        onRequestClose={() => setIsWriteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsWriteModalVisible(false)} style={styles.closeCircle}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Write New Blog</Text>
            <View style={{ width: 36 }} />
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 25 }}>
             <TextInput 
                style={{ fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#ebebeb', paddingBottom: 10, marginBottom: 20 }}
                placeholder="Give it a catchy title..."
                value={newBlogTitle}
                onChangeText={setNewBlogTitle}
                placeholderTextColor="#999"
             />
             <TextInput 
                style={{ fontSize: 16, lineHeight: 26, textAlignVertical: 'top', minHeight: 200 }}
                placeholder="Share your Ayurvedic wellness tips here..."
                value={newBlogContent}
                onChangeText={setNewBlogContent}
                multiline
                placeholderTextColor="#999"
             />
             
             <TouchableOpacity style={{ backgroundColor: THEME_COLOR, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30 }} onPress={handlePublishOffline}>
               <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Publish Offline</Text>
             </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <BottomNavBar navigation={navigation} activeScreen="Blog" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: BACKGROUND,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: TEXT_PRIMARY },
  searchIcon: {
    padding: 8, backgroundColor: '#FFF', borderRadius: 12,
    elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 5,
  },

  // ── States
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerStateText: { marginTop: 12, color: TEXT_SECONDARY, fontSize: 14 },
  errorBox: {
    alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30,
  },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 8 },
  errorBody:  { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 20, backgroundColor: THEME_COLOR,
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14,
  },
  retryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // ── Scroll
  scrollContent: { padding: 20 },
  sectionHeading: {
    fontSize: 13, fontWeight: '800', color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15,
  },

  // ── Blog Card
  blogCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,                 // was 24
    padding: 20, marginBottom: 18,   // was 20
    elevation: 4,
    shadowColor: THEME_DARK,         // was #000
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08, shadowRadius: 12,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between' },
  textSection: { flex: 1, paddingRight: 10 },
  tag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 10,
  },
  tagText:   { fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' },
  postTitle: { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY, lineHeight: 24, marginBottom: 8 },
  excerpt:   { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  emojiContainer: {
    width: 58, height: 58,
    backgroundColor: THEME_SURFACE,  // was #F8FAF8
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji: { fontSize: 28 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F2F2F2',
  },
  footerText:   { color: '#AAA', fontSize: 12, fontWeight: '500' },
  readMoreText: { color: THEME_COLOR, fontWeight: 'bold', fontSize: 13 },

  // ── Modal
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
  },
  closeCircle: {
    width: 36, height: 36, borderRadius: 10,   // squircle
    backgroundColor: THEME_SURFACE, justifyContent: 'center', alignItems: 'center',
  },
  closeIcon:        { fontSize: 16, color: TEXT_PRIMARY },
  modalHeaderTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },

  modalScroll:   { padding: 25 },
  modalCategory: {
    fontSize: 12, fontWeight: 'bold', color: THEME_LIGHT,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  modalTitle: {
    fontSize: 28, fontWeight: 'bold', color: TEXT_PRIMARY,
    lineHeight: 38, marginBottom: 20,
  },

  authorBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  authorAvatar: {
    width: 44, height: 44, borderRadius: 13,   // squircle
    backgroundColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  modalAuthor: { fontWeight: 'bold', fontSize: 15, color: TEXT_PRIMARY },
  modalTime:   { color: TEXT_SECONDARY, fontSize: 13 },

  diagramArea: {
    backgroundColor: THEME_SURFACE, borderRadius: 18, padding: 20, marginVertical: 20,
    alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#C8E6C9',
  },
  diagramCaption: { marginTop: 8, fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },

  fullContentText: { fontSize: 16, color: '#3A4A3E', lineHeight: 30 },
  articleEnd: { alignItems: 'center', marginTop: 50, marginBottom: 30 },
  divider: { width: 40, height: 3, backgroundColor: THEME_SURFACE, borderRadius: 2, marginBottom: 10 },
  endText: { fontSize: 11, color: '#AAA', textTransform: 'uppercase', letterSpacing: 2 },
});

export default BlogScreen;
