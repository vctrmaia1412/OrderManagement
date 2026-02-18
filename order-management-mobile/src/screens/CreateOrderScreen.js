import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { orderService, customerService, paymentConditionService } from '../services/api';
import { useI18n } from '../context/I18nContext';

export default function CreateOrderScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [items, setItems] = useState([{ productName: '', quantity: '1', unitPrice: '' }]);
  const { t } = useI18n();

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p] = await Promise.all([customerService.getAll(), paymentConditionService.getAll()]);
        setCustomers(c.data); setConditions(p.data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const addItem = () => setItems([...items, { productName: '', quantity: '1', unitPrice: '' }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i, field, val) => { const copy = [...items]; copy[i] = { ...copy[i], [field]: val }; setItems(copy); };

  const total = items.reduce((s, it) => s + (parseInt(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const showError = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };
  const showSuccess = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
    else Alert.alert(title, msg);
  };

  const handleSubmit = async () => {
    if (!customerId || !conditionId) { showError(t('error'), t('selectCustomerError')); return; }
    if (items.some(i => !i.productName || !i.quantity || !i.unitPrice)) { showError(t('error'), t('fillItemsError')); return; }
    try {
      setSubmitting(true);
      const payload = {
        customerId: parseInt(customerId), paymentConditionId: parseInt(conditionId),
        items: items.map(i => ({ productName: i.productName, quantity: parseInt(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
      };
      const { data } = await orderService.create(payload);
      showSuccess(t('success'), `${t('orderTitle')} #${data.orderId} ${t('orderCreated')}`);
      navigation.navigate('Pedidos');
    } catch (e) { showError(t('error'), e.response?.data?.message || t('createError')); } finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orderDataSection')}</Text>
        <Text style={styles.label}>{t('selectCustomer')}</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={customerId} onValueChange={setCustomerId} style={styles.picker}>
            <Picker.Item label={t('select')} value="" />
            {customers.map(c => <Picker.Item key={c.customerId} label={c.name} value={String(c.customerId)} />)}
          </Picker>
        </View>
        <Text style={styles.label}>{t('selectPayment')}</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={conditionId} onValueChange={setConditionId} style={styles.picker}>
            <Picker.Item label={t('select')} value="" />
            {conditions.map(p => <Picker.Item key={p.paymentConditionId} label={p.description} value={String(p.paymentConditionId)} />)}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>{t('itemsSection')}</Text>
          <TouchableOpacity onPress={addItem}><Text style={{ color: '#4338ca', fontWeight: '600' }}>{t('addItem')}</Text></TouchableOpacity>
        </View>
        {items.map((item, i) => (
          <View key={i} style={styles.itemForm}>
            <TextInput style={[styles.input, { marginBottom: 6 }]} placeholder={t('product')} value={item.productName} onChangeText={v => updateItem(i, 'productName', v)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('quantity')} value={item.quantity} onChangeText={v => updateItem(i, 'quantity', v)} keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 2 }]} placeholder={t('unitPrice')} value={item.unitPrice} onChangeText={v => updateItem(i, 'unitPrice', v)} keyboardType="decimal-pad" />
              {items.length > 1 && <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}><Text style={{ color: '#dc2626' }}>✕</Text></TouchableOpacity>}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>{t('totalLabel')}</Text>
        <Text style={styles.totalValue}>{fmt(total)}</Text>
      </View>
      {total > 5000 && <Text style={styles.approvalWarn}>{t('requiresApproval')}</Text>}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? t('creating') : t('createOrder')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  pickerWrap: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 48 },
  itemForm: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  removeBtn: { justifyContent: 'center', paddingHorizontal: 10 },
  totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, elevation: 1 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#4338ca' },
  approvalWarn: { textAlign: 'center', fontSize: 12, color: '#b45309', backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 8 },
  submitBtn: { backgroundColor: '#4338ca', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 30 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
