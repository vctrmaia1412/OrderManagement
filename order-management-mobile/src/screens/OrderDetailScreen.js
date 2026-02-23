import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { orderService } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { statusColors, statusTextColors, formatCurrency, formatDate, showAlert, showConfirm } from '../utils/helpers';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { t, statusLabel } = useI18n();

  const fetchOrder = async () => {
    try {
      const { data } = await orderService.getById(orderId);
      setOrder(data);
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleApprove = async () => {
    const confirmed = await showConfirm(`${t('confirmApprove')} #${orderId}?`, { cancelLabel: t('cancel'), confirmLabel: t('confirm') });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await orderService.approve(orderId);
      showAlert(t('success'), t('orderApproved'));
      fetchOrder();
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('approveError2'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm(`${t('confirmCancel')} #${orderId}?`, { cancelLabel: t('cancel'), confirmLabel: t('confirm') });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await orderService.cancel(orderId);
      showAlert(t('success'), t('orderCanceled'));
      fetchOrder();
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('cancelError'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;
  if (!order) return <View style={styles.center}><Text>{t('orderNotFound')}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('orderTitle')} #{order.orderId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[order.status] }]}>
          <Text style={[styles.badgeText, { color: statusTextColors[order.status] }]}>{statusLabel(order.status)}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('infoSection')}</Text>
        <Row label={t('customer')} value={order.customerName} />
        <Row label={t('paymentCondition')} value={order.paymentConditionDescription} />
        <Row label={t('date')} value={formatDate(order.orderDate)} />
        <Row label={t('total')} value={formatCurrency(order.totalAmount)} bold />
        <Row label={t('manualApprovalLabel')} value={order.requiresManualApproval ? t('yes') : t('no')} />
        <Row label={t('createdBy')} value={order.createdBy} />
      </View>
      {order.deliveryTerm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('deliverySection')}</Text>
          <Row label={t('deliveryDays')} value={`${order.deliveryTerm.deliveryDays} ${t('deliveryDays').toLowerCase()}`} />
          <Row label={t('deliveryEstimate')} value={formatDate(order.deliveryTerm.estimatedDeliveryDate)} />
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('itemsSection')}</Text>
        {order.items?.map((item) => (
          <View key={item.orderItemId} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemSub}>{item.quantity}x {formatCurrency(item.unitPrice)}</Text>
            </View>
            <Text style={styles.itemTotal}>{formatCurrency(item.totalPrice)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        {order.status === 'Criado' && order.requiresManualApproval && (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#059669' }, actionLoading && styles.disabled]} onPress={handleApprove} disabled={actionLoading}>
            <Text style={styles.actionText}>{actionLoading ? t('processing') : t('approveOrder')}</Text>
          </Pressable>
        )}
        {order.status !== 'Pago' && order.status !== 'Cancelado' && (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#dc2626' }, actionLoading && styles.disabled]} onPress={handleCancel} disabled={actionLoading}>
            <Text style={styles.actionText}>{actionLoading ? t('processing') : t('cancelOrder')}</Text>
          </Pressable>
        )}
        <Pressable style={[styles.actionBtn, { backgroundColor: '#6b7280' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.actionText}>{t('back')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: 'bold', fontSize: 18, color: '#4338ca' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  itemSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  actions: { marginTop: 8, marginBottom: 30 },
  actionBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  disabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
