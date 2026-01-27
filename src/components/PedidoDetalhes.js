import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './PedidoDetalhes.css';

function PedidoDetalhes({ pedido, onVoltar }) {
  const [cliente, setCliente] = useState(pedido.cliente || null);
  const [loadingCliente, setLoadingCliente] = useState(!pedido.cliente && pedido.uid);

  useEffect(() => {
    // Se não tiver cliente mas tiver uid, buscar
    if (!cliente && pedido.uid) {
      const buscarCliente = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', pedido.uid));
          if (userDoc.exists()) {
            setCliente(userDoc.data());
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
        } finally {
          setLoadingCliente(false);
        }
      };
      buscarCliente();
    }
  }, [pedido.uid, cliente]);

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString('pt-BR');
    }
    
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

  const calcularSubtotal = () => {
    if (!pedido.items || pedido.items.length === 0) return 0;
    return pedido.items.reduce((total, item) => {
      const preco = typeof item.preco === 'number' ? item.preco : parseFloat(item.preco) || 0;
      const quantidade = item.quantidade || 1;
      return total + (preco * quantidade);
    }, 0);
  };

  const subtotal = pedido.subtotal || calcularSubtotal();
  const taxaEntrega = pedido.deliveryCost || 0;
  const total = pedido.total || (subtotal + taxaEntrega);

  return (
    <div className="pedido-detalhes">
      <button className="btn-voltar" onClick={onVoltar}>
        ← Voltar para lista
      </button>

      <div className="detalhes-container">
        <div className="detalhes-header">
          <h2>Detalhes do Pedido</h2>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(pedido.status) }}
          >
            {pedido.status || 'pendente'}
          </span>
        </div>

        <div className="detalhes-section">
          <h3>Informações do Pedido</h3>
          <div className="info-grid">
            <div className="info-box">
              <span className="info-label">ID do Pedido</span>
              <span className="info-value">{pedido.id}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Data/Hora</span>
              <span className="info-value">{formatarData(pedido.data)}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Forma de Pagamento</span>
              <span className="info-value">{pedido.formaPagamento || 'Não informado'}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Tipo de Entrega</span>
              <span className="info-value">{pedido.delivery || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div className="detalhes-section">
          <h3>Cliente</h3>
          {loadingCliente ? (
            <p>Carregando dados do cliente...</p>
          ) : (
            <div className="info-grid">
              <div className="info-box">
                <span className="info-label">Nome</span>
                <span className="info-value">{cliente?.name || 'Não informado'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Telefone</span>
                <span className="info-value">{cliente?.telefone || 'Não informado'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Email</span>
                <span className="info-value">{cliente?.email || 'Não informado'}</span>
              </div>
            </div>
          )}
        </div>

        {cliente?.endereco && (
          <div className="detalhes-section">
            <h3>Endereço de Entrega</h3>
            <div className="endereco-box">
              <p>{cliente.endereco}</p>
            </div>
          </div>
        )}

        <div className="detalhes-section">
          <h3>Itens do Pedido</h3>
          <div className="itens-list">
            {pedido.items && pedido.items.length > 0 ? (
              pedido.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-info">
                    <span className="item-nome">{item.nome || 'Item sem nome'}</span>
                    {item.descricao && (
                      <span className="item-descricao">{item.descricao}</span>
                    )}
                  </div>
                  <div className="item-quantidade">
                    <span>Qtd: {item.quantidade || 1}</span>
                  </div>
                  <div className="item-preco">
                    {formatarValor(item.total || (
                      (typeof item.preco === 'number' ? item.preco : parseFloat(item.preco) || 0) *
                      (item.quantidade || 1)
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-items">Nenhum item encontrado</p>
            )}
          </div>
        </div>

        <div className="detalhes-section">
          <h3>Resumo Financeiro</h3>
          <div className="resumo-financeiro">
            <div className="resumo-row">
              <span>Subtotal</span>
              <span>{formatarValor(subtotal)}</span>
            </div>
            {taxaEntrega > 0 && (
              <div className="resumo-row">
                <span>Taxa de Entrega</span>
                <span>{formatarValor(taxaEntrega)}</span>
              </div>
            )}
            <div className="resumo-row total-row">
              <span>Total</span>
              <span>{formatarValor(total)}</span>
            </div>
          </div>
        </div>

        {pedido.observacoes && (
          <div className="detalhes-section">
            <h3>Observações</h3>
            <div className="observacoes-box">
              <p>{pedido.observacoes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PedidoDetalhes;
