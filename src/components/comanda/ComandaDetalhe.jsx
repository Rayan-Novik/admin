import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Spinner, Badge } from 'react-bootstrap';
import api from '../../services/api';

export default function ComandaDetalhe({ comandaOriginal, atualizarComandaBase }) {
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/comandas');
      const comandaAtualizada = data.find(c => c.id_pedido === comandaOriginal?.id_pedido);
      setComanda(comandaAtualizada || comandaOriginal);
      if (atualizarComandaBase) atualizarComandaBase(comandaAtualizada || comandaOriginal);
    } catch (error) {
      toast.error("Erro ao atualizar itens da comanda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (comandaOriginal?.id_pedido) {
      carregarItens();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line
  }, [comandaOriginal?.id_pedido]);

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

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  const itens = comanda?.pedido_items || [];
  const total = Number(comanda?.preco_total || 0);

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="flex-grow-1 p-3 overflow-auto pb-4">
        
        {/* CABEÇALHO DOS ITENS */}
        <h3 className="fw-bold text-secondary mb-3 text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
          Itens Consumidos ({itens.length})
        </h3>
        
        <div className="d-flex flex-column gap-2">
          {itens.map(item => (
            <div key={item.id_item} className="bg-white p-3 rounded-4 border border-2 border-light-subtle d-flex justify-content-between align-items-center shadow-sm">
              <div>
                <p className="fw-bold text-dark mb-0">{item.quantidade}x {item.nome}</p>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="small text-secondary fw-medium">R$ {Number(item.preco).toFixed(2)} cada</span>
                  
                  {/* 🟢 MOSTRANDO QUEM LANÇOU ESSE ITEM ESPECÍFICO */}
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
          {itens.length === 0 && <p className="text-center text-muted mt-4">Nenhum item lançado ainda.</p>}
        </div>
      </div>

      <div className="bg-white border-top border-light-subtle p-3 mt-auto shadow-sm" style={{ marginBottom: '8px' }}>
        <div className="d-flex justify-content-between align-items-center px-2">
          <span className="text-secondary fw-bold text-uppercase small">Total da Mesa</span>
          <span className="fs-2 fw-black text-dark mb-0">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}