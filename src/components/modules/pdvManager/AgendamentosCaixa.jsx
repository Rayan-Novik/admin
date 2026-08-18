import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { CalendarClock, DollarSign, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AgendamentosCaixa = ({ onVendaSuccess }) => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal de Pagamento
    const [showModal, setShowModal] = useState(false);
    const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [valorRecebido, setValorRecebido] = useState('');
    const [processando, setProcessando] = useState(false);

    const fetchAgendamentos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/agendamentos/admin');
            
            // Filtra para mostrar apenas agendamentos de hoje em diante e que NÃO estejam cancelados
            const hoje = new Date();
            hoje.setHours(0,0,0,0);
            
            const filtrados = data.filter(ag => {
                const dataAg = new Date(ag.data_inicio);
                return dataAg >= hoje && ag.status !== 'CANCELADO';
            });

            setAgendamentos(filtrados);
        } catch (error) {
            toast.error("Erro ao carregar agendamentos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgendamentos();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const abrirModalCobranca = (ag) => {
        setAgendamentoSelecionado(ag);
        setValorRecebido('');
        setShowModal(true);
    };

    const handleCobrarRestante = async () => {
        if (!agendamentoSelecionado?.id_pedido) return toast.error("Este agendamento não tem pedido vinculado.");
        
        setProcessando(true);
        try {
            const res = await api.post(`/pdv/receber-restante/${agendamentoSelecionado.id_pedido}`, {
                metodo_pagamento: metodoPagamento,
                valor_recebido: valorRecebido ? Number(valorRecebido) : undefined
            });

            toast.success("Pagamento finalizado com sucesso!");
            
            // Dispara a impressão na maquininha se necessário
            try {
                await api.post(`/pdv/imprimir/termica/${agendamentoSelecionado.id_pedido}`);
            } catch (e) {}

            setShowModal(false);
            fetchAgendamentos(); // Recarrega a lista
            if (onVendaSuccess) onVendaSuccess(); // Atualiza o saldo do caixa no PDV
            
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao receber o pagamento.");
        } finally {
            setProcessando(false);
        }
    };

    const getStatusPagamentoBadge = (status) => {
        if (status === 'PAGO') return <Badge bg="success">100% PAGO</Badge>;
        if (status === 'PARCIALMENTE_PAGO') return <Badge bg="warning" text="dark">SINAL PAGO</Badge>;
        return <Badge bg="danger">PENDENTE</Badge>;
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="h-100 bg-white rounded-4 border shadow-sm d-flex flex-column" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                    <CalendarClock className="me-2 text-primary" size={20} /> 
                    Agendamentos do Dia
                </h5>
                <Button variant="outline-secondary" size="sm" onClick={fetchAgendamentos}>
                    Atualizar
                </Button>
            </div>
            
            <div className="flex-grow-1 overflow-auto p-0">
                <Table hover responsive className="align-middle mb-0 text-nowrap">
                    <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                        <tr>
                            <th className="text-muted small text-uppercase ps-4">Horário</th>
                            <th className="text-muted small text-uppercase">Cliente</th>
                            <th className="text-muted small text-uppercase">Profissional</th>
                            <th className="text-muted small text-uppercase">Pagamento</th>
                            <th className="text-muted small text-uppercase">Valor Total</th>
                            <th className="text-center text-muted small text-uppercase pe-4">Ação de Caixa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agendamentos.length > 0 ? agendamentos.map((ag) => {
                            const isTotalmentePago = ag.pagamento?.status === 'PAGO';
                            
                            return (
                                <tr key={ag.id_agendamento}>
                                    <td className="ps-4">
                                        <div className="fw-bold text-dark">{new Date(ag.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="small text-muted">{new Date(ag.data_inicio).toLocaleDateString('pt-BR')}</div>
                                    </td>
                                    <td>
                                        <div className="fw-semibold text-dark">{ag.cliente.nome}</div>
                                        <div className="small text-muted">{ag.cliente.telefone || 'Sem telefone'}</div>
                                    </td>
                                    <td><Badge bg="light" text="dark" className="border">{ag.profissional}</Badge></td>
                                    <td>{getStatusPagamentoBadge(ag.pagamento?.status)}</td>
                                    <td className="fw-bold text-primary">{formatCurrency(ag.pagamento?.total)}</td>
                                    <td className="text-center pe-4">
                                        {isTotalmentePago ? (
                                            <Button variant="light" size="sm" className="rounded-pill fw-bold text-success border border-success opacity-75" disabled>
                                                <CheckCircle2 size={16} className="me-1" /> OK
                                            </Button>
                                        ) : (
                                            <Button variant="success" size="sm" className="rounded-pill fw-bold px-3 shadow-sm" onClick={() => abrirModalCobranca(ag)}>
                                                <DollarSign size={16} className="me-1" /> Receber Restante
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="6" className="text-center py-5 text-muted">Nenhum agendamento para hoje.</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* MODAL DE COBRANÇA */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
                <Modal.Header closeButton className="bg-light border-bottom-0 rounded-top-4">
                    <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center">
                        <DollarSign className="me-2 text-success" /> Receber no Balcão
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="text-center mb-4">
                        <h4 className="fw-black text-dark mb-1">{agendamentoSelecionado?.cliente?.nome}</h4>
                        <p className="text-muted small">Valor total do serviço: {formatCurrency(agendamentoSelecionado?.pagamento?.total)}</p>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted text-uppercase">Como o cliente vai pagar o restante?</Form.Label>
                        <Form.Select 
                            size="lg" 
                            className="bg-light border-0 shadow-none fw-bold text-dark" 
                            value={metodoPagamento} 
                            onChange={(e) => setMetodoPagamento(e.target.value)}
                        >
                            <option value="DINHEIRO">💵 Dinheiro</option>
                            <option value="PIX">📱 PIX (Maquininha/Loja)</option>
                            <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                            <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                        </Form.Select>
                    </Form.Group>

                    {metodoPagamento === 'DINHEIRO' && (
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Valor Entregue pelo Cliente (Para Troco)</Form.Label>
                            <Form.Control 
                                type="number" 
                                size="lg" 
                                className="bg-light border-0 shadow-none fw-bold" 
                                placeholder="Ex: 50.00" 
                                value={valorRecebido}
                                onChange={(e) => setValorRecebido(e.target.value)}
                            />
                        </Form.Group>
                    )}
                    
                    <Button 
                        variant="success" 
                        size="lg" 
                        className="w-100 rounded-pill fw-bold shadow-sm mt-2" 
                        onClick={handleCobrarRestante}
                        disabled={processando}
                    >
                        {processando ? <Spinner size="sm" /> : 'Confirmar Pagamento Final'}
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AgendamentosCaixa;