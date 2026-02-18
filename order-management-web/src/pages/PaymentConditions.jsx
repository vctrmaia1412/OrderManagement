import { useEffect, useState } from 'react';
import { paymentConditionService } from '../services/api';

export default function PaymentConditions() {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ description: '', numberOfInstallments: 1 });

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const { data } = await paymentConditionService.getAll();
      setConditions(data);
    } catch {
      setError('Erro ao carregar condições de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConditions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.numberOfInstallments) return;
    try {
      setSubmitting(true);
      await paymentConditionService.create({
        description: form.description,
        numberOfInstallments: parseInt(form.numberOfInstallments),
      });
      setForm({ description: '', numberOfInstallments: 1 });
      setShowForm(false);
      fetchConditions();
    } catch {
      setError('Erro ao criar condição de pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Condições de Pagamento</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">
          {showForm ? 'Cancelar' : '+ Nova Condição'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Nova Condição de Pagamento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: À vista, 30/60/90" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Parcelas</label>
              <input type="number" min="1" value={form.numberOfInstallments} onChange={(e) => setForm({ ...form, numberOfInstallments: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {conditions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Nenhuma condição de pagamento cadastrada.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Parcelas</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conditions.map((pc) => (
                <tr key={pc.paymentConditionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pc.paymentConditionId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{pc.description}</td>
                  <td className="px-6 py-4 text-sm text-center">{pc.numberOfInstallments}x</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(pc.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
