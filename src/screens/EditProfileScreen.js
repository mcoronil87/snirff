import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, flat } from '../theme';
import { supabase } from '../supabase';
import { XIcon } from '../components/Icons';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [avatarUrl, setAvatarUrl]     = useState(null);
  const [uploadingPhoto, setUploading] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [email, setEmail]             = useState('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { navigation.goBack(); return; }
    setEmail(s.session.user.email);

    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', s.session.user.id)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    setLoading(false);
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    const { data: s } = await supabase.auth.getSession();
    const uri   = result.assets[0].uri;
    const ext   = uri.split('.').pop();
    const path  = `${s.session.user.id}/avatar.${ext}`;

    const response = await fetch(uri);
    const blob     = await response.blob();
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: `image/${ext}` });

    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      setAvatarUrl(url);
      await supabase.from('profiles').upsert({ id: s.session.user.id, avatar_url: url, updated_at: new Date().toISOString() });
    }
    setUploading(false);
  }

  async function handleSave() {
    if (newPassword && newPassword !== confirmPass) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSaving(true);
    const { data: s } = await supabase.auth.getSession();

    // Save display name
    await supabase.from('profiles').upsert({
      id: s.session.user.id,
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    // Change password if provided
    if (newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert('Error', error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    Alert.alert('¡Listo!', 'Perfil actualizado correctamente.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: OAT, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={FOREST} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: OAT }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn} activeOpacity={0.7}>
          <XIcon size={18} color={INK} />
        </TouchableOpacity>
        <Text style={s.title}>Editar perfil</Text>
        <TouchableOpacity onPress={handleSave} style={s.saveBtn} activeOpacity={0.9}>
          {saving
            ? <ActivityIndicator size="small" color={WHITE} />
            : <Text style={s.saveBtnText}>Guardar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <TouchableOpacity style={s.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
          {uploadingPhoto
            ? <ActivityIndicator color={WHITE} />
            : avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
              : <Text style={s.avatarInitial}>{email?.[0]?.toUpperCase() ?? '?'}</Text>
          }
          <View style={s.avatarOverlay}>
            <Text style={{ color: WHITE, fontSize: 11, fontWeight: '700' }}>Cambiar foto</Text>
          </View>
        </TouchableOpacity>


        {/* Email (read-only) */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>EMAIL</Text>
          <View style={[s.input, s.inputReadOnly]}>
            <Text style={{ color: MUTED, fontSize: 15 }}>{email}</Text>
          </View>
          <Text style={s.hint}>El email no se puede cambiar</Text>
        </View>

        {/* Display name */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>NOMBRE DE USUARIO</Text>
          <TextInput
            style={s.input}
            placeholder="Cómo quieres que te llamen"
            placeholderTextColor={MUTED}
            value={displayName}
            onChangeText={setDisplayName}
            autoCorrect={false}
          />
        </View>

        {/* Divider */}
        <View style={s.divider} />
        <Text style={s.sectionTitle}>Cambiar contraseña</Text>

        {/* New password */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>NUEVA CONTRASEÑA</Text>
          <TextInput
            style={s.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={MUTED}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm password */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>CONFIRMAR CONTRASEÑA</Text>
          <TextInput
            style={[s.input, confirmPass && newPassword !== confirmPass && { borderColor: TERRA }]}
            placeholder="Repite la nueva contraseña"
            placeholderTextColor={MUTED}
            value={confirmPass}
            onChangeText={setConfirmPass}
            secureTextEntry
          />
          {confirmPass && newPassword !== confirmPass && (
            <Text style={s.errorText}>Las contraseñas no coinciden</Text>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  avatarWrap:    { width: 90, height: 90, borderRadius: 2, backgroundColor: FOREST, borderWidth: 2, borderColor: INK, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden', ...flat },
  avatarImg:     { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: WHITE },
  avatarOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 4, alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SAND, paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 2, borderColor: INK,
  },
  closeBtn: { width: 38, height: 38, backgroundColor: OAT, borderRadius: 2, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', ...flat },
  title:    { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.4 },
  saveBtn:  { backgroundColor: FOREST, borderRadius: 2, borderWidth: 2, borderColor: INK, paddingHorizontal: 16, paddingVertical: 8, ...flat },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  form:       { padding: 20, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 10, fontWeight: '800', color: INK, letterSpacing: 0.7, opacity: 0.6, marginBottom: 6 },
  input: {
    height: 50, backgroundColor: SAND, borderRadius: 2,
    borderWidth: 2, borderColor: INK, paddingHorizontal: 14,
    fontSize: 15, color: INK, ...flat,
  },
  inputReadOnly: { justifyContent: 'center', backgroundColor: OAT },
  hint:       { fontSize: 11, color: MUTED, marginTop: 4 },
  errorText:  { fontSize: 12, color: TERRA, marginTop: 4, fontWeight: '600' },

  divider:      { height: 2, backgroundColor: INK, opacity: 0.1, marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 16, letterSpacing: -0.3 },
});
