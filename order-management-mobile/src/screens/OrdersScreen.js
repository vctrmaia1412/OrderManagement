import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderService } from '../services/api';

const statusColors = {
  Criado: '#e5e7eb', AguardandoAprovacao: '#fef3c7', Aprovado: '#dbeafe',
  Processando: '#ede9fe', Pago: '#d1fae5', Cancelado: '#fee2e2',
};
const statusTextColors = {
  Criado: '#374151', AguardandoAprovacao: '#92400e', Aprovado: '#1d4ed8',
  Processando: '#6d28d9', Pago: '#065f46', Cancelado: '#991b1b',
};
const statusLabels = {
  Criado: 'Criado', AguardandoAprovacao: 'Aguard. Aprov.', Aprovado: 'Aprovado',
  Processando: 'Processando', Pago: 'Pago', Cancelado: 'Cancelado',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await orderService.getAll();
      setOrders(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const handleApprove = (orderId) => {
    Alert.alert('Aprovar Pedido', `Deseja aprovar o pedido #${orderId}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprovar', onPress: async () => {
        try {
          await orderService.approve(orderId);
          fetchOrders();
        } catch { Alert.alert('Erro', 'Não foi possível aprovar o pedido.'); }
      }},
    ]);
  };

  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.orderId })}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#e5e7eb' }]}>
          <Text style={[styles.badgeText, { color: statusTextColors[item.status] || '#374151' }]}>
            {statusLabels[item.status] || item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.customer}>{item.customerName}</Text>
      <Text style={styles.condition}>{item.paymentConditionDescription} • por {item.createdBy}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{fmt(item.totalAmount)}</Text>
        {item.requiresManualApproval && item.status === 'Criado' ? (
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.orderId)}>
            <Text style={styles.approveBtnText}>Aprovar</Text>
          </TouchableOpacity>
        ) : item.requiresManualApproval ? (
          <Text style={styles.approvalTag}>Aprov. Manual</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.orderId)}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338ca']} />}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>Nenhum pedido encontrado.</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
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
  approveBtn: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 15, color: '#9ca3af' },
});
