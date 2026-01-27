import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import './App.css';
import Login from './components/Login';
import HomePage from './components/HomePage';
import PedidosList from './components/PedidosList';
import PedidoDetalhes from './components/PedidoDetalhes';
import ReservasList from './components/ReservasList';
import ReservaDetalhes from './components/ReservaDetalhes';
import UsuariosList from './components/UsuariosList';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [telaAtual, setTelaAtual] = useState('home'); // 'home', 'pedidos', 'reservas', 'usuarios'
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);

  // Função para verificar se o usuário é administrador
  const verificarPermissaoAdmin = async (user) => {
    if (!user) {
      setIsAdmin(false);
      setPermissionError('');
      return false;
    }

    try {
      // Buscar documento do usuário na coleção 'users' usando o UID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Verificar se tem role 'admin' ou isAdmin true
        const temPermissao = userData.role === 'admin' || userData.isAdmin === true;
        setIsAdmin(temPermissao);
        
        if (!temPermissao) {
          console.warn('⚠️ Usuário não tem permissão de administrador');
          setPermissionError('Você não tem permissão de administrador para acessar este sistema.');
          // Fazer logout automático se não for admin
          await signOut(auth);
        } else {
          setPermissionError('');
        }
        
        return temPermissao;
      } else {
        // Se o documento não existir na coleção users, não é admin
        console.warn('⚠️ Usuário não encontrado na coleção users');
        setIsAdmin(false);
        setPermissionError('Usuário não encontrado. Apenas administradores podem acessar este sistema.');
        await signOut(auth);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      setIsAdmin(false);
      setPermissionError('Erro ao verificar permissões. Tente novamente.');
      await signOut(auth);
      return false;
    }
  };

  useEffect(() => {
    // Verificar estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Se houver usuário, verificar permissão
        setCheckingPermission(true);
        await verificarPermissaoAdmin(user);
        setCheckingPermission(false);
      } else {
        setIsAdmin(false);
        setCheckingPermission(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTelaAtual('home');
      setPedidoSelecionado(null);
      setReservaSelecionada(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleNavigate = (tela) => {
    setTelaAtual(tela);
    setPedidoSelecionado(null);
    setReservaSelecionada(null);
  };

  const handlePedidoClick = (pedido) => {
    setPedidoSelecionado(pedido);
  };

  const handleReservaClick = (reserva) => {
    setReservaSelecionada(reserva);
  };

  const handleVoltar = () => {
    if (pedidoSelecionado) {
      setPedidoSelecionado(null);
    } else if (reservaSelecionada) {
      setReservaSelecionada(null);
    } else {
      setTelaAtual('home');
    }
  };

  const renderizarConteudo = () => {
    // Se estiver na tela de pedidos
    if (telaAtual === 'pedidos') {
      if (pedidoSelecionado) {
        return (
          <PedidoDetalhes 
            pedido={pedidoSelecionado} 
            onVoltar={handleVoltar}
          />
        );
      }
      return <PedidosList onPedidoClick={handlePedidoClick} />;
    }

    // Se estiver na tela de reservas
    if (telaAtual === 'reservas') {
      if (reservaSelecionada) {
        return (
          <ReservaDetalhes 
            reserva={reservaSelecionada} 
            onVoltar={handleVoltar}
          />
        );
      }
      return <ReservasList onReservaClick={handleReservaClick} />;
    }

    // Se estiver na tela de usuários
    if (telaAtual === 'usuarios') {
      return <UsuariosList />;
    }

    // Tela inicial (home)
    return <HomePage onNavigate={handleNavigate} />;
  };

  const mostrarHeader = telaAtual !== 'home';
  const mostrarVoltar = telaAtual !== 'home' && !pedidoSelecionado && !reservaSelecionada && telaAtual !== 'usuarios';

  // Mostrar loading enquanto verifica autenticação ou permissão
  if (loading || checkingPermission) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>{checkingPermission ? 'Verificando permissões...' : 'Carregando...'}</p>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Login onLoginSuccess={() => setUser(auth.currentUser)} permissionError={permissionError} />;
  }

  // Se não for admin, mostrar mensagem (já foi feito logout automático, mas pode ainda estar no estado)
  if (!isAdmin && user) {
    return (
      <div className="loading-screen">
        <div className="error-icon">🚫</div>
        <p>Acesso negado</p>
        <p className="error-subtitle">
          {permissionError || 'Você não tem permissão para acessar este sistema.'}
        </p>
        <p className="error-subtitle">Redirecionando para login...</p>
      </div>
    );
  }

  // Se estiver autenticado e for admin, mostrar aplicação
  return (
    <div className="App">
      {mostrarHeader && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              {mostrarVoltar && (
                <button className="btn-header-voltar" onClick={handleVoltar}>
                  ← Voltar
                </button>
              )}
              <h1>🍽️ iFood - Painel do Restaurante</h1>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Sair">
              Sair
            </button>
          </div>
        </header>
      )}
      
      {!mostrarHeader && (
        <header className="app-header-home">
          <div className="header-content">
            <h1>🍽️ iFood - Painel do Restaurante</h1>
            <button className="btn-logout" onClick={handleLogout} title="Sair">
              Sair
            </button>
          </div>
        </header>
      )}
      
      <main className={`app-main ${telaAtual === 'home' ? 'app-main-home' : ''}`}>
        {renderizarConteudo()}
      </main>
    </div>
  );
}

export default App;
