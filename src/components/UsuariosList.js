import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import './UsuariosList.css';

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Iniciando busca de usuários no Firestore...');
    
    const collectionRef = collection(db, 'users');
    
    // Escutar mudanças em tempo real
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.log(`📦 Snapshot recebido: ${snapshot.size} usuários encontrados`);
        
        const usuariosData = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          usuariosData.push({
            id: docSnapshot.id,
            ...data
          });
        });
        
        // Ordenar por nome
        usuariosData.sort((a, b) => {
          const nomeA = (a.name || '').toLowerCase();
          const nomeB = (b.name || '').toLowerCase();
          return nomeA.localeCompare(nomeB);
        });
        
        console.log(`✅ Total de usuários processados: ${usuariosData.length}`);
        setUsuarios(usuariosData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ Erro ao buscar usuários:', err);
        console.error('Detalhes do erro:', {
          code: err.code,
          message: err.message
        });
        
        let errorMessage = 'Erro ao carregar usuários. ';
        
        if (err.code === 'permission-denied') {
          errorMessage += 'Permissão negada. Verifique as regras de segurança do Firestore.';
        } else if (err.code === 'failed-precondition') {
          errorMessage += 'A coleção "users" pode não existir ou não ter índices necessários.';
        } else {
          errorMessage += `Erro: ${err.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    );

    // Limpar subscription ao desmontar
    return () => {
      console.log('🛑 Desinscrevendo do Firestore');
      unsubscribe();
    };
  }, []);

  const isAdmin = (usuario) => {
    return usuario.role === 'admin' || usuario.isAdmin === true;
  };

  const formatarTelefone = (telefone) => {
    if (!telefone) return 'Não informado';
    // Formatar telefone brasileiro
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length === 11) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    } else if (apenasNumeros.length === 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    }
    return telefone;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>❌ {error}</p>
        <p className="error-hint">
          Verifique se as credenciais do Firebase estão configuradas corretamente em <code>src/firebase/config.js</code>
        </p>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="empty-state">
        <p>📭 Nenhum usuário encontrado</p>
        <p className="empty-hint">Os usuários aparecerão aqui quando forem criados.</p>
      </div>
    );
  }

  // Separar usuários por tipo
  const usuariosAdmin = usuarios.filter(u => isAdmin(u));
  const usuariosComuns = usuarios.filter(u => !isAdmin(u));

  return (
    <div className="usuarios-list">
      <div className="usuarios-header">
        <h2>👥 Usuários do Sistema</h2>
        <div className="usuarios-stats">
          <span className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{usuarios.length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Administradores:</span>
            <span className="stat-value admin">{usuariosAdmin.length}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Usuários:</span>
            <span className="stat-value">{usuariosComuns.length}</span>
          </span>
        </div>
      </div>

      {usuariosAdmin.length > 0 && (
        <div className="usuarios-section">
          <h3 className="section-title">👑 Administradores ({usuariosAdmin.length})</h3>
          <div className="usuarios-grid">
            {usuariosAdmin.map((usuario) => (
              <div key={usuario.id} className="usuario-card admin-card">
                <div className="usuario-header">
                  <span className="usuario-id">ID: {usuario.id.slice(0, 12)}...</span>
                  <span className="admin-badge">ADMIN</span>
                </div>
                
                <div className="usuario-info">
                  <div className="info-item">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">{usuario.name || 'Não informado'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{usuario.email || 'Não informado'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{formatarTelefone(usuario.telefone)}</span>
                  </div>
                  
                  {usuario.endereco && (
                    <div className="info-item">
                      <span className="info-label">Endereço:</span>
                      <span className="info-value">{usuario.endereco}</span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <span className="info-label">UID:</span>
                    <span className="info-value uid">{usuario.uid || usuario.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usuariosComuns.length > 0 && (
        <div className="usuarios-section">
          <h3 className="section-title">👤 Usuários Comuns ({usuariosComuns.length})</h3>
          <div className="usuarios-grid">
            {usuariosComuns.map((usuario) => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-header">
                  <span className="usuario-id">ID: {usuario.id.slice(0, 12)}...</span>
                </div>
                
                <div className="usuario-info">
                  <div className="info-item">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">{usuario.name || 'Não informado'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{usuario.email || 'Não informado'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{formatarTelefone(usuario.telefone)}</span>
                  </div>
                  
                  {usuario.endereco && (
                    <div className="info-item">
                      <span className="info-label">Endereço:</span>
                      <span className="info-value">{usuario.endereco}</span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <span className="info-label">UID:</span>
                    <span className="info-value uid">{usuario.uid || usuario.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosList;
