import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customerService } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { showAlert, showConfirm } from '../utils/helpers';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const fetchCustomers = async () => {
    try {
      const { data } = await customerService.getAll();
      setCustomers(data);
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchCustomers(); }, []));

  const resetForm = () => {
    setName('');
    setEmail('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name || !email) { showAlert(t('error'), t('fillAllFields')); return; }
    try {
      setSubmitting(true);
      if (editingId) {
        await customerService.update(editingId, { name, email });
      } else {
        await customerService.create({ name, email });
      }
      resetForm();
      fetchCustomers();
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || (editingId ? t('updateError') : t('createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.customerId);
    setName(customer.name);
    setEmail(customer.email);
    setShowForm(true);
  };

  const handleDelete = async (customer) => {
    const confirmed = await showConfirm(
      `${t('confirmDelete')}\n#${customer.customerId} - ${customer.name}`,
      { cancelLabel: t('no'), confirmLabel: t('yes') }
    );
    if (!confirmed) return;
    try {
      await customerService.remove(customer.customerId);
      fetchCustomers();
    } catch (e) {
      const msg = e.response?.status === 500
        ? t('deleteHasOrders')
        : (e.response?.data?.message || t('deleteError'));
      showAlert(t('error'), msg);
    }
  };

  const toggleForm = () => {
    if (showForm) { resetForm(); } else { setShowForm(true); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={toggleForm}>
        <Text style={styles.addText}>{showForm ? t('cancel') : t('newCustomer')}</Text>
      </TouchableOpacity>
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? t('edit') : t('newCustomer')}</Text>
          <TextInput style={styles.input} placeholder={t('customerName')} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={t('customerEmail')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? t('saving') : t('save')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={customers}
        keyExtractor={(c) => String(c.customerId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>#{item.customerId} - {item.name}</Text>
                <Text style={styles.cardSub}>{item.email}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                  <Text style={styles.editText}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  formTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 14 },
  saveBtn: { backgroundColor: '#4338ca', borderRadius: 8, padding: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  cardSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#e0e7ff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  editText: { color: '#4338ca', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 30 },
});
