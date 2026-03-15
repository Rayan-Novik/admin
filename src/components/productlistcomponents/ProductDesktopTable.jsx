import React from 'react';
import { Table, Image, Form, Button, OverlayTrigger, Tooltip, Badge, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- HELPERS ---
const formatStock = (val, unit) => {
    const decimalUnits = ['KG', 'G', 'M', 'CM', 'L', 'ML', 'M2'];
    const isDecimal = decimalUnits.includes(unit);
    return Number(val).toLocaleString('pt-BR', {
        minimumFractionDigits: isDecimal ? 3 : 0,
        maximumFractionDigits: isDecimal ? 3 : 0
    });
};

const getTypeBadge = (type) => {
    const config = {
        'INSUMO': { bg: 'warning', text: 'Insumo' },
        'FINAL': { bg: 'success', text: 'Venda' },
        'MISTO': { bg: 'primary', text: 'Misto' },
        'CONSUMO_INTERNO': { bg: 'secondary', text: 'Uso Interno' }
    };
    const { bg, text } = config[type] || { bg: 'light', text: type };
    
    return <Badge bg={bg} className="fw-normal rounded-pill px-2">{text}</Badge>;
};

const ProductDesktopTable = ({ 
    products, toggleEcommerce, renderStatusBadge, syncStatus, publishHandler, 
    isFacebookReady, fbConfig, handlePostOrganico, handleAnuncioPago, 
    updateStatusHandler, deleteHandler, defaultImage, onShowHistory,
    onShowComposition, onShowCraft,
    // ✅ NOVA PROP IMPORTANTE: Recebe a lista completa de categorias
    categoriesList = [] 
}) => (
    <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4 border border-light">
        <Table hover responsive className="mb-0 align-middle text-nowrap">
            <thead className="bg-light text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
                <tr>
                    <th className="py-3 ps-4 border-0">Produto</th>
                    <th className="py-3 border-0">Estoque & Preço</th>
                    <th className="py-3 border-0 text-center">Status & Canais</th>
                    <th className="py-3 pe-4 border-0 text-end">Gerenciar</th>
                </tr>
            </thead>
            <tbody>
                {products.map(p => {
                    // ✅ LÓGICA DE CORREÇÃO DO NOME DA CATEGORIA
                    // 1. Tenta pegar do objeto populado (p.categorias.nome)
                    // 2. Se não tiver, busca na lista categoriesList pelo ID
                    // 3. Se não achar, mostra "Sem Categoria"
                    const categoryName = p.categorias?.nome || 
                                         categoriesList.find(c => c.id_categoria == p.id_categoria)?.nome || 
                                         'Sem Categoria';

                    return (
                        <motion.tr 
                            key={p.id_produto} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className={!p.active_ecommerce ? 'bg-light bg-opacity-50' : ''}
                        >
                            {/* COLUNA 1: INFO BÁSICA */}
                            <td className="ps-4 py-3">
                                <div className="d-flex align-items-center">
                                    <div className="position-relative">
                                        <Image 
                                            src={p.imagem_url || defaultImage} 
                                            rounded 
                                            style={{ width: '56px', height: '56px', objectFit: 'cover' }} 
                                            className="shadow-sm border" 
                                            onError={(e) => { e.target.src = defaultImage; }} 
                                        />
                                        <div className="position-absolute top-0 start-0 translate-middle">
                                            {getTypeBadge(p.tipo_produto)}
                                        </div>
                                    </div>
                                    <div className="ms-3">
                                        <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '280px' }}>{p.nome}</div>
                                        <div className="d-flex gap-2 small text-muted">
                                            <span>SKU: {p.id_produto}</span>
                                            <span>•</span>
                                            {/* ✅ Usando a variável corrigida aqui */}
                                            <span className="text-primary">{categoryName}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* COLUNA 2: PREÇO E ESTOQUE */}
                            <td>
                                <div className="d-flex flex-column">
                                    <span className="fw-bold text-dark fs-6">R$ {parseFloat(p.preco).toFixed(2)}</span>
                                    <div className={`d-flex align-items-center small ${p.estoque > 0 ? 'text-success' : 'text-danger'}`}>
                                        <i className={`bi bi-${p.estoque > 0 ? 'box-seam' : 'exclamation-circle'} me-1`}></i>
                                        {formatStock(p.estoque, p.unidade)} {p.unidade}
                                    </div>
                                </div>
                            </td>

                            {/* COLUNA 3: INTEGRAÇÕES (Consolidado) */}
                            <td>
                                <div className="d-flex align-items-center justify-content-center gap-3">
                                    {/* Switch Loja Virtual */}
                                    <div className="d-flex flex-column align-items-center" title="Loja Virtual">
                                        <Form.Check 
                                            type="switch" 
                                            checked={p.active_ecommerce} 
                                            onChange={() => toggleEcommerce(p.id_produto, p.active_ecommerce)} 
                                            className="m-0"
                                        />
                                        <small className="text-muted" style={{fontSize: '0.65rem'}}>Loja</small>
                                    </div>

                                    {/* Ícone Mercado Livre */}
                                    <div className="d-flex flex-column align-items-center">
                                        {p.mercado_livre_id ? (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Status: {p.ml_status}</Tooltip>}>
                                                <i className={`bi bi-handbag-fill fs-5 ${p.ml_status === 'active' ? 'text-warning' : 'text-secondary opacity-50'}`}></i>
                                            </OverlayTrigger>
                                        ) : (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Não publicado no ML</Tooltip>}>
                                                <i className="bi bi-handbag fs-5 text-muted opacity-25"></i>
                                            </OverlayTrigger>
                                        )}
                                        <small className="text-muted" style={{fontSize: '0.65rem'}}>ML</small>
                                    </div>

                                    {/* Ícone Facebook */}
                                    {isFacebookReady && (
                                        <div className="d-flex flex-column align-items-center">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Integração Meta</Tooltip>}>
                                                <i className="bi bi-facebook fs-5 text-primary"></i>
                                            </OverlayTrigger>
                                            <small className="text-muted" style={{fontSize: '0.65rem'}}>Social</small>
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* COLUNA 4: AÇÕES (Limpo) */}
                            <td className="pe-4 text-end">
                                <div className="d-inline-flex align-items-center gap-1">
                                    
                                    {/* Ação Principal: EDITAR */}
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Editar Produto</Tooltip>}>
                                        <Button 
                                            as={Link} 
                                            to={`/admin/product/${p.id_produto}/edit`} 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="btn-icon rounded-circle"
                                            style={{width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                        >
                                            <i className="bi bi-pencil-fill"></i>
                                        </Button>
                                    </OverlayTrigger>

                                    {/* Dropdown para todo o resto */}
                                    <Dropdown align="end">
                                        <Dropdown.Toggle variant="light" size="sm" className="btn-icon rounded-circle text-muted border-0" style={{width: 32, height: 32, padding: 0}}>
                                            <i className="bi bi-three-dots-vertical"></i>
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="shadow border-0 rounded-3 p-2" style={{ minWidth: '220px' }}>
                                            <div className="text-muted small fw-bold px-3 py-1 text-uppercase">Produção</div>
                                            
                                            {/* Fabricação */}
                                            {p.tipo_produto !== 'INSUMO' && (
                                                <Dropdown.Item onClick={() => onShowCraft(p)} className="rounded-2 py-2">
                                                    <i className="bi bi-hammer text-primary me-2"></i>Fabricar Item
                                                </Dropdown.Item>
                                            )}
                                            <Dropdown.Item onClick={() => onShowComposition(p)} className="rounded-2 py-2">
                                                <i className="bi bi-list-check text-secondary me-2"></i>Receita / Insumos
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => onShowHistory(p)} className="rounded-2 py-2">
                                                <i className="bi bi-clock-history text-info me-2"></i>Histórico Estoque
                                            </Dropdown.Item>

                                            <div className="dropdown-divider my-2"></div>
                                            <div className="text-muted small fw-bold px-3 py-1 text-uppercase">Marketing</div>

                                            {/* Mercado Livre Actions */}
                                            {p.mercado_livre_id ? (
                                                <>
                                                    <Dropdown.Item onClick={() => updateStatusHandler(p.id_produto, p.ml_status)} className="rounded-2 py-2">
                                                        <i className={`bi bi-${p.ml_status === 'active' ? 'pause' : 'play'}-circle me-2`}></i>
                                                        {p.ml_status === 'active' ? 'Pausar no ML' : 'Ativar no ML'}
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => syncStatus(p.id_produto)} className="rounded-2 py-2">
                                                        <i className="bi bi-arrow-repeat me-2"></i>Sincronizar ML
                                                    </Dropdown.Item>
                                                </>
                                            ) : (
                                                <Dropdown.Item onClick={() => publishHandler(p.id_produto)} className="rounded-2 py-2">
                                                    <i className="bi bi-upload text-warning me-2"></i>Publicar no ML
                                                </Dropdown.Item>
                                            )}

                                            {/* Facebook Actions */}
                                            {isFacebookReady && (
                                                <>
                                                    <Dropdown.Item onClick={() => handlePostOrganico(p.id_produto)} className="rounded-2 py-2">
                                                        <i className="bi bi-facebook text-primary me-2"></i>Postar Orgânico
                                                    </Dropdown.Item>
                                                    {fbConfig.FB_AD_ACCOUNT_ID && (
                                                        <Dropdown.Item onClick={() => handleAnuncioPago(p.id_produto)} className="rounded-2 py-2">
                                                            <i className="bi bi-megaphone text-success me-2"></i>Criar Anúncio
                                                        </Dropdown.Item>
                                                    )}
                                                </>
                                            )}

                                            <div className="dropdown-divider my-2"></div>
                                            <Dropdown.Item onClick={() => deleteHandler(p.id_produto)} className="rounded-2 py-2 text-danger">
                                                <i className="bi bi-trash me-2"></i>Excluir Produto
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </td>
                        </motion.tr>
                    );
                })}
            </tbody>
        </Table>
    </div>
);

export default ProductDesktopTable;