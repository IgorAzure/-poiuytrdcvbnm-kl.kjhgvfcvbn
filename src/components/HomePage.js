import React from 'react';
import './HomePage.css';

function HomePage({ onNavigate }) {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">🍽️ iFood - Painel do Restaurante</h1>
        <p className="home-subtitle">Gerencie pedidos e reservas do seu restaurante</p>
        
        <div className="home-buttons">
          <button 
            className="home-button pedidos-button"
            onClick={() => onNavigate('pedidos')}
          >
            <div className="button-icon">📦</div>
            <div className="button-content">
              <h2>Pedidos</h2>
              <p>Visualize e gerencie os pedidos recebidos</p>
            </div>
            <div className="button-arrow">→</div>
          </button>
          
          <button 
            className="home-button reservas-button"
            onClick={() => onNavigate('reservas')}
          >
            <div className="button-icon">📅</div>
            <div className="button-content">
              <h2>Reservas</h2>
              <p>Visualize e gerencie as reservas de mesas</p>
            </div>
            <div className="button-arrow">→</div>
          </button>

          <button 
            className="home-button usuarios-button"
            onClick={() => onNavigate('usuarios')}
          >
            <div className="button-icon">👥</div>
            <div className="button-content">
              <h2>Usuários</h2>
              <p>Visualize todos os usuários cadastrados</p>
            </div>
            <div className="button-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
