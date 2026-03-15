import React, { useState, useEffect, useRef } from 'react';
import { buscarProdutos } from './pdvService';
import { Search, Plus, PackageSearch, Barcode, Type, X } from 'lucide-react';

export default function ProductSearch({ onAddProduct }) {
    const [buscaNome, setBuscaNome] = useState('');
    const [buscaCodigo, setBuscaCodigo] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('NOME'); // 'NOME' or 'CODIGO' for mobile usability
    
    const nomeInputRef = useRef(null);
    const codigoInputRef = useRef(null);

    // EFEITO 1: Busca por NOME
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (buscaNome.length >= 2) { 
                executarBusca(buscaNome, 'nome');
            } else if (buscaNome.length === 0 && buscaCodigo.length === 0) {
                setProducts([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [buscaNome]);

    // EFEITO 2: Busca por CÓDIGO
    useEffect(() => {
        if (buscaCodigo.length > 0) {
            executarBusca(buscaCodigo, 'codigo');
        }
    }, [buscaCodigo]);

    const executarBusca = async (termo, tipo) => {
        setLoading(true);
        try {
            const data = await buscarProdutos(termo, tipo);
            setProducts(data || []);
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeNome = (e) => {
        setBuscaNome(e.target.value);
        if (e.target.value) setBuscaCodigo(''); 
    };

    const handleChangeCodigo = (e) => {
        setBuscaCodigo(e.target.value);
        if (e.target.value) setBuscaNome(''); 
    };

    const handleKeyDownCodigo = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!buscaCodigo.trim()) return;
            setLoading(true);
            try {
                const resultados = await buscarProdutos(buscaCodigo, 'codigo');
                if (resultados && resultados.length === 1) {
                    onAddProduct(resultados[0]);
                    setBuscaCodigo('');
                    setProducts([]);
                    // Keep focus on code input for rapid scanning
                    setTimeout(() => codigoInputRef.current?.focus(), 100);
                } else if (resultados && resultados.length > 1) {
                    setProducts(resultados);
                } else {
                    alert('Produto não encontrado.');
                    setProducts([]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    const clearSearch = () => {
        setBuscaNome('');
        setBuscaCodigo('');
        setProducts([]);
        if(activeTab === 'NOME') nomeInputRef.current?.focus();
        else codigoInputRef.current?.focus();
    };

    return (
        <div className="d-flex flex-column h-100 bg-white">
            {/* Search Header - Adapted for Mobile */}
            <div className="p-2 p-md-3 border-bottom sticky-top bg-white z-2">
                {/* Mobile Tabs for switching input type (saves screen space) */}
                <div className="d-md-none d-flex mb-2 bg-light rounded-pill p-1">
                    <button 
                        className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${activeTab === 'NOME' ? 'btn-white shadow-sm text-primary' : 'text-muted'}`}
                        onClick={() => { setActiveTab('NOME'); setTimeout(() => nomeInputRef.current?.focus(), 100); }}
                    >
                        <Type size={14} className="me-1"/> Nome
                    </button>
                    <button 
                        className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${activeTab === 'CODIGO' ? 'btn-white shadow-sm text-primary' : 'text-muted'}`}
                        onClick={() => { setActiveTab('CODIGO'); setTimeout(() => codigoInputRef.current?.focus(), 100); }}
                    >
                        <Barcode size={14} className="me-1"/> Código
                    </button>
                </div>

                <div className="position-relative">
                    <div className={`input-group input-group-lg shadow-sm rounded-pill overflow-hidden border ${activeTab === 'CODIGO' ? 'd-flex' : 'd-none d-md-flex'}`}>
                        <span className="input-group-text bg-white border-0 ps-3 text-muted"><Barcode size={20} /></span>
                        <input
                            ref={codigoInputRef}
                            type="text"
                            inputMode="numeric" // Mobile numeric keyboard
                            placeholder="Escanear Código..."
                            className="form-control border-0 shadow-none fs-6"
                            value={buscaCodigo}
                            onChange={handleChangeCodigo}
                            onKeyDown={handleKeyDownCodigo}
                        />
                        {buscaCodigo && <button className="btn btn-white border-0 text-muted" onClick={clearSearch}><X size={18}/></button>}
                    </div>

                    <div className={`input-group input-group-lg shadow-sm rounded-pill overflow-hidden border mt-md-0 ${activeTab === 'NOME' ? 'd-flex' : 'd-none d-md-flex'} ${activeTab === 'NOME' ? '' : 'mt-2'}`}>
                        <span className="input-group-text bg-white border-0 ps-3 text-muted"><Search size={20} /></span>
                        <input
                            ref={nomeInputRef}
                            type="text"
                            placeholder="Buscar por nome..."
                            className="form-control border-0 shadow-none fs-6"
                            value={buscaNome}
                            onChange={handleChangeNome}
                        />
                        {buscaNome && <button className="btn btn-white border-0 text-muted" onClick={clearSearch}><X size={18}/></button>}
                    </div>
                </div>
                {loading && <div className="progress mt-2" style={{height: '3px'}}><div className="progress-bar progress-bar-striped progress-bar-animated w-100"></div></div>}
            </div>

            {/* RESULTS GRID */}
            <div className="flex-grow-1 overflow-auto p-2 bg-light">
                {products.length > 0 ? (
                    // Responsive Grid: 2 cols on mobile, 3 on tablet, 4+ on desktop
                    <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-4 row-cols-xl-5 g-2 g-md-3">
                        {products.map((produto) => (
                            <div key={produto.id_produto} className="col">
                                <div 
                                    className="card h-100 border-0 shadow-sm rounded-4 cursor-pointer position-relative overflow-hidden product-card-hover"
                                    onClick={() => onAddProduct(produto)}
                                >
                                    <div className="position-relative bg-white ratio ratio-1x1 border-bottom">
                                        {produto.imagem_url ? (
                                            <img src={produto.imagem_url} alt={produto.nome} className="object-fit-contain p-2" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center text-muted opacity-25 h-100"><PackageSearch size={32} /></div>
                                        )}
                                        <div className="position-absolute bottom-0 end-0 m-2">
                                            <button className="btn btn-sm btn-primary rounded-circle shadow p-0 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-body p-2 d-flex flex-column">
                                        <h6 className="card-title text-truncate-2 small fw-bold mb-1 text-dark" style={{ lineHeight: '1.3', height: '2.6em', overflow: 'hidden' }}>
                                            {produto.nome}
                                        </h6>
                                        <div className="mt-auto">
                                            <span className="fw-bold text-success fs-6">R$ {Number(produto.preco).toFixed(2)}</span>
                                            <small className="text-muted d-block" style={{fontSize: '0.65rem'}}>ID: {produto.id_produto}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50 p-4 text-center">
                        {loading ? (
                            <p>Buscando...</p>
                        ) : (buscaNome || buscaCodigo) ? (
                            <>
                                <PackageSearch size={48} className="mb-3" />
                                <h6>Nenhum produto encontrado</h6>
                            </>
                        ) : (
                            <>
                                <Search size={48} className="mb-3" />
                                <p className="small">Digite ou escaneie para buscar.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            <style>{`
                .text-truncate-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .product-card-hover:active {
                    transform: scale(0.98);
                    transition: transform 0.1s;
                }
            `}</style>
        </div>
    );
}