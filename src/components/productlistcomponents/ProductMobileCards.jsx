import React, { useState } from 'react';
import { Card, Image, Form, Button, Badge, Offcanvas, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        'INSUMO': { bg: 'warning', text: 'Insumo', icon: 'bi-box-seam' },
        'FINAL': { bg: 'success', text: 'Venda', icon: 'bi-bag-check' },
        'MISTO': { bg: 'primary', text: 'Misto', icon: 'bi-arrow-left-right' },
        'CONSUMO_INTERNO': { bg: 'secondary', text: 'Interno', icon: 'bi-house-door' }
    };
    const { bg, text, icon } = config[type?.toUpperCase()] || { bg: 'light', text: type, icon: 'bi-tag' };
    
    return (
        <Badge bg={bg} className="fw-bold position-absolute top-0 start-0 m-2 shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
            <i className={`bi ${icon}`}></i> {text}
        </Badge>
    );
};

const ProductMobileCards = ({ 
    products, toggleEcommerce, renderStatusBadge, syncStatus, publishHandler, 
    updateStatusHandler, deleteHandler, isFacebookReady, handlePostOrganico, 
    defaultImage, onShowHistory, 
    onShowComposition, onShowCraft
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
        // Aguarda a animação de saída antes de limpar o produto para não piscar a tela
        setTimeout(() => setActionProduct(null), 300);
    };

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                <i className="bi bi-box fs-1 d-block mb-3 opacity-25"></i>
                <p>Nenhum produto encontrado.</p>
            </div>
        );
    }

    return (
        <div className="d-lg-none pb-5"> 
            {products.map(p => (
                <motion.div 
                    key={p.id_produto} 
                    initial={{ opacity: 0, y: 15 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                >
                    <Card className={`mb-3 border-0 shadow-sm rounded-4 overflow-hidden transition-all ${!p.active_ecommerce ? 'bg-light bg-opacity-75 border border-light' : ''}`}>
                        <Card.Body className="p-3">
                            <div className="d-flex gap-3 mb-3">
                                
                                {/* IMAGEM E TIPO */}
                                <div className="position-relative flex-shrink-0">
                                    <Image 
                                        src={p.imagem_url || defaultImage} 
                                        style={{ width: '85px', height: '85px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #eee' }} 
                                        onError={(e) => { e.target.src = defaultImage; }} 
                                    />
                                    {getTypeBadge(p.tipo_produto)}
                                </div>
                                
                                {/* INFORMAÇÕES DO PRODUTO */}
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="pe-2 overflow-hidden">
                                            <h6 className="fw-bold text-dark mb-0 text-truncate">{p.nome}</h6>
                                            
                                            {/* ✅ CORREÇÃO: O renderStatusBadge agora aparece na tela (ex: Badge do Mercado Livre) */}
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
                                                onChange={() => toggleEcommerce(p.id_produto, p.active_ecommerce)} 
                                                style={{ transform: 'scale(1.2)', margin: '0' }}
                                                title="Ativar/Desativar no E-commerce"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-2 small text-muted mb-1 mt-2">
                                        <span className="text-truncate" style={{maxWidth: '100px'}}>{p.categorias?.nome || 'Sem Categoria'}</span>
                                        <span>•</span>
                                        <span className={p.estoque > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                            <i className={`bi ${p.estoque > 0 ? 'bi-box-seam' : 'bi-x-circle'} me-1`}></i>
                                            {formatStock(p.estoque, p.unidade)} {p.unidade}
                                        </span>
                                    </div>
                                    
                                    <div className="fw-bolder text-success fs-5">
                                        R$ {parseFloat(p.preco || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* BOTÕES DE AÇÃO RÁPIDA */}
                            <div className="d-flex gap-2 border-top pt-3 mt-2">
                                <Button 
                                    as={Link} 
                                    to={`/admin/product/${p.id_produto}/edit`} 
                                    variant="outline-primary" 
                                    size="sm"
                                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 rounded-pill fw-bold"
                                >
                                    <i className="bi bi-pencil-fill"></i> Editar
                                </Button>

                                <Button 
                                    variant="light" 
                                    size="sm"
                                    className="px-4 rounded-pill border shadow-sm fw-bold text-dark"
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
                className="rounded-top-4 shadow-lg"
                style={{ height: 'auto', maxHeight: '85vh', zIndex: 1060 }}
            >
                <Offcanvas.Header closeButton className="border-bottom pb-3 pt-4">
                    <Offcanvas.Title className="fs-5 fw-bold text-truncate pe-3 d-flex align-items-center gap-2">
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
                            <div className="px-4 py-2 bg-light small fw-bold text-uppercase text-muted sticky-top border-bottom">
                                <i className="bi bi-box-seam me-2"></i> Estoque & Produção
                            </div>
                            
                            {actionProduct.tipo_produto !== 'INSUMO' && (
                                <ListGroup.Item action onClick={() => { onShowCraft(actionProduct); handleCloseActions(); }} className="py-3 px-4 border-bottom-0">
                                    <i className="bi bi-hammer text-primary me-3 fs-5"></i>
                                    <span className="fw-medium">Fabricar Item</span>
                                </ListGroup.Item>
                            )}
                            
                            <ListGroup.Item action onClick={() => { onShowComposition(actionProduct); handleCloseActions(); }} className="py-3 px-4 border-bottom-0">
                                <i className="bi bi-list-check text-secondary me-3 fs-5"></i>
                                <span className="fw-medium">Receita / Insumos</span>
                            </ListGroup.Item>
                            
                            <ListGroup.Item action onClick={() => { onShowHistory(actionProduct); handleCloseActions(); }} className="py-3 px-4">
                                <i className="bi bi-clock-history text-info me-3 fs-5"></i>
                                <span className="fw-medium">Histórico de Estoque</span>
                            </ListGroup.Item>

                            {/* SEÇÃO DE VENDAS EXTERNAS */}
                            <div className="px-4 py-2 bg-light small fw-bold text-uppercase text-muted sticky-top border-bottom border-top">
                                <i className="bi bi-rocket-takeoff me-2"></i> Canais de Venda
                            </div>

                            {actionProduct.mercado_livre_id ? (
                                <>
                                    <ListGroup.Item action onClick={() => { updateStatusHandler(actionProduct.id_produto, actionProduct.ml_status); handleCloseActions(); }} className="py-3 px-4 border-bottom-0">
                                        <i className={`bi bi-${actionProduct.ml_status === 'active' ? 'pause' : 'play'}-circle text-warning me-3 fs-5`}></i>
                                        <span className="fw-medium">{actionProduct.ml_status === 'active' ? 'Pausar Anúncio no ML' : 'Reativar Anúncio no ML'}</span>
                                    </ListGroup.Item>
                                    <ListGroup.Item action onClick={() => { syncStatus(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4">
                                        <i className="bi bi-arrow-repeat text-success me-3 fs-5"></i>
                                        <span className="fw-medium">Sincronizar com o Mercado Livre</span>
                                    </ListGroup.Item>
                                </>
                            ) : (
                                <ListGroup.Item action onClick={() => { publishHandler(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4">
                                    <i className="bi bi-upload text-warning me-3 fs-5"></i>
                                    <span className="fw-medium">Publicar no Mercado Livre</span>
                                </ListGroup.Item>
                            )}

                            {isFacebookReady && (
                                <ListGroup.Item action onClick={() => { handlePostOrganico(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4">
                                    <i className="bi bi-facebook text-primary me-3 fs-5"></i>
                                    <span className="fw-medium">Postar no Facebook</span>
                                </ListGroup.Item>
                            )}

                            {/* SEÇÃO DE PERIGO */}
                            <div className="px-4 py-2 bg-danger bg-opacity-10 small fw-bold text-uppercase text-danger sticky-top border-bottom border-top mt-2">
                                <i className="bi bi-exclamation-triangle me-2"></i> Zona de Perigo
                            </div>
                            
                            <ListGroup.Item action onClick={() => { deleteHandler(actionProduct.id_produto); handleCloseActions(); }} className="py-3 px-4 text-danger">
                                <i className="bi bi-trash me-3 fs-5"></i>
                                <span className="fw-bold">Excluir Produto</span>
                            </ListGroup.Item>
                            
                        </ListGroup>
                    )}
                </Offcanvas.Body>
            </Offcanvas>

            <style>{`
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
};

export default ProductMobileCards;