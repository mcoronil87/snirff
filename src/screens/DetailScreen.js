import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image,
  TextInput, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, SAND, FOREST, TERRA, SURFACE, OAT, MUTED, flat, CAT_META } from '../theme';
import { supabase } from '../supabase';
import PawRating from '../components/PawRating';
import {
  ChevLeftIcon, HeartIcon, HeartTabIcon, ShareIcon, MapPinFillIcon, LocationIcon, CAT_ICONS, PawIcon, FlagIcon,
} from '../components/Icons';

const WARM_GRADIENTS = {
  pip:   ['#2A4A1C', '#3D6B2A'],
  park:  ['#1E4A30', '#2D7048'],
  grass: ['#2E4A1A', '#4A7025'],
  cafe:  ['#6B3520', '#C05A34'],
};

// ─── Comment ─────────────────────────────────────────────────────────────────
function Comment({ comment, accentColor }) {
  const avatar = comment.user_email ? comment.user_email[0].toUpperCase() : '?';
  const date   = new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return (
    <View style={s.comment}>
      <View style={[s.avatar, { backgroundColor: accentColor }]}>
        <Text style={s.avatarText}>{avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.commentHeader}>
          <Text style={s.commentUser}>{comment.user_email?.split('@')[0] ?? 'Usuario'}</Text>
          <Text style={s.commentDate}>{date}</Text>
        </View>
        <View style={{ marginBottom: 6, marginTop: 4 }}>
          <PawRating rating={comment.rating} size={10} />
        </View>
        <Text style={s.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function DetailScreen({ route, navigation }) {
  const { zone } = route.params;
  const m = CAT_META[zone.cat];
  const insets = useSafeAreaInsets();
  const Icon = CAT_ICONS[zone.cat];
  const gradient = WARM_GRADIENTS[zone.cat] || WARM_GRADIENTS.park;
  const accentColor = zone.cat === 'cafe' ? TERRA : FOREST;
  const [comments, setComments]     = useState([]);
  const [showAddComment, setShowAdd] = useState(false);
  const [isSaved, setIsSaved]         = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => { fetchComments(); checkSaved(); }, [zone.id]);

  async function checkSaved() {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;
    const { data } = await supabase.from('favorites')
      .select('id').eq('user_id', s.session.user.id).eq('zone_id', zone.id).maybeSingle();
    setIsSaved(!!data);
  }

  function handleReport() { setShowReport(true); }

  async function submitReport(reason) {
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase.from('reports').insert({
      zone_id: zone.id,
      user_id: s.session?.user?.id ?? null,
      reason,
    });
    if (error) {
      Alert.alert('Error', 'No se pudo enviar el reporte. Inténtalo de nuevo.');
    } else {
      Alert.alert('Gracias', 'Tu reporte ha sido enviado. Lo revisaremos pronto.');
    }
  }

  async function toggleSaved() {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { navigation.navigate('Auth'); return; }
    if (isSaved) {
      await supabase.from('favorites').delete().eq('user_id', s.session.user.id).eq('zone_id', zone.id);
      setIsSaved(false);
    } else {
      await supabase.from('favorites').insert({ user_id: s.session.user.id, zone_id: zone.id });
      setIsSaved(true);
    }
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('zone_id', zone.id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { navigation.navigate('Auth'); return; }
    setSavingComment(true);
    const { error } = await supabase.from('comments').insert({
      zone_id: zone.id,
      user_id: sessionData.session.user.id,
      user_email: sessionData.session.user.email,
      text: commentText.trim(),
      rating: commentRating,
    });
    if (error) { console.error('Comment error:', error.message); setSavingComment(false); return; }
    setCommentText(''); setShowAdd(false);
    setSavingComment(false);
    fetchComments();
  }

  return (
    <View style={s.root}>
      {/* ── Hero ── */}
      <View style={s.hero}>
        {zone.cat === 'park' ? (
          <>
            <Image source={require('../../assets/santa-margarita.jpg')} style={s.heroImg} resizeMode="cover" />
            <View style={s.heroOverlay} />
          </>
        ) : (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <View style={{ height: insets.top + 8 }} />

        <View style={s.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={s.glassBtn}>
            <ChevLeftIcon size={22} color="white" />
          </TouchableOpacity>
          <View style={s.navActions}>
            <TouchableOpacity activeOpacity={0.8} style={s.glassBtn} onPress={toggleSaved}>
              {isSaved
                ? <HeartTabIcon size={18} color='#FF6B6B' />
                : <HeartIcon size={18} color='white' />
              }
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={s.glassBtn}>
              <ShareIcon size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={s.glassBtn} onPress={handleReport}>
              <FlagIcon size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.heroTitle}>
          <View style={s.categoryBadge}>
            {Icon && <Icon size={12} color="#263D1A" />}
            <Text style={s.categoryBadgeText}>{m.label.toUpperCase()}</Text>
          </View>
          <Text style={s.heroName}>{zone.name}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Info card */}
        <View style={s.infoCard}>
          <View style={s.ratingRow}>
            <PawRating rating={zone.rating} size={13} />
            <Text style={s.ratingNum}>{zone.rating}</Text>
            <Text style={s.ratingCount}>({zone.rev} reseñas)</Text>
            <View style={s.divider} />
            <MapPinFillIcon size={14} color={accentColor} />
            <Text style={[s.distText, { color: accentColor }]}>{zone.dist}</Text>
          </View>

          <View style={s.addressRow}>
            <LocationIcon size={16} color={MUTED} />
            <Text style={s.addressText}>{zone.address}</Text>
          </View>

          <View style={s.tags}>
            {zone.tags.map((tag, i) => (
              <View key={i} style={[s.tag, { backgroundColor: zone.cat === 'cafe' ? '#F5E6DC' : '#E4EDD8' }]}>
                <Text style={[s.tagText, { color: accentColor }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Descripción</Text>
          <Text style={s.descText}>{zone.desc}</Text>
        </View>

        {/* Comments */}
        <View style={[s.section, { borderBottomWidth: 0 }]}>
          <View style={s.commentsHeader}>
            <Text style={s.sectionLabel}>Comentarios</Text>
            <TouchableOpacity style={s.addCommentBtn} activeOpacity={0.7} onPress={() => setShowAdd(true)}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>+ Añadir</Text>
            </TouchableOpacity>
          </View>

          {/* Add comment modal */}
          <Modal visible={showAddComment} transparent animationType="slide">
            <View style={s.modalOverlay}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>Añadir comentario</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setCommentRating(n)}>
                      <PawIcon size={22} color={n <= commentRating ? '#59361A' : '#CEBB9A'} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={s.modalInput}
                  placeholder="Cuéntanos tu experiencia..."
                  placeholderTextColor={MUTED}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity style={[s.modalBtn, { flex: 1, backgroundColor: '#E4EDD8' }]} onPress={() => setShowAdd(false)}>
                    <Text style={{ fontWeight: '700', color: INK }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.modalBtn, { flex: 1, backgroundColor: accentColor }]} onPress={handleAddComment}>
                    {savingComment ? <ActivityIndicator color="white" /> : <Text style={{ fontWeight: '700', color: 'white' }}>Publicar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Report modal — centered dialog */}
          <Modal visible={showReport} transparent animationType="fade">
            <View style={s.reportOverlay}>
              <View style={s.reportDialog}>
                <Text style={s.reportDialogTitle}>Reportar zona</Text>
                <Text style={s.reportDialogSub}>Selecciona el motivo</Text>
                <View style={{ gap: 10, marginTop: 16 }}>
                  {['Contenido inapropiado', 'Información incorrecta', 'Zona duplicada'].map(reason => (
                    <TouchableOpacity key={reason} style={s.reportBtn} activeOpacity={0.85}
                      onPress={() => { setShowReport(false); submitReport(reason); }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: INK }}>{reason}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[s.reportBtn, { backgroundColor: OAT, marginTop: 4 }]} onPress={() => setShowReport(false)}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: MUTED }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {comments.length === 0
            ? <Text style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>Sé el primero en comentar</Text>
            : comments.map((cm) => (
                <Comment key={cm.id} comment={cm} accentColor={accentColor} />
              ))
          }
        </View>


      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SURFACE },

  hero: { height: 240, overflow: 'hidden', justifyContent: 'space-between', position: 'relative' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },

  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  navActions:{ flexDirection: 'row', gap: 12 },
  glassBtn: {
    width: 42, height: 42, backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: INK, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 3,
  },
  heroTitle: { padding: 20, paddingBottom: 24 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 50,
    paddingHorizontal: 10, paddingLeft: 8, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  categoryBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#101A0C', letterSpacing: 0.4 },
  heroName: { fontSize: 26, fontWeight: '800', color: 'white', letterSpacing: -0.6, lineHeight: 32 },

  infoCard: {
    backgroundColor: SAND, padding: 20,
    borderWidth: 2, borderColor: INK,
    marginTop: 0,
    ...flat,
  },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  ratingNum:   { fontSize: 16, fontWeight: '800', color: INK, marginLeft: 2 },
  ratingCount: { fontSize: 13, color: MUTED },
  divider:     { width: 1, height: 14, backgroundColor: INK, opacity: 0.2, marginHorizontal: 6 },
  distText:    { fontSize: 14, fontWeight: '700' },
  addressRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  addressText: { fontSize: 14, color: MUTED, flex: 1 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderRadius: 2, borderWidth: 2, borderColor: INK,
    paddingHorizontal: 12, paddingVertical: 6,
    ...flat,
  },
  tagText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  section: {
    backgroundColor: SAND, marginTop: 8,
    borderWidth: 2, borderColor: INK,
    padding: 20,
    ...flat,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: INK,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, opacity: 0.5,
  },
  descText: { fontSize: 15, color: INK, lineHeight: 24, letterSpacing: -0.1 },

  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  addCommentBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 2, borderWidth: 2, borderColor: INK,
    backgroundColor: '#C05A34',
    ...flat,
  },

  comment: {
    flexDirection: 'row', gap: 14, marginBottom: 20,
    borderBottomWidth: 1, borderColor: INK, paddingBottom: 16, opacity: 1,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 2,
    borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    ...flat,
  },
  avatarText:    { fontSize: 15, fontWeight: '700', color: 'white' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentUser:   { fontSize: 14.5, fontWeight: '700', color: INK },
  commentDate:   { fontSize: 12, color: MUTED },
  commentText:   { fontSize: 14, color: INK, lineHeight: 21, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#EDE6DB', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#101A0C', padding: 24, paddingTop: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: INK, marginBottom: 14 },
  modalInput:   { backgroundColor: '#CEBB9A', borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 12, fontSize: 14, color: INK, minHeight: 80 },
  modalBtn:     { height: 48, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  reportOverlay:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  reportDialog:      { backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 24, width: '100%', shadowColor: INK, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },
  reportDialogTitle: { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.4 },
  reportDialogSub:   { fontSize: 13, color: MUTED, marginTop: 4 },
  reportBtn:         { height: 50, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', backgroundColor: SAND, shadowColor: INK, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
});
