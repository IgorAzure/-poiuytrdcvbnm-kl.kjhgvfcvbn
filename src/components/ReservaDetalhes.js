import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ReservaDetalhes.css';

function ReservaDetalhes({ reserva, onVoltar }) {
  const [cliente, setCliente] = useState(reserva.cliente || null);
  const [loadingCliente, setLoadingCliente] = useState(!reserva.cliente && reserva.uid);

  useEffect(() => {
    // Se não tiver cliente mas tiver uid, buscar
    if (!cliente && reserva.uid) {
      const buscarCliente = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', reserva.uid));
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
  }, [reserva.uid, cliente]);

  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    
    // Se for timestamp do Firestore
    if (dataString.toDate) {
      const date = dataString.toDate();
      return date.toLocaleDateString('pt-BR');
    }
    
    // Se for string de data (formato "10/24/2025")
    if (typeof dataString === 'string') {
      // Tentar parsear se estiver no formato MM/DD/YYYY
      const parts = dataString.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${day}/${month}/${year}`;
      }
      return dataString;
    }
    
    return dataString;
  };

  const formatarHora = (horaString) => {
    if (!horaString) return 'Hora não disponível';
    return horaString;
  };

  const formatarDataCompleta = (timestamp) => {
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

  return (
    <div className="reserva-detalhes">
      <button className="btn-voltar" onClick={onVoltar}>
        ← Voltar para lista
      </button>

      <div className="detalhes-container">
        <div className="detalhes-header">
          <h2>Detalhes da Reserva</h2>
        </div>

        <div className="detalhes-section">
          <h3>Informações da Reserva</h3>
          <div className="info-grid">
            <div className="info-box">
              <span className="info-label">ID da Reserva</span>
              <span className="info-value">{reserva.id}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Data</span>
              <span className="info-value">{formatarData(reserva.data)}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Hora</span>
              <span className="info-value">{formatarHora(reserva.hour)}</span>
            </div>
            <div className="info-box">
              <span className="info-label">Número de Assentos</span>
              <span className="info-value">{reserva.assentos || 'Não informado'}</span>
            </div>
            {reserva.reservado_em && (
              <div className="info-box">
                <span className="info-label">Reservado em</span>
                <span className="info-value">{formatarDataCompleta(reserva.reservado_em)}</span>
              </div>
            )}
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
            <h3>Endereço do Cliente</h3>
            <div className="endereco-box">
              <p>{cliente.endereco}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservaDetalhes;
