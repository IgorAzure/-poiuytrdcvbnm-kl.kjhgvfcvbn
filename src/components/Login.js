import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import './Login.css';

function Login({ onLoginSuccess, permissionError }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    const emailSalvo = localStorage.getItem('ifood_admin_email');
    const senhaSalva = localStorage.getItem('ifood_admin_senha');
    const lembrarSalvo = localStorage.getItem('ifood_admin_lembrar') === 'true';
    
    if (lembrarSalvo && emailSalvo && senhaSalva) {
      setEmail(emailSalvo);
      setSenha(senhaSalva);
      setLembrar(true);
    }
  }, []);

  // Mostrar erro de permissão se houver
  useEffect(() => {
    if (permissionError) {
      setError(permissionError);
    }
  }, [permissionError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      
      // Salvar ou remover credenciais baseado na opção "Lembrar-me"
      if (lembrar) {
        localStorage.setItem('ifood_admin_email', email);
        localStorage.setItem('ifood_admin_senha', senha);
        localStorage.setItem('ifood_admin_lembrar', 'true');
      } else {
        localStorage.removeItem('ifood_admin_email');
        localStorage.removeItem('ifood_admin_senha');
        localStorage.removeItem('ifood_admin_lembrar');
      }
      
      // onLoginSuccess será chamado automaticamente pelo App.js através do onAuthStateChanged
      console.log('✅ Login realizado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err);
      
      let errorMessage = 'Erro ao fazer login. ';
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = err.message || 'Erro desconhecido.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🍽️ iFood</h1>
          <h2>Painel do Restaurante</h2>
          <p>Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group remember-group">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                disabled={loading}
                className="remember-checkbox"
              />
              <span>Lembrar-me</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Acesso restrito a administradores</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
