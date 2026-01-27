import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ReservasList.css';

function ReservasList({ onReservaClick }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Iniciando busca de reservas no Firestore...');
    
    const collectionRef = collection(db, 'reservas');
    
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
        
        // Primeiro, criar array com todas as reservas
        const reservasTemp = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          reservasTemp.push({
            id: docSnapshot.id,
            ...data
          });
        });
        
        // Buscar clientes para todas as reservas que têm uid
        const reservasComClientes = await Promise.all(
          reservasTemp.map(async (reserva) => {
            if (reserva.uid) {
              const cliente = await buscarCliente(reserva.uid);
              return { ...reserva, cliente };
            }
            return reserva;
          })
        );
        
        // Verificar e concluir automaticamente reservas antigas (30 minutos após data/hora)
        const agora = new Date();
        const reservasProcessadas = await Promise.all(
          reservasComClientes.map(async (reserva) => {
            if (!reserva.concluido) {
              const dataReserva = obterDataHoraReserva(reserva);
              if (dataReserva) {
                const diferencaMinutos = (agora - dataReserva) / (1000 * 60);
                if (diferencaMinutos > 30) {
                  // Concluir automaticamente
                  try {
                    const reservaRef = doc(db, 'reservas', reserva.id);
                    await updateDoc(reservaRef, {
                      concluido: true,
                      concluido_em: serverTimestamp()
                    });
                    console.log(`✅ Reserva ${reserva.id} concluída automaticamente`);
                    return { ...reserva, concluido: true };
                  } catch (error) {
                    console.error(`Erro ao concluir reserva ${reserva.id}:`, error);
                  }
                }
              }
            }
            return reserva;
          })
        );
        
        // Ordenar manualmente por data de reserva (campo 'reservado_em' ou 'data')
        if (reservasProcessadas.length > 0) {
          reservasProcessadas.sort((a, b) => {
            const dateA = a.reservado_em?.toDate ? a.reservado_em.toDate() : 
                         (a.reservado_em instanceof Date ? a.reservado_em : 
                         (a.reservado_em ? new Date(a.reservado_em) : new Date(0)));
            const dateB = b.reservado_em?.toDate ? b.reservado_em.toDate() : 
                         (b.reservado_em instanceof Date ? b.reservado_em : 
                         (b.reservado_em ? new Date(b.reservado_em) : new Date(0)));
            return dateB - dateA; // Mais recentes primeiro
          });
        }
        
        console.log(`✅ Total de reservas processadas: ${reservasProcessadas.length}`);
        setReservas(reservasProcessadas);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ Erro ao buscar reservas:', err);
        console.error('Detalhes do erro:', {
          code: err.code,
          message: err.message
        });
        
        let errorMessage = 'Erro ao carregar reservas. ';
        
        if (err.code === 'permission-denied') {
          errorMessage += 'Permissão negada. Verifique as regras de segurança do Firestore.';
        } else if (err.code === 'failed-precondition') {
          errorMessage += 'A coleção "reservas" pode não existir ou não ter índices necessários.';
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

  // Função para obter a data/hora completa da reserva
  const obterDataHoraReserva = (reserva) => {
    if (!reserva.data || !reserva.hour) return null;
    
    try {
      // Parsear data (formato "10/24/2025")
      const partesData = reserva.data.split('/');
      if (partesData.length !== 3) return null;
      
      const [mes, dia, ano] = partesData;
      
      // Parsear hora (formato "5:44:01PM")
      const horaStr = reserva.hour.trim();
      const isPM = horaStr.toUpperCase().includes('PM');
      const horaSemAMPM = horaStr.replace(/[AP]M/i, '').trim();
      const [hora, minuto, segundo] = horaSemAMPM.split(':').map(Number);
      
      let hora24 = hora;
      if (isPM && hora !== 12) hora24 = hora + 12;
      if (!isPM && hora === 12) hora24 = 0;
      
      const dataHora = new Date(ano, mes - 1, dia, hora24, minuto || 0, segundo || 0);
      return dataHora;
    } catch (error) {
      console.error('Erro ao parsear data/hora da reserva:', error);
      return null;
    }
  };

  const isReservaConcluida = (reserva) => {
    return reserva.concluido === true;
  };

  const marcarComoConcluida = async (reservaId, e) => {
    e.stopPropagation(); // Prevenir clique no card
    
    try {
      const reservaRef = doc(db, 'reservas', reservaId);
      await updateDoc(reservaRef, {
        concluido: true,
        concluido_em: serverTimestamp()
      });
      console.log(`✅ Reserva ${reservaId} marcada como concluída`);
    } catch (error) {
      console.error('❌ Erro ao marcar reserva como concluída:', error);
      alert('Erro ao marcar reserva como concluída. Verifique as permissões do Firestore.');
    }
  };

  // Separar reservas em concluídas e pendentes
  const reservasPendentes = reservas.filter(r => !isReservaConcluida(r));
  const reservasConcluidas = reservas.filter(r => isReservaConcluida(r));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando reservas...</p>
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

  if (reservas.length === 0) {
    return (
      <div className="empty-state">
        <p>📭 Nenhuma reserva encontrada</p>
        <p className="empty-hint">As reservas aparecerão aqui quando forem criadas.</p>
      </div>
    );
  }

  const renderReservaCard = (reserva) => {
    const concluida = isReservaConcluida(reserva);
    
    return (
      <div
        key={reserva.id}
        className={`reserva-card ${concluida ? 'reserva-concluida' : ''}`}
        onClick={() => onReservaClick(reserva)}
      >
        <div className="reserva-header">
          <span className="reserva-id">Reserva #{reserva.id.slice(0, 8)}</span>
        </div>
        
        <div className="reserva-info">
          <div className="info-item">
            <span className="info-label">Cliente:</span>
            <span className="info-value">{reserva.cliente?.name || 'Carregando...'}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Data:</span>
            <span className="info-value">{formatarData(reserva.data)}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Hora:</span>
            <span className="info-value">{formatarHora(reserva.hour)}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Assentos:</span>
            <span className="info-value">{reserva.assentos || 'Não informado'}</span>
          </div>
        </div>
        
        <div className="reserva-footer">
          {!concluida && (
            <button
              className="btn-concluir"
              onClick={(e) => marcarComoConcluida(reserva.id, e)}
            >
              ✓ Marcar como Concluída
            </button>
          )}
          {concluida && (
            <span className="concluido-badge">✓ Concluída</span>
          )}
          <span className="click-hint">Clique para ver detalhes →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="reservas-list">
      <h2>Reservas Recebidas</h2>
      
      {reservasPendentes.length > 0 && (
        <div className="reservas-section">
          <h3 className="section-title">📅 Reservas Pendentes ({reservasPendentes.length})</h3>
          <div className="reservas-grid">
            {reservasPendentes.map(renderReservaCard)}
          </div>
        </div>
      )}

      {reservasConcluidas.length > 0 && (
        <div className="reservas-section">
          <h3 className="section-title">✓ Reservas Concluídas ({reservasConcluidas.length})</h3>
          <div className="reservas-grid">
            {reservasConcluidas.map(renderReservaCard)}
          </div>
        </div>
      )}

      {reservasPendentes.length === 0 && reservasConcluidas.length === 0 && (
        <div className="empty-state">
          <p>📭 Nenhuma reserva encontrada</p>
        </div>
      )}
    </div>
  );
}

export default ReservasList;
