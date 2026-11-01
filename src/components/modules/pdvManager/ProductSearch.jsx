import React, { useState, useEffect, useRef, useMemo } from 'react';
import { buscarProdutos, buscarProdutosIniciais, playPdvBeep } from './pdvService';
import { Search, Plus, PackageSearch, X, ScanLine, Tag, RefreshCw } from 'lucide-react';
import { InputGroup, Form, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

import BarcodeScannerModal from './BarcodeScannerModal';
import api from '../../../services/api';

export default function ProductSearch({ onAddProduct, searchInputRef }) {
    const [busca, setBusca] = useState('');
    const [products, setProducts] = useState([]);
    const [initialProducts, setInitialProducts] = useState([]);
    const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
    const [loading, setLoading] = useState(false);

    const [logoLoja, setLogoLoja] = useState('');
    const [modalScannerOpen, setModalScannerOpen] = useState(false);
    const localInputRef = useRef(null);
    const inputRef = searchInputRef || localInputRef;
    const isSearchingRef = useRef(false);

    // Carrega logo e vitrine inicial de produtos ao abrir o PDV
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [resAppearance, listaInicial] = await Promise.all([
                    api.get('/configuracoes/appearance').catch(() => ({ data: null })),
                    buscarProdutosIniciais()
                ]);
                if (resAppearance?.data?.LOGO_URL) {
                    setLogoLoja(resAppearance.data.LOGO_URL);
                }
                if (Array.isArray(listaInicial)) {
                    setInitialProducts(listaInicial);
                    setProducts(listaInicial);
                }
            } catch (error) {
                console.warn('Erro ao inicializar vitrine do PDV:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Debounce para busca automática
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busca.trim().length >= 1) {
                atualizarVitrineDeProdutos(busca.trim());
            } else if (busca.length === 0) {
                setProducts(initialProducts);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busca, initialProducts]);

    const recarregarVitrine = async () => {
        setLoading(true);
        try {
            const lista = await buscarProdutosIniciais();
            setInitialProducts(lista || []);
            if (!busca.trim()) setProducts(lista || []);
        } finally {
            setLoading(false);
        }
    };

    const atualizarVitrineDeProdutos = async (termo) => {
        setLoading(true);
        try {
            const data = await buscarProdutos(termo, 'geral');
            setProducts(data || []);
        } catch (error) {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Disparo rápido via leitor de código de barras (Enter) ou câmera
    const buscarEAdicionarDireto = async (termoExato) => {
        if (isSearchingRef.current) return;
        isSearchingRef.current = true;

        setLoading(true);
        try {
            const data = await buscarProdutos(termoExato, 'geral');

            const soNumeros = /^\d+$/.test(termoExato);
            const produtoExato = data?.find(
                p => String(p.id_produto) === termoExato || String(p.id_externo) === termoExato
            );

            if (produtoExato && (soNumeros || data.length === 1)) {
                handleClickProduct(produtoExato);
                setBusca('');
                setProducts(initialProducts);
                setTimeout(() => inputRef.current?.focus(), 80);
            } else if (data && data.length === 1) {
                handleClickProduct(data[0]);
                setBusca('');
                setProducts(initialProducts);
                setTimeout(() => inputRef.current?.focus(), 80);
            } else if (data && data.length > 0) {
                setProducts(data);
                if (data.length > 1 && soNumeros) toast.info('Vários produtos encontrados. Clique no item desejado.');
            } else {
                setProducts([]);
                toast.warning('Nenhum produto encontrado com esse código ou nome!');
            }
        } catch (error) {
            console.error(error);
            setProducts([]);
        } finally {
            setLoading(false);
            setTimeout(() => { isSearchingRef.current = false; }, 400);
        }
    };

    const handleClickProduct = (produto) => {
        playPdvBeep('beep');
        onAddProduct(produto);
    };

    const handleChange = (e) => setBusca(e.target.value);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const termo = busca.trim();
            if (!termo) return;
            await buscarEAdicionarDireto(termo);
        } else if (e.key === 'Escape') {
            clearSearch();
        }
    };

    const handleCameraScan = async (codigoLido) => {
        setModalScannerOpen(false);
        const codigo = codigoLido?.replace(/\D/g, '');
        if (!codigo) return;
        setBusca(codigo);
        await buscarEAdicionarDireto(codigo);
    };

    const clearSearch = () => {
        setBusca('');
        setProducts(initialProducts);
        inputRef.current?.focus();
    };

    // Extrai categorias únicas para filtro rápido por botão
    const categorias = useMemo(() => {
        const map = new Set();
        const source = busca.trim() ? products : initialProducts;
        source.forEach(p => {
            const cat = p.subcategorias?.categorias?.nome || p.subcategorias?.nome;
            if (cat) map.add(cat);
        });
        return ['TODOS', ...Array.from(map)];
    }, [products, initialProducts, busca]);

    const produtosFiltrados = useMemo(() => {
        if (categoriaAtiva === 'TODOS') return products;
        return products.filter(p => {
            const cat = p.subcategorias?.categorias?.nome || p.subcategorias?.nome;
            return cat === categoriaAtiva;
        });
    }, [products, categoriaAtiva]);

    return (
        <div className="d-flex flex-column h-100" style={{ backgroundColor: 'var(--bg-main)' }}>
            {/* Barra de Busca e Categorias */}
            <div className="p-3 border-bottom sticky-top z-2" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <div className="d-flex gap-2 align-items-center">
                    <InputGroup className="shadow-sm rounded-4 overflow-hidden border flex-grow-1" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                        <InputGroup.Text className="border-0 ps-3 bg-transparent" style={{ color: 'var(--text-secondary)' }}>
                            <Search size={20} className="text-primary" />
                        </InputGroup.Text>

                        <Form.Control
                            ref={inputRef}
                            type="text"
                            placeholder="Pesquisar produto por nome, código ou bipar leitor... (Atalho: F4)"
                            className="form-dark-input border-0 shadow-none py-2 px-2"
                            style={{ fontSize: '15px', backgroundColor: 'transparent', color: 'var(--text-primary)', height: '46px' }}
                            value={busca}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />

                        {busca && (
                            <Button variant="link" className="border-0 pe-2 text-decoration-none" style={{ color: 'var(--text-secondary)' }} onClick={clearSearch} title="Limpar busca (Esc)">
                                <X size={18} />
                            </Button>
                        )}

                        <Button
                            variant="light"
                            className="border-0 px-3 bg-transparent text-primary d-flex align-items-center gap-1"
                            onClick={() => setModalScannerOpen(true)}
                            title="Ler Código de Barras com a Câmera"
                        >
                            <ScanLine size={20} />
                        </Button>
                    </InputGroup>

                    <Button
                        variant="light"
                        className="border rounded-4 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={recarregarVitrine}
                        title="Atualizar catálogo de produtos"
                    >
                        <RefreshCw size={18} className={loading ? 'spin-anim' : ''} />
                    </Button>
                </div>

                {/* Pílulas de Categorias Rápidas */}
                {categorias.length > 1 && (
                    <div className="d-flex gap-2 overflow-auto pt-2 mt-1 pb-1 no-scrollbar">
                        {categorias.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoriaAtiva(cat)}
                                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold text-nowrap transition-all border ${
                                    categoriaAtiva === cat
                                        ? 'btn-primary text-white border-primary shadow-sm'
                                        : 'bg-transparent'
                                }`}
                                style={{
                                    fontSize: '11px',
                                    borderColor: categoriaAtiva === cat ? '' : 'var(--border-color)',
                                    color: categoriaAtiva === cat ? '#fff' : 'var(--text-secondary)'
                                }}
                            >
                                {cat === 'TODOS' ? '📦 Todos os Produtos' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="progress mt-2" style={{ height: '3px', backgroundColor: 'transparent' }}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated w-100 bg-primary"></div>
                    </div>
                )}
            </div>

            {/* Grade de Produtos */}
            <div className="flex-grow-1 overflow-auto p-3 p-md-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                        <PackageSearch size={18} className="text-primary" />
                        {busca.trim() ? `Resultados para "${busca}"` : 'Catálogo Rápido (Clique para adicionar)'}
                    </h6>
                    <Badge bg="secondary" className="bg-opacity-10 text-secondary border rounded-pill px-3 py-1 fw-semibold" style={{ borderColor: 'var(--border-color)', fontSize: '11px' }}>
                        {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto' : 'produtos'}
                    </Badge>
                </div>

                {produtosFiltrados.length > 0 ? (
                    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                        {produtosFiltrados.map((produto) => {
                            const estoque = Number(produto.estoque ?? 0);
                            return (
                                <div key={produto.id_produto} className="col">
                                    <div
                                        className="card h-100 border rounded-4 cursor-pointer product-card-hover"
                                        onClick={() => handleClickProduct(produto)}
                                        style={{
                                            backgroundColor: 'var(--bg-sidebar)',
                                            borderColor: 'var(--border-color)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="position-relative p-2 pb-0">
                                            <div
                                                className="rounded-3 d-flex align-items-center justify-content-center w-100 overflow-hidden"
                                                style={{
                                                    backgroundColor: 'rgba(14, 165, 233, 0.08)',
                                                    aspectRatio: '4/3',
                                                    position: 'relative'
                                                }}
                                            >
                                                {produto.imagem_url ? (
                                                    <img
                                                        src={produto.imagem_url}
                                                        alt={produto.nome}
                                                        className="w-100 h-100 rounded-3"
                                                        style={{ objectFit: 'cover' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <PackageSearch size={34} className="text-primary opacity-50" />
                                                )}

                                                {/* Badge código */}
                                                <span
                                                    className="position-absolute top-0 start-0 m-1 badge rounded-pill bg-dark bg-opacity-75 text-white"
                                                    style={{ fontSize: '9px', fontWeight: 600 }}
                                                >
                                                    #{produto.id_externo || produto.id_produto}
                                                </span>

                                                {/* Badge NCM/Fiscal */}
                                                {produto.ncm && produto.ncm !== '00000000' && (
                                                    <span
                                                        className="position-absolute bottom-0 end-0 m-1 badge rounded-pill bg-success bg-opacity-75 text-white"
                                                        style={{ fontSize: '8px' }}
                                                        title={`NCM: ${produto.ncm}`}
                                                    >
                                                        Fiscal OK
                                                    </span>
                                                )}

                                                {/* Botão + no Hover */}
                                                <div className="btn-add-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-3">
                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '38px', height: '38px' }}>
                                                        <Plus size={22} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-body p-2 px-3 d-flex flex-column">
                                            <h6
                                                className="text-truncate-2 mb-1"
                                                style={{
                                                    color: 'var(--text-primary)',
                                                    fontSize: '12.5px',
                                                    fontWeight: '600',
                                                    lineHeight: '1.35',
                                                    minHeight: '34px'
                                                }}
                                                title={produto.nome}
                                            >
                                                {produto.nome}
                                            </h6>

                                            <div className="mt-auto pt-1 d-flex justify-content-between align-items-end border-top" style={{ borderColor: 'var(--border-color)' }}>
                                                <div>
                                                    <span className="fw-bolder text-primary" style={{ fontSize: '15px' }}>
                                                        R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                                                    </span>
                                                    {produto.unidade && produto.unidade !== 'UN' && (
                                                        <small className="text-muted ms-1" style={{ fontSize: '10px' }}>/{produto.unidade}</small>
                                                    )}
                                                </div>
                                                <small
                                                    className={`fw-semibold ${estoque <= 0 ? 'text-danger' : 'text-muted'}`}
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {estoque} {produto.unidade || 'un'}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-75 d-flex flex-column align-items-center justify-content-center text-center p-4">
                        {loading ? (
                            <p className="fw-medium text-muted">Carregando produtos do estoque...</p>
                        ) : busca ? (
                            <>
                                <PackageSearch size={52} className="mb-3 text-muted opacity-50" />
                                <h6 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Nenhum produto encontrado para "{busca}"</h6>
                                <p className="small text-muted mb-3">Verifique o nome ou código digitado.</p>
                                <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={clearSearch}>
                                    Limpar filtro e ver todos
                                </Button>
                            </>
                        ) : (
                            <>
                                {logoLoja ? (
                                    <img src={logoLoja} alt="Logo da Empresa" className="mb-3 logo-watermark" />
                                ) : (
                                    <Tag size={52} className="mb-3 text-muted opacity-25" />
                                )}
                                <p className="small fw-medium text-muted opacity-75">Pesquise ou bipe um código de barras para vender.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <BarcodeScannerModal
                isOpen={modalScannerOpen}
                onClose={() => setModalScannerOpen(false)}
                onScan={handleCameraScan}
            />

            <style>{`
                .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .spin-anim { animation: pdvSpin 0.8s linear infinite; }
                @keyframes pdvSpin { 100% { transform: rotate(360deg); } }

                .product-card-hover {
                    transition: all 0.18s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
                }
                .product-card-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px -4px rgba(14, 165, 233, 0.16) !important;
                    border-color: #38bdf8 !important;
                }
                .product-card-hover:active {
                    transform: scale(0.98);
                }

                .btn-add-overlay {
                    background-color: rgba(15, 23, 42, 0.25);
                    opacity: 0;
                    transition: opacity 0.18s ease;
                }
                .product-card-hover:hover .btn-add-overlay {
                    opacity: 1;
                }

                .logo-watermark {
                    max-width: 150px;
                    max-height: 150px;
                    object-fit: contain;
                    filter: brightness(0);
                    opacity: 0.10;
                }
                body.dark-mode .logo-watermark {
                    filter: brightness(0) invert(1);
                    opacity: 0.10;
                }
            `}</style>
        </div>
    );
}