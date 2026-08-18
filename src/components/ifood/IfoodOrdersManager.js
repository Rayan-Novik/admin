import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

const IfoodOrdersManager = ({ statusConnected }) => {
    const [pedidos, setPedidos] = useState([]);
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [mensagemChat, setMensagemChat] = useState('');

    const fetchPedidos = async () => {
        try {
            const res = await api.get('/pedidos?tipo=IFOOD'); 
            setPedidos(res.data || []);
            
            if (pedidoSelecionado) {
                const atualizado = res.data.find(p => p.id_pedido === pedidoSelecionado.id_pedido);
                if (atualizado) setPedidoSelecionado(atualizado);
            }
        } catch (error) {
            console.error("Erro ao buscar pedidos iFood", error);
        }
    };

    useEffect(() => {
        let interval;
        if (statusConnected) {
            fetchPedidos();
            interval = setInterval(fetchPedidos, 10000); // Polling a cada 10s
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [statusConnected]);

    const handleAcaoPedido = async (acao) => {
        if (!pedidoSelecionado) return;
        try {
            await api.post(`/ifood/pedidos/${pedidoSelecionado.id_externo_ifood}/${acao}`);
            toast.success(`Comando '${acao}' enviado com sucesso!`);
            fetchPedidos();
        } catch (error) {
            toast.error(error.response?.data?.message || `Erro ao ${acao} pedido.`);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!mensagemChat.trim() || !pedidoSelecionado) return;
        
        const msgTexto = mensagemChat;
        setMensagemChat('');

        try {
            await api.post(`/ifood/pedidos/${pedidoSelecionado.id_externo_ifood}/mensagem`, { mensagem: msgTexto });
            toast.success('Mensagem enviada ao cliente!');
        } catch (error) {
            toast.error('Erro ao enviar mensagem.');
            setMensagemChat(msgTexto);
        }
    };

    return (
        <Row className="h-100 animate-in fade-in duration-300">
            {/* COLUNA ESQUERDA: LISTA DE PEDIDOS */}
            <Col md={4} className="pe-md-2">
                <Card className="border-0 shadow-sm rounded-4 h-100 ifood-product-card">
                    <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                        <h6 className="fw-bold mb-0 ifood-text-primary">Pedidos em Andamento</h6>
                    </Card.Header>
                    <Card.Body className="p-2 overflow-auto" style={{ maxHeight: '65vh' }}>
                        {pedidos.length === 0 ? (
                            <div className="text-center p-4 ifood-text-secondary">
                                <i className="bi bi-inbox fs-1 mb-2 d-block opacity-50"></i>
                                <small>Nenhum pedido do iFood pendente.</small>
                            </div>
                        ) : (
                            pedidos.map(ped => (
                                <div 
                                    key={ped.id_pedido} 
                                    onClick={() => setPedidoSelecionado(ped)}
                                    className={`p-3 mb-2 rounded-4 cursor-pointer transition-all border ${pedidoSelecionado?.id_pedido === ped.id_pedido ? 'border-danger bg-danger bg-opacity-10' : 'border-light hover-bg-light'}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <strong className="ifood-text-primary">#{ped.display_id || ped.id_pedido}</strong>
                                        <Badge bg={ped.status === 'PEN' ? 'warning' : 'success'} className="rounded-pill">
                                            {ped.status === 'PEN' ? 'Novo' : ped.status}
                                        </Badge>
                                    </div>
                                    <div className="small ifood-text-secondary mb-1">
                                        <i className="bi bi-person-circle me-1"></i> {ped.nome_cliente}
                                    </div>
                                    <div className="fw-bold text-success small">
                                        R$ {Number(ped.valor_total).toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            ))
                        )}
                    </Card.Body>
                </Card>
            </Col>

            {/* COLUNA DIREITA: DETALHES E CHAT */}
            <Col md={8} className="ps-md-2 mt-3 mt-md-0">
                <Card className="border-0 shadow-sm rounded-4 h-100 ifood-product-card d-flex flex-column">
                    {!pedidoSelecionado ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-center ifood-text-secondary opacity-50">
                            <i className="bi bi-chat-dots fs-1 mb-3"></i>
                            <h5>Selecione um pedido</h5>
                            <p>Clique em um pedido na lista para ver os detalhes e falar com o cliente.</p>
                        </div>
                    ) : (
                        <>
                            {/* Cabeçalho do Pedido e Ações */}
                            <Card.Header className="bg-transparent border-bottom p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-1 ifood-text-primary">Pedido #{pedidoSelecionado.display_id || pedidoSelecionado.id_pedido}</h5>
                                    <span className="text-muted small">Cliente: {pedidoSelecionado.nome_cliente}</span>
                                </div>
                                <div className="d-flex gap-2">
                                    {pedidoSelecionado.status === 'PEN' && (
                                        <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm border-0 bg-success" onClick={() => handleAcaoPedido('aceitar')}>
                                            <i className="bi bi-check-circle me-2"></i> Aceitar Pedido
                                        </Button>
                                    )}
                                    {(pedidoSelecionado.status === 'PREPARANDO' || pedidoSelecionado.status === 'ACEITO') && (
                                        <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => handleAcaoPedido('despachar')}>
                                            <i className="bi bi-bicycle me-2"></i> Despachar
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>

                            {/* Área do Chat */}
                            <Card.Body className="p-4 flex-grow-1 overflow-auto bg-light bg-opacity-50" style={{ maxHeight: '45vh' }}>
                                <div className="text-center mb-4">
                                    <Badge bg="secondary" className="bg-opacity-25 text-secondary fw-normal rounded-pill">Chat aberto pelo iFood</Badge>
                                </div>
                                <div className="d-flex justify-content-start mb-3">
                                    <div className="bg-white p-3 rounded-4 shadow-sm border border-light" style={{ maxWidth: '75%', borderBottomLeftRadius: 0 }}>
                                        <div className="small fw-bold text-danger mb-1">{pedidoSelecionado.nome_cliente}</div>
                                        <span className="ifood-text-primary text-sm">Avisos e mensagens do cliente aparecerão aqui.</span>
                                    </div>
                                </div>
                            </Card.Body>

                            {/* Input de Envio de Mensagem */}
                            <Card.Footer className="bg-transparent border-top p-3">
                                <Form onSubmit={handleSendMessage}>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Digite uma mensagem para o cliente..."
                                            className="border-light-subtle rounded-start-pill py-3 px-4 ifood-input-bg shadow-none"
                                            value={mensagemChat}
                                            onChange={(e) => setMensagemChat(e.target.value)}
                                        />
                                        <Button type="submit" variant="danger" className="rounded-end-pill px-4 fw-bold bg-danger border-danger">
                                            Enviar <i className="bi bi-send ms-1"></i>
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </Card.Footer>
                        </>
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default IfoodOrdersManager;