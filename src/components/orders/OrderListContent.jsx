import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, OverlayTrigger, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // 🟢 AQUI ESTÁ O IMPORT CORRETO!
import { motion } from 'framer-motion';

// Nossos Componentes Universais de UI
import { SquareButton, GreenSquareButton } from '../ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../ui/listagem/FlatList';

// --- COMPONENTE DE CRONÔMETRO (Totalmente Limpo, apenas Classes) ---
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

    // Removemos todo o CSS inline e deixamos a cargo das classes nativas
    return (
        <motion.div 
            animate={isLate ? { opacity: [1, 0.5, 1] } : {}}
            transition={isLate ? { duration: 1, repeat: Infinity } : {}}
            className={`d-inline-flex align-items-center fw-bold px-2 py-1 rounded-pill mt-1 small text-uppercase bg-opacity-10 ${isLate ? 'bg-danger text-danger' : 'bg-warning text-warning'}`}
        >
            <i className={`bi ${isLate ? 'bi-exclamation-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
            {isLate ? 'Atrasado: ' : 'Expira em: '} {timeLeft}
        </motion.div>
    );
};

// ==============================================================
// 🟢 COMPONENTE UNIVERSAL DE LISTAGEM
// ==============================================================
export const OrderListContent = ({ 
    items, podeGerenciarPedidos, formatCurrency, renderOrigemBadge, 
    renderBadgeLogistica, checkActionable, handleAction, copyDriverLink 
}) => {
    
    return (
        <FlatListContainer 
            loading={false} 
            empty={items.length === 0} 
            emptyMessage="Nenhum pedido encontrado com os filtros atuais." 
            emptyIcon="bi-receipt"
        >
            {/* 🟢 CABEÇALHO DESKTOP (Grid Inteligente do Bootstrap: col-lg-*) */}
            <FlatListHeader>
                <div className="col-lg-2 ps-2">Pedido</div>
                <div className="col-lg-3">Cliente</div>
                <div className="col-lg-2">Total</div>
                <div className="col-lg-3">Status & Logística</div>
                <div className="col-lg-2 text-end pe-2">Ações</div>
            </FlatListHeader>

            {/* 🟢 CORPO DA LISTA */}
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
                        animate={{ opacity: 1, y: 0 }}
                        className="w-100"
                    >
                        <FlatListItem className="py-3">
                            <div className="row w-100 m-0 align-items-center">

                                {/* COLUNA 1: PEDIDO & ORIGEM */}
                                <div className="col-12 col-lg-2 p-0 mb-3 mb-lg-0">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="fw-bold fs-6 text-dark">#{p.id_pedido}</span>
                                        {renderOrigemBadge(p)}
                                    </div>
                                    <small className="fw-medium text-secondary">
                                        {new Date(p.data_pedido).toLocaleDateString('pt-BR')} às {new Date(p.data_pedido).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>

                                {/* COLUNA 2: CLIENTE */}
                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0">
                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Cliente:</span>
                                    <span className="fw-bold text-dark text-truncate d-inline-block align-bottom w-100">
                                        {p.nome_completo}
                                    </span>
                                </div>

                                {/* COLUNA 3: VALOR TOTAL E PAGAMENTO */}
                                <div className="col-6 col-lg-2 p-0 mb-3 mb-lg-0">
                                    <div className="fw-bold text-success fs-6">{formatCurrency(p.preco_total)}</div>
                                    <div className="text-uppercase fw-bold text-secondary small mt-1 text-truncate">
                                        <i className="bi bi-credit-card me-1"></i> {p.metodo_pagamento || 'N/A'}
                                    </div>
                                </div>

                                {/* COLUNA 4: STATUS (PAGAMENTO + LOGÍSTICA) */}
                                <div className="col-6 col-lg-3 p-0 mb-3 mb-lg-0 d-flex flex-column gap-1 align-items-start">
                                    <div className="d-flex gap-2 flex-wrap">

                                        {/* Badge Pagamento */}
                                        {p.status_pagamento === 'PAGO' ? (
                                            <Badge bg="success" className="px-2 py-1 fw-bold bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">PAGO</Badge>
                                        ) : p.metodo_pagamento?.toUpperCase().includes('OFFLINE') ? (
                                            <Badge bg="info" className="px-2 py-1 fw-bold bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill">Na Entrega</Badge>
                                        ) : (
                                            <Badge bg={p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} className={`px-2 py-1 fw-bold bg-opacity-10 border border-opacity-25 text-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} border-${p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} rounded-pill`}>
                                                {p.status_pagamento}
                                            </Badge>
                                        )}

                                        {/* Badge Entrega / Rota */}
                                        {isOutForDelivery && !isDelivered ? (
                                            <Badge bg="primary" className="fw-bold px-2 py-1 bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill"><i className="bi bi-bicycle"></i> Em Rota</Badge>
                                        ) : (
                                            <Badge bg={isDelivered ? 'success' : 'secondary'} className={`fw-bold px-2 py-1 bg-opacity-10 border border-opacity-25 text-${isDelivered ? 'success' : 'secondary'} border-${isDelivered ? 'success' : 'secondary'} rounded-pill`}>
                                                {p.status_entrega || 'Pendente'}
                                            </Badge>
                                        )}

                                        {/* Badge Metodo Logistica */}
                                        {renderBadgeLogistica(p)}
                                    </div>

                                    {/* Cronômetro */}
                                    {(p.origem === 'ecommerce' || p.origem === 'pdv') && isActionable && !isReady && !isDelivered && !isOutForDelivery && (
                                        <PreparationTimer orderDate={p.data_pedido} />
                                    )}

                                    {/* PIN Seguro */}
                                    {isOutForDelivery && !isDelivered && p.delivery_pin && (
                                        <div className="mt-1 small fw-bold text-secondary">
                                            PIN Cliente: <span className="text-danger bg-danger bg-opacity-10 px-2 py-1 rounded ms-1">{p.delivery_pin}</span>
                                        </div>
                                    )}
                                </div>

                                {/* COLUNA 5: AÇÕES */}
                                <div className="col-12 col-lg-2 p-0 mt-3 mt-lg-0 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">

                                    {/* Ação: Copiar Link do Motoboy */}
                                    {isOutForDelivery && !isDelivered && p.delivery_pin && (
                                        <OverlayTrigger overlay={<Tooltip>Copiar Link do Motoboy</Tooltip>}>
                                            <Button variant="link" className="text-primary p-0 text-decoration-none shadow-none" onClick={() => copyDriverLink(p.driver_token)}>
                                                <i className="bi bi-link-45deg fs-4"></i>
                                            </Button>
                                        </OverlayTrigger>
                                    )}

                                    {/* Ação Principal: Ver Detalhes */}
                                    <OverlayTrigger overlay={<Tooltip>Ver Detalhes do Pedido</Tooltip>}>
                                        <SquareButton as={Link} to={p.link_detalhe || `/admin/order/${p.id_pedido}`}>
                                            <i className="bi bi-eye"></i>
                                        </SquareButton>
                                    </OverlayTrigger>

                                    {/* Ações Mercado Livre */}
                                    {p.origem === 'mercadolivre' && (
                                        <OverlayTrigger overlay={<Tooltip>Ver no Mercado Livre</Tooltip>}>
                                            <SquareButton as="a" href={p.link_externo} target="_blank" color="#F59E0B">
                                                <i className="bi bi-box-arrow-up-right"></i>
                                            </SquareButton>
                                        </OverlayTrigger>
                                    )}

                                    {/* Ações de Gestão Logística */}
                                    {podeGerenciarPedidos && p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && (
                                        isRetirada ? (
                                            isReady ? (
                                                <OverlayTrigger overlay={<Tooltip>Confirmar Retirada</Tooltip>}>
                                                    <GreenSquareButton onClick={() => handleAction('pickedup', p.id_pedido)}>
                                                        <i className="bi bi-check-lg fs-5"></i>
                                                    </GreenSquareButton>
                                                </OverlayTrigger>
                                            ) : (
                                                <OverlayTrigger overlay={<Tooltip>Separar Pedido (Pronto)</Tooltip>}>
                                                    <SquareButton onClick={() => handleAction('ready', p.id_pedido)}>
                                                        <i className="bi bi-box-seam"></i>
                                                    </SquareButton>
                                                </OverlayTrigger>
                                            )
                                        ) : (
                                            <OverlayTrigger overlay={<Tooltip>Despachar com Entregador</Tooltip>}>
                                                <SquareButton color="#0dcaf0" onClick={() => handleAction('deliver', p.id_pedido)}>
                                                    <i className="bi bi-bicycle"></i>
                                                </SquareButton>
                                            </OverlayTrigger>
                                        )
                                    )}
                                </div>

                            </div>
                        </FlatListItem>
                    </motion.div>
                );
            })}
        </FlatListContainer>
    );
};