import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, DIST, flatSm as flat, CAT_META } from '../theme';
import { FILTER_CATS } from '../data';
import { supabase, mapZoneRow } from '../supabase';
import PawRating from '../components/PawRating';
import { SearchIcon, PawIcon, CAT_ICONS } from '../components/Icons';

// ─── Zone row ─────────────────────────────────────────────────────────────────
function ZoneRow({ zone, onPress }) {
  const m   = CAT_META[zone.cat];
  const Icon = CAT_ICONS[zone.cat];
  const accentColor = zone.cat === 'cafe' ? TERRA : FOREST;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.row}>
      {/* Icon box */}
      <View style={[s.rowIcon, { backgroundColor: accentColor }]}>
        {Icon && <Icon size={20} color="white" />}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        {/* Badge */}
        <View style={s.rowBadge}>
          <Text style={[s.rowBadgeText, { color: accentColor }]}>{m.label.toUpperCase()}</Text>
        </View>
        <Text style={s.rowName} numberOfLines={1}>{zone.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <PawRating rating={zone.rating} />
          <Text style={s.rowRating}>{zone.rating}</Text>
          <Text style={s.rowRev}>({zone.rev})</Text>
        </View>
        {zone.address ? (
          <Text style={s.rowAddress} numberOfLines={1}>{zone.address}</Text>
        ) : null}
      </View>

      {/* Distance */}
      <View style={s.rowDist}>
        <Text style={s.rowDistText}>{zone.dist}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ExploreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [zones, setZones]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [activeFilter, setFilter] = useState('all');

  useEffect(() => { fetchZones(); }, []);

  async function fetchZones() {
    setLoading(true);
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('status', 'approved')
      .order('rating', { ascending: false });

    if (!error && data) {
      setZones(data.map(mapZoneRow));
    }
    setLoading(false);
  }

  const filtered = zones.filter(z => {
    const matchCat  = activeFilter === 'all' || z.cat === activeFilter;
    const matchText = z.name.toLowerCase().includes(query.toLowerCase()) ||
                      (z.address || '').toLowerCase().includes(query.toLowerCase());
    return matchCat && matchText;
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>Explorar</Text>
        {query.length > 0 ? (
          <View style={s.searchTagRow}>
            <View style={s.searchTag}>
              <Text style={s.searchTagText}>{query}</Text>
              <TouchableOpacity onPress={() => setQuery('')} style={{ marginLeft: 4 }}>
                <Text style={s.searchTagX}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.sub}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        ) : (
          <Text style={s.sub}>{filtered.length} zonas a tu alrededor</Text>
        )}
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <SearchIcon size={16} color={MUTED} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar zona o dirección…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ fontSize: 16, color: MUTED, paddingHorizontal: 4 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filters ── */}
      <View style={s.filtersWrap}>
        {FILTER_CATS.map(cat => {
          const on = activeFilter === cat.id;
          return (
            <TouchableOpacity key={cat.id} onPress={() => setFilter(cat.id)} activeOpacity={0.8}
              style={[s.chip, on && s.chipActive]}>
              <Text style={[s.chipText, { color: on ? WHITE : INK }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={FOREST} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={z => String(z.id)}
          style={{ backgroundColor: OAT }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchZones}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <PawIcon size={24} color={MUTED} />
              <Text style={s.emptyText}>No hay zonas que coincidan</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ZoneRow zone={item} onPress={() => navigation.navigate('Detail', { zone: item })} />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: SAND },

  header:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: SAND },
  title:   { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.8 },
  sub:     { fontSize: 13, color: MUTED, marginTop: 2 },
  searchTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  searchTag:    { flexDirection: 'row', alignItems: 'center', backgroundColor: FOREST, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  searchTagText:{ fontSize: 12, fontWeight: '700', color: WHITE },
  searchTagX:   { fontSize: 14, color: WHITE, lineHeight: 16 },

  searchWrap: { backgroundColor: SAND, paddingHorizontal: 16, paddingBottom: 12 },
  searchBox:  { height: 46, backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, ...flat },
  searchInput:{ flex: 1, fontSize: 14, color: INK },

  filtersWrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: SAND, borderBottomWidth: 2, borderColor: INK },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2, borderWidth: 2, borderColor: INK, backgroundColor: OAT, ...flat },
  chipActive:  { backgroundColor: FOREST },
  chipText:    { fontSize: 12, fontWeight: '600' },

  listContent: { padding: 16, gap: 0 },
  separator:   { height: 2, backgroundColor: INK, opacity: 0.08, marginHorizontal: 4 },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 14, marginBottom: 10, ...flat },
  rowIcon:  { width: 44, height: 44, borderRadius: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBadge: { alignSelf: 'flex-start', backgroundColor: OAT, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 3 },
  rowBadgeText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  rowName:  { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  rowRating:{ fontSize: 11, fontWeight: '700', color: INK },
  rowRev:   { fontSize: 11, color: MUTED },
  rowAddress:{ fontSize: 12, color: MUTED, marginTop: 3 },
  rowDist:  { backgroundColor: DIST, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginLeft: 4 },
  rowDistText: { fontSize: 10, fontWeight: '700', color: '#EDE6DB' },

  empty:    { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:{ fontSize: 15, color: MUTED },
});
