import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, TextInput, Alert, Modal, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
const THEME_COLOR   = '#2D7D46';
const THEME_DARK    = '#1E5C33';
const THEME_SURFACE = '#EAF4EC';
const BACKGROUND    = '#F7FAF8';
const TEXT_PRIMARY  = '#141F17';
const TEXT_SECONDARY= '#5A6E60';

const CATEGORIES = ['All', 'Remedy', 'Diet', 'Lifestyle', 'Herbs', 'Question'];
const CAT_ICONS  = { All: '🌿', Remedy: '💊', Diet: '🥗', Lifestyle: '🧘', Herbs: '🌱', Question: '❓' };
const CAT_COLORS = { Remedy: '#E8593C', Diet: '#2D7D46', Lifestyle: '#7B61FF', Herbs: '#0F8CC0', Question: '#FF9800' };

// Offline seed posts shown when no network
const SEED_POSTS = [
  { id: 's1', author: 'Dr. Ayur', category: 'Remedy', title: 'Ginger honey for sore throat',
    body: 'Mix 1 tsp fresh ginger juice with 1 tsp raw honey. Take 3x daily. Works in 24 hours for most Vata-Kapha types.', dosha: 'Vata', upvotes: 47, userUpvoted: false, time: '2 days ago' },
  { id: 's2', author: 'Priya_Wellness', category: 'Herbs', title: 'Brahmi for exam stress',
    body: 'Started taking Brahmi ghee 1 tsp with warm milk before bed. Memory improved noticeably in 2 weeks. Highly recommend for Pitta types.', dosha: 'Pitta', upvotes: 33, userUpvoted: false, time: '3 days ago' },
  { id: 's3', author: 'AyurMom', category: 'Diet', title: 'Morning Kapha ritual that works',
    body: 'Warm water with lemon + 10 min brisk walk before breakfast. Cut out dairy in the morning. Lost 3kg in a month without dieting!', dosha: 'Kapha', upvotes: 62, userUpvoted: false, time: '5 days ago' },
  { id: 's4', author: 'RaviVaid', category: 'Lifestyle', title: 'Oil pulling every morning',
    body: 'Sesame oil, 1 tbsp, swish for 15-20 minutes on empty stomach. Teeth whitened, gum problems gone. Ancient practice that truly works.', dosha: 'Vata', upvotes: 28, userUpvoted: false, time: '1 week ago' },
  { id: 's5', author: 'SunitaAyur', category: 'Question', title: 'Which herb for chronic fatigue?',
    body: 'Been feeling constantly tired for 3 months. Tried Ashwagandha but got mild headaches. Any suggestions for Vata-Pitta type?', dosha: 'Vata', upvotes: 15, userUpvoted: false, time: '1 week ago' },
];

