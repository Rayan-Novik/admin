import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import api from '../../services/api';

export default function ProdutoCatalogo({ carrinho, setCarrinho }) {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catSelecionada, setCatSelecionada] = useState(null); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // 🟢 ESTADOS DO MODAL DE PERSONALIZAÇÃO
  const [produtoModal, setProdutoModal] = useState(null);
  const [modalQtd, setModalQtd] = useState(1);
  const [modalComplements, setModalComplements] = useState({});
  const [modalObservacao, setModalObservacao] = useState(''); // 🟢 NOVO ESTADO: Observação

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data } = await api.get('/produtos');
        const produtosAtivos = data.filter(p => p.ativo);
        setProdutos(produtosAtivos);

        const catsMap = new Set(produtosAtivos.map(p => p.categorias?.nome || 'Sem Categoria'));
        setCategorias(Array.from(catsMap));
      } catch (error) { 
        toast.error("Erro ao carregar catálogo."); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProdutos();
  }, []);

  // 🟢 ATUALIZADO: Agora recebe a observação
  const adicionarAoCarrinho = (produto, quantidade, complementosEscolhidos = [], observacao = '') => {
    setCarrinho(prev => {
        // Se não tem complemento, verifica se pode agrupar (mesmo produto E mesma observação)
        if (complementosEscolhidos.length === 0) {
            const existente = prev.find(item => 
                item.produto.id_produto === produto.id_produto && 
                (!item.complementos || item.complementos.length === 0) &&
                ((!item.observacao && !observacao) || item.observacao === observacao)
            );
            if (existente) {
                return prev.map(item => item.cartItemId === existente.cartItemId ? { ...item, quantidade: item.quantidade + quantidade } : item);
            }
        }
        
        const extraPrice = complementosEscolhidos.reduce((acc, c) => acc + (Number(c.preco_adicional) * c.quantidade), 0);
        const finalPrice = Number(produto.preco) + extraPrice;

        return [...prev, {
            cartItemId: Math.random().toString(36).substring(2, 9),
            produto: produto,
            preco_unitario_calculado: finalPrice,
            quantidade,
            complementos: complementosEscolhidos,
            observacao // 🟢 Passando a observação para o carrinho
        }];
    });
    
    toast.success(`${produto.nome} adicionado!`, { autoClose: 500, hideProgressBar: true, position: "top-center" });
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const handleLancarItem = (produto) => {
      const isCustomizable = produto.grupos_complemento && produto.grupos_complemento.length > 0;
      
      if (isCustomizable) {
          setProdutoModal(produto);
          setModalQtd(1);
          setModalObservacao(''); // 🟢 Limpa a observação ao abrir novo modal

          // 🟢 AUTO-PREENCHIMENTO
          const initialComps = {};
          produto.grupos_complemento.forEach(grupo => {
              const obrigatorios = [];
              grupo.complementos.forEach(comp => {
                  if (comp.minimo > 0) {
                      obrigatorios.push({
                          id_produto_add: comp.id_produto_add,
                          preco_adicional: comp.preco_adicional,
                          nome: comp.produto_add?.nome,
                          quantidade: comp.minimo
                      });
                  }
              });
              if (obrigatorios.length > 0) {
                  initialComps[grupo.id_grupo] = obrigatorios;
              }
          });
          setModalComplements(initialComps);

      } else {
          adicionarAoCarrinho(produto, 1, [], '');
      }
  };

  const handleUpdateComplementQty = (grupo, comp, nomeComplemento, delta) => {
    setModalComplements(prev => {
        const atuais = prev[grupo.id_grupo] || [];
        const indexItem = atuais.findIndex(c => c.id_produto_add === comp.id_produto_add);
        const qtdAtualGrupo = atuais.reduce((acc, c) => acc + c.quantidade, 0);
        
        const qtdAtualItem = indexItem >= 0 ? atuais[indexItem].quantidade : 0;
        const maxItem = comp.maximo !== undefined ? comp.maximo : 1;
        const minItem = comp.minimo !== undefined ? comp.minimo : 0;

        if (grupo.maximo === 1) {
            if (delta > 0) {
                return { ...prev, [grupo.id_grupo]: [{ id_produto_add: comp.id_produto_add, preco_adicional: comp.preco_adicional, nome: nomeComplemento, quantidade: 1 }] };
            }
            return prev;
        }

        if (delta > 0) {
            if (qtdAtualGrupo >= grupo.maximo) {
                toast.warning(`Você atingiu o limite de ${grupo.maximo} opções para o grupo "${grupo.nome}".`);
                return prev;
            }
            if (qtdAtualItem >= maxItem) {
                toast.warning(`Você só pode adicionar no máximo ${maxItem}x o item "${nomeComplemento}".`);
                return prev;
            }

            if (indexItem >= 0) {
                const novos = [...atuais];
                novos[indexItem] = { ...novos[indexItem], quantidade: novos[indexItem].quantidade + 1 };
                return { ...prev, [grupo.id_grupo]: novos };
            } else {
                return { ...prev, [grupo.id_grupo]: [...atuais, { id_produto_add: comp.id_produto_add, preco_adicional: comp.preco_adicional, nome: nomeComplemento, quantidade: 1 }] };
            }
        } else {
            if (indexItem >= 0) {
                if (qtdAtualItem <= minItem) {
                    toast.warning(`O item "${nomeComplemento}" exige no mínimo ${minItem} opção(ões).`);
                    return prev;
                }

                const novos = [...atuais];
                if (novos[indexItem].quantidade > 1) {
                    novos[indexItem] = { ...novos[indexItem], quantidade: novos[indexItem].quantidade - 1 };
                    return { ...prev, [grupo.id_grupo]: novos };
                } else {
                    return { ...prev, [grupo.id_grupo]: atuais.filter((_, i) => i !== indexItem) };
                }
            }
            return prev;
        }
    });
  };

  const validateModalAndAdd = () => {
      const complementosFinais = [];
      for (const grupo of produtoModal.grupos_complemento) {
          const selecionados = modalComplements[grupo.id_grupo] || [];
          const qtdSelecionada = selecionados.reduce((acc, c) => acc + c.quantidade, 0);
          
          if (qtdSelecionada < grupo.minimo) {
              toast.warning(`Selecione pelo menos ${grupo.minimo} opção(ões) no grupo "${grupo.nome}"`);
              return;
          }

          for (const comp of grupo.complementos) {
              const itemSel = selecionados.find(c => c.id_produto_add === comp.id_produto_add);
              const qtdItem = itemSel ? itemSel.quantidade : 0;
              if (comp.minimo > 0 && qtdItem < comp.minimo) {
                  toast.warning(`A opção "${comp.produto_add?.nome}" é obrigatória (Mínimo: ${comp.minimo}).`);
                  return;
              }
          }
          complementosFinais.push(...selecionados);
      }
      
      // 🟢 Envia a observação para o carrinho
      adicionarAoCarrinho(produtoModal, modalQtd, complementosFinais, modalObservacao);
      setProdutoModal(null);
  };

  const calcularTotalModal = () => {
      let total = Number(produtoModal?.preco || 0);
      Object.values(modalComplements).flat().forEach(comp => { 
          total += (Number(comp.preco_adicional) * comp.quantidade); 
      });
      return total * modalQtd;
  };

  const isBuscando = busca.trim().length > 0;
  const produtosMostrados = isBuscando
    ? produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : (catSelecionada ? produtos.filter(p => (p.categorias?.nome || 'Sem Categoria') === catSelecionada) : []);

  return (
    <div className="d-flex flex-column h-100 bg-light position-relative">
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
                        <button onClick={() => handleLancarItem(prod)} className="w-100 bg-white border border-light-subtle rounded-4 p-3 d-flex flex-column justify-content-between text-start shadow-sm active:border-success active:bg-success-subtle active:scale-95 transition-all position-relative" style={{ height: '140px' }}>
                          <span className="fw-bold text-dark lh-sm">{prod.nome}</span>
                          <span className="text-primary fw-bold fs-5 mt-auto">R$ {Number(prod.preco).toFixed(2)}</span>
                          {prod.grupos_complemento?.length > 0 && (
                              <span className="position-absolute bottom-0 end-0 mb-3 me-3 text-muted fw-bold" style={{fontSize: '10px'}}><Plus size={12} strokeWidth={3}/> OPÇÕES</span>
                          )}
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

      {/* 🟢 MODAL ESTILO IFOOD */}
      {produtoModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-end align-items-sm-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="bg-white w-100 d-flex flex-column" style={{ maxWidth: '500px', height: '95vh', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', overflow: 'hidden' }}>
                  
                  {/* FOTO E BOTÃO DE FECHAR */}
                  <div className="position-relative bg-white flex-shrink-0" style={{ height: '220px' }}>
                      {produtoModal.imagem_url ? (
                          <img src={produtoModal.imagem_url} alt={produtoModal.nome} className="w-100 h-100 object-fit-cover" />
                      ) : (
                          <div className="w-100 h-100 d-flex justify-content-center align-items-center bg-secondary bg-opacity-10 text-muted"><ShoppingBag size={48} /></div>
                      )}
                      <button onClick={() => setProdutoModal(null)} className="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', padding: 0 }}>
                          <X size={20} strokeWidth={2.5} className="text-dark" />
                      </button>
                  </div>
                  
                  {/* TÍTULO E PREÇO */}
                  <div className="p-3 bg-white border-bottom flex-shrink-0">
                      <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: '22px' }}>{produtoModal.nome}</h3>
                      {produtoModal.descricao && <p className="text-secondary mb-2 small" style={{display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{produtoModal.descricao}</p>}
                      <h5 className="fw-medium text-primary mb-0" style={{ color: '#0d6efd' }}>R$ {Number(produtoModal.preco).toFixed(2)}</h5>
                  </div>
                  
                  {/* ÁREA DE SELEÇÃO DE GRUPOS E OBSERVAÇÃO */}
                  <div className="overflow-auto flex-grow-1" style={{ backgroundColor: '#f7f7f7' }}>
                      {produtoModal.grupos_complemento?.map((grupo) => {
                          const selecionados = modalComplements[grupo.id_grupo] || [];
                          const isRequired = grupo.minimo > 0;
                          const atingiuMaximo = selecionados.reduce((acc, c) => acc + c.quantidade, 0) >= grupo.maximo;

                          return (
                              <div key={grupo.id_grupo} className="bg-white mb-2 pt-3 pb-1 shadow-sm">
                                  <div className="px-3 d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '15px' }}>{grupo.nome}</h6>
                                          <small className="text-secondary" style={{fontSize: '12px'}}>
                                              Escolha {grupo.minimo === grupo.maximo ? `exatamente ${grupo.maximo}` : `de ${grupo.minimo} até ${grupo.maximo}`} opções
                                          </small>
                                      </div>
                                      {isRequired ? <span className="badge bg-dark text-white fw-bold">Obrigatório</span> : <span className="badge bg-secondary bg-opacity-25 text-secondary fw-bold">Opcional</span>}
                                  </div>

                                  <div className="d-flex flex-column">
                                      {grupo.complementos?.map((comp) => {
                                          const itemSelecionado = selecionados.find(c => c.id_produto_add === comp.id_produto_add);
                                          const qtdDesteItem = itemSelecionado ? itemSelecionado.quantidade : 0;
                                          
                                          const maxItem = comp.maximo !== undefined ? comp.maximo : 1;
                                          const minItem = comp.minimo !== undefined ? comp.minimo : 0;

                                          const isDisabledAdd = atingiuMaximo || qtdDesteItem >= maxItem;
                                          const isDisabledRemove = qtdDesteItem <= minItem;

                                          return (
                                              <div key={comp.id_produto_add} className={`d-flex align-items-center justify-content-between px-3 py-3 border-bottom ${qtdDesteItem > 0 ? 'bg-primary border-primary border-opacity-25 bg-opacity-10' : ''}`} style={{transition: 'all 0.2s'}}>
                                                  
                                                  <div className="d-flex flex-column" 
                                                       onClick={() => { if (grupo.maximo === 1) handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1); }} 
                                                       style={{ cursor: grupo.maximo === 1 ? 'pointer' : 'default', flex: 1 }}
                                                  >
                                                      <span className="fw-medium text-dark">{comp.produto_add?.nome}</span>
                                                      {Number(comp.preco_adicional) > 0 && (
                                                          <span className="small text-secondary">+ R$ {Number(comp.preco_adicional).toFixed(2)}</span>
                                                      )}
                                                  </div>

                                                  <div className="d-flex align-items-center">
                                                      {grupo.maximo === 1 ? (
                                                          <div 
                                                              className={`rounded-circle border d-flex align-items-center justify-content-center cursor-pointer ${qtdDesteItem > 0 ? 'border-primary' : 'border-secondary'}`} 
                                                              style={{ width: '22px', height: '22px', padding: '2px' }}
                                                              onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                          >
                                                              {qtdDesteItem > 0 && <div className="bg-primary rounded-circle w-100 h-100"></div>}
                                                          </div>
                                                      ) : (
                                                          <div className="d-flex align-items-center gap-2">
                                                              {qtdDesteItem > 0 ? (
                                                                  <>
                                                                      <button 
                                                                          className={`btn p-0 d-flex align-items-center justify-content-center rounded-circle border bg-white ${isDisabledRemove ? 'opacity-50 border-secondary-subtle text-secondary' : 'border-danger-subtle text-danger'}`}
                                                                          style={{ width: '28px', height: '28px' }}
                                                                          onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, -1)}
                                                                          disabled={isDisabledRemove}
                                                                      >
                                                                          <Minus size={14} />
                                                                      </button>
                                                                      <span className="fw-bold text-dark text-center" style={{ width: '16px' }}>{qtdDesteItem}</span>
                                                                      <button 
                                                                          className={`btn p-0 d-flex align-items-center justify-content-center rounded-circle border bg-white ${isDisabledAdd ? 'opacity-50 border-secondary-subtle text-secondary' : 'border-primary-subtle text-primary'}`}
                                                                          style={{ width: '28px', height: '28px' }}
                                                                          onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                                          disabled={isDisabledAdd}
                                                                      >
                                                                          <Plus size={14} />
                                                                      </button>
                                                                  </>
                                                              ) : (
                                                                  <button 
                                                                      className={`btn p-0 d-flex align-items-center justify-content-center rounded-circle border bg-white ${isDisabledAdd ? 'opacity-50 border-secondary-subtle text-secondary' : 'border-secondary-subtle text-secondary'}`}
                                                                      style={{ width: '28px', height: '28px' }}
                                                                      onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                                      disabled={isDisabledAdd}
                                                                  >
                                                                      <Plus size={14} />
                                                                  </button>
                                                              )}
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                          )
                                      })}
                                  </div>
                              </div>
                          )
                      })}

                      {/* 🟢 NOVO CAMPO DE OBSERVAÇÃO */}
                      <div className="bg-white mb-2 pt-3 pb-3 shadow-sm border-top">
                          <div className="px-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '15px' }}>Alguma observação?</h6>
                                  <span className="text-secondary small">Opcional</span>
                              </div>
                              <textarea
                                  className="form-control bg-light border-0"
                                  rows="2"
                                  placeholder="Ex: Tirar cebola, molho à parte..."
                                  value={modalObservacao}
                                  onChange={(e) => setModalObservacao(e.target.value)}
                                  style={{ fontSize: '14px', resize: 'none', boxShadow: 'none' }}
                              />
                          </div>
                      </div>
                      
                  </div>

                  {/* BARRA INFERIOR (CARRINHO) */}
                  <div className="p-3 bg-white d-flex align-items-center justify-content-between gap-3 flex-shrink-0" style={{ boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', zIndex: 2 }}>
                      <div className="d-flex align-items-center justify-content-between bg-white border rounded-3" style={{ height: '48px', width: '120px', borderColor: '#e0e0e0' }}>
                          <button onClick={() => setModalQtd(Math.max(1, modalQtd - 1))} className="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '100%' }}>
                              <Minus size={20} strokeWidth={2} />
                          </button>
                          <span className="fw-bold text-dark fs-6">{modalQtd}</span>
                          <button onClick={() => setModalQtd(modalQtd + 1)} className="btn btn-link text-primary text-decoration-none p-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '100%' }}>
                              <Plus size={20} strokeWidth={2} />
                          </button>
                      </div>

                      <button onClick={validateModalAndAdd} className="btn btn-primary flex-grow-1 rounded-3 fw-bold d-flex justify-content-between align-items-center px-3" style={{ height: '48px', fontSize: '15px', backgroundColor: '#0d6efd' }}>
                          <span>Adicionar</span>
                          <span>R$ {calcularTotalModal().toFixed(2)}</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}