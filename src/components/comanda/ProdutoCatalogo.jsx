import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import api from '../../services/api';

export default function ProdutoCatalogo({ carrinho, setCarrinho }) {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catSelecionada, setCatSelecionada] = useState(null); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data } = await api.get('/produtos');
        const produtosAtivos = data.filter(p => p.ativo);
        setProdutos(produtosAtivos);

        const catsMap = new Set(produtosAtivos.map(p => p.categorias?.nome || 'Sem Categoria'));
        setCategorias(Array.from(catsMap));
      } catch (error) { toast.error("Erro ao carregar catálogo."); } finally { setLoading(false); }
    };
    fetchProdutos();
  }, []);

  const handleLancarItem = (produto) => {
    setCarrinho(prev => {
        const existe = prev.find(i => i.produto.id_produto === produto.id_produto);
        if (existe) return prev.map(i => i.produto.id_produto === produto.id_produto ? { ...i, quantidade: i.quantidade + 1 } : i);
        return [...prev, { produto, quantidade: 1 }];
    });
    toast.success(`${produto.nome} selecionado!`, { autoClose: 500, hideProgressBar: true, position: "top-center" });
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const isBuscando = busca.trim().length > 0;
  const produtosMostrados = isBuscando
    ? produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : (catSelecionada ? produtos.filter(p => (p.categorias?.nome || 'Sem Categoria') === catSelecionada) : []);

  return (
    <div className="d-flex flex-column h-100 bg-light relative">
      <div className="p-3 border-bottom border-2 border-light-subtle bg-white sticky-top z-1">
        <div className="position-relative">
          <Search className="position-absolute text-secondary" size={20} style={{ left: '16px', top: '14px' }} />
          <input type="text" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="form-control form-control-lg border-0 bg-light rounded-4" style={{ paddingLeft: '44px', fontWeight: '500' }} />
        </div>
      </div>

      <div className="p-3 overflow-auto pb-5">
        {loading ? (
          <div className="text-center w-100 mt-4"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <>
            {!isBuscando && !catSelecionada && (
              <div className="row g-3">
                {categorias.map(cat => (
                  <div className="col-6" key={cat}>
                    <button onClick={() => setCatSelecionada(cat)} className="w-100 bg-white border border-2 border-primary-subtle text-primary rounded-4 p-3 d-flex flex-column justify-content-center align-items-center text-center shadow-sm active:scale-95 transition-transform" style={{ height: '120px' }}>
                      <span className="fw-bold fs-5 lh-sm">{cat}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(isBuscando || catSelecionada) && (
              <>
                {!isBuscando && (
                  <div className="d-flex align-items-center mb-3">
                    <button onClick={() => setCatSelecionada(null)} className="btn btn-light text-primary border-0 p-2 me-2 rounded-3 d-flex align-items-center justify-content-center"><ChevronLeft size={24} /></button>
                    <h4 className="fw-bold text-dark mb-0">{catSelecionada}</h4>
                  </div>
                )}
                <div className="row g-3">
                  {produtosMostrados.length === 0 ? (
                    <div className="text-center text-secondary w-100 mt-4 fw-medium">Nenhum produto encontrado.</div>
                  ) : (
                    produtosMostrados.map(prod => (
                      <div className="col-6" key={prod.id_produto}>
                        <button onClick={() => handleLancarItem(prod)} className="w-100 bg-white border border-light-subtle rounded-4 p-3 d-flex flex-column justify-content-between text-start shadow-sm active:border-success active:bg-success-subtle active:scale-95 transition-all" style={{ height: '140px' }}>
                          <span className="fw-bold text-dark lh-sm">{prod.nome}</span>
                          <span className="text-primary fw-bold fs-5 mt-auto">R$ {Number(prod.preco).toFixed(2)}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}