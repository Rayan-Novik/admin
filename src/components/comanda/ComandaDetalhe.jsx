import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Spinner, Badge } from 'react-bootstrap';
import api from '../../services/api';

export default function ComandaDetalhe({ comandaOriginal, atualizarComandaBase, mesaContexto }) {
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const carregarItens = async (silencioso = false) => {
    try {
      if (!silencioso && !comanda) setLoading(true);
      if (silencioso) setIsRefreshing(true);
      
      const { data } = await api.get('/comandas');
      
      // 🟢 FALLBACK DE SEGURANÇA: Se o ID sumiu, procura a comanda pelo Nome da Mesa!
      const comandaAtualizada = data.find(c => 
         (comandaOriginal?.id_pedido && c.id_pedido === comandaOriginal.id_pedido) || 
         (mesaContexto?.nome && c.codigo_comanda === mesaContexto.nome)
      );
      
      setComanda(comandaAtualizada || comandaOriginal);
      if (atualizarComandaBase) atualizarComandaBase(comandaAtualizada || comandaOriginal);
    } catch (error) {
      if (!silencioso) toast.error("Erro ao atualizar itens da comanda.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 🟢 Agora aceita iniciar a busca desde que saiba qual é a mesa
    if (comandaOriginal?.id_pedido || mesaContexto?.nome) {
      carregarItens();
      
      // O sistema do garçom checa a mesa a cada 3 segundos
      const interval = setInterval(() => {
        carregarItens(true);
      }, 3000);
      
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line
  }, [comandaOriginal?.id_pedido, mesaContexto?.nome]);

  const handleRemoverItem = async (id_item) => {
    if(!window.confirm("Deseja remover este item e estornar do estoque?")) return;
    try {
      await api.delete(`/comandas/${comanda.id_pedido}/itens/${id_item}`);
      toast.success("Item removido!");
      carregarItens();
    } catch (error) {
      toast.error("Erro ao remover item.");
    }
  };

  if (loading && !comanda) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  const itens = comanda?.pedido_items || [];
  const total = Number(comanda?.preco_total || 0);

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="flex-grow-1 p-3 overflow-auto pb-4">
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-secondary mb-0 text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
            Itens Consumidos ({itens.length})
          </h3>
          
          <button 
            onClick={() => carregarItens(false)} 
            className="btn btn-sm btn-light border border-secondary-subtle d-flex align-items-center gap-2 text-secondary fw-medium rounded-pill px-3 shadow-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? "spin-animation" : ""} />
            Atualizar
          </button>
        </div>
        
        <div className="d-flex flex-column gap-2">
          {itens.map(item => (
            <div key={item.id_item} className="bg-white p-3 rounded-4 border border-2 border-light-subtle d-flex justify-content-between align-items-start shadow-sm">
              <div className="flex-grow-1 pe-2">
                <p className="fw-bold text-dark mb-0">{item.quantidade}x {item.nome}</p>
                
                {/* 🟢 EXIBIÇÃO DOS COMPLEMENTOS NO PAINEL DO GARÇOM/CAIXA */}
                {item.complementos && item.complementos.length > 0 && (
                  <div className="my-1 ps-2 border-start border-2 border-primary-subtle d-flex flex-column gap-1">
                    {item.complementos.map((comp, idx) => (
                      <div key={idx} className="d-flex justify-content-between text-secondary" style={{ fontSize: '11px' }}>
                        <span>+ {comp.quantidade}x {comp.nome || comp.produto_add?.nome}</span>
                        {Number(comp.preco_adicional) > 0 && (
                          <span className="fw-medium">R$ {(Number(comp.preco_adicional) * comp.quantidade).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 🟢 EXIBIÇÃO DA OBSERVAÇÃO */}
                {item.observacao && (
                  <div className="text-danger-emphasis bg-danger-subtle px-2 py-1 rounded-2 mt-1" style={{ fontSize: '11px' }}>
                    <strong>Obs:</strong> {item.observacao}
                  </div>
                )}

                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="small text-secondary fw-medium">R$ {Number(item.preco).toFixed(2)} cada</span>
                  
                  {item.nome_atendente && (
                    <Badge bg="light" text="secondary" className="border px-2 fw-medium" style={{ fontSize: '9px' }}>
                      Lançado por: {item.nome_atendente.split(' ')[0]}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <p className="fw-bold text-primary mb-0">R$ {(Number(item.quantidade) * Number(item.preco)).toFixed(2)}</p>
                <button onClick={() => handleRemoverItem(item.id_item)} className="btn btn-light text-danger border-0 p-2 rounded-3" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {itens.length === 0 && (
            <div className="text-center text-muted mt-5 bg-white p-4 rounded-4 border border-light-subtle">
                <p className="mb-0">Nenhum item lançado ainda.</p>
                <small className="text-secondary">Se o cliente pedir no celular, aparecerá aqui automaticamente.</small>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-top border-light-subtle p-3 mt-auto shadow-sm" style={{ marginBottom: '8px' }}>
        <div className="d-flex justify-content-between align-items-center px-2">
          <span className="text-secondary fw-bold text-uppercase small">Total da Mesa</span>
          <span className="fs-2 fw-black text-dark mb-0">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      
      <style>{`
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}