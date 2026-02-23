import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const canApprove = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      setError('Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm(`Deseja aprovar o pedido #${orderId}?`)) return;
    try {
      await orderService.approve(orderId);
      fetchOrders();
    } catch { alert('Não foi possível aprovar o pedido.'); }
  };

  useEffect(() => { fetchOrders(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors">Atualizar</button>
          <Link to="/orders/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">+ Novo Pedido</Link>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Nenhum pedido encontrado.</p>
          <Link to="/orders/new" className="text-indigo-600 hover:underline mt-2 inline-block">Criar primeiro pedido</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Condição Pgto</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor Total</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aprov. Manual</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.paymentConditionDescription}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {order.requiresManualApproval ? (
                      <span className="text-yellow-600 font-medium text-sm">Sim</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Não</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                    <Link to={`/orders/${order.orderId}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Detalhes
                    </Link>
                    {order.requiresManualApproval && order.status === 'Criado' && canApprove && (
                      <button onClick={() => handleApprove(order.orderId)} className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        Aprovar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
