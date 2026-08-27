import React from 'react';
import { Image, Form, OverlayTrigger, Tooltip, Badge, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Importando os novos componentes universais
import { SquareButton } from '../ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../ui/listagem/FlatList';

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
        'INSUMO': { bg: 'warning', text: 'Insumo', color: '#b45309' },
        'FINAL': { bg: 'success', text: 'Venda', color: '#15803d' },
        'MISTO': { bg: 'primary', text: 'Misto', color: '#1d4ed8' },
        'CONSUMO_INTERNO': { bg: 'secondary', text: 'Uso Interno', color: '#475569' }
    };
    const { bg, text, color } = config[type] || { bg: 'light', text: type, color: '#475569' };
    
    return <Badge bg={bg} className="fw-normal rounded-pill px-2 bg-opacity-25 border" style={{ color: color, borderColor: color, fontSize: '0.65rem' }}>{text}</Badge>;
};

const ProductDesktopTable = ({ 
    products, toggleEcommerce, renderStatusBadge, syncStatus, publishHandler, 
    isFacebookReady, fbConfig, handlePostOrganico, handleAnuncioPago, 
    updateStatusHandler, deleteHandler, defaultImage, onShowHistory,
    onShowComposition, onShowCraft,
    categoriesList = [] 
}) => {

    // ==============================================================
    // 🟢 LÓGICA DE PERMISSÕES BLINDADA ('PRODUTOS_MANAGE')
    // ==============================================================
    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) {}

    const roleUpper = String(dadosUser.role || '').toUpperCase();
    const isDono = roleUpper === 'PROPRIETÁRIO' || 
                   roleUpper === 'DONO' || 
                   roleUpper === 'ADMIN' || 
                   dadosUser.isAdmin === true;

    let permissoesUsuario = [];
    if (Array.isArray(dadosUser.permissoes)) {
        permissoesUsuario = dadosUser.permissoes;
    } else if (dadosUser.cargo && Array.isArray(dadosUser.cargo.permissoes)) {
        permissoesUsuario = dadosUser.cargo.permissoes;
    }

    const podeEditar = isDono || permissoesUsuario.includes('PRODUTOS_MANAGE');
    const podeVer = isDono || permissoesUsuario.includes('PRODUTOS_VIEW') || podeEditar;
    // ==============================================================

    return (
        <div className="mb-4">
            <FlatListContainer 
                loading={false} 
                empty={products.length === 0} 
                emptyMessage="Nenhum produto cadastrado no catálogo."
                emptyIcon="bi-box-seam"
            >
                {/* 🟢 CABEÇALHO DESKTOP (Grid System) */}
                <FlatListHeader>
                    <div className="col-lg-4 ps-2">Produto</div>
                    <div className="col-lg-3">Estoque & Preço</div>
                    <div className="col-lg-3 text-center">Status & Canais</div>
                    <div className="col-lg-2 text-end pe-2">Gerenciar</div>
                </FlatListHeader>

                {/* 🟢 LISTAGEM DOS PRODUTOS */}
                {products.map(p => {
                    const categoryName = p.categorias?.nome || 
                                         categoriesList.find(c => c.id_categoria == p.id_categoria)?.nome || 
                                         'Sem Categoria';

                    return (
                        <motion.div 
                            key={p.id_produto} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="w-100"
                        >
                            <FlatListItem>
                                <div className={`row w-100 m-0 align-items-center ${!p.active_ecommerce ? 'opacity-75' : ''}`}>
                                    
                                    {/* COLUNA 1: INFO BÁSICA */}
                                    <div className="col-12 col-lg-4 d-flex align-items-center mb-3 mb-lg-0 p-0">
                                        <div className="position-relative flex-shrink-0">
                                            <Image 
                                                src={p.imagem_url || defaultImage} 
                                                rounded 
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderColor: 'var(--border-color)' }} 
                                                className="shadow-sm border" 
                                                onError={(e) => { e.target.src = defaultImage; }} 
                                            />
                                            <div className="position-absolute top-0 start-0 translate-middle">
                                                {getTypeBadge(p.tipo_produto)}
                                            </div>
                                        </div>
                                        <div className="ms-3 overflow-hidden">
                                            <div className="fw-bold text-truncate" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                                {p.nome}
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 small mt-1" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                <span>SKU: {p.id_produto}</span>
                                                <span className="d-none d-sm-inline">•</span>
                                                <span style={{ color: '#0A84FF', fontWeight: 500 }}>{categoryName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUNA 2: PREÇO E ESTOQUE */}
                                    <div className="col-6 col-lg-3 p-0">
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold fs-6" style={{ color: 'var(--text-primary)' }}>
                                                R$ {parseFloat(p.preco).toFixed(2)}
                                            </span>
                                            <div className={`d-flex align-items-center small ${p.estoque > 0 ? 'text-success fw-medium' : 'text-danger fw-bold'}`}>
                                                <i className={`bi bi-${p.estoque > 0 ? 'box-seam' : 'exclamation-circle'} me-1`}></i>
                                                {formatStock(p.estoque, p.unidade)} {p.unidade}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUNA 3: INTEGRAÇÕES (CANAIS) */}
                                    <div className="col-6 col-lg-3 d-flex align-items-center justify-content-end justify-content-lg-center gap-3 gap-md-4 p-0">
                                        
                                        {/* Switch Loja Virtual */}
                                        <div className="d-flex flex-column align-items-center" title="Loja Virtual">
                                            <Form.Check 
                                                type="switch" 
                                                checked={p.active_ecommerce} 
                                                onChange={() => podeEditar && toggleEcommerce(p.id_produto, p.active_ecommerce)} 
                                                className="m-0 custom-switch"
                                                disabled={!podeEditar} 
                                                style={{ cursor: podeEditar ? 'pointer' : 'not-allowed' }}
                                            />
                                            <small style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>LOJA</small>
                                        </div>

                                        {/* Ícone Mercado Livre */}
                                        <div className="d-flex flex-column align-items-center">
                                            {p.mercado_livre_id ? (
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Status: {p.ml_status}</Tooltip>}>
                                                    <i className={`bi bi-handbag-fill fs-5 ${p.ml_status === 'active' ? 'text-warning' : 'opacity-50'}`} style={{ color: p.ml_status === 'active' ? '' : 'var(--text-secondary)' }}></i>
                                                </OverlayTrigger>
                                            ) : (
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Não publicado no ML</Tooltip>}>
                                                    <i className="bi bi-handbag fs-5 opacity-25" style={{ color: 'var(--text-secondary)' }}></i>
                                                </OverlayTrigger>
                                            )}
                                            <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ML</small>
                                        </div>

                                        {/* Ícone Facebook */}
                                        {isFacebookReady && (
                                            <div className="d-flex flex-column align-items-center">
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Integração Meta</Tooltip>}>
                                                    <i className="bi bi-facebook fs-5" style={{ color: '#1877F2' }}></i>
                                                </OverlayTrigger>
                                                <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>META</small>
                                            </div>
                                        )}
                                    </div>

                                    {/* COLUNA 4: AÇÕES */}
                                    <div className="col-12 col-lg-2 d-flex justify-content-end align-items-center gap-2 mt-3 mt-lg-0 p-0">
                                        
                                        {/* Ação Principal: EDITAR ou VISUALIZAR usando SquareButton */}
                                        {podeEditar ? (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Editar Produto</Tooltip>}>
                                                <SquareButton 
                                                    as={Link} 
                                                    to={`/admin/product/${p.id_produto}/edit`}
                                                >
                                                    <i className="bi bi-pencil-fill"></i>
                                                </SquareButton>
                                            </OverlayTrigger>
                                        ) : podeVer ? (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Visualizar Detalhes</Tooltip>}>
                                                <SquareButton 
                                                    as={Link} 
                                                    to={`/admin/product/${p.id_produto}/edit`} 
                                                    color="var(--bg-sidebar, #F4F6FA)"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <i className="bi bi-eye-fill"></i>
                                                </SquareButton>
                                            </OverlayTrigger>
                                        ) : null}

                                        {/* Dropdown de Opções Extras */}
                                        {podeEditar && (
                                            <Dropdown align="end">
                                                <Dropdown.Toggle 
                                                    variant="none" 
                                                    className="d-flex align-items-center justify-content-center border-0 shadow-none flat-dropdown-toggle" 
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-2 custom-dropdown" style={{ minWidth: '220px' }}>
                                                    <div className="small fw-bold px-3 py-1 text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Produção</div>
                                                    
                                                    {/* Fabricação */}
                                                    {p.tipo_produto !== 'INSUMO' && (
                                                        <Dropdown.Item onClick={() => onShowCraft(p)} className="rounded-3 py-2 d-flex align-items-center">
                                                            <i className="bi bi-hammer me-2" style={{ color: '#0A84FF' }}></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Fabricar Item</span>
                                                        </Dropdown.Item>
                                                    )}
                                                    <Dropdown.Item onClick={() => onShowComposition(p)} className="rounded-3 py-2 d-flex align-items-center">
                                                        <i className="bi bi-list-check me-2 text-info"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Receita / Insumos</span>
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => onShowHistory(p)} className="rounded-3 py-2 d-flex align-items-center">
                                                        <i className="bi bi-clock-history me-2 text-secondary"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Histórico Estoque</span>
                                                    </Dropdown.Item>

                                                    <div className="dropdown-divider my-2" style={{ borderColor: 'var(--border-color)' }}></div>
                                                    <div className="small fw-bold px-3 py-1 text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Marketing</div>

                                                    {/* Mercado Livre Actions */}
                                                    {p.mercado_livre_id ? (
                                                        <>
                                                            <Dropdown.Item onClick={() => updateStatusHandler(p.id_produto, p.ml_status)} className="rounded-3 py-2 d-flex align-items-center">
                                                                <i className={`bi bi-${p.ml_status === 'active' ? 'pause' : 'play'}-circle me-2 text-warning`}></i>
                                                                <span className="fw-medium" style={{ fontSize: '13px' }}>{p.ml_status === 'active' ? 'Pausar no ML' : 'Ativar no ML'}</span>
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => syncStatus(p.id_produto)} className="rounded-3 py-2 d-flex align-items-center">
                                                                <i className="bi bi-arrow-repeat me-2 text-success"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Sincronizar ML</span>
                                                            </Dropdown.Item>
                                                        </>
                                                    ) : (
                                                        <Dropdown.Item onClick={() => publishHandler(p.id_produto)} className="rounded-3 py-2 d-flex align-items-center">
                                                            <i className="bi bi-upload text-warning me-2"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Publicar no ML</span>
                                                        </Dropdown.Item>
                                                    )}

                                                    {/* Facebook Actions */}
                                                    {isFacebookReady && (
                                                        <>
                                                            <Dropdown.Item onClick={() => handlePostOrganico(p.id_produto)} className="rounded-3 py-2 d-flex align-items-center">
                                                                <i className="bi bi-facebook text-primary me-2"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Postar Orgânico</span>
                                                            </Dropdown.Item>
                                                            {fbConfig.FB_AD_ACCOUNT_ID && (
                                                                <Dropdown.Item onClick={() => handleAnuncioPago(p.id_produto)} className="rounded-3 py-2 d-flex align-items-center">
                                                                    <i className="bi bi-megaphone text-success me-2"></i> <span className="fw-medium" style={{ fontSize: '13px' }}>Criar Anúncio</span>
                                                                </Dropdown.Item>
                                                            )}
                                                        </>
                                                    )}

                                                    <div className="dropdown-divider my-2" style={{ borderColor: 'var(--border-color)' }}></div>
                                                    <Dropdown.Item onClick={() => deleteHandler(p.id_produto)} className="rounded-3 py-2 text-danger d-flex align-items-center">
                                                        <i className="bi bi-trash me-2"></i> <span className="fw-bold" style={{ fontSize: '13px' }}>Excluir Produto</span>
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}
                                    </div>
                                </div>
                            </FlatListItem>
                        </motion.div>
                    );
                })}
            </FlatListContainer>
            
            <style>{`
                /* Estilização do Botão de Opções (Dropdown) para combinar com a interface plana */
                .flat-dropdown-toggle {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    background-color: transparent;
                    color: var(--text-secondary, #64748b);
                    transition: all 0.2s ease;
                }
                .flat-dropdown-toggle:hover {
                    background-color: rgba(100, 116, 139, 0.1);
                    color: var(--text-primary);
                }
                .flat-dropdown-toggle::after {
                    display: none !important; /* Esconde a setinha nativa do dropdown */
                }

                /* Customização visual dos switches */
                .custom-switch .form-check-input {
                    cursor: pointer;
                    width: 2.5rem;
                    height: 1.25rem;
                }
                .custom-switch .form-check-input:focus {
                    box-shadow: none;
                    border-color: rgba(0,0,0,0.25);
                }
                .custom-switch .form-check-input:checked {
                    background-color: #10B981;
                    border-color: #10B981;
                }

                /* 🟢 MODO ESCURO: CORREÇÕES ESPECÍFICAS (Cores, Dropdowns) */
                body.dark-mode .custom-dropdown { 
                    background-color: var(--bg-sidebar); 
                    border: 1px solid var(--border-color) !important; 
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                }
                body.dark-mode .custom-dropdown .dropdown-item { color: var(--text-primary); }
                body.dark-mode .custom-dropdown .dropdown-item:hover { background-color: var(--bg-hover); color: var(--text-primary); }
                body.dark-mode .custom-dropdown .text-danger:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
                body.dark-mode .custom-dropdown .dropdown-divider { border-color: var(--border-color); }
            `}</style>
        </div>
    );
};

export default ProductDesktopTable;