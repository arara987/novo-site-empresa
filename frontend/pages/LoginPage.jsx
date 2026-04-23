import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', verification_code: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao autenticar');
    }
  }

  return (
    <main className="shell">
      <form className="panel" onSubmit={submit}>
        <h1>Login</h1>
        <input required placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Senha" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input required placeholder="Código de verificação" onChange={(e) => setForm({ ...form, verification_code: e.target.value })} />
        {error && <p>{error}</p>}
        <button className="cta" type="submit">Entrar</button>
      </form>
    </main>
  );
}
