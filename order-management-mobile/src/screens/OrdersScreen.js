import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { orderService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { statusColors, statusTextColors, formatCurrency, showAlert, showConfirm } from '../utils/helpers';

const STATUS_FILTERS = ['Todos', 'Criado', 'Pago', 'Cancelado'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const { user } = useAuth();
  const { t, statusLabel } = useI18n();
  const canApprove = user?.role === 'Admin' || user?.role === 'Manager';

  const filteredOrders = activeFilter === 'Todos'
    ? orders
    : orders.filter(o => o.status === activeFilter);

  const fetchOrders = async () => {
    try {
      const { data } = await orderService.getAll();
      setOrders(data);
    } catch (e) {
      showAlert(t('error'), e.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleApprove = async (e, orderId) => {
    if (e?.stopPropagation) e.stopPropagation();
    const confirmed = await showConfirm(`${t('confirmApprove')} #${orderId}?`, { cancelLabel: t('cancel'), confirmLabel: t('confirm') });
    if (!confirmed) return;
    try {
      setApproving(orderId);
      await orderService.approve(orderId);
      await fetchOrders();
    } catch (err) {
      showAlert(t('error'), err.response?.data?.message || t('approveError'));
    } finally {
      setApproving(null);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#e5e7eb' }]}>
          <Text style={[styles.badgeText, { color: statusTextColors[item.status] || '#374151' }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.customer}>{item.customerName}</Text>
      <Text style={styles.condition}>{item.paymentConditionDescription} • {t('by')} {item.createdBy}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
        {item.requiresManualApproval && item.status === 'Criado' && canApprove ? (
          <Pressable
            style={[styles.approveBtn, approving === item.orderId && styles.approveBtnDisabled]}
            onPress={(e) => handleApprove(e, item.orderId)}
            disabled={approving === item.orderId}
          >
            <Text style={styles.approveBtnText}>{approving === item.orderId ? t('approving') : t('approveBtn')}</Text>
          </Pressable>
        ) : item.requiresManualApproval && item.status === 'Criado' ? (
          <Text style={styles.approvalTag}>{t('manualApproval')}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  const getFilterLabel = (f) => f === 'Todos' ? t('filterAll') : statusLabel(f);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {getFilterLabel(f)}{f === 'Todos' ? '' : ` (${orders.filter(o => o.status === f).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Text style={styles.refreshText}>{t('refresh')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.orderId)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchOrders}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>{t('ordersEmpty')}</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 0, flexWrap: 'wrap', gap: 8 },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  filterText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e5e7eb', borderRadius: 8 },
  refreshText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  customer: { fontSize: 14, color: '#374151', marginBottom: 2 },
  condition: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#4338ca' },
  approvalTag: { fontSize: 11, color: '#b45309', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  approveBtn: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  approveBtnDisabled: { backgroundColor: '#9ca3af' },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 15, color: '#9ca3af' },
});
