import React, { useState, useEffect } from 'react';
import { Spinner, Badge, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Receipt, CheckCircle, CreditCard, Banknote, Smartphone, BellRing } from 'lucide-react';
import api from '../../services/api';

export default function CaixaComandas({ onVendaSuccess }) {
    const [comandas, setComandas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comandaReceber, setComandaReceber] = useState(null);
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [processando, setProcessando] = useState(false);

    const carregarComandas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/comandas');
            
            // Ordena colocando as comandas com status FECHANDO primeiro
            const comandasOrdenadas = data.sort((a, b) => {
                if (a.status_comanda === 'FECHANDO' && b.status_comanda !== 'FECHANDO') return -1;
                if (a.status_comanda !== 'FECHANDO' && b.status_comanda === 'FECHANDO') return 1;
                return 0;
            });
            
            setComandas(comandasOrdenadas);
        } catch (error) {
            toast.error('Erro ao carregar comandas no caixa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarComandas();
        // Atualiza automaticamente a tela do caixa a cada 10 segundos
        const interval = setInterval(carregarComandas, 10000); 
        return () => clearInterval(interval);
    }, []);

    const handleConfirmarPagamento = async () => {
        if (!comandaReceber) return;
        setProcessando(true);
        try {
            await api.post(`/comandas/${comandaReceber.id_pedido}/fechar`, {
                metodo_pagamento: metodoPagamento
            });
            toast.success(`Comanda da Mesa ${comandaReceber.codigo_comanda} fechada com sucesso!`);
            setComandaReceber(null);
            carregarComandas();
            if (onVendaSuccess) onVendaSuccess(); // Atualiza o saldo principal do PDV
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao fechar pagamento da comanda.');
        } finally {
            setProcessando(false);
        }
    };

    if (loading && comandas.length === 0) {
        return <div className="h-100 d-flex justify-content-center align-items-center"><Spinner animation="border" variant="primary" /></div>;
    }

    return (
        <div className="h-100 d-flex flex-column bg-white rounded-4 shadow-sm border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Receipt size={24} className="text-primary" />
                    Comandas do Salão
                </h4>
                <Button variant="light" size="sm" onClick={carregarComandas} className="border fw-bold">Atualizar Tela</Button>
            </div>

            <div className="flex-grow-1 overflow-auto pe-2">
                {comandas.length === 0 ? (
                    <div className="text-center text-secondary mt-5 pt-5">
                        <Receipt size={48} className="opacity-25 mb-3" />
                        <h5>Nenhuma comanda ativa no momento.</h5>
                    </div>
                ) : (
                    <div className="row g-3">
                        {comandas.map(comanda => {
                            const pedindoConta = comanda.status_comanda === 'FECHANDO';
                            
                            return (
                                <div className="col-12 col-md-6 col-xl-4" key={comanda.id_pedido}>
                                    <div className={`p-3 rounded-4 border-2 border transition-all ${pedindoConta ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light border-light-subtle'}`}>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h3 className="fw-bold mb-0 text-dark">Mesa {comanda.codigo_comanda}</h3>
                                                <span className="small text-secondary fw-bold">Pedido #{comanda.id_pedido}</span>
                                            </div>
                                            {pedindoConta && (
                                                <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1 px-2 py-1 pulse-animation">
                                                    <BellRing size={12} /> Pedindo Conta
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <span className="d-block small text-secondary fw-semibold text-uppercase">Total Consumido</span>
                                            <span className="fs-3 fw-black text-primary">R$ {Number(comanda.preco_total).toFixed(2)}</span>
                                        </div>

                                        <Button 
                                            variant={pedindoConta ? "warning" : "outline-primary"} 
                                            className="w-100 fw-bold rounded-pill"
                                            onClick={() => setComandaReceber(comanda)}
                                        >
                                            Receber Pagamento
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL DE PAGAMENTO DA COMANDA */}
            <Modal show={!!comandaReceber} onHide={() => !processando && setComandaReceber(null)} centered>
                <Modal.Header closeButton className="bg-light border-bottom-0">
                    <Modal.Title className="fw-bold">Pagamento: Mesa {comandaReceber?.codigo_comanda}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <div className="text-center mb-4">
                        <span className="d-block text-secondary fw-bold text-uppercase">Valor a Receber</span>
                        <h1 className="display-4 fw-black text-success">R$ {Number(comandaReceber?.preco_total || 0).toFixed(2)}</h1>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold text-secondary text-uppercase small">Forma de Pagamento</Form.Label>
                        <div className="d-grid gap-2">
                            <Button 
                                variant={metodoPagamento === 'DINHEIRO' ? 'primary' : 'outline-secondary'} 
                                className="d-flex align-items-center justify-content-start gap-3 p-3 fw-bold rounded-3 text-start"
                                onClick={() => setMetodoPagamento('DINHEIRO')}
                            >
                                <Banknote size={24} /> Dinheiro em Espécie
                            </Button>
                            <Button 
                                variant={metodoPagamento === 'CARTAO_CREDITO' ? 'primary' : 'outline-secondary'} 
                                className="d-flex align-items-center justify-content-start gap-3 p-3 fw-bold rounded-3 text-start"
                                onClick={() => setMetodoPagamento('CARTAO_CREDITO')}
                            >
                                <CreditCard size={24} /> Cartão de Crédito / Débito
                            </Button>
                            <Button 
                                variant={metodoPagamento === 'PIX' ? 'primary' : 'outline-secondary'} 
                                className="d-flex align-items-center justify-content-start gap-3 p-3 fw-bold rounded-3 text-start"
                                onClick={() => setMetodoPagamento('PIX')}
                            >
                                <Smartphone size={24} /> Pix (Conferido)
                            </Button>
                        </div>
                    </Form.Group>

                    <Button 
                        variant="success" 
                        size="lg" 
                        className="w-100 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 py-3"
                        onClick={handleConfirmarPagamento}
                        disabled={processando}
                    >
                        {processando ? <Spinner size="sm" /> : <><CheckCircle size={24} /> Confirmar Recebimento</>}
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
}