import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, GREEN, flatSm as flat, CAT_META } from '../theme';
import { ADMIN_EMAIL } from '../config';
import { supabase, mapZoneRow } from '../supabase';
import { CAT_ICONS, ChevLeftIcon } from '../components/Icons';

function ZonePendingCard({ zone, onApprove, onReject }) {
  const m    = CAT_META[zone.cat];
  const Icon = CAT_ICONS[zone.cat];
  const accent = zone.cat === 'cafe' ? TERRA : FOREST;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.iconBox, { backgroundColor: accent }]}>
          {Icon && <Icon size={18} color="white" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.catLabel}>{m.label.toUpperCase()}</Text>
          <Text style={s.zoneName} numberOfLines={1}>{zone.name}</Text>
        </View>
      </View>

      {zone.address ? <Text style={s.address} numberOfLines={1}>{zone.address}</Text> : null}
      {zone.description ? <Text style={s.desc} numberOfLines={2}>{zone.description}</Text> : null}

      <Text style={s.meta}>
        {new Date(zone.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
      </Text>

      <View style={s.actions}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: GREEN }]} onPress={() => onApprove(zone.id)} activeOpacity={0.85}>
          <Text style={[s.actionText, { color: FOREST }]}>✓ Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FFE0D6' }]} onPress={() => onReject(zone.id)} activeOpacity={0.85}>
          <Text style={[s.actionText, { color: TERRA }]}>✕ Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [zones, setZones]     = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab]         = useState('zones');
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, danger }
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(useCallback(() => { checkAndLoad(); }, []));

  async function checkAndLoad() {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session || data.session.user.email !== ADMIN_EMAIL) {
      setIsAdmin(false); setLoading(false); return;
    }
    setIsAdmin(true);
    fetchPending();
    fetchReports();
  }

  async function fetchReports() {
    const { data } = await supabase
      .from('reports')
      .select('*, zones(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    setReports(data || []);
  }

  async function rejectZoneFromReport(reportId, zoneId) {
    setConfirm({
      title: 'Desactivar zona',
      message: 'La zona se ocultará del mapa y se marcará como rechazada.',
      danger: true,
      onConfirm: async () => {
        await Promise.all([
          supabase.from('zones').update({ status: 'rejected' }).eq('id', zoneId),
          supabase.from('reports').delete().eq('id', reportId),
        ]);
        setReports(prev => prev.filter(r => r.id !== reportId));
      }
    });
  }

  async function dismissReport(id) {
    await supabase.from('reports').delete().eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  async function fetchPending() {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setZones(data || []);
    setLoading(false);
  }

  async function approve(id) {
    await supabase.from('zones').update({ status: 'approved' }).eq('id', id);
    setZones(prev => prev.filter(z => z.id !== id));
  }

  async function reject(id) {
    setConfirm({
      title: 'Rechazar zona',
      message: '¿Seguro que quieres rechazar esta zona? Desaparecerá del mapa.',
      danger: true,
      onConfirm: async () => {
        await supabase.from('zones').update({ status: 'rejected' }).eq('id', id);
        setZones(prev => prev.filter(z => z.id !== id));
      }
    });
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: OAT, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={FOREST} />
    </View>
  );

  if (!isAdmin) return (
    <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 16, color: MUTED }}>Acceso restringido</Text>
    </View>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ChevLeftIcon size={20} color={INK} />
        </TouchableOpacity>
        <Text style={s.title}>Moderación</Text>
      </View>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tabBtn, tab === 'zones' && s.tabActive]} onPress={() => setTab('zones')}>
          <Text style={[s.tabText, tab === 'zones' && { color: WHITE }]}>Zonas ({zones.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'reports' && s.tabActive]} onPress={() => setTab('reports')}>
          <Text style={[s.tabText, tab === 'reports' && { color: WHITE }]}>Reportes ({reports.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'reports' ? (
        reports.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: OAT }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 8 }}>Sin reportes</Text>
          </View>
        ) : (
          <FlatList data={reports} keyExtractor={r => String(r.id)} style={{ backgroundColor: OAT }}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item: r }) => (
              <TouchableOpacity
                style={[s.card, { gap: 6 }]}
                activeOpacity={0.85}
                onPress={() => r.zones && navigation.navigate('Detail', { zone: mapZoneRow(r.zones) })}
              >
                <Text style={s.zoneName} numberOfLines={1}>{r.zones?.name ?? 'Zona eliminada'}</Text>
                <Text style={{ fontSize: 13, color: TERRA, fontWeight: '700' }}>{r.reason}</Text>
                <Text style={s.meta}>{new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: OAT, flex: 1 }]} onPress={() => dismissReport(r.id)}>
                    <Text style={[s.actionText, { color: MUTED }]}>Descartar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FFE0D6', flex: 1 }]} onPress={() => rejectZoneFromReport(r.id, r.zone_id)}>
                    <Text style={[s.actionText, { color: TERRA }]}>Desactivar zona</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )} />
        )
      ) : zones.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: OAT }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 8 }}>¡Todo al día!</Text>
          <Text style={{ color: MUTED, fontSize: 14 }}>No hay zonas pendientes de revisión</Text>
        </View>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={z => String(z.id)}
          style={{ backgroundColor: OAT }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ZonePendingCard zone={item} onApprove={approve} onReject={reject} />
          )}
        />
      )}
      {/* Custom confirm modal */}
      <Modal visible={!!confirm} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{confirm?.title}</Text>
            <Text style={s.modalMsg}>{confirm?.message}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[s.modalBtn, { flex: 1, backgroundColor: OAT }]} onPress={() => setConfirm(null)}>
                <Text style={{ fontWeight: '700', color: INK }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { flex: 1, backgroundColor: confirm?.danger ? '#FFE0D6' : GREEN }]}
                onPress={() => { confirm?.onConfirm(); setConfirm(null); }}
              >
                <Text style={{ fontWeight: '700', color: confirm?.danger ? TERRA : FOREST }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SAND },
  tabs:    { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: SAND, borderBottomWidth: 2, borderColor: INK },
  tabBtn:  { flex: 1, height: 36, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', backgroundColor: OAT },
  tabActive: { backgroundColor: FOREST, shadowColor: INK, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  tabText: { fontSize: 13, fontWeight: '700', color: INK },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: SAND, borderBottomWidth: 2, borderColor: INK },
  backBtn: { width: 36, height: 36, backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.8 },
  sub:    { fontSize: 13, color: MUTED, marginTop: 2 },

  card: { backgroundColor: SAND, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 16, ...flat },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox:    { width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  catLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: MUTED, marginBottom: 2 },
  zoneName:   { fontSize: 16, fontWeight: '700', color: INK },
  address:    { fontSize: 13, color: MUTED, marginBottom: 6 },
  desc:       { fontSize: 13, color: INK, lineHeight: 18, marginBottom: 8 },
  meta:       { fontSize: 11, color: MUTED, marginBottom: 12 },

  actions:    { flexDirection: 'row', gap: 10 },
  actionBtn:  { flex: 1, height: 42, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
  actionText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:    { backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, padding: 24, width: '100%', ...flat },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: INK, marginBottom: 8 },
  modalMsg:     { fontSize: 14, color: MUTED, lineHeight: 20 },
  modalBtn:     { height: 46, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
});
