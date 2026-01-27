import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './PedidosList.css';

function PedidosList({ onPedidoClick }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Iniciando busca de pedidos no Firestore...');
    
    const collectionRef = collection(db, 'pedidos');
    
    // Função para buscar dados do cliente
    const buscarCliente = async (uid) => {
      if (!uid) return null;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          return userDoc.data();
        }
        return null;
      } catch (error) {
        console.error(`Erro ao buscar cliente ${uid}:`, error);
        return null;
      }
    };
    
    // Escutar mudanças em tempo real
    const unsubscribe = onSnapshot(
      collectionRef,
      async (snapshot) => {
        console.log(`📦 Snapshot recebido: ${snapshot.size} documentos encontrados`);
        
        // Primeiro, criar array com todos os pedidos
        const pedidosTemp = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          pedidosTemp.push({
            id: docSnapshot.id,
            ...data
          });
        });
        
        // Buscar clientes para todos os pedidos que têm uid
        const pedidosComClientes = await Promise.all(
          pedidosTemp.map(async (pedido) => {
            if (pedido.uid) {
              const cliente = await buscarCliente(pedido.uid);
              return { ...pedido, cliente };
            }
            return pedido;
          })
        );
        
        // Ordenar manualmente por data (campo 'data' no Firestore)
        if (pedidosComClientes.length > 0) {
          pedidosComClientes.sort((a, b) => {
            const dateA = a.data?.toDate ? a.data.toDate() : 
                         (a.data instanceof Date ? a.data : 
                         (a.data ? new Date(a.data) : new Date(0)));
            const dateB = b.data?.toDate ? b.data.toDate() : 
                         (b.data instanceof Date ? b.data : 
                         (b.data ? new Date(b.data) : new Date(0)));
            return dateB - dateA; // Mais recentes primeiro
          });
        }
        
        console.log(`✅ Total de pedidos processados: ${pedidosComClientes.length}`);
        setPedidos(pedidosComClientes);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ Erro ao buscar pedidos:', err);
        console.error('Detalhes do erro:', {
          code: err.code,
          message: err.message
        });
        
        let errorMessage = 'Erro ao carregar pedidos. ';
        
        if (err.code === 'permission-denied') {
          errorMessage += 'Permissão negada. Verifique as regras de segurança do Firestore.';
        } else if (err.code === 'failed-precondition') {
          errorMessage += 'A coleção "pedidos" pode não existir ou não ter índices necessários.';
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

  const getStatusColor = (status) => {
    const statusColors = {
      'pendente': '#ff9800',
      'preparando': '#2196f3',
      'pronto': '#4caf50',
      'entregue': '#9e9e9e',
      'cancelado': '#f44336'
    };
    return statusColors[status] || '#757575';
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    // Se for um timestamp do Firestore
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString('pt-BR');
    }
    
    // Se for um objeto Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('pt-BR');
    }
    
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatarValor = (valor) => {
    if (typeof valor === 'number') {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
    return valor;
  };

  const isPedidoConcluido = (pedido) => {
    return pedido.status === 'entregue' || pedido.concluido === true;
  };

  const marcarComoConcluido = async (pedidoId, e) => {
    e.stopPropagation(); // Prevenir clique no card
    
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, {
        status: 'entregue',
        concluido: true
      });
      console.log(`✅ Pedido ${pedidoId} marcado como concluído`);
    } catch (error) {
      console.error('❌ Erro ao marcar pedido como concluído:', error);
      alert('Erro ao marcar pedido como concluído. Verifique as permissões do Firestore.');
    }
  };

  // Separar pedidos em concluídos e pendentes
  const pedidosPendentes = pedidos.filter(p => !isPedidoConcluido(p));
  const pedidosConcluidos = pedidos.filter(p => isPedidoConcluido(p));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando pedidos...</p>
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

  if (pedidos.length === 0) {
    return (
      <div className="empty-state">
        <p>📭 Nenhum pedido encontrado</p>
        <p className="empty-hint">Os pedidos aparecerão aqui quando forem criados.</p>
        <div className="debug-info">
          <p className="debug-title">💡 Dicas para debug:</p>
          <ul>
            <li>Abra o console do navegador (F12) para ver logs detalhados</li>
            <li>Verifique se a coleção se chama exatamente "pedidos" no Firestore</li>
            <li>Confirme que as regras de segurança do Firestore permitem leitura</li>
            <li>Verifique se os documentos têm a estrutura esperada</li>
          </ul>
        </div>
      </div>
    );
  }

  const renderPedidoCard = (pedido) => {
    const concluido = isPedidoConcluido(pedido);
    
    return (
      <div
        key={pedido.id}
        className={`pedido-card ${concluido ? 'pedido-concluido' : ''}`}
        onClick={() => onPedidoClick(pedido)}
      >
        <div className="pedido-header">
          <span className="pedido-id">Pedido #{pedido.id.slice(0, 8)}</span>
          <span
            className="pedido-status"
            style={{ backgroundColor: getStatusColor(pedido.status) }}
          >
            {pedido.status || 'pendente'}
          </span>
        </div>
        
        <div className="pedido-info">
          <div className="info-item">
            <span className="info-label">Cliente:</span>
            <span className="info-value">{pedido.cliente?.name || 'Carregando...'}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Itens:</span>
            <span className="info-value">
              {pedido.items?.length || 0} {pedido.items?.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Total:</span>
            <span className="info-value total">
              {formatarValor(pedido.total || 0)}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Data:</span>
            <span className="info-value">
              {formatarData(pedido.data)}
            </span>
          </div>
        </div>
        
        <div className="pedido-footer">
          {!concluido && (
            <button
              className="btn-concluir"
              onClick={(e) => marcarComoConcluido(pedido.id, e)}
            >
              ✓ Marcar como Entregue
            </button>
          )}
          {concluido && (
            <span className="concluido-badge">✓ Entregue</span>
          )}
          <span className="click-hint">Clique para ver detalhes →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="pedidos-list">
      <h2>Pedidos Recebidos</h2>
      
      {pedidosPendentes.length > 0 && (
        <div className="pedidos-section">
          <h3 className="section-title">📦 Pedidos a Entregar/Retirar ({pedidosPendentes.length})</h3>
          <div className="pedidos-grid">
            {pedidosPendentes.map(renderPedidoCard)}
          </div>
        </div>
      )}

      {pedidosConcluidos.length > 0 && (
        <div className="pedidos-section">
          <h3 className="section-title">✓ Pedidos Concluídos ({pedidosConcluidos.length})</h3>
          <div className="pedidos-grid">
            {pedidosConcluidos.map(renderPedidoCard)}
          </div>
        </div>
      )}

      {pedidosPendentes.length === 0 && pedidosConcluidos.length === 0 && (
        <div className="empty-state">
          <p>📭 Nenhum pedido encontrado</p>
        </div>
      )}
    </div>
  );
}

export default PedidosList;
