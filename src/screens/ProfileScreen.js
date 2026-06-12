import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, flat } from '../theme';
import { ADMIN_EMAIL } from '../config';
import { supabase } from '../supabase';
import { UserIcon, HeartTabIcon, MapTabIcon, GearIcon } from '../components/Icons';
import Svg, { Path } from 'react-native-svg';

function ChatIcon({ size = 22, color = FOREST }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </Svg>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState(null);
  const [stats, setStats]     = useState({ zones: 0, comments: 0, saved: 0 });
  const [loading, setLoading]      = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl]     = useState(null);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const s = data.session ?? null;
    setSession(s);

    if (s) {
      const [z, c, f, p] = await Promise.all([
        supabase.from('zones').select('id', { count: 'exact', head: true }).eq('created_by', s.user.id),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', s.user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', s.user.id),
        supabase.from('profiles').select('display_name, avatar_url').eq('id', s.user.id).maybeSingle(),
      ]);
      setStats({ zones: z.count ?? 0, comments: c.count ?? 0, saved: f.count ?? 0 });
      setDisplayName(p.data?.display_name ?? '');
      setAvatarUrl(p.data?.avatar_url ?? null);
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      'Se eliminarán todos tus datos: comentarios, zonas guardadas y perfil. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteAccount },
      ]
    );
  }

  async function deleteAccount() {
    if (!session) return;
    const uid = session.user.id;
    await Promise.all([
      supabase.from('profiles').delete().eq('id', uid),
      supabase.from('favorites').delete().eq('user_id', uid),
      supabase.from('comments').delete().eq('user_id', uid),
    ]);
    await supabase.auth.signOut();
    setSession(null);
  }

  const avatar = session?.user?.email?.[0]?.toUpperCase() ?? '?';
  const email  = session?.user?.email ?? '';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: OAT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={FOREST} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Text style={s.title}>Perfil</Text>
        </View>
        <View style={s.emptyWrap}>
          <View style={s.avatarPlaceholder}>
            <UserIcon size={36} color={MUTED} />
          </View>
          <Text style={s.emptyTitle}>¿Eres de los nuestros?</Text>
          <Text style={s.emptySub}>Inicia sesión para ver tu perfil, zonas añadidas y favoritos</Text>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Auth')} activeOpacity={0.9}>
            <Text style={s.loginBtnText}>Iniciar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Auth')} activeOpacity={0.7} style={{ marginTop: 12 }}>
            <Text style={{ color: FOREST, fontWeight: '700', fontSize: 14 }}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Perfil</Text>
      </View>

      <ScrollView style={{ backgroundColor: OAT }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>

        {/* Avatar + email */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 2 }} />
              : <Text style={s.avatarText}>{avatar}</Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.emailText} numberOfLines={1}>{displayName || email}</Text>
            {displayName ? <Text style={s.memberText} numberOfLines={1}>{email}</Text> : null}
            <Text style={s.memberText}>Miembro de Sniffr</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={s.editBtn} activeOpacity={0.8}>
            <Text style={s.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <MapTabIcon size={22} color={FOREST} />
            <Text style={s.statNum}>{stats.zones}</Text>
            <Text style={s.statLabel}>Zonas{'\n'}en la app</Text>
          </View>
          <View style={s.statCard}>
            <ChatIcon size={22} color={FOREST} />
            <Text style={s.statNum}>{stats.comments}</Text>
            <Text style={s.statLabel}>Comentarios{'\n'}publicados</Text>
          </View>
          <View style={s.statCard}>
            <HeartTabIcon size={22} color={TERRA} />
            <Text style={s.statNum}>{stats.saved}</Text>
            <Text style={s.statLabel}>Zonas{'\n'}guardadas</Text>
          </View>
        </View>

        {/* Admin panel — only for admin */}
        {session?.user?.email === ADMIN_EMAIL && (
          <TouchableOpacity style={[s.actionBtn, { borderColor: FOREST }]} activeOpacity={0.85}
            onPress={() => navigation.navigate('Admin')}>
            <GearIcon size={18} color={FOREST} />
            <Text style={[s.actionText, { color: FOREST }]}>Moderación de zonas</Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.85}
          onPress={() => navigation.navigate('Saved')}>
          <HeartTabIcon size={18} color={TERRA} />
          <Text style={s.actionText}>Ver mis guardados</Text>
          <Text style={s.actionChevron}>›</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={[s.actionBtn, { marginTop: 8 }]} activeOpacity={0.85} onPress={signOut}>
          <Text style={[s.actionText, { color: TERRA }]}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={[s.actionBtn, { marginTop: 4, borderColor: TERRA }]} activeOpacity={0.85} onPress={confirmDeleteAccount}>
          <Text style={[s.actionText, { color: TERRA }]}>Eliminar cuenta</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SAND },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: SAND, borderBottomWidth: 2, borderColor: INK },
  title:  { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.8 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 16, ...flat,
  },
  avatar:     { width: 56, height: 56, borderRadius: 2, backgroundColor: FOREST, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
  avatarText: { fontSize: 24, fontWeight: '800', color: WHITE },
  emailText:  { fontSize: 15, fontWeight: '700', color: INK },
  editBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2, borderWidth: 2, borderColor: INK, backgroundColor: OAT, ...flat },
  editBtnText:{ fontSize: 12, fontWeight: '700', color: INK },
  memberText: { fontSize: 12, color: MUTED, marginTop: 2 },

  statsRow:  { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 14, alignItems: 'center', gap: 6, ...flat },
  statNum:   { fontSize: 24, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 15 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 16, ...flat },
  actionText:   { flex: 1, fontSize: 15, fontWeight: '600', color: INK },
  actionChevron:{ fontSize: 20, color: MUTED },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: OAT, gap: 12 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 2, backgroundColor: SAND, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: INK, textAlign: 'center', letterSpacing: -0.4 },
  emptySub:   { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },
  loginBtn:   { marginTop: 8, backgroundColor: FOREST, borderRadius: 2, borderWidth: 2, borderColor: INK, paddingHorizontal: 28, paddingVertical: 14, ...flat },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});
