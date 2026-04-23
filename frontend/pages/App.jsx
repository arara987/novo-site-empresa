import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Catalog from '../components/Catalog';
import WhatsAppCheckout from '../components/WhatsAppCheckout';
import LoginPage from './LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { getProducts } from '../services/productService';
import api from '../services/api';

function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  return (
    <main className="shell">
      <header className="top"><h1>Novo Premium Platform</h1><nav><Link to="/admin">Admin</Link><Link to="/architect">Architect</Link></nav></header>
      <Catalog products={products} />
      <WhatsAppCheckout products={products} />
    </main>
  );
}

function AdminPage() {
  const [data, setData] = useState();
  useEffect(() => { api.get('/admin/dashboard').then((r) => setData(r.data)); }, []);
  if (!data) return <main className="shell"><div className="panel">Carregando...</div></main>;
  return <main className="shell"><section className="panel"><h2>Admin Dashboard</h2><p>Sales: {data.salesCount}</p><p>Clients: {data.clients}</p><p>Stock zerado: {data.lowStock.length}</p></section></main>;
}

function ArchitectPage() {
  const [data, setData] = useState();
  useEffect(() => { api.get('/architect/dashboard').then((r) => setData(r.data)); }, []);
  if (!data) return <main className="shell"><div className="panel">Carregando...</div></main>;
  return <main className="shell"><section className="panel"><h2>Área do Arquiteto</h2><p>Score: {data.score}</p><p>Tier: {data.tier_level}</p><p>Clientes: {data.clients.length}</p></section></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
      <Route path="/architect" element={<ProtectedRoute role="architect"><ArchitectPage /></ProtectedRoute>} />
    </Routes>
  );
}
