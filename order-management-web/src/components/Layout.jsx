import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-xl font-bold">Order Management</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/orders" className={linkClass}>Pedidos</NavLink>
          <NavLink to="/orders/new" className={linkClass}>Novo Pedido</NavLink>
          <NavLink to="/customers" className={linkClass}>Clientes</NavLink>
          <NavLink to="/payment-conditions" className={linkClass}>Cond. Pagamento</NavLink>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
