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

    // 🛑 CHAVES DE ACESSO:
    const podeEditar = isDono || permissoesUsuario.includes('PRODUTOS_MANAGE');
    const podeVer = isDono || permissoesUsuario.includes('PRODUTOS_VIEW') || podeEditar;
    // ==============================================================

    return (
        <div className="rounded-4 shadow-sm overflow-hidden mb-4 border" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
            {/* 🟢 Adicionada a classe 'table-dark-fix' aqui em baixo */}
            <Table responsive className="mb-0 align-middle text-nowrap table-borderless table-dark-fix">
                <thead style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                    <tr>
                        <th className="py-3 ps-4 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Produto</th>
                        <th className="py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Estoque & Preço</th>
                        <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Status & Canais</th>
                        <th className="py-3 pe-4 text-end text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Gerenciar</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => {
                        const categoryName = p.categorias?.nome || 
                                             categoriesList.find(c => c.id_categoria == p.id_categoria)?.nome || 
                                             'Sem Categoria';

                        return (
                            <motion.tr 
                                key={p.id_produto} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className={`border-bottom hover-effect ${!p.active_ecommerce ? 'opacity-75' : ''}`}
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                {/* COLUNA 1: INFO BÁSICA */}
                                <td className="ps-4 py-3">
                                    <div className="d-flex align-items-center">
                                        <div className="position-relative">
                                            <Image 
                                                src={p.imagem_url || defaultImage} 
                                                rounded 
                                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderColor: 'var(--border-color)' }} 
                                                className="shadow-sm border" 
                                                onError={(e) => { e.target.src = defaultImage; }} 
                                            />
                                            <div className="position-absolute top-0 start-0 translate-middle">
                                                {getTypeBadge(p.tipo_produto)}
                                            </div>
                                        </div>
                                        <div className="ms-3">
                                            <div className="fw-bold text-truncate" style={{ maxWidth: '280px', color: 'var(--text-primary)', fontSize: '13px' }}>{p.nome}</div>
                                            <div className="d-flex gap-2 small mt-1" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                                                <span>SKU: {p.id_produto}</span>
                                                <span>•</span>
                                                <span style={{ color: '#2563eb' }}>{categoryName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUNA 2: PREÇO E ESTOQUE */}
                                <td>
                                    <div className="d-flex flex-column">
                                        <span className="fw-bold fs-6" style={{ color: 'var(--text-primary)' }}>R$ {parseFloat(p.preco).toFixed(2)}</span>
                                        <div className={`d-flex align-items-center small ${p.estoque > 0 ? 'text-success' : 'text-danger'}`}>
                                            <i className={`bi bi-${p.estoque > 0 ? 'box-seam' : 'exclamation-circle'} me-1`}></i>
                                            {formatStock(p.estoque, p.unidade)} {p.unidade}
                                        </div>
                                    </div>
                                </td>

                                {/* COLUNA 3: INTEGRAÇÕES (Consolidado) */}
                                <td>
                                    <div className="d-flex align-items-center justify-content-center gap-4">
                                        {/* Switch Loja Virtual */}
                                        <div className="d-flex flex-column align-items-center" title="Loja Virtual">
                                            <Form.Check 
                                                type="switch" 
                                                checked={p.active_ecommerce} 
                                                onChange={() => podeEditar && toggleEcommerce(p.id_produto, p.active_ecommerce)} 
                                                className="m-0"
                                                disabled={!podeEditar} // 🟢 DESATIVA O SWITCH SE NÃO PUDER EDITAR
                                                style={{ cursor: podeEditar ? 'pointer' : 'not-allowed' }}
                                            />
                                            <small style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Loja</small>
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
                                            <small style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ML</small>
                                        </div>

                                        {/* Ícone Facebook */}
                                        {isFacebookReady && (
                                            <div className="d-flex flex-column align-items-center">
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Integração Meta</Tooltip>}>
                                                    <i className="bi bi-facebook fs-5" style={{ color: '#1877F2' }}></i>
                                                </OverlayTrigger>
                                                <small style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Social</small>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* COLUNA 4: AÇÕES (Limpo) */}
                                <td className="pe-4 text-end">
                                    <div className="d-inline-flex align-items-center gap-2">
                                        
                                        {/* 🟢 Ação Principal: EDITAR ou VISUALIZAR */}
                                        {podeEditar ? (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Editar Produto</Tooltip>}>
                                                <Button 
                                                    as={Link} 
                                                    to={`/admin/product/${p.id_produto}/edit`} 
                                                    variant="light" 
                                                    size="sm" 
                                                    className="btn-icon rounded-circle border shadow-sm"
                                                    style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                                >
                                                    <i className="bi bi-pencil-fill" style={{ fontSize: '12px' }}></i>
                                                </Button>
                                            </OverlayTrigger>
                                        ) : podeVer ? (
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Visualizar Detalhes</Tooltip>}>
                                                <Button 
                                                    as={Link} 
                                                    to={`/admin/product/${p.id_produto}/edit`} 
                                                    variant="light" 
                                                    size="sm" 
                                                    className="btn-icon rounded-circle border shadow-sm text-primary"
                                                    style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13, 110, 253, 0.1)', borderColor: 'var(--border-color)' }}
                                                >
                                                    <i className="bi bi-eye-fill" style={{ fontSize: '12px' }}></i>
                                                </Button>
                                            </OverlayTrigger>
                                        ) : null}

                                        {/* 🟢 Dropdown para todo o resto (SÓ APARECE SE PUDER EDITAR) */}
                                        {podeEditar && (
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="light" size="sm" className="btn-icon rounded-circle border-0" style={{ width: 32, height: 32, padding: 0, backgroundColor: 'transparent', color: 'var(--text-secondary)' }}>
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="shadow-lg border-0 rounded-3 p-2 custom-dropdown" style={{ minWidth: '220px' }}>
                                                    <div className="small fw-bold px-3 py-1 text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Produção</div>
                                                    
                                                    {/* Fabricação */}
                                                    {p.tipo_produto !== 'INSUMO' && (
                                                        <Dropdown.Item onClick={() => onShowCraft(p)} className="rounded-2 py-2 d-flex align-items-center">
                                                            <i className="bi bi-hammer me-2 text-primary"></i> <span style={{ fontSize: '13px' }}>Fabricar Item</span>
                                                        </Dropdown.Item>
                                                    )}
                                                    <Dropdown.Item onClick={() => onShowComposition(p)} className="rounded-2 py-2 d-flex align-items-center">
                                                        <i className="bi bi-list-check me-2 text-info"></i> <span style={{ fontSize: '13px' }}>Receita / Insumos</span>
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => onShowHistory(p)} className="rounded-2 py-2 d-flex align-items-center">
                                                        <i className="bi bi-clock-history me-2 text-secondary"></i> <span style={{ fontSize: '13px' }}>Histórico Estoque</span>
                                                    </Dropdown.Item>

                                                    <div className="dropdown-divider my-2" style={{ borderColor: 'var(--border-color)' }}></div>
                                                    <div className="small fw-bold px-3 py-1 text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Marketing</div>

                                                    {/* Mercado Livre Actions */}
                                                    {p.mercado_livre_id ? (
                                                        <>
                                                            <Dropdown.Item onClick={() => updateStatusHandler(p.id_produto, p.ml_status)} className="rounded-2 py-2 d-flex align-items-center">
                                                                <i className={`bi bi-${p.ml_status === 'active' ? 'pause' : 'play'}-circle me-2 text-warning`}></i>
                                                                <span style={{ fontSize: '13px' }}>{p.ml_status === 'active' ? 'Pausar no ML' : 'Ativar no ML'}</span>
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => syncStatus(p.id_produto)} className="rounded-2 py-2 d-flex align-items-center">
                                                                <i className="bi bi-arrow-repeat me-2 text-success"></i> <span style={{ fontSize: '13px' }}>Sincronizar ML</span>
                                                            </Dropdown.Item>
                                                        </>
                                                    ) : (
                                                        <Dropdown.Item onClick={() => publishHandler(p.id_produto)} className="rounded-2 py-2 d-flex align-items-center">
                                                            <i className="bi bi-upload text-warning me-2"></i> <span style={{ fontSize: '13px' }}>Publicar no ML</span>
                                                        </Dropdown.Item>
                                                    )}

                                                    {/* Facebook Actions */}
                                                    {isFacebookReady && (
                                                        <>
                                                            <Dropdown.Item onClick={() => handlePostOrganico(p.id_produto)} className="rounded-2 py-2 d-flex align-items-center">
                                                                <i className="bi bi-facebook text-primary me-2"></i> <span style={{ fontSize: '13px' }}>Postar Orgânico</span>
                                                            </Dropdown.Item>
                                                            {fbConfig.FB_AD_ACCOUNT_ID && (
                                                                <Dropdown.Item onClick={() => handleAnuncioPago(p.id_produto)} className="rounded-2 py-2 d-flex align-items-center">
                                                                    <i className="bi bi-megaphone text-success me-2"></i> <span style={{ fontSize: '13px' }}>Criar Anúncio</span>
                                                                </Dropdown.Item>
                                                            )}
                                                        </>
                                                    )}

                                                    <div className="dropdown-divider my-2" style={{ borderColor: 'var(--border-color)' }}></div>
                                                    <Dropdown.Item onClick={() => deleteHandler(p.id_produto)} className="rounded-2 py-2 text-danger d-flex align-items-center">
                                                        <i className="bi bi-trash me-2"></i> <span className="fw-bold" style={{ fontSize: '13px' }}>Excluir Produto</span>
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </Table>
            
            <style>{`
                /* 🟢 CORES PADRÃO PARA HOVER (USADAS EM MODO CLARO E ESCURO) */
                .hover-effect:hover td { background-color: var(--bg-hover, #f1f5f9) !important; }
                
                /* 🟢 MODO ESCURO GERAL DA TABELA (Bootstrap Overrides) */
                .table-dark-fix {
                    --bs-table-bg: transparent;
                    color: var(--text-primary);
                }
                .table-dark-fix th {
                    color: var(--text-secondary);
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-color);
                }
                .table-dark-fix td {
                    border-bottom: 1px solid var(--border-color);
                    vertical-align: middle;
                }

                /* 🟢 MODO ESCURO: CORREÇÕES ESPECÍFICAS (Cores, Dropdowns) */
                body.dark-mode table { color: var(--text-primary) !important; }
                body.dark-mode .table-dark-fix td,
                body.dark-mode .table-dark-fix th {
                    background-color: var(--bg-sidebar) !important;
                    border-bottom-color: var(--border-color) !important;
                    color: var(--text-primary) !important;
                }
                body.dark-mode .hover-effect:hover td { background-color: var(--bg-hover) !important; }

                /* Correção do Dropdown para o Modo Escuro */
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