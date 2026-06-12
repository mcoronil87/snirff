import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INK, SAND, FOREST, TERRA, MUTED, WHITE, OAT, flat } from '../theme';
import { supabase } from '../supabase';

export default function AuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit() {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Rellena todos los campos.'); return; }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigation.goBack();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess('¡Cuenta creada! Revisa tu email para confirmarla.');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: OAT }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 40, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / title */}
        <View style={s.logoWrap}>
          <Text style={s.logo}>Sniffr</Text>
          <Text style={s.tagline}>Encuentra dónde pasear a tu perro</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Text>

          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="tu@email.com"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <TextInput
              style={s.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPass}
              secureTextEntry
            />
          </View>

          {/* Error / success */}
          {error  ? <Text style={s.error}>{error}</Text>   : null}
          {success ? <Text style={s.successMsg}>{success}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            style={[s.btn, { backgroundColor: FOREST }]}
          >
            {loading
              ? <ActivityIndicator color={WHITE} />
              : <Text style={s.btnText}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>
            }
          </TouchableOpacity>

          {/* Toggle mode */}
          <TouchableOpacity
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            style={s.toggleWrap}
            activeOpacity={0.7}
          >
            <Text style={s.toggleText}>
              {mode === 'login'
                ? '¿No tienes cuenta? '
                : '¿Ya tienes cuenta? '}
              <Text style={s.toggleLink}>
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { paddingHorizontal: 24, alignItems: 'stretch' },

  logoWrap:   { alignItems: 'center', marginBottom: 36 },
  logo:       { fontSize: 48, fontWeight: '900', color: INK, letterSpacing: -2 },
  tagline:    { fontSize: 14, color: MUTED, marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: SAND, borderRadius: 2,
    borderWidth: 2, borderColor: INK, padding: 24,
    ...flat,
  },
  cardTitle:  { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.5, marginBottom: 24 },

  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 10, fontWeight: '800', color: INK, letterSpacing: 0.7, opacity: 0.6, marginBottom: 6 },
  input: {
    height: 50, backgroundColor: OAT,
    borderRadius: 2, borderWidth: 2, borderColor: INK,
    paddingHorizontal: 14, fontSize: 15, color: INK,
    ...flat,
  },

  error:      { fontSize: 13, color: TERRA, marginBottom: 12, fontWeight: '600' },
  successMsg: { fontSize: 13, color: FOREST, marginBottom: 12, fontWeight: '600' },

  btn: {
    height: 54, borderRadius: 2, borderWidth: 2, borderColor: INK,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...flat,
  },
  btnText:    { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },

  toggleWrap: { alignItems: 'center', marginTop: 20 },
  toggleText: { fontSize: 14, color: MUTED },
  toggleLink: { color: FOREST, fontWeight: '700' },
});
