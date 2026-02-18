import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { orderService } from '../services/api';

export default function ApprovalQueueScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  const fetchPending = async () => {
    try {
      const { data } = await orderService.getPending();
      setOrders(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (e, orderId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (Platform.OS === 'web') {
      if (!window.confirm(`Deseja aprovar o pedido #${orderId}?`)) return;
    }
    try {
      setApproving(orderId);
      await orderService.approve(orderId);
      await fetchPending();
    } catch {
      if (Platform.OS === 'web') window.alert('Não foi possível aprovar o pedido.');
    } finally {
      setApproving(null);
    }
  };

  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <Text style={styles.createdBy}>por {item.createdBy}</Text>
        </View>
        <Text style={styles.customer}>{item.customerName}</Text>
        <Text style={styles.total}>{fmt(item.totalAmount)}</Text>
      </Pressable>
      <Pressable
        style={[styles.approveBtn, approving === item.orderId && styles.approveBtnDisabled]}
        onPress={(e) => handleApprove(e, item.orderId)}
        disabled={approving === item.orderId}
      >
        <Text style={styles.approveBtnText}>
          {approving === item.orderId ? 'Aprovando...' : '✓ Aprovar'}
        </Text>
      </Pressable>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <Text style={styles.countText}>{orders.length} pedido(s) pendente(s)</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPending}>
          <Text style={styles.refreshText}>🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.orderId)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.empty}>Nenhum pedido pendente de aprovação.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 0 },
  countText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e5e7eb', borderRadius: 8 },
  refreshText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  createdBy: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  customer: { fontSize: 14, color: '#374151', marginBottom: 4 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#4338ca' },
  approveBtn: { backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, marginLeft: 12, cursor: 'pointer' },
  approveBtnDisabled: { backgroundColor: '#9ca3af' },
  approveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty: { fontSize: 15, color: '#9ca3af', marginTop: 8 },
  emptyIcon: { fontSize: 40 },
});
