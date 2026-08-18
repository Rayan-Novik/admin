import React, { useState, useEffect } from 'react';
import { Home, Receipt, Search, LogOut, ChevronRight, Plus, ShoppingBag, CheckCircle } from 'lucide-react';
import { Spinner } from 'react-bootstrap';
import api from '../../services/api';

export default function ComandaBottomNav({ 
  telaAtiva, setTelaAtiva, comandaSelecionada, carrinho = [], loadingAcao,
  acaoRevisar, acaoEnviarCozinha, acaoAdicionarItem, acaoPedirConta 
}) {
  const [lojaConfig, setLojaConfig] = useState({ primaria: '#0d6efd', textoBtn: '#ffffff' });

  useEffect(() => {
    const fetchConfiguracoes = async () => {
      try {
        const { data } = await api.get('/configuracoes/appearance');
        setLojaConfig({ primaria: data.HEADER_PRIMARY_COLOR || '#0d6efd', textoBtn: data.BTN_PRIMARY_TEXT || '#ffffff' });
      } catch (error) { console.error(error); }
    };
    fetchConfiguracoes();
  }, []);

  const hexToRgba = (hex, opacity) => {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x' + c.join('');
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
    }
    return `rgba(13, 110, 253, ${opacity})`;
  };

  const navItems = [
    { id: 'lista', label: 'Mesas', icon: Home, disabled: false },
    { id: 'detalhe', label: 'Comanda', icon: Receipt, disabled: !comandaSelecionada },
    { id: 'catalogo', label: 'Catálogo', icon: Search, disabled: !comandaSelecionada && carrinho.length === 0 }
  ];

  const totalMesa = Number(comandaSelecionada?.preco_total || 0);

  // 🟢 RENDERIZAÇÃO DOS BOTÕES DE AÇÃO BASEADO NA TELA
  const renderAcoesFlutuantes = () => {
    if (telaAtiva === 'revisao') {
      return (
        <button onClick={acaoEnviarCozinha} disabled={loadingAcao || carrinho.length === 0} className="btn btn-success w-100 fw-bold py-3 rounded-4 d-flex justify-content-center align-items-center gap-2 border-0 shadow-lg active:scale-95 transition-transform">
          {loadingAcao ? <Spinner size="sm" /> : <><CheckCircle size={22} strokeWidth={2.5} /> Enviar para Cozinha</>}
        </button>
      );
    }
    if (telaAtiva === 'catalogo' && carrinho.length > 0) {
      return (
        <button onClick={acaoRevisar} className="btn w-100 fw-bold py-3 rounded-4 d-flex justify-content-center align-items-center gap-2 border-0 shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: lojaConfig.primaria, color: lojaConfig.textoBtn }}>
          <ShoppingBag size={22} strokeWidth={2.5} />
          Avançar e Revisar ({carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens)
        </button>
      );
    }
    if (telaAtiva === 'detalhe') {
      return (
        <div className="d-flex gap-2 w-100 shadow-lg rounded-4 overflow-hidden bg-white p-2 border border-light-subtle">
          <button onClick={acaoAdicionarItem} disabled={loadingAcao} className="btn bg-dark text-white w-50 fw-bold py-2 rounded-3 d-flex flex-column justify-content-center align-items-center border-0 active:scale-95 transition-transform">
            <Plus size={20} className="mb-1" strokeWidth={2.5} />
            <span style={{ fontSize: '11px' }}>Adicionar Itens</span>
          </button>
          <button onClick={acaoPedirConta} disabled={loadingAcao || totalMesa <= 0} className="btn btn-light border border-secondary w-50 fw-bold py-2 rounded-3 d-flex flex-column justify-content-center align-items-center text-dark active:bg-secondary-subtle transition-colors">
            <Receipt size={20} className="mb-1" strokeWidth={2.5} />
            <span style={{ fontSize: '11px' }}>Pedir Conta</span>
          </button>
        </div>
      );
    }
    if (comandaSelecionada && telaAtiva !== 'detalhe' && telaAtiva !== 'revisao') {
      return (
        <button onClick={() => setTelaAtiva('detalhe')} className="btn bg-white rounded-pill w-100 d-flex justify-content-between align-items-center shadow-lg px-4 py-3 border-0 active:scale-95 transition-transform">
          <div className="d-flex align-items-center gap-2">
            <span className="bg-success rounded-circle shadow-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="fw-black text-dark" style={{ fontSize: '14px' }}>Mesa {comandaSelecionada.codigo_comanda}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-black text-primary" style={{ fontSize: '15px' }}>R$ {totalMesa.toFixed(2)}</span>
            <ChevronRight size={20} className="text-secondary" />
          </div>
        </button>
      );
    }
    return null;
  };

  return (
    <>
      <div className="position-fixed w-100 d-flex justify-content-center z-3" style={{ bottom: '85px', padding: '0 16px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: '100%' }}>
          {renderAcoesFlutuantes()}
        </div>
      </div>

      <div className="position-fixed bottom-0 start-0 w-100 border-top-0 d-flex justify-content-around align-items-center pb-2 pt-2 px-2 z-3 shadow-lg" style={{ height: '75px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', backgroundColor: lojaConfig.primaria, transition: 'background-color 0.3s' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = telaAtiva === item.id;
          return (
            <button key={item.id} onClick={() => !item.disabled && setTelaAtiva(item.id)} disabled={item.disabled} className="btn border-0 d-flex flex-column align-items-center justify-content-center p-2" style={{ opacity: item.disabled ? 0.4 : 1, width: '75px', backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent', borderRadius: '16px', transition: 'all 0.2s ease-in-out' }}>
              <Icon size={24} className="mb-1" color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500', color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)' }}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => window.location.href = '/'} className="btn border-0 d-flex flex-column align-items-center justify-content-center p-2" style={{ width: '75px' }}>
          <LogOut size={24} className="mb-1" color="rgba(255, 255, 255, 0.8)" />
          <span style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>Sair</span>
        </button>
      </div>
    </>
  );
}