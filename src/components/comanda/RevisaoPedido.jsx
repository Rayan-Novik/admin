import React from 'react';
import { Trash2, Plus, Minus, ChevronLeft } from 'lucide-react';

export default function RevisaoPedido({ carrinho, setCarrinho, aoVoltar }) {
  const atualizarQtd = (cartItemId, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const novaQtd = item.quantidade + delta;
        return novaQtd > 0 ? { ...item, quantidade: novaQtd } : item;
      }
      return item;
    }));
  };

  const removerItem = (cartItemId) => setCarrinho(prev => prev.filter(i => i.cartItemId !== cartItemId));
  
  const total = carrinho.reduce((acc, item) => acc + (Number(item.preco_unitario_calculado || item.produto.preco) * item.quantidade), 0);

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="p-3 border-bottom bg-white sticky-top z-1 d-flex align-items-center shadow-sm">
        <button onClick={aoVoltar} className="btn btn-light text-primary border-0 p-2 me-3 rounded-3 d-flex align-items-center justify-content-center"><ChevronLeft size={24} /></button>
        <div>
          <h4 className="fw-bold text-dark mb-0">Revisar Itens</h4>
          <span className="text-secondary small fw-medium">Confirme antes de enviar para a cozinha</span>
        </div>
      </div>

      <div className="flex-grow-1 p-3 overflow-auto pb-5">
        {carrinho.length === 0 ? (
          <div className="text-center mt-5 text-secondary">Nenhum item selecionado.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {carrinho.map(item => (
              <div key={item.cartItemId} className="bg-white p-3 rounded-4 border border-light-subtle shadow-sm">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-bold text-dark">{item.produto.nome}</span>
                  <span className="fw-black text-primary">R$ {(Number(item.preco_unitario_calculado || item.produto.preco) * item.quantidade).toFixed(2)}</span>
                </div>
                
                {/* 🟢 MOSTRANDO OS COMPLEMENTOS ESTILO IFOOD NA REVISÃO */}
                {item.complementos && item.complementos.length > 0 && (
                    <div className="mb-2 mt-1">
                        {item.complementos.map((comp, idx) => (
                            <div key={idx} className="text-muted small fw-medium" style={{fontSize: '12px'}}>
                                ↳ {comp.quantidade > 1 ? `${comp.quantidade}x ` : ''}{comp.nome} 
                                {Number(comp.preco_adicional) > 0 ? ` (+R$ ${Number(comp.preco_adicional).toFixed(2)})` : ''}
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light-subtle">
                  <button onClick={() => removerItem(item.cartItemId)} className="btn btn-light text-danger p-2 rounded-3 border-0" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}><Trash2 size={20} /></button>
                  <div className="d-flex align-items-center gap-3 bg-light rounded-pill px-2 py-1 border border-secondary border-opacity-25">
                    <button onClick={() => atualizarQtd(item.cartItemId, -1)} className="btn btn-sm btn-white rounded-circle shadow-sm border p-1"><Minus size={18}/></button>
                    <span className="fw-bold fs-5 px-2">{item.quantidade}</span>
                    <button onClick={() => atualizarQtd(item.cartItemId, 1)} className="btn btn-sm btn-primary rounded-circle shadow-sm p-1"><Plus size={18}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-top border-light-subtle p-3 mt-auto shadow-sm" style={{ marginBottom: '8px' }}>
        <div className="d-flex justify-content-between align-items-center px-2">
          <span className="text-secondary fw-bold text-uppercase small">Total do Novo Pedido</span>
          <span className="fs-3 fw-black text-dark">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}