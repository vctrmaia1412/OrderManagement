import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  Criado: 'bg-gray-100 text-gray-700',
  AguardandoAprovacao: 'bg-yellow-100 text-yellow-800',
  Aprovado: 'bg-blue-100 text-blue-700',
  Processando: 'bg-purple-100 text-purple-700',
  Pago: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
};

const statusLabels = {
  Criado: 'Criado',
  AguardandoAprovacao: 'Aguardando Aprovação',
  Aprovado: 'Aprovado',
  Processando: 'Processando',
  Pago: 'Pago',
  Cancelado: 'Cancelado',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const canApprove = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await orderService.getById(id);
      setOrder(data);
    } catch (err) {
      setError('Erro ao carregar pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      await orderService.approve(id);
      setMessage('Pedido aprovado com sucesso!');
      fetchOrder();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao aprovar pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Deseja realmente cancelar este pedido?')) return;
    try {
      setActionLoading(true);
      setMessage('');
      await orderService.cancel(id);
      setMessage('Pedido cancelado.');
      fetchOrder();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao cancelar pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  if (!order) return null;

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/orders')} className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">&larr; Voltar aos pedidos</button>

      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pedido #{order.orderId}</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      {message && <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Informações Gerais</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Cliente</dt><dd className="font-medium">{order.customerName}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Condição Pgto</dt><dd className="font-medium">{order.paymentConditionDescription}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Data do Pedido</dt><dd className="font-medium">{new Date(order.orderDate).toLocaleDateString('pt-BR')}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Valor Total</dt><dd className="font-bold text-lg text-indigo-600">{fmt(order.totalAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Aprov. Manual</dt><dd className="font-medium">{order.requiresManualApproval ? 'Sim' : 'Não'}</dd></div>
          </dl>
        </div>

        {order.deliveryTerm && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Prazo de Entrega</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Prazo (dias)</dt><dd className="font-medium">{order.deliveryTerm.deliveryDays} dias</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Previsão</dt><dd className="font-medium">{new Date(order.deliveryTerm.estimatedDeliveryDate).toLocaleDateString('pt-BR')}</dd></div>
            </dl>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Itens do Pedido</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Produto</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500">Qtd</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Preço Unit.</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <tr key={item.orderItemId}>
                <td className="px-6 py-3 text-sm">{item.productName}</td>
                <td className="px-6 py-3 text-sm text-center">{item.quantity}</td>
                <td className="px-6 py-3 text-sm text-right">{fmt(item.unitPrice)}</td>
                <td className="px-6 py-3 text-sm text-right font-medium">{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {order.status === 'Criado' && order.requiresManualApproval && canApprove && (
          <button onClick={handleApprove} disabled={actionLoading} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {actionLoading ? 'Processando...' : 'Aprovar Pedido'}
          </button>
        )}
        {order.status !== 'Pago' && order.status !== 'Cancelado' && (
          <button onClick={handleCancel} disabled={actionLoading} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {actionLoading ? 'Processando...' : 'Cancelar Pedido'}
          </button>
        )}
        <button onClick={fetchOrder} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors">
          Atualizar
        </button>
      </div>
    </div>
  );
}
