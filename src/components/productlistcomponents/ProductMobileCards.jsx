import React, { useState } from 'react';
import { Card, Image, Form, Button, Badge, Offcanvas, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- HELPERS ---
const formatStock = (val, unit) => {
    const decimalUnits = ['KG', 'G', 'M', 'CM', 'L', 'ML', 'M2'];
    const isDecimal = decimalUnits.includes(unit?.toUpperCase());
    return Number(val).toLocaleString('pt-BR', {
        minimumFractionDigits: isDecimal ? 3 : 0,
        maximumFractionDigits: isDecimal ? 3 : 0
    });
};

const getTypeBadge = (type) => {
    const config = {
        'INSUMO': { bg: 'warning', text: 'Insumo', icon: 'bi-box-seam', textClass: 'text-dark' },
        'FINAL': { bg: 'success', text: 'Venda', icon: 'bi-bag-check', textClass: 'text-white' },
        'MISTO': { bg: 'primary', text: 'Misto', icon: 'bi-arrow-left-right', textClass: 'text-white' },
        'CONSUMO_INTERNO': { bg: 'secondary', text: 'Interno', icon: 'bi-house-door', textClass: 'text-white' }
    };
    const { bg, text, icon, textClass } = config[type?.toUpperCase()] || { bg: 'light', text: type, icon: 'bi-tag', textClass: 'text-dark' };
    
    return (
        <Badge bg={bg} className={`fw-bold position-absolute top-0 start-0 m-2 shadow-sm d-flex align-items-center gap-1 ${textClass}`} style={{ fontSize: '0.65rem' }}>
            <i className={`bi ${icon}`}></i> {text}
        </Badge>
    );
};

const ProductMobileCards = ({ 
    products, toggleEcommerce, renderStatusBadge, syncStatus, publishHandler, 
    updateStatusHandler, deleteHandler, isFacebookReady, handlePostOrganico, 
    defaultImage, onShowHistory, 
    onShowComposition, onShowCraft, podeGerenciarProdutos
}) => {
    // ESTADOS PARA O MENU INFERIOR (OFFCANVAS)
    const [showActions, setShowActions] = useState(false);
    const [actionProduct, setActionProduct] = useState(null);

    const handleOpenActions = (product) => {
        setActionProduct(product);
        setShowActions(true);
    };

    const handleCloseActions = () => {
        setShowActions(false);
        setTimeout(() => setActionProduct(null), 300);
    };

    if (!products || products.length === 0) {
        return null; // A lista vazia já é tratada no ProductListPage
    }

    return (
        <div className="pb-5"> 
            {products.map(p => (
                <motion.div 
                    key={p.id_produto} 
                    initial={{ opacity: 0, y: 15 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                >
                    <Card 
                        className="mb-3 border-0 shadow-sm overflow-hidden transition-all clean-card-mobile" 
                        style={{ opacity: p.active_ecommerce ? 1 : 0.65 }}
                    >
                        <Card.Body className="p-4">
                            <div className="d-flex gap-3 mb-3">
                                
                                {/* IMAGEM E TIPO */}
                                <div className="position-relative flex-shrink-0">
                                    <Image 
                                        src={p.imagem_url || defaultImage} 
                                        style={{ width: '85px', height: '85px', borderRadius: '14px', objectFit: 'cover' }} 
                                        className="shadow-sm"
                                        onError={(e) => { e.target.src = defaultImage; }} 
                                    />
                                    {getTypeBadge(p.tipo_produto)}
                                </div>
                                
                                {/* INFORMAÇÕES DO PRODUTO */}
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="pe-2 overflow-hidden">
                                            <h6 className="fw-bold mb-0 text-truncate product-name" style={{ fontSize: '15px' }}>{p.nome}</h6>
                                            
                                            {/* Badge do ML/Status */}
                                            {renderStatusBadge && (
                                                <div className="mt-1">
                                                    {renderStatusBadge(p)}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="d-flex flex-column align-items-end">
                                            <Form.Check 
                                                type="switch" 
                                                id={`switch-${p.id_produto}`}
                                                checked={p.active_ecommerce} 
                                                onChange={() => podeGerenciarProdutos && toggleEcommerce(p.id_produto, p.active_ecommerce)} 
                                                style={{ transform: 'scale(1.2)', margin: '0', cursor: podeGerenciarProdutos ? 'pointer' : 'not-allowed' }}
                                                className="custom-switch-dark"
                                                disabled={!podeGerenciarProdutos} 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-2 small mb-1 mt-2 mobile-text-muted" style={{ fontSize: '12px' }}>
                                        <span className="text-truncate" style={{maxWidth: '100px'}}>{p.categorias?.nome || 'Sem Categoria'}</span>
                                        <span>•</span>
                                        <span className={p.estoque > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                            <i className={`bi ${p.estoque > 0 ? 'bi-box-seam' : 'bi-x-circle'} me-1`}></i>
                                            {formatStock(p.estoque, p.unidade)} {p.unidade}
                                        </span>
                                    </div>
                                    
                                    <div className="fw-bold text-success fs-5">
                                        R$ {parseFloat(p.preco || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* BOTÕES DE AÇÃO RÁPIDA */}
                            <div className="d-flex gap-2 border-top pt-3 mt-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                {podeGerenciarProdutos ? (
                                    <Button 
                                        as={Link} 
                                        to={`/admin/product/${p.id_produto}/edit`} 
                                        variant="light" 
                                        size="sm"
                                        className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold bg-white text-dark shadow-sm border-0"
                                        style={{ borderRadius: '12px', padding: '10px' }}
                                    >
                                        <i className="bi bi-pencil-fill"></i> Editar
                                    </Button>
                                ) : (
                                    <Button 
                                        as={Link} 
                                        to={`/admin/product/${p.id_produto}/edit`} 
                                        variant="light" 
                                        size="sm"
                                        className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold bg-white text-dark shadow-sm border-0"
                                        style={{ borderRadius: '12px', padding: '10px' }}
                                    >
                                        <i className="bi bi-eye-fill"></i> Detalhes
                                    </Button>
                                )}

                                <Button 
                                    variant="light" 
                                    size="sm"
                                    className="px-4 shadow-sm fw-bold bg-white text-dark border-0"
                                    style={{ borderRadius: '12px' }}
                                    onClick={() => handleOpenActions(p)}
                                >
                                    <i className="bi bi-three-dots"></i> Mais
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            ))}

            {/* --- MENU INFERIOR (OFFCANVAS MOBILE) --- */}
            <Offcanvas 
                show={showActions} 
                onHide={handleCloseActions} 
                placement="bottom" 
                className="rounded-top-4 border-0 offcanvas-dark-fix"
                style={{ height: 'auto', maxHeight: '85vh', zIndex: 1060 }}
            >
                <Offcanvas.Header closeButton className="border-bottom pb-3 pt-4 custom-border">
                    <Offcanvas.Title className="fs-5 fw-bold text-truncate pe-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Image 
                            src={actionProduct?.imagem_url || defaultImage} 
                            style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} 
                            onError={(e) => { e.target.src = defaultImage; }} 
                        />
                        {actionProduct?.nome || 'Opções'}
                    </Offcanvas.Title>
                </Offcanvas.Header>
                
                <Offcanvas.Body className="p-0 overflow-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    {actionProduct && (
                        <ListGroup variant="flush" className="pb-4">
                            
                            {/* SEÇÃO DE PRODUÇÃO */}
                            <div className="px-4 py-2 small fw-bold text-uppercase sticky-top border-bottom section-divider">
                                <i className="bi bi-box-seam me-2"></i> Estoque & Produção
                            </div>
                            
                            {podeGerenciarProdutos && actionProduct.tipo_produto !== 'INSUMO' && (
                                <ListGroup.Item action onClick={() => { onShowCraft(actionProduct); handleCloseActions(); }} className="py-3 px-4 border-bottom-0 saas-list-item">
                                    <i className="bi bi-hammer text-primary me-3 fs-5"></i>
                                    <span className="fw-medium">Fabricar Item</span>
                                </ListGroup.Item>
                            )}
                            
                            <ListGroup.Item action onClick={() => { onShowComposition(actionProduct); handleCloseActions(); }} className="py-3 px-4 border-bottom-0 saas-list-item">
                                <i className="bi bi-list-check text-info me-3 fs-5"></i>
                                <span className="fw-medium">Receita / Insumos</span>
                            </ListGroup.Item>
                            
                            <ListGroup.Item action onClick={() => { onShowHistory(actionProduct); handleCloseActions(); }} className="py-3 px-4 saas-list-item">
                                <i className="bi bi-clock-history text-secondary me-3 fs-5"></i>
                                <span className="fw-medium">Histórico de Estoque</span>
                            </ListGroup.Item>

                            {/* SEÇÃO DE VENDAS EXTERNAS E MARKETING */}
                            {podeGerenciarProdutos && (
                                <>
                                    <div className="px-4 py-2 small fw-bold text-uppercase sticky-top border-bottom border-top section-divider">
                                        <i className="bi bi-rocket-takeoff me-2"></i> Canais de Venda
                                    </div>

                                    {actionProduct.mercado_livre_id ? (
                                        <>
                                            <ListGroup.Item action onClick={() => { updateStatusHandler(actionProduct.id_produto, actionProduct.ml_status); handleCloseActions(); }} className="py-3 px-4 border-bottom-0 saas-list-item">
                                                <i className={`bi bi-${actionProduct.ml_status === 'active' ? 'pause' : 'play'}-circle text-warning me-3 fs-5`}></i>
                                                <span className="fw-medium">{actionProduct.ml_status === 'active' ? 'Pausar Anúncio no ML' : 'Reativar Anúncio no ML'}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item action onClick={() => { syncStatus(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4 saas-list-item">
                                                <i className="bi bi-arrow-repeat text-success me-3 fs-5"></i>
                                                <span className="fw-medium">Sincronizar com o Mercado Livre</span>
                                            </ListGroup.Item>
                                        </>
                                    ) : (
                                        <ListGroup.Item action onClick={() => { publishHandler(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4 saas-list-item">
                                            <i className="bi bi-upload text-warning me-3 fs-5"></i>
                                            <span className="fw-medium">Publicar no Mercado Livre</span>
                                        </ListGroup.Item>
                                    )}

                                    {isFacebookReady && (
                                        <ListGroup.Item action onClick={() => { handlePostOrganico(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4 saas-list-item">
                                            <i className="bi bi-facebook text-primary me-3 fs-5"></i>
                                            <span className="fw-medium">Postar no Facebook</span>
                                        </ListGroup.Item>
                                    )}

                                    {/* SEÇÃO DE PERIGO */}
                                    <div className="px-4 py-2 small fw-bold text-uppercase sticky-top border-bottom border-top mt-2 danger-zone">
                                        <i className="bi bi-exclamation-triangle me-2"></i> Zona de Perigo
                                    </div>
                                    
                                    <ListGroup.Item action onClick={() => { deleteHandler(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4 text-danger saas-list-item danger-action">
                                        <i className="bi bi-trash me-3 fs-5"></i>
                                        <span className="fw-bold">Excluir Produto</span>
                                    </ListGroup.Item>
                                </>
                            )}
                            
                        </ListGroup>
                    )}
                </Offcanvas.Body>
            </Offcanvas>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .transition-all { transition: all 0.3s ease; }
                
                /* Offcanvas e ListGroup (Menu Inferior) */
                .offcanvas-dark-fix { background-color: var(--bg-sidebar, #ffffff) !important; }
                .section-divider { background-color: var(--bg-main, #f8fafc); color: var(--text-secondary, #64748b); border-color: var(--border-color, #e2e8f0) !important; }
                .saas-list-item { background-color: transparent !important; color: var(--text-primary, #0f172a) !important; border-color: var(--border-color, #e2e8f0) !important; transition: background-color 0.2s; }
                .saas-list-item:hover, .saas-list-item:focus { background-color: var(--bg-hover, #f1f5f9) !important; }
                .danger-zone { background-color: rgba(239, 68, 68, 0.05) !important; color: #ef4444 !important; border-color: var(--border-color, #e2e8f0) !important; }
                .danger-action:hover, .danger-action:focus { background-color: rgba(239, 68, 68, 0.1) !important; }

                /* Ajustes de Dark Mode Nativos */
                body.dark-mode .btn-close { filter: invert(1); }
                body.dark-mode .custom-switch-dark .form-check-input { background-color: var(--bg-main); border-color: var(--border-color); }
                body.dark-mode .custom-switch-dark .form-check-input:checked { background-color: #198754; border-color: #198754; }

                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                @media (max-width: 991px) {
                    .product-name {
                        color: #000 !important;
                        font-weight: 800 !important;
                    }
                    .mobile-text-muted {
                        color: #64748b !important;
                        font-weight: 600 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductMobileCards;