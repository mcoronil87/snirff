import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, PanResponder,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, DIST, flat,
  CAT_META,
} from '../theme';
import { supabase, mapZoneRow } from '../supabase';
import { CORUNA } from '../config';
import { FILTER_CATS } from '../data';
import PawRating from '../components/PawRating';
import { SearchIcon, LayersIcon, ChevRightIcon, PawIcon, CAT_ICONS } from '../components/Icons';

// Re-compute distances only after moving this far (metres)
const MIN_MOVE_M = 25;

// ─── Haversine distance ───────────────────────────────────────────────────────
function distanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDistance(metres) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres/1000).toFixed(1)} km`;
}

function withDistances(zones, coords) {
  if (!coords) return zones;
  return zones.map(z => ({
    ...z,
    dist: (z.latitude && z.longitude)
      ? formatDistance(distanceMetres(coords.latitude, coords.longitude, z.latitude, z.longitude))
      : z.dist,
  }));
}

const PIN_COLORS = { pip: '#31553B', park: '#31553B', grass: '#3D6B2A', cafe: TERRA };

function CustomPin({ cat, selected }) {
  const Icon  = CAT_ICONS[cat];
  const color = PIN_COLORS[cat] || FOREST;
  const size  = selected ? 44 : 38;
  return (
    <View style={[
      styles.pinCircle,
      { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
      selected && styles.pinSelected,
    ]}>
      {Icon && <Icon size={selected ? 20 : 17} color="white" />}
    </View>
  );
}

// ─── Zone card ────────────────────────────────────────────────────────────────
function ZoneCard({ zone, onPress }) {
  const m = CAT_META[zone.cat];
  const Icon = CAT_ICONS[zone.cat];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
      <View style={styles.cardBadge}>
        {Icon && <Icon size={10} color={INK} />}
        <Text style={styles.cardBadgeText}>{m.label.toUpperCase()}</Text>
      </View>
      <Text style={styles.cardName} numberOfLines={1}>{zone.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <PawRating rating={zone.rating} size={10} />
        <Text style={styles.cardRating}>{zone.rating}</Text>
        <Text style={styles.cardRev}>({zone.rev})</Text>
      </View>
      <View style={styles.distTag}>
        <Text style={styles.distTagText}>{zone.dist}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelected] = useState(null);
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const userCoordsRef = useRef(null);
  const sheetAnim = useRef(new Animated.Value(1)).current; // 1=expanded, 0=collapsed

  const SHEET_EXPANDED  = 230; // approx height when open
  const SHEET_COLLAPSED = 54;  // handle + header only

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      if (g.dy > 10) {
        Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: false, speed: 20 }).start();
      } else if (g.dy < -10) {
        Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: false, speed: 20 }).start();
      }
    },
  })).current;

  const sheetHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_COLLAPSED, SHEET_EXPANDED],
  });

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    setLoading(true);
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('status', 'approved')
      .order('rating', { ascending: false });

    if (!error && data) {
      setZones(withDistances(data.map(mapZoneRow), userCoordsRef.current));
    }
    setLoading(false);
  }

  function handleUserLocation(e) {
    const coords = e.nativeEvent.coordinate;
    if (!coords) return;
    const prev = userCoordsRef.current;
    // Skip tiny movements to avoid recomputing distances on every GPS tick
    if (prev && distanceMetres(prev.latitude, prev.longitude, coords.latitude, coords.longitude) < MIN_MOVE_M) return;
    userCoordsRef.current = coords;
    setZones(z => withDistances(z, coords));
  }

  const filteredZones = activeFilter === 'all' ? zones : zones.filter(z => z.cat === activeFilter);
  const pins = filteredZones.filter(z => z.latitude && z.longitude);

  return (
    <View style={styles.root}>
      {/* ── Map ── */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_DEFAULT}
          mapType="mutedStandard"
          initialRegion={CORUNA}
          showsUserLocation={true}
          onUserLocationChange={handleUserLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {pins.map(zone => (
            <Marker
              key={zone.id}
              coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
              onPress={() => { setSelected(zone.id); navigation.navigate('Detail', { zone }); }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={selectedPin === zone.id}
            >
              <CustomPin cat={zone.cat} selected={selectedPin === zone.id} />
            </Marker>
          ))}
        </MapView>

        {/* Floating top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerRow}>
            <View style={styles.appNameWrap}>
              <Text style={styles.appName}>Sniffr</Text>
            </View>
            <TouchableOpacity style={styles.layersBtn} activeOpacity={0.8}
              onPress={() => mapRef.current?.animateToRegion(CORUNA, 800)}>
              <LayersIcon size={18} color={INK} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <SearchIcon size={16} color={MUTED} />
            <Text style={styles.searchPlaceholder}>¿A dónde olemos hoy?</Text>
          </View>
          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
              {FILTER_CATS.map(cat => {
                const on = activeFilter === cat.id;
                return (
                  <TouchableOpacity key={cat.id} onPress={() => setActiveFilter(cat.id)} activeOpacity={0.8}
                    style={[styles.chip, on && styles.chipActive]}>
                    <Text style={[styles.chipText, { color: on ? WHITE : INK, fontWeight: on ? '700' : '500' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ── Bottom sheet ── */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <View {...panResponder.panHandlers} style={styles.sheetDragArea}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Zonas cercanas</Text>
            <Text style={styles.sheetSub}>{loading ? 'Cargando...' : `${filteredZones.length} ${filteredZones.length === 1 ? 'lugar' : 'lugares'} en tu área`}</Text>
          </View>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Explore')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
            <ChevRightIcon size={12} color={FOREST} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContent} style={{ overflow: 'hidden' }}>
          {filteredZones.length > 0
            ? filteredZones.map(z => <ZoneCard key={z.id} zone={z} onPress={() => navigation.navigate('Detail', { zone: z })} />)
            : (
              <View style={styles.empty}>
                <PawIcon size={16} color={MUTED} />
                <Text style={styles.emptyText}>Sin zonas de este tipo cerca</Text>
              </View>
            )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1 },
  mapArea: { flex: 1 },

  topBar:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 16, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appName:   { fontSize: 24, fontWeight: '900', color: INK, letterSpacing: -0.8 },
  appNameWrap: { backgroundColor: OAT, borderRadius: 50, borderWidth: 2, borderColor: INK, paddingHorizontal: 14, paddingVertical: 6, shadowColor: INK, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  layersBtn: { width: 44, height: 44, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
  searchBox: { height: 48, backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, ...flat },
  searchPlaceholder: { flex: 1, fontSize: 14, color: MUTED },
  filtersWrapper: { paddingBottom: 6 },
  filtersContent: { gap: 8, paddingRight: 6, paddingBottom: 4, paddingTop: 2 },
  chip:       { height: 34, paddingHorizontal: 14, borderRadius: 2, borderWidth: 2, borderColor: INK, backgroundColor: SAND, alignItems: 'center', justifyContent: 'center', ...flat },
  chipActive: { backgroundColor: FOREST },
  chipText:   { fontSize: 13, letterSpacing: -0.1 },

  // Pin
  pinCircle:   { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0C180C' },
  pinSelected: { shadowColor: '#0C180C', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 },

  // Sheet
  sheet:       { backgroundColor: SAND, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: INK },
  sheetDragArea: { paddingVertical: 4, alignItems: 'center' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: INK, opacity: 0.15 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4 },
  sheetSub:    { fontSize: 13, color: MUTED, marginTop: 2 },
  seeAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText:  { fontSize: 13, fontWeight: '700', color: FOREST },

  // Cards
  cardsContent: { gap: 12, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  card:         { width: 152, height: 110, backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 12, gap: 4, ...flat },
  cardBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: SAND, borderRadius: 50, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  cardBadgeText:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.4, color: INK },
  cardName:     { fontSize: 14, fontWeight: '700', color: INK, letterSpacing: -0.2, lineHeight: 18 },
  cardRating:   { fontSize: 11, fontWeight: '700', color: INK },
  cardRev:      { fontSize: 11, color: MUTED },
  distTag:      { alignSelf: 'flex-start', backgroundColor: DIST, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  distTagText:  { fontSize: 10, fontWeight: '700', color: OAT },
  empty:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, width: 280 },
  emptyText:    { fontSize: 14, color: MUTED },
});
