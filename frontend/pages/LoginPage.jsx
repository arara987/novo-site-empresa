import { useState } from 'react';
import api from '../services/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', verification_code: '' });

  async function submit(e) {
    e.preventDefault();
    const { data } = await api.post('/auth/login', form);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    location.href = '/';
  }

  return (
    <main className="shell">
      <form className="panel" onSubmit={submit}>
        <h1>Login</h1>
        <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Senha" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Código de verificação" onChange={(e) => setForm({ ...form, verification_code: e.target.value })} />
        <button className="cta" type="submit">Entrar</button>
      </form>
    </main>
  );
}
