import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, flatSm as flat, CAT_META } from '../theme';
import { supabase } from '../supabase';
import PawRating from '../components/PawRating';
import { CAT_ICONS, HeartTabIcon } from '../components/Icons';

function ZoneRow({ zone, onPress, onRemove }) {
  const m    = CAT_META[zone.cat];
  const Icon = CAT_ICONS[zone.cat];
  const accentColor = zone.cat === 'cafe' ? TERRA : FOREST;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: accentColor }]}>
        {Icon && <Icon size={20} color="white" />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.rowBadge}>
          <Text style={[s.rowBadgeText, { color: accentColor }]}>{m.label.toUpperCase()}</Text>
        </View>
        <Text style={s.rowName} numberOfLines={1}>{zone.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <PawRating rating={zone.rating} />
          <Text style={s.rowRating}>{zone.rating}</Text>
        </View>
        {zone.address ? <Text style={s.rowAddress} numberOfLines={1}>{zone.address}</Text> : null}
      </View>
      <TouchableOpacity onPress={onRemove} style={s.heartBtn} activeOpacity={0.7}>
        <HeartTabIcon size={20} color={TERRA} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SavedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [zones, setZones]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useFocusEffect(useCallback(() => {
    checkAndLoad();
  }, []));

  async function checkAndLoad() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    if (data.session) fetchFavorites(data.session.user.id);
    else setLoading(false);
  }

  async function fetchFavorites(userId) {
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('zone_id, zones(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      // f.zones is null when the favourited zone has been deleted
      setZones(data.filter(f => f.zones).map(f => ({
        ...f.zones,
        rating: parseFloat(f.zones.rating) || 0,
        rev: f.zones.review_count ?? 0,
        desc: f.zones.description || '',
        tags: f.zones.tags || [],
        comments: [],
        dist: '— m',
      })));
    }
    setLoading(false);
  }

  async function removeFavorite(zoneId) {
    if (!session) return;
    await supabase.from('favorites').delete()
      .eq('user_id', session.user.id)
      .eq('zone_id', zoneId);
    setZones(prev => prev.filter(z => z.id !== zoneId));
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Guardados</Text>
        <Text style={s.sub}>
          {session ? `${zones.length} zona${zones.length !== 1 ? 's' : ''} guardada${zones.length !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={FOREST} />
        </View>
      ) : !session ? (
        // Not logged in
        <View style={s.emptyWrap}>
          <HeartTabIcon size={40} color={MUTED} />
          <Text style={s.emptyTitle}>Inicia sesión para guardar zonas</Text>
          <Text style={s.emptySub}>Guarda tus lugares favoritos para encontrarlos fácilmente</Text>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Auth')} activeOpacity={0.9}>
            <Text style={s.loginBtnText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      ) : zones.length === 0 ? (
        // Logged in but no favorites
        <View style={s.emptyWrap}>
          <HeartTabIcon size={40} color={MUTED} />
          <Text style={s.emptyTitle}>Aún no tienes guardados</Text>
          <Text style={s.emptySub}>Pulsa el corazón en la ficha de cualquier zona para guardarla</Text>
        </View>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={z => String(z.id)}
          contentContainerStyle={{ padding: 16 }}
          style={{ backgroundColor: OAT }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ZoneRow
              zone={item}
              onPress={() => navigation.navigate('Detail', { zone: item })}
              onRemove={() => removeFavorite(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SAND },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: SAND, borderBottomWidth: 2, borderColor: INK },
  title:  { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.8 },
  sub:    { fontSize: 13, color: MUTED, marginTop: 2 },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 14, ...flat },
  rowIcon:  { width: 44, height: 44, borderRadius: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBadge: { alignSelf: 'flex-start', backgroundColor: OAT, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 3 },
  rowBadgeText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  rowName:  { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  rowRating:{ fontSize: 11, fontWeight: '700', color: INK },
  rowAddress:{ fontSize: 12, color: MUTED, marginTop: 3 },
  heartBtn: { padding: 6 },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: OAT, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: INK, textAlign: 'center', letterSpacing: -0.4 },
  emptySub:   { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },
  loginBtn:   { marginTop: 8, backgroundColor: FOREST, borderRadius: 2, borderWidth: 2, borderColor: INK, paddingHorizontal: 28, paddingVertical: 14, ...flat },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});
