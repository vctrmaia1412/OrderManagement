import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { paymentConditionService } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { showAlert } from '../utils/helpers';

export default function PaymentConditionsScreen() {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const fetchConditions = async () => {
    try {
      const { data } = await paymentConditionService.getAll();
      setConditions(data);
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchConditions(); }, []));

  const handleCreate = async () => {
    if (!description) { showAlert(t('error'), t('fillDescription')); return; }
    try {
      setSubmitting(true);
      await paymentConditionService.create({ description, numberOfInstallments: parseInt(installments) });
      setDescription('');
      setInstallments('1');
      setShowForm(false);
      fetchConditions();
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('createError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addText}>{showForm ? t('cancel') : t('newCondition')}</Text>
      </TouchableOpacity>
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder={t('condDescription')} value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder={t('condInstallments')} value={installments} onChangeText={setInstallments} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? t('saving') : t('save')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={conditions}
        keyExtractor={(c) => String(c.paymentConditionId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>#{item.paymentConditionId} - {item.description}</Text>
            <Text style={styles.cardSub}>{item.numberOfInstallments}x {t('condInstallmentsSuffix')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('noConditions')}</Text>}
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
