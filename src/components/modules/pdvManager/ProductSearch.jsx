import React, { useState, useEffect, useRef } from 'react';
import { buscarProdutos } from './pdvService';
import { Search, Plus, PackageSearch, X, ScanLine } from 'lucide-react';
import { InputGroup, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

import BarcodeScannerModal from './BarcodeScannerModal'; 
import api from '../../../services/api';

export default function ProductSearch({ onAddProduct }) {
    const [busca, setBusca] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [logoLoja, setLogoLoja] = useState('');
    const [modalScannerOpen, setModalScannerOpen] = useState(false); 
    const inputRef = useRef(null);
    const isSearchingRef = useRef(false);

    // 🟢 Busca a logo do cliente para o Empty State
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const { data } = await api.get('/configuracoes/appearance');
                if (data && data.LOGO_URL) {
                    setLogoLoja(data.LOGO_URL);
                }
            } catch (error) {
                console.warn('Erro ao carregar a logo do cliente no PDV:', error);
            }
        };
        fetchLogo();
    }, []);

    // 🟢 DEBOUNCE (Busca automática para mostrar SUGESTÕES)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busca.trim().length >= 1) {
                atualizarVitrineDeProdutos(busca.trim());
            } else if (busca.length === 0) {
                setProducts([]);
            }
        }, 400); 
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

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

    // 🟢 O "TIRO" DA PISTOLA (ENTER) OU CÂMERA
    const buscarEAdicionarDireto = async (termoExato) => {
        if (isSearchingRef.current) return;
        isSearchingRef.current = true;

        setLoading(true);
        try {
            const data = await buscarProdutos(termoExato, 'geral');
            
            const soNumeros = /^\d+$/.test(termoExato);
            const produtoExato = data?.find(p => 
                String(p.id_produto) === termoExato || p.id_externo === termoExato
            );
            
            if (produtoExato && soNumeros) {
                onAddProduct(produtoExato);
                toast.success(`${produtoExato.nome} adicionado!`);
                setBusca(''); 
                setProducts([]);
                setTimeout(() => inputRef.current?.focus(), 100);
            } else if (data && data.length > 0) {
                setProducts(data);
                if(data.length > 1 && soNumeros) toast.info("Vários produtos encontrados.");
            } else {
                setProducts([]);
                toast.warning('Nenhum produto encontrado com esse termo!');
            }
        } catch (error) {
            console.error(error);
            setProducts([]);
        } finally {
            setLoading(false);
            setTimeout(() => { isSearchingRef.current = false; }, 600);
        }
    };

    const handleChange = (e) => setBusca(e.target.value);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const termo = busca.trim();
            if (!termo) return;
            await buscarEAdicionarDireto(termo);
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
        setProducts([]);
        inputRef.current?.focus();
    };

    return (
        <div className="d-flex flex-column h-100" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="p-3 border-bottom sticky-top z-2" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <div className="position-relative">
                    <InputGroup className="shadow-sm rounded-4 overflow-hidden border d-flex bg-white" style={{ borderColor: 'var(--border-color)' }}>
                        <InputGroup.Text className="border-0 ps-3 bg-transparent" style={{ color: '#9ca3af' }}>
                            <Search size={20} />
                        </InputGroup.Text>
                        
                        <Form.Control 
                            ref={inputRef} 
                            type="text" 
                            placeholder="Pesquisar por nome ou código..." 
                            className="form-dark-input border-0 shadow-none py-3" 
                            style={{ fontSize: '15px' }} 
                            value={busca} 
                            onChange={handleChange} 
                            onKeyDown={handleKeyDown} 
                            autoFocus
                        />
                        
                        {busca && (
                            <Button variant="link" className="border-0 pe-2 form-dark-input text-decoration-none text-muted" onClick={clearSearch}>
                                <X size={20}/>
                            </Button>
                        )}
                        
                        <Button variant="light" className="border-0 px-3 bg-transparent text-primary" onClick={() => setModalScannerOpen(true)} title="Ler com Câmera">
                            <ScanLine size={20} />
                        </Button>
                    </InputGroup>
                </div>

                {loading && <div className="progress mt-3" style={{height: '3px', backgroundColor: 'transparent'}}><div className="progress-bar progress-bar-striped progress-bar-animated w-100 bg-primary"></div></div>}
            </div>

            <div className="flex-grow-1 overflow-auto p-4" style={{ backgroundColor: '#f8fafc' }}>
                {/* Cabeçalho da vitrine */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0 d-flex align-items-center" style={{ color: '#1e293b' }}>
                        <PackageSearch size={18} className="me-2 text-primary" /> Produtos
                    </h6>
                    {products.length > 0 && (
                        <small className="text-muted">{products.length} itens</small>
                    )}
                </div>

                {products.length > 0 ? (
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                        {products.map((produto) => (
                            <div key={produto.id_produto} className="col">
                                {/* 🟢 NOVO LAYOUT DO CARD (IDÊNTICO À IMAGEM) */}
                                <div 
                                    className="card h-100 border rounded-4 cursor-pointer product-card-hover bg-white"
                                    onClick={() => onAddProduct(produto)}
                                    style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}
                                >
                                    {/* Box da imagem (Azul claro de fundo) */}
                                    <div className="position-relative p-2" style={{ backgroundColor: '#fff' }}>
                                        <div 
                                            className="rounded-3 d-flex align-items-center justify-content-center w-100" 
                                            style={{ backgroundColor: '#e0f2fe', aspectRatio: '1/1', position: 'relative' }}
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
                                                <PackageSearch size={40} style={{ color: '#0284c7' }} />
                                            )}
                                            
                                            {/* Efeito Hover - Botãozinho de + */}
                                            <div className="btn-add-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-3">
                                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '40px', height: '40px' }}>
                                                    <Plus size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Textos fora da caixa azul */}
                                    <div className="card-body p-3 pt-2 d-flex flex-column bg-white">
                                        <small className="text-muted d-block mb-1" style={{ fontSize: '11px' }}>
                                            {produto.id_externo || produto.id_produto}
                                        </small>
                                        <h6 className="text-truncate-2 mb-2" style={{ color: '#334155', fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>
                                            {produto.nome}
                                        </h6>
                                        <div className="mt-auto">
                                            <span className="fw-bold" style={{ fontSize: '16px', color: '#0284c7' }}>
                                                R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                        {loading ? (
                            <p className="fw-medium text-muted">Buscando no estoque...</p>
                        ) : busca ? (
                            <>
                                <PackageSearch size={56} className="mb-3 text-muted opacity-50" />
                                <h6 className="fw-bold text-muted opacity-50">Nenhum item localizado</h6>
                            </>
                        ) : (
                            <>
                                {logoLoja ? (
                                    <img 
                                        src={logoLoja} 
                                        alt="Logo da Empresa" 
                                        className="mb-4 logo-watermark"
                                    />
                                ) : (
                                    <Search size={56} className="mb-3 text-muted opacity-25" />
                                )}
                                <p className="small fw-medium text-muted opacity-50">Pesquise ou escaneie um produto para começar.</p>
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
                
                /* EFEITOS DO CARD */
                .product-card-hover { 
                    transition: all 0.2s ease; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
                }
                .product-card-hover:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important; 
                    border-color: #bae6fd !important;
                }
                .product-card-hover:active { 
                    transform: scale(0.98); 
                }
                
                /* BOTÃO DE + INVISÍVEL ATÉ O HOVER */
                .btn-add-overlay {
                    background-color: rgba(255,255,255,0.4);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .product-card-hover:hover .btn-add-overlay {
                    opacity: 1;
                }

                /* LOGO PRETO E BRANCO (Fundo) */
                .logo-watermark {
                    max-width: 160px;
                    max-height: 160px;
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