const CommunityForumScreen = ({ navigation, route }) => {
  const { userName = '' } = route.params || {};
  const [dosha, setDosha] = useState(route.params?.dosha || 'General');
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showPostModal,  setShowPostModal]  = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'Remedy' });
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchGlobal = async () => {
        const p = await AsyncStorage.getItem('userPrakriti');
        if (p && p !== 'Unknown' && p !== 'Not Analyzed') setDosha(p);
      };
      fetchGlobal();
      // Load posts on focus if not loaded, or re-load
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/forum/posts/`, { timeout: 8000 });
      if (res.data && Array.isArray(res.data)) {
        const merged = mergePosts(res.data);
        setPosts(merged);
        await AsyncStorage.setItem('forum_posts', JSON.stringify(merged));
      } else throw new Error();
    } catch (_) {
      const cached = await AsyncStorage.getItem('forum_posts');
      setPosts(cached ? JSON.parse(cached) : SEED_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const mergePosts = (online) => {
    // Merge online posts with seed, avoiding duplicates by id
    const ids = new Set(online.map(p => p.id));
    const extras = SEED_POSTS.filter(p => !ids.has(p.id));
    return [...online, ...extras];
  };

  const handleUpvote = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasUpvoted = p.userUpvoted;
      return { ...p, upvotes: wasUpvoted ? p.upvotes - 1 : p.upvotes + 1, userUpvoted: !wasUpvoted };
    }));
    try {
      await axios.post(`${API_BASE_URL}/forum/upvote/`, { post_id: postId, username: userName }, { timeout: 5000 });
    } catch (_) {}
  };

  const handlePost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      Alert.alert('Fill all fields'); return;
    }
    setPosting(true);
    const post = {
      id:          Date.now().toString(),
      author:      userName || 'Anonymous',
      category:    newPost.category,
      title:       newPost.title.trim(),
      body:        newPost.body.trim(),
      dosha:       dosha,
      upvotes:     0,
      userUpvoted: false,
      time:        'Just now',
    };
    try {
      await axios.post(`${API_BASE_URL}/forum/posts/`, { ...post, username: userName }, { timeout: 8000 });
    } catch (_) {}
    const updated = [post, ...posts];
    setPosts(updated);
    await AsyncStorage.setItem('forum_posts', JSON.stringify(updated));
    setShowPostModal(false);
    setNewPost({ title: '', body: '', category: 'Remedy' });
    setPosting(false);
  };

  const filteredPosts = posts.filter(p => {
  const matchCat   = activeCategory === 'All' || p.category === activeCategory;
  const matchSearch= !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
                       || p.body.toLowerCase().includes(searchQuery.toLowerCase());
  return matchCat && matchSearch;
});

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Forum</Text>
        <TouchableOpacity style={styles.postBtn} onPress={() => setShowPostModal(true)}>
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search remedies, herbs..."
          placeholderTextColor="#AAA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={[styles.catScroll, { height: 60 }]}  // <- add height
  contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}  // align vertically
>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat}
            style={[styles.catChip, activeCategory === cat && { backgroundColor: CAT_COLORS[cat] || THEME_COLOR, borderColor: CAT_COLORS[cat] || THEME_COLOR }]}
            onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.catChipText, activeCategory === cat && { color: '#FFF' }]}>
              {CAT_ICONS[cat]} {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filteredPosts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyText}>No posts yet. Be the first to share a remedy!</Text>
            </View>
          ) : filteredPosts.map(post => {
            const catColor = CAT_COLORS[post.category] || THEME_COLOR;
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={[styles.catBadge, { backgroundColor: catColor + '20', borderColor: catColor }]}>
                    <Text style={[styles.catBadgeText, { color: catColor }]}>
                      {CAT_ICONS[post.category]} {post.category}
                    </Text>
                  </View>
                  {post.dosha && post.dosha !== 'General' && (
                    <View style={styles.doshaBadge}>
                      <Text style={styles.doshaBadgeText}>{post.dosha}</Text>
                    </View>
                  )}
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>

                <View style={styles.postFooter}>
                  <View style={styles.authorRow}>
                    <View style={styles.authorDot}>
                      <Text style={styles.authorDotText}>{(post.author || 'A')[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                  </View>
                  <TouchableOpacity style={[styles.upvoteBtn, post.userUpvoted && styles.upvoteBtnActive]}
                    onPress={() => handleUpvote(post.id)}>
                    <Text style={styles.upvoteIcon}>{post.userUpvoted ? '👍' : '👍'}</Text>
                    <Text style={[styles.upvoteCount, post.userUpvoted && { color: THEME_COLOR }]}>
                      {post.upvotes}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* New Post Modal */}
      <Modal visible={showPostModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Share a Remedy</Text>

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <TouchableOpacity key={cat}
                  style={[styles.catChip, newPost.category === cat && { backgroundColor: CAT_COLORS[cat] || THEME_COLOR, borderColor: 'transparent' }]}
                  onPress={() => setNewPost({...newPost, category: cat})}>
                  <Text style={[styles.catChipText, newPost.category === cat && { color: '#FFF' }]}>
                    {CAT_ICONS[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={newPost.title} onChangeText={v => setNewPost({...newPost, title: v})}
              placeholder="e.g., Tulsi tea for cold & cough" placeholderTextColor="#AAA" />

            <Text style={styles.fieldLabel}>Your Remedy / Experience *</Text>
            <TextInput style={[styles.input, styles.textArea]} value={newPost.body}
              onChangeText={v => setNewPost({...newPost, body: v})}
              placeholder="Share how it helped you, dosage, preparation..."
              placeholderTextColor="#AAA" multiline numberOfLines={5} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPostModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handlePost} disabled={posting}>
                {posting
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.saveModalBtnText}>Post</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: THEME_DARK, elevation: 6,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn:     { padding: 4 },
  backArrow:   { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  postBtn:     { backgroundColor: THEME_COLOR, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  postBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
                  margin: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
                  borderWidth: 1, borderColor: '#E8EEE8', elevation: 1 },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_PRIMARY },

  catScroll:   { maxHeight: 52, marginBottom: 8 },
  catChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                  borderColor: '#E0E0E0', backgroundColor: '#FFF', marginRight: 8 },
  catChipText: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  scroll:     { padding: 16 },
  emptyBox:   { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText:  { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center' },

  postCard:   { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14,
                 borderWidth: 1, borderColor: '#EBEBEB', elevation: 3,
                 shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  doshaBadge: { backgroundColor: THEME_SURFACE, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  doshaBadgeText: { fontSize: 11, color: THEME_DARK, fontWeight: '600' },
  postTime:   { fontSize: 11, color: TEXT_SECONDARY, marginLeft: 'auto' },
  postTitle:  { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 8 },
  postBody:   { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20, marginBottom: 14 },
  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow:  { flexDirection: 'row', alignItems: 'center' },
  authorDot:  { width: 26, height: 26, borderRadius: 13, backgroundColor: THEME_COLOR,
                 justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  authorDotText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  postAuthor: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },
  upvoteBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_SURFACE,
                 paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9' },
  upvoteBtnActive: { backgroundColor: '#D7F0DD', borderColor: THEME_COLOR },
  upvoteIcon: { fontSize: 14, marginRight: 4 },
  upvoteCount:{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle:   { fontSize: 20, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 18 },
  fieldLabel:   { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: '#F7FAF8', borderRadius: 12, padding: 14, fontSize: 15, color: TEXT_PRIMARY, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16 },
  textArea:     { height: 120, textAlignVertical: 'top' },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  cancelBtnText:{ color: TEXT_SECONDARY, fontWeight: '700', fontSize: 15 },
  saveModalBtn: { flex: 2, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: THEME_COLOR },
  saveModalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default CommunityForumScreen;
