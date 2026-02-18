import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      setLoading(true);
      await login(username, password);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || 'Usuário ou senha inválidos.');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.label}>Usuário</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="admin" autoCapitalize="none" />

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>admin/admin123 | joao/joao123 | maria/maria123</Text>
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
  hint: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16 },
});
