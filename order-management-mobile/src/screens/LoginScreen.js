import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, locale, changeLanguage, languages } = useI18n();
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    setError('');
    if (!username || !password) { setError(t('loginFillAll')); return; }
    try {
      setLoading(true);
      await login(username, password);
    } catch (err) {
      if (err.response) setError(err.response.data?.message || t('loginInvalid'));
      else setError(t('loginNoServer'));
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('appTitle')}</Text>
        <Text style={styles.subtitle}>{t('loginTitle')}</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.label}>{t('loginUser')}</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} blurOnSubmit={false} />

        <Text style={styles.label}>{t('loginPassword')}</Text>
        <TextInput ref={passwordRef} style={styles.input} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="go" onSubmitEditing={handleLogin} />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('loginButton')}</Text>}
        </TouchableOpacity>

        <View style={styles.langRow}>
          {languages.map(lang => (
            <TouchableOpacity key={lang.code} style={[styles.langBtn, locale === lang.code && styles.langBtnActive]} onPress={() => changeLanguage(lang.code)}>
              <Text style={[styles.langText, locale === lang.code && styles.langTextActive]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#312e81' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '85%', maxWidth: 400 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  button: { backgroundColor: '#4338ca', borderRadius: 10, paddingVertical: 13, marginTop: 20, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorBox: { backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 4 },
  errorText: { color: '#dc2626', fontSize: 13 },
  langRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 6 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  langBtnActive: { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  langText: { fontSize: 12, color: '#6b7280' },
  langTextActive: { color: '#fff', fontWeight: '600' },
});
