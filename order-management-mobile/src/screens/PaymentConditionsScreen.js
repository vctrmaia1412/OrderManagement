import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { paymentConditionService } from '../services/api';

export default function PaymentConditionsScreen() {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => { try { const { data } = await paymentConditionService.getAll(); setConditions(data); } catch {} finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { fetch(); }, []));

  const handleCreate = async () => {
    if (!description) { Alert.alert('Erro', 'Preencha a descrição.'); return; }
    try { setSubmitting(true); await paymentConditionService.create({ description, numberOfInstallments: parseInt(installments) }); setDescription(''); setInstallments('1'); setShowForm(false); fetch(); } catch { Alert.alert('Erro', 'Erro ao criar.'); } finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addText}>{showForm ? 'Cancelar' : '+ Nova Condição'}</Text>
      </TouchableOpacity>
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Descrição (ex: 30/60/90)" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Nº Parcelas" value={installments} onChangeText={setInstallments} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? 'Salvando...' : 'Salvar'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={conditions}
        keyExtractor={(c) => String(c.paymentConditionId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>#{item.paymentConditionId} - {item.description}</Text>
            <Text style={styles.cardSub}>{item.numberOfInstallments}x parcela(s)</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma condição cadastrada.</Text>}
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
