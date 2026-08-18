import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { motion } from 'framer-motion';

// --- COMPONENTE DE CRONÔMETRO ---
export const PreparationTimer = ({ orderDate }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!orderDate) return;
            const orderTime = new Date(orderDate).getTime();
            const deadline = orderTime + (2 * 60 * 60 * 1000); 
            const now = new Date().getTime();
            const difference = deadline - now;

            if (difference < 0) {
                setIsLate(true);
                const lateDiff = Math.abs(difference);
                const hours = Math.floor(lateDiff / (1000 * 60 * 60));
                const minutes = Math.floor((lateDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`-${hours}h ${minutes}m`);
            } else {
                setIsLate(false);
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(timer);
    }, [orderDate]);

    if (!timeLeft) return null;

    return (
        <motion.div 
            animate={isLate ? { opacity: [1, 0.5, 1] } : {}}
            transition={isLate ? { duration: 1, repeat: Infinity } : {}}
            className={`d-inline-flex align-items-center fw-medium px-2 py-1 rounded-3 mt-1`}
            style={{ fontSize: '11px', backgroundColor: isLate ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isLate ? '#ef4444' : '#d97706' }}
        >
            <i className={`bi ${isLate ? 'bi-exclamation-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
            {isLate ? 'Atrasado: ' : 'Expira: '} {timeLeft}
        </motion.div>
    );
};

// ==============================================================
// 🟢 COMPONENTE PRINCIPAL DE LISTAGEM
// ==============================================================
export const OrderListContent = ({ 
    items, 
    podeGerenciarPedidos, 
    formatCurrency, 
    renderOrigemBadge, 
    renderBadgeLogistica, 
    checkActionable, 
    handleAction, 
    copyDriverLink 
}) => {
    return (
        <>
            {/* VISÃO DESKTOP (MANTIDA INTACTA) */}
            <div className="d-none d-lg-block">
                <Table responsive className="mb-0 align-middle table-borderless">
                    <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th className="py-3 ps-4 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pedido</th>
                            <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Origem</th>
                            <th className="py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cliente</th>
                            <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Entrega</th>
                            <th className="py-3 text-end text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total</th>
                            <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status</th>
                            <th className="py-3 pe-4 text-end text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => {
                            const isRetirada = p.metodo_envio === 'Retirada na Loja' || p.metodo_envio === 'Consumo no Local' || !p.id_endereco_entrega;
                            const isReady = p.status_entrega === 'Pronto para Retirada';
                            const isOutForDelivery = String(p.status_entrega || '').toLowerCase().includes('rota') || Boolean(p.delivery_pin);
                            const isDelivered = String(p.status_entrega || '').toLowerCase() === 'entregue';
                            const isActionable = checkActionable(p);

                            return (
                                <motion.tr 
                                    key={`${p.origem}-${p.id_pedido}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-bottom hover-effect"
                                    style={{ borderColor: 'var(--border-color)' }}
                                >
                                    <td className="ps-4 fw-bold" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                        #{p.id_pedido}
                                    </td>
                                    <td className="text-center">
                                        {renderOrigemBadge(p)}
                                    </td>
                                    <td>
                                        <span className="d-block fw-semibold text-truncate" style={{ maxWidth: '180px', color: 'var(--text-primary)', fontSize: '13px' }}>{p.nome_completo}</span>
                                        <small style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(p.data_pedido).toLocaleDateString('pt-BR')} às {new Date(p.data_pedido).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                    </td>
                                    
                                    <td className="text-center align-middle">
                                        {renderBadgeLogistica(p)}
                                        {(p.origem === 'ecommerce' || p.origem === 'pdv') && isActionable && !isReady && !isDelivered && !isOutForDelivery && (
                                            <div><PreparationTimer orderDate={p.data_pedido} /></div>
                                        )}
                                    </td>
                                    
                                    <td className="text-end">
                                        <div className="fw-bold text-success" style={{ fontSize: '14px' }}>{formatCurrency(p.preco_total)}</div>
                                        <div className="text-uppercase fw-semibold text-truncate mt-1" style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '120px', display: 'inline-block' }}>
                                            <i className="bi bi-credit-card me-1"></i> {p.metodo_pagamento || 'N/A'}
                                        </div>
                                    </td>
                                    
                                    <td className="text-center">
                                        {p.status_pagamento === 'PAGO' ? (
                                            <Badge bg="success" className="px-2 py-1 fw-medium bg-opacity-10 text-success border border-success border-opacity-25">PAGO</Badge>
                                        ) : p.metodo_pagamento?.toUpperCase().includes('OFFLINE') ? (
                                            <Badge bg="info" className="px-2 py-1 fw-medium bg-opacity-10 text-info border border-info border-opacity-25">Na Entrega</Badge>
                                        ) : (
                                            <Badge bg={p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} className={`px-2 py-1 fw-medium bg-opacity-10 border border-opacity-25 text-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} border-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'}`}>
                                                {p.status_pagamento}
                                            </Badge>
                                        )}
                                        
                                        <div className="mt-1">
                                            {isOutForDelivery && !isDelivered ? (
                                                <Badge bg="primary" className="fw-medium py-1 bg-opacity-10 text-primary border border-primary border-opacity-25"><i className="bi bi-bicycle"></i> Rota</Badge>
                                            ) : (
                                                <Badge bg={isDelivered ? 'success' : 'secondary'} className={`fw-medium px-2 py-1 bg-opacity-10 border border-opacity-25 text-${isDelivered ? 'success' : 'secondary'} border-${isDelivered ? 'success' : 'secondary'}`} style={{ fontSize: '10px' }}>{p.status_entrega || 'Pendente'}</Badge>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="pe-4 text-end">
                                        {isOutForDelivery && !isDelivered && p.delivery_pin ? (
                                            <div className="d-flex flex-column align-items-end gap-1">
                                                <Badge bg="light" text="dark" className="border px-2 py-1" style={{ fontSize: '11px' }}>
                                                    PIN Cliente: <strong className="text-danger fs-6">{p.delivery_pin}</strong>
                                                </Badge>
                                                
                                                <div className="d-flex gap-1">
                                                    <OverlayTrigger overlay={<Tooltip>Copiar Link do Motoboy</Tooltip>}>
                                                        <Button variant="outline-primary" size="sm" style={{ fontSize: '11px', height: '32px' }} onClick={() => copyDriverLink(p.driver_token)}>
                                                            <i className="bi bi-link-45deg me-1"></i> Link Moto
                                                        </Button>
                                                    </OverlayTrigger>
                                                    
                                                    <OverlayTrigger overlay={<Tooltip>Ver Detalhes do Pedido</Tooltip>}>
                                                        <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`}>
                                                            <Button variant="light" size="sm" className="border text-secondary" style={{ width: '32px', height: '32px' }}>
                                                                <i className="bi bi-eye"></i>
                                                            </Button>
                                                        </LinkContainer>
                                                    </OverlayTrigger>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex justify-content-end gap-2">
                                                <OverlayTrigger overlay={<Tooltip>Ver Detalhes</Tooltip>}>
                                                    <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`}>
                                                        <Button variant="light" size="sm" className="border d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                    </LinkContainer>
                                                </OverlayTrigger>

                                                {podeGerenciarPedidos && p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && (
                                                    isRetirada ? (
                                                        isReady ? 
                                                        <OverlayTrigger overlay={<Tooltip>Confirmar Retirada</Tooltip>}>
                                                            <Button variant="success" size="sm" className="d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => handleAction('pickedup', p.id_pedido)}><i className="bi bi-check-lg"></i></Button>
                                                        </OverlayTrigger> : 
                                                        <OverlayTrigger overlay={<Tooltip>Separar Pedido</Tooltip>}>
                                                            <Button variant="primary" size="sm" className="d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => handleAction('ready', p.id_pedido)}><i className="bi bi-box-seam"></i></Button>
                                                        </OverlayTrigger>
                                                    ) : (
                                                        <OverlayTrigger overlay={<Tooltip>Despachar Entregador</Tooltip>}>
                                                            <Button variant="info" size="sm" className="d-flex align-items-center justify-content-center text-white" style={{ width: '32px', height: '32px' }} onClick={() => handleAction('deliver', p.id_pedido)}>
                                                                <i className="bi bi-bicycle"></i> 
                                                            </Button>
                                                        </OverlayTrigger>
                                                    )
                                                )}
                                                
                                                {p.origem === 'mercadolivre' && (
                                                    <OverlayTrigger overlay={<Tooltip>Ver no ML</Tooltip>}>
                                                        <Button variant="warning" size="sm" className="d-flex align-items-center justify-content-center text-dark" style={{ width: '32px', height: '32px' }} href={p.link_externo} target="_blank"><i className="bi bi-box-arrow-up-right"></i></Button>
                                                    </OverlayTrigger>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>

            {/* VISÃO MOBILE COM PADRONIZAÇÃO DE COR */}
            <div className="d-lg-none p-3 mobile-bg-override">
                {items.map((p) => {
                    const isRetirada = p.metodo_envio === 'Retirada na Loja' || p.metodo_envio === 'Consumo no Local' || !p.id_endereco_entrega;
                    const isReady = p.status_entrega === 'Pronto para Retirada';
                    const isOutForDelivery = String(p.status_entrega || '').toLowerCase().includes('rota') || Boolean(p.delivery_pin);
                    const isDelivered = String(p.status_entrega || '').toLowerCase() === 'entregue';
                    const isActionable = checkActionable(p);
                    
                    return (
                        <motion.div 
                            key={`${p.origem}-${p.id_pedido}`}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <Card className="mb-3 mobile-gray-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>#{p.id_pedido}</h6>
                                                {renderOrigemBadge(p)}
                                            </div>
                                            <small className="mobile-text-muted" style={{ fontSize: '12px' }}>{new Date(p.data_pedido).toLocaleDateString('pt-BR')} às {new Date(p.data_pedido).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                        </div>
                                        
                                        <div className="text-end">
                                            <h5 className="fw-bold text-success mb-1">{formatCurrency(p.preco_total)}</h5>
                                            <div className="text-uppercase fw-bold text-truncate mobile-text-muted" style={{ fontSize: '10px', maxWidth: '100px' }}>
                                                <i className="bi bi-credit-card me-1"></i> {p.metodo_pagamento || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <span className="d-block fw-bold text-truncate mb-1 text-dark" style={{ fontSize: '15px' }}>{p.nome_completo}</span>
                                        
                                        <div className="d-flex flex-wrap gap-2 mt-2 align-items-center">
                                            {p.status_pagamento === 'PAGO' ? (
                                                <Badge bg="success" className="px-2 py-1 fw-medium bg-opacity-10 text-success border border-success border-opacity-25">PAGO</Badge>
                                            ) : p.metodo_pagamento?.toUpperCase().includes('OFFLINE') ? (
                                                <Badge bg="info" className="px-2 py-1 fw-medium bg-opacity-10 text-info border border-info border-opacity-25">Na Entrega</Badge>
                                            ) : (
                                                <Badge bg={p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} className={`px-2 py-1 fw-medium bg-opacity-10 border border-opacity-25 text-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} border-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'}`}>
                                                    {p.status_pagamento}
                                                </Badge>
                                            )}

                                            {isOutForDelivery && !isDelivered ? (
                                                <Badge bg="primary" className="fw-medium px-2 py-1 bg-opacity-10 text-primary border border-primary border-opacity-25"><i className="bi bi-bicycle me-1"></i> Rota</Badge>
                                            ) : (
                                                <Badge bg={isDelivered ? 'success' : 'secondary'} className={`fw-medium px-2 py-1 bg-opacity-10 border border-opacity-25 text-${isDelivered ? 'success' : 'secondary'} border-${isDelivered ? 'success' : 'secondary'}`} style={{ fontSize: '10px' }}>{p.status_entrega || 'Pendente'}</Badge>
                                            )}

                                            {renderBadgeLogistica(p)}
                                        </div>

                                        {(p.origem === 'ecommerce' || p.origem === 'pdv') && isActionable && !isReady && !isDelivered && !isOutForDelivery && (
                                            <div className="mt-2"><PreparationTimer orderDate={p.data_pedido} /></div>
                                        )}
                                    </div>
                                    
                                    {/* AÇÕES E INFOS DE ENTREGA (MOBILE) */}
                                    {isOutForDelivery && !isDelivered && p.delivery_pin ? (
                                        <div className="border-top pt-3 mt-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="mobile-text-muted small fw-bold">PIN do Cliente:</span>
                                                <strong className="text-danger fs-5 border rounded px-3 py-1 bg-white">{p.delivery_pin}</strong>
                                            </div>
                                            
                                            <div className="d-flex gap-2">
                                                <Button variant="outline-primary" size="sm" className="flex-fill fw-bold bg-white" onClick={() => copyDriverLink(p.driver_token)}>
                                                    <i className="bi bi-files me-1"></i> Link Motoboy
                                                </Button>
                                                <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`}>
                                                    <Button variant="light" size="sm" className="border fw-bold text-dark bg-white">Detalhes</Button>
                                                </LinkContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="d-flex gap-2 border-top pt-3 mt-1" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                            <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`} className="flex-grow-1">
                                                <Button variant="light" size="sm" className="fw-bold border bg-white text-dark shadow-sm">Abrir Pedido</Button>
                                            </LinkContainer>
                                            
                                            {podeGerenciarPedidos && p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && isRetirada && (
                                                isReady ? (
                                                    <Button variant="success" size="sm" className="px-3 shadow-sm" onClick={() => handleAction('pickedup', p.id_pedido)}>
                                                        <i className="bi bi-check-lg"></i>
                                                    </Button>
                                                ) : (
                                                    <Button variant="primary" size="sm" className="px-3 shadow-sm" onClick={() => handleAction('ready', p.id_pedido)}>
                                                        <i className="bi bi-box-seam"></i>
                                                    </Button>
                                                )
                                            )}
                                            
                                            {podeGerenciarPedidos && p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && !isRetirada && (
                                                <Button variant="info" size="sm" className="px-3 text-white shadow-sm" onClick={() => handleAction('deliver', p.id_pedido)}>
                                                    <i className="bi bi-bicycle"></i> 
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <style>{`
                /* ====== CSS PADRONIZADOR MOBILE ====== */
                @media (max-width: 991px) {
                    .mobile-bg-override {
                        background-color: transparent !important;
                    }
                    .mobile-gray-card {
                        background-color: #e6e6e6 !important;
                        border: none !important;
                        border-radius: 20px !important;
                        box-shadow: none !important;
                    }
                    .mobile-text-muted {
                        color: #64748b !important;
                        font-weight: 600 !important;
                    }
                }
            `}</style>
        </>
    );
};