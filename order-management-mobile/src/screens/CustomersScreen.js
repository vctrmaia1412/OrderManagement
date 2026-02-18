import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customerService } from '../services/api';
import { useI18n } from '../context/I18nContext';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const fetchCustomers = async () => { try { const { data } = await customerService.getAll(); setCustomers(data); } catch {} finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { fetchCustomers(); }, []));

  const showError = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };

  const handleCreate = async () => {
    if (!name || !email) { showError(t('error'), t('fillAllFields')); return; }
    try { setSubmitting(true); await customerService.create({ name, email }); setName(''); setEmail(''); setShowForm(false); fetchCustomers(); }
    catch { showError(t('error'), t('createError')); } finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addText}>{showForm ? t('cancel') : t('newCustomer')}</Text>
      </TouchableOpacity>
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder={t('customerName')} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={t('customerEmail')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? t('saving') : t('save')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={customers}
        keyExtractor={(c) => String(c.customerId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>#{item.customerId} - {item.name}</Text>
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('noCustomers')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: '#4338ca', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  addText: { color: '#fff', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 14 },
  saveBtn: { backgroundColor: '#4338ca', borderRadius: 8, padding: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  cardSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 30 },
});
