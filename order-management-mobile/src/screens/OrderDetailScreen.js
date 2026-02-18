import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { orderService } from '../services/api';

const statusColors = { Criado:'#e5e7eb', AguardandoAprovacao:'#fef3c7', Aprovado:'#dbeafe', Processando:'#ede9fe', Pago:'#d1fae5', Cancelado:'#fee2e2' };
const statusTextColors = { Criado:'#374151', AguardandoAprovacao:'#92400e', Aprovado:'#1d4ed8', Processando:'#6d28d9', Pago:'#065f46', Cancelado:'#991b1b' };
const statusLabels = { Criado:'Criado', AguardandoAprovacao:'Aguard. Aprovação', Aprovado:'Aprovado', Processando:'Processando', Pago:'Pago', Cancelado:'Cancelado' };

function showAlert(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
}

function showConfirm(msg) {
  if (Platform.OS === 'web') return window.confirm(msg);
  return true;
}

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    try { const { data } = await orderService.getById(orderId); setOrder(data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR');

  const handleApprove = async () => {
    if (!showConfirm(`Deseja aprovar o pedido #${orderId}?`)) return;
    try {
      setActionLoading(true);
      await orderService.approve(orderId);
      showAlert('Sucesso', 'Pedido aprovado!');
      fetchOrder();
    } catch (e) {
      showAlert('Erro', e.response?.data?.message || 'Erro ao aprovar.');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!showConfirm(`Deseja cancelar o pedido #${orderId}?`)) return;
    try {
      setActionLoading(true);
      await orderService.cancel(orderId);
      showAlert('Sucesso', 'Pedido cancelado.');
      fetchOrder();
    } catch (e) {
      showAlert('Erro', e.response?.data?.message || 'Erro ao cancelar.');
    } finally { setActionLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;
  if (!order) return <View style={styles.center}><Text>Pedido não encontrado.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pedido #{order.orderId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[order.status] }]}>
          <Text style={[styles.badgeText, { color: statusTextColors[order.status] }]}>{statusLabels[order.status] || order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMAÇÕES</Text>
        <Row label="Cliente" value={order.customerName} />
        <Row label="Cond. Pagamento" value={order.paymentConditionDescription} />
        <Row label="Data" value={fmtDate(order.orderDate)} />
        <Row label="Total" value={fmt(order.totalAmount)} bold />
        <Row label="Aprov. Manual" value={order.requiresManualApproval ? 'Sim' : 'Não'} />
        <Row label="Criado por" value={order.createdBy} />
      </View>

      {order.deliveryTerm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRAZO DE ENTREGA</Text>
          <Row label="Dias" value={`${order.deliveryTerm.deliveryDays} dias`} />
          <Row label="Previsão" value={fmtDate(order.deliveryTerm.estimatedDeliveryDate)} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ITENS</Text>
        {order.items?.map((item) => (
          <View key={item.orderItemId} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemSub}>{item.quantity}x {fmt(item.unitPrice)}</Text>
            </View>
            <Text style={styles.itemTotal}>{fmt(item.totalPrice)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {order.status === 'Criado' && order.requiresManualApproval && (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#059669' }, actionLoading && styles.disabled]} onPress={handleApprove} disabled={actionLoading}>
            <Text style={styles.actionText}>{actionLoading ? 'Processando...' : '✓ Aprovar Pedido'}</Text>
          </Pressable>
        )}
        {order.status !== 'Pago' && order.status !== 'Cancelado' && (
          <Pressable style={[styles.actionBtn, { backgroundColor: '#dc2626' }, actionLoading && styles.disabled]} onPress={handleCancel} disabled={actionLoading}>
            <Text style={styles.actionText}>{actionLoading ? 'Processando...' : '✕ Cancelar Pedido'}</Text>
          </Pressable>
        )}
        <Pressable style={[styles.actionBtn, { backgroundColor: '#6b7280' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.actionText}>← Voltar</Text>
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
  actionBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10, cursor: 'pointer' },
  disabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
