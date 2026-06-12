import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, SAND, FOREST, TERRA, OAT, MUTED, WHITE, flat } from '../theme';
import { supabase } from '../supabase';
import { CORUNA } from '../config';
import {
  XIcon, CheckIcon, LocationIcon,
  FilledFenceIcon, FilledParkIcon, FilledGrassIcon, FilledCafeIcon,
} from '../components/Icons';

const CATS = [
  { id: 'pip',   label: 'Pipicán',   sub: 'Área vallada oficial', color: FOREST,    lightBg: '#C1E9CC', Icon: FilledFenceIcon },
  { id: 'park',  label: 'Parque',    sub: 'Zona verde amplia',    color: '#3D6B2A', lightBg: '#C1E9CC', Icon: FilledParkIcon },
  { id: 'grass', label: 'Hierba',    sub: 'Parada de 2 minutos',  color: '#4A7025', lightBg: '#C1E9CC', Icon: FilledGrassIcon },
  { id: 'cafe',  label: 'Cafetería', sub: 'Pet friendly',         color: TERRA,     lightBg: '#C1E9CC', Icon: FilledCafeIcon },
];

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView({ onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.success, { paddingBottom: insets.bottom + 24 }]}>
      <View style={s.successIcon}>
        <CheckIcon size={32} color={FOREST} />
      </View>
      <Text style={s.successTitle}>¡Zona añadida!</Text>
      <Text style={s.successSub}>
        Tu zona está pendiente de revisión por nuestro equipo. Aparecerá en el mapa una vez aprobada.
      </Text>
      <TouchableOpacity onPress={onBack} activeOpacity={0.9} style={s.successBtn}>
        <Text style={s.successBtnText}>Volver al mapa</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AddScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [selCat, setSelCat]     = useState(null);
  const [desc, setDesc]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const insets = useSafeAreaInsets();

  const canSubmit = name.trim().length > 2 && selCat;

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Activa el acceso a la ubicación para usar tu posición actual.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    // Check auth — redirect to login if not logged in
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigation.navigate('Auth');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('zones').insert({
      name:         name.trim(),
      cat:          selCat,
      description:  desc.trim() || null,
      address:      locationText.trim() || null,
      latitude:     coords?.latitude ?? CORUNA.latitude,
      longitude:    coords?.longitude ?? CORUNA.longitude,
      rating:       0,
      review_count: 0,
      status:       'pending',
      created_by:   data.session.user.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'No se pudo publicar la zona. Inténtalo de nuevo.');
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) return (
    <View style={{ flex: 1, backgroundColor: SAND }}>
      <View style={s.handleWrap}><View style={s.handle} /></View>
      <SuccessView onBack={() => navigation.goBack()} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: SAND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.root}>
        {/* Bottom sheet handle */}
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.closeBtn}>
            <XIcon size={18} color={INK} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text style={s.headerTitle}>Añadir zona</Text>
            <Text style={s.headerSub}>Comparte un lugar con la comunidad</Text>
          </View>
        </View>

        {/* ── Form ── */}
        <ScrollView style={{ flex: 1, backgroundColor: OAT }} contentContainerStyle={s.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Name */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Nombre de la zona</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ej. Pipicán del Parc Güell"
              placeholderTextColor={MUTED}
              style={[s.input, name.length > 0 && s.inputActive]}
            />
          </View>

          {/* Category */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Tipo de zona</Text>
            <View style={s.catGrid}>
              {CATS.map((cat) => {
                const on = selCat === cat.id;
                const Icon = cat.Icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelCat(cat.id)}
                    activeOpacity={0.85}
                    style={[s.catCard, { backgroundColor: on ? cat.lightBg : SAND, borderColor: on ? cat.color : INK }]}
                  >
                    <View style={s.catCardTop}>
                      <View style={[s.catIcon, { backgroundColor: cat.color }]}>
                        <Icon size={20} color='white' />
                      </View>
                      {on && (
                        <View style={[s.catCheck, { backgroundColor: cat.color }]}>
                          <CheckIcon size={10} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[s.catLabel, { color: INK, fontWeight: on ? '700' : '600' }]}>{cat.label}</Text>
                    <Text style={[s.catSub, { color: MUTED }]}>{cat.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>
              Descripción
              <Text style={{ textTransform: 'none', fontWeight: '400', color: MUTED }}> — opcional</Text>
            </Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder="Cuéntanos qué hace especial este lugar…"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[s.textarea, desc.length > 0 && s.inputActive]}
            />
          </View>

          {/* Location */}
          <View style={[s.fieldGroup, { marginBottom: 32 }]}>
            <Text style={s.fieldLabel}>Ubicación</Text>
            <TextInput
              placeholder="ej. Parque de Santa Margarita"
              placeholderTextColor={MUTED}
              value={locationText}
              onChangeText={setLocationText}
              style={[s.input, { marginBottom: 10 }]}
            />
            <TouchableOpacity activeOpacity={0.7} style={s.locationBtn} onPress={useMyLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color={FOREST} />
                : <LocationIcon size={18} color={FOREST} />
              }
              <Text style={s.locationBtnText}>
                {coords ? 'Ubicación capturada ✓' : 'Usar mi ubicación actual'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Submit ── */}
        <View style={[s.submitBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={canSubmit ? 0.9 : 1}
            style={[s.submitBtn, canSubmit ? s.submitActive : s.submitDisabled]}
          >
            {saving
              ? <ActivityIndicator color={WHITE} />
              : <Text style={[s.submitBtnText, { color: canSubmit ? WHITE : MUTED }]}>Publicar zona</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SAND },

  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4, backgroundColor: SAND },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#101A0C', opacity: 0.15 },
  header: {
    backgroundColor: SAND,
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
    borderBottomWidth: 1, borderColor: INK,
    ...flat,
  },
  closeBtn: {
    width: 40, height: 40, backgroundColor: OAT,
    borderRadius: 2, borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center',
    ...flat,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: MUTED, marginTop: 1 },

  form:       { padding: 20 },
  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: INK,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, opacity: 0.7,
  },

  input: {
    height: 52, borderRadius: 2, borderWidth: 2, borderColor: INK,
    backgroundColor: SAND, paddingHorizontal: 16,
    fontSize: 15, color: INK,
    ...flat,
  },
  inputActive: { backgroundColor: WHITE },
  textarea: {
    minHeight: 100, borderRadius: 2, borderWidth: 2, borderColor: INK,
    backgroundColor: SAND, padding: 16,
    fontSize: 15, color: INK, lineHeight: 22,
    ...flat,
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '48%', padding: 16,
    backgroundColor: SAND, borderRadius: 2,
    borderWidth: 2, borderColor: INK,
    ...flat,
  },
  catCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  catIcon:    { width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  catCheck:   { width: 18, height: 18, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  catLabel:   { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  catSub:     { fontSize: 12, color: MUTED, marginTop: 4 },

  locationBtn: {
    height: 52, borderRadius: 2, borderWidth: 2, borderColor: FOREST,
    borderStyle: 'dashed', backgroundColor: `${FOREST}0A`,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,

  },
  locationBtnText: { fontSize: 14.5, fontWeight: '600', color: FOREST },

  submitBar: {
    paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: SAND, borderTopWidth: 1, borderColor: INK,
  },
  submitBtn:      { height: 54, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  submitActive:   { backgroundColor: FOREST, ...flat },
  submitDisabled: { backgroundColor: '#C8C2B4' },
  submitBtnText:  { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

  success: {
    flex: 1, backgroundColor: SAND,
    alignItems: 'center', justifyContent: 'center', padding: 36,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 2,
    borderWidth: 2, borderColor: INK,
    backgroundColor: '#E4EDD8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    ...flat,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: INK, letterSpacing: -0.6, marginBottom: 10, textAlign: 'center' },
  successSub:   { fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 24, marginBottom: 36, paddingHorizontal: 16 },
  successBtn: {
    height: 52, paddingHorizontal: 36, backgroundColor: FOREST,
    borderRadius: 2, borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center',
    ...flat,
  },
  successBtnText: { fontSize: 15.5, fontWeight: '700', color: WHITE },
});
