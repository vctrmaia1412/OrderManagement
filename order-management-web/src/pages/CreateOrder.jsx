import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, customerService, paymentConditionService } from '../services/api';

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [paymentConditions, setPaymentConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerId: '',
    paymentConditionId: '',
    items: [{ productName: '', quantity: 1, unitPrice: '' }],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, pcRes] = await Promise.all([
          customerService.getAll(),
          paymentConditionService.getAll(),
        ]);
        setCustomers(custRes.data);
        setPaymentConditions(pcRes.data);
      } catch {
        setError('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productName: '', quantity: 1, unitPrice: '' }] });
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const total = form.items.reduce((sum, item) => {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.customerId || !form.paymentConditionId) {
      setError('Selecione cliente e condição de pagamento.');
      return;
    }

    const invalidItems = form.items.some(i => !i.productName || !i.quantity || !i.unitPrice);
    if (invalidItems) {
      setError('Preencha todos os campos dos itens.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: parseInt(form.customerId),
        paymentConditionId: parseInt(form.paymentConditionId),
        items: form.items.map(i => ({
          productName: i.productName,
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      };
      const { data } = await orderService.create(payload);
      navigate(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Novo Pedido</h2>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Dados do Pedido</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Selecione...</option>
                {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cond. Pagamento</label>
              <select value={form.paymentConditionId} onChange={(e) => setForm({ ...form, paymentConditionId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Selecione...</option>
                {paymentConditions.map(p => <option key={p.paymentConditionId} value={p.paymentConditionId}>{p.description}</option>)}
              </select>
            </div>
            
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Itens</h3>
            <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Adicionar Item</button>
          </div>
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Produto</label>}
                  <input type="text" placeholder="Nome do produto" value={item.productName} onChange={(e) => updateItem(index, 'productName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="w-24">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Qtd</label>}
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="w-36">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Preço Unit.</label>}
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <button type="button" onClick={() => removeItem(index)} className="px-3 py-2 text-red-500 hover:text-red-700 text-sm" disabled={form.items.length <= 1}>
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm">Total do Pedido: </span>
            <span className="text-2xl font-bold text-indigo-600">{fmt(total)}</span>
            {total > 5000 && <span className="ml-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Requer aprovação manual</span>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/orders')} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {submitting ? 'Criando...' : 'Criar Pedido'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
