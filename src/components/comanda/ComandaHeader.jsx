import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import api from '../../services/api';

export default function ComandaHeader({ titulo, comandaAberta }) {
  const [horaAtual, setHoraAtual] = useState('');
  const [lojaConfig, setLojaConfig] = useState({ cor: '#0d6efd', logo: null });

  // 🟢 1. RELÓGIO EM TEMPO REAL
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      // Formata a hora no padrão brasileiro (ex: 14:30)
      setHoraAtual(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    atualizarHora(); // Atualiza imediatamente ao renderizar
    const intervalo = setInterval(atualizarHora, 1000); // Roda a cada segundo
    
    return () => clearInterval(intervalo); // Limpa o timer se sair da tela
  }, []);

  // 🟢 2. BUSCAR A COR E A LOGO DA LOJA
  useEffect(() => {
    const fetchConfiguracoes = async () => {
      try {
        const { data } = await api.get('/configuracoes/appearance');
        setLojaConfig({
          cor: data.HEADER_PRIMARY_COLOR || '#0d6efd',
          logo: data.LOGO_URL || null
        });
      } catch (error) {
        console.error("Erro ao carregar aparência do header:", error);
      }
    };
    fetchConfiguracoes();
  }, []);

  return (
    <header 
      className="text-white p-3 d-flex align-items-center justify-content-between sticky-top z-3 shadow-sm"
      style={{ backgroundColor: lojaConfig.cor, transition: 'background-color 0.3s' }}
    >
      {/* 🟢 LADO ESQUERDO (Logo/Título + Nome do Atendente) */}
      <div className="d-flex flex-column justify-content-center">
        
        {/* Mostra a Logo se tiver, senão mostra o Título em texto */}
        {lojaConfig.logo ? (
          <img 
            src={lojaConfig.logo} 
            alt="Logo da Loja" 
            style={{ maxHeight: '28px', maxWidth: '140px', objectFit: 'contain' }} 
          />
        ) : (
          <h1 className="h5 fw-bold mb-0 text-truncate">{titulo}</h1>
        )}

        {/* 🟢 Mostra quem abriu a mesa SEMPRE (Fica embaixo da logo ou do título) */}
        {comandaAberta && comandaAberta.nome_atendente && (
          <small className="opacity-100 d-flex align-items-center gap-1 mt-1 fw-medium" style={{ fontSize: '11px', textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
            <User size={12} /> Aberto por: {comandaAberta.nome_atendente.split(' ')[0]}
          </small>
        )}
      </div>

      {/* 🟢 RELÓGIO (Lado Direito) */}
      <div className="fw-black fs-5" style={{ letterSpacing: '1.5px' }}>
        {horaAtual}
      </div>
    </header>
  );
}