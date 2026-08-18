import React, { useState, useEffect } from 'react';
import { Spinner, Modal, Button, OverlayTrigger, Tooltip, Table, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PaymentMethodsChart = ({ dateRange }) => {
    const [rawData, setRawData] = useState([]); 
    const [groupedData, setGroupedData] = useState([]); 
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // Estados do Modal (Popup)
    const [showModal, setShowModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [modalTransactions, setModalTransactions] = useState([]); // Guarda a lista de compras
    const [loadingModal, setLoadingModal] = useState(false); // Loading exclusivo do modal

    // 🟢 Função para determinar a qual GRUPO (Tipo) pertence o pagamento
    const getGroupName = (name) => {
        const upper = (name || '').toUpperCase();
        if (upper.includes('CREDIT') || upper.includes('CRÉDITO') || upper.includes('CREDITO')) return 'Cartão de Crédito';
        if (upper.includes('DEBIT') || upper.includes('DÉBITO') || upper.includes('DEBITO')) return 'Cartão de Débito';
        if (upper.includes('PIX')) return 'Pix';
        if (upper.includes('BOLETO')) return 'Boleto';
        if (upper.includes('CASH') || upper.includes('DINHEIRO')) return 'Dinheiro';
        return 'Outros';
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.startDate || !dateRange?.endDate) return;
            setLoading(true);
            try {
                const res = await api.get(`/dashboard/charts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                
                const methods = res.data.paymentChartData || [];
                setRawData(methods); 
                
                const groups = {};
                let sumTotal = 0;

                methods.forEach(item => {
                    const groupName = getGroupName(item.name);
                    if (!groups[groupName]) groups[groupName] = 0;
                    groups[groupName] += item.value;
                    sumTotal += item.value;
                });

                const groupedArray = Object.keys(groups).map(key => ({
                    name: key,
                    value: groups[key]
                }));

                groupedArray.sort((a, b) => b.value - a.value);

                setGroupedData(groupedArray);
                setTotal(sumTotal);

            } catch (err) {
                console.error("Erro Pagamentos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const getIconInfo = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('credito')) return { image: '/images/credito.png', color: '#f97316' }; 
        if (lower.includes('debito')) return { image: '/images/debito.png', color: '#3b82f6' };  
        if (lower.includes('pix')) return { image: '/images/pix.png', color: '#a855f7' };        
        if (lower.includes('boleto')) return { image: '/images/boleto.png', color: '#eab308' };  
        if (lower.includes('dinheiro')) return { image: '/images/dinheiro.png', color: '#22c55e' }; 
        
        return { image: '/images/dinheiro.png', color: '#06b6d4' }; 
    };

    // 🟢 ABRE O MODAL E BUSCA A LISTA DE COMPRAS REAIS DAQUELE MÉTODO
    const handleOpenDetails = async (groupName) => {
        setSelectedGroup(groupName);
        setShowModal(true);
        setLoadingModal(true);
        setModalTransactions([]);

        try {
            const queryParams = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: `${dateRange.endDate}T23:59:59`
            }).toString();

            // Puxa o extrato financeiro (o mesmo da auditoria)
            const response = await api.get(`/admin/financial/transactions?${queryParams}`);
            const history = Array.isArray(response.data.history) ? response.data.history : (Array.isArray(response.data) ? response.data : []);

            // Filtra os pedidos para mostrar SÓ os que baterem com o método clicado (Ex: Só os de PIX)
            const filtered = history.filter(tx => {
                const method = tx.pedidos?.metodo_pagamento || tx.gateway_provider || '';
                return getGroupName(method) === groupName;
            });

            setModalTransactions(filtered);
        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
            toast.error("Não foi possível carregar a lista de pedidos.");
        } finally {
            setLoadingModal(false);
        }
    };

    const modalTotal = modalTransactions.reduce((acc, curr) => acc + Number(curr.valor_liquido || curr.valor_bruto), 0);

    return (
        <>
            <div className="clean-card mb-4 p-4">
                <div className="section-title mb-4 justify-content-between">
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#000' }}>
                        Métodos de pagamentos
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '150px' }}>
                        <Spinner animation="border" variant="secondary" size="sm" />
                    </div>
                ) : (
                    <>
                        {/* Barra de progresso com Tooltip no Hover */}
                        <div className="d-flex w-100 rounded-pill overflow-hidden mb-4" style={{ height: '24px', backgroundColor: 'var(--border-color, #d1d1d1)' }}>
                            {groupedData.map((item, idx) => {
                                const percent = total > 0 ? (item.value / total) * 100 : 0;
                                const { color } = getIconInfo(item.name);
                                
                                return (
                                    <OverlayTrigger
                                        key={idx}
                                        placement="top"
                                        overlay={<Tooltip>{item.name}: {formatCurrency(item.value)}</Tooltip>}
                                    >
                                        <div 
                                            style={{ width: `${percent}%`, backgroundColor: color, borderRight: '2px solid var(--bg-sidebar)' }}
                                            className="cursor-pointer"
                                            onClick={() => handleOpenDetails(item.name)}
                                        ></div>
                                    </OverlayTrigger>
                                );
                            })}
                        </div>

                        {/* Lista de métodos agrupada */}
                        <div className="d-flex flex-column">
                            {groupedData.length > 0 ? groupedData.map((item, index) => {
                                const { image } = getIconInfo(item.name);
                                return (
                                    <div 
                                        key={index} 
                                        className="d-flex justify-content-between align-items-center py-2 hover-effect cursor-pointer rounded px-2" 
                                        onClick={() => handleOpenDetails(item.name)}
                                        title={`Ver pedidos pagos com ${item.name}`}
                                    >
                                        <div className="d-flex align-items-center" style={{ fontSize: '11px', color: '#000', fontWeight: '800' }}>
                                            <img 
                                                src={image} 
                                                alt={item.name} 
                                                className="me-2" 
                                                style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
                                            />
                                            {item.name}
                                        </div>
                                        <div className="fw-bold" style={{ fontSize: '11px', color: '#000' }}>
                                            {formatCurrency(item.value)}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-muted small py-3">Sem pagamentos no período.</div>
                            )}

                            {/* Total Footer */}
                            <div className="d-flex justify-content-between align-items-center py-3 mt-4 px-2">
                                <div className="d-flex align-items-center" style={{ fontSize: '11px', color: '#000', fontWeight: '800' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759', marginRight: '6px' }}></span>
                                    Total
                                </div>
                                <div className="fw-bold" style={{ fontSize: '11px', color: '#000' }}>
                                    {formatCurrency(total)}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 🟢 POPUP (MODAL) COM A LISTA DE COMPRAS E OS ITENS */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" contentClassName="modal-dark-fix border-0 shadow-lg rounded-4">
                <Modal.Header closeButton className="border-bottom bg-light rounded-top-4" style={{ borderColor: 'var(--border-color)' }}>
                    <Modal.Title className="fs-5 fw-bold d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                        <img 
                            src={getIconInfo(selectedGroup).image} 
                            alt={selectedGroup} 
                            className="me-2" 
                            style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                        />
                        Vendas pagas via {selectedGroup}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ backgroundColor: 'var(--bg-sidebar)', maxHeight: '65vh', overflowY: 'auto' }}>
                    {loadingModal ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <div className="mt-2 text-muted small">Buscando pedidos...</div>
                        </div>
                    ) : modalTransactions.length > 0 ? (
                        <Table hover responsive className="align-middle mb-0 m-0">
                            <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                <tr>
                                    <th className="text-muted small fw-bold ps-4 text-uppercase">Data</th>
                                    <th className="text-muted small fw-bold text-uppercase">Pedido</th>
                                    <th className="text-muted small fw-bold text-uppercase">Cliente</th>
                                    <th className="text-muted small fw-bold text-uppercase">Itens Comprados</th>
                                    <th className="text-muted small fw-bold text-uppercase">Gateway</th>
                                    <th className="text-end text-muted small fw-bold pe-4 text-uppercase">Líquido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalTransactions.map((tx) => (
                                    <tr key={tx.id_transacao}>
                                        <td className="ps-4">
                                            <span className="fw-bold d-block text-nowrap" style={{ color: 'var(--text-primary)' }}>{new Date(tx.data_criacao).toLocaleDateString('pt-BR')}</span>
                                            <small className="text-muted text-nowrap">{new Date(tx.data_criacao).toLocaleTimeString('pt-BR')}</small>
                                        </td>
                                        <td>
                                            <Badge bg="secondary" className="bg-opacity-10 text-secondary border">#{tx.id_pedido}</Badge>
                                        </td>
                                        <td>
                                            <span className="fw-medium text-nowrap" style={{ color: 'var(--text-primary)' }}>{tx.usuarios?.nome_completo || 'Cliente Balcão'}</span>
                                        </td>
                                        
                                        {/* 🟢 NOVA COLUNA: EXIBIÇÃO DOS ITENS DO PEDIDO */}
                                        <td>
                                            {tx.pedidos?.pedido_items && tx.pedidos.pedido_items.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small">
                                                    {tx.pedidos.pedido_items.map((item, idx) => (
                                                        <li key={idx} className="text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minWidth: '150px' }} title={item.nome}>
                                                            <span className="fw-bold text-dark">{item.quantidade}x</span> {item.nome}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-muted small fst-italic">Sem itens detalhados</span>
                                            )}
                                        </td>
                                        
                                        <td>
                                            <Badge bg={tx.gateway_provider === 'PDV' ? 'warning' : 'info'} text="dark" className="border shadow-sm text-nowrap">
                                                {tx.gateway_provider}
                                            </Badge>
                                        </td>
                                        <td className="text-end pe-4 fw-bold text-success text-nowrap">
                                            {formatCurrency(tx.valor_liquido || tx.valor_bruto)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                            Nenhuma compra encontrada para este método no período.
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light border-top rounded-bottom-4 d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="text-muted small">
                        Total de <strong>{modalTransactions.length}</strong> vendas encontradas
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                            <span className="d-block small text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Total Líquido ({selectedGroup})</span>
                            <span className="fs-5 fw-bold text-primary">{formatCurrency(modalTotal)}</span>
                        </div>
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4 fw-bold border-0 bg-secondary bg-opacity-10 text-secondary">
                            Fechar
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            <style>{`
                .hover-effect {
                    transition: background-color 0.2s;
                }
                .hover-effect:hover {
                    background-color: var(--bg-hover);
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                body.dark-mode .modal-dark-fix {
                    background-color: var(--bg-sidebar);
                    border-color: var(--border-color);
                }
                body.dark-mode .btn-close {
                    filter: invert(1);
                }
            `}</style>
        </>
    );
};

export default PaymentMethodsChart;