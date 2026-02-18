import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderService } from '../services/api';

export default function ApprovalQueueScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = async () => {
    try {
      const { data } = await orderService.getPending();
      setOrders(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPending(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchPending(); };

  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const handleApprove = (orderId) => {
    Alert.alert('Aprovar Pedido', `Deseja aprovar o pedido #${orderId}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprovar', onPress: async () => {
        try {
          await orderService.approve(orderId);
          fetchPending();
        } catch { Alert.alert('Erro', 'Não foi possível aprovar o pedido.'); }
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <Text style={styles.createdBy}>por {item.createdBy}</Text>
        </View>
        <Text style={styles.customer}>{item.customerName}</Text>
        <Text style={styles.total}>{fmt(item.totalAmount)}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.orderId)}>
        <Text style={styles.approveBtnText}>Aprovar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.orderId)}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.empty}>Nenhum pedido pendente de aprovação.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  createdBy: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  customer: { fontSize: 14, color: '#374151', marginBottom: 4 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#4338ca' },
  approveBtn: { backgroundColor: '#059669', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, marginLeft: 12 },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 15, color: '#9ca3af', marginTop: 8 },
  emptyIcon: { fontSize: 40 },
});
