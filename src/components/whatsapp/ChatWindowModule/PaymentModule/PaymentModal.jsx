import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert, InputGroup, ButtonGroup, ToggleButton, ListGroup } from 'react-bootstrap';
import api from '../../../../services/api';

const PaymentModal = ({ show, onHide, jid }) => {
    const [modo, setModo] = useState('avulso');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    
    const [tipoEntrega, setTipoEntrega] = useState('retirada');
    const [taxaFrete, setTaxaFrete] = useState('');
    const [fretePadrao, setFretePadrao] = useState('');

    const [produtos, setProdutos] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [loadingProdutos, setLoadingProdutos] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (show) {
            carregarFretePadrao();
        }
    }, [show]);

    useEffect(() => {
        if (modo === 'produtos' && produtos.length === 0) {
            carregarProdutos();
        }
    }, [modo, produtos.length]);

    const carregarFretePadrao = async () => {
        try {
            const { data } = await api.get('/frete/settings');
            if (data && data.CUSTO_FRETE_LOCAL) {
                setFretePadrao(data.CUSTO_FRETE_LOCAL);
            }
        } catch (err) {
            setFretePadrao('');
        }
    };

    const carregarProdutos = async () => {
        setLoadingProdutos(true);
        try {
            const { data } = await api.get('/produtos');
            setProdutos(data || []);
        } catch (err) {
            setError("Não foi possível carregar o estoque.");
        } finally {
            setLoadingProdutos(false);
        }
    };

    const handleValorChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
            value = (Number(value) / 100).toFixed(2);
            setValor(value);
        } else {
            setValor('');
        }
    };

    const handleFreteChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
            value = (Number(value) / 100).toFixed(2);
            setTaxaFrete(value);
        } else {
            setTaxaFrete('');
        }
    };

    const handleTipoEntregaChange = (tipo) => {
        setTipoEntrega(tipo);
        if (tipo === 'entrega') {
            setTaxaFrete(fretePadrao ? Number(fretePadrao).toFixed(2) : '');
        } else {
            setTaxaFrete('');
        }
    };

    const adicionarAoCarrinho = (e) => {
        const produtoId = e.target.value;
        if (!produtoId) return;

        const produtoSelecionado = produtos.find(p => String(p.id_produto) === String(produtoId));
        if (!produtoSelecionado) return;

        setCarrinho(prev => {
            const existe = prev.find(item => String(item.id_produto) === String(produtoId));
            if (existe) {
                return prev.map(item => String(item.id_produto) === String(produtoId) ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...prev, { ...produtoSelecionado, quantidade: 1 }];
        });
        e.target.value = ''; 
    };

    const removerDoCarrinho = (produtoId) => {
        setCarrinho(prev => prev.filter(item => String(item.id_produto) !== String(produtoId)));
    };

    const alterarQuantidade = (produtoId, delta) => {
        setCarrinho(prev => prev.map(item => {
            if (String(item.id_produto) === String(produtoId)) {
                const novaQtd = item.quantidade + delta;
                return { ...item, quantidade: novaQtd > 0 ? novaQtd : 1 };
            }
            return item;
        }));
    };

    const calcularSubtotal = () => {
        if (modo === 'avulso') return Number(valor || 0);
        return carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
    };

    const calcularTotalFinal = () => {
        const subtotal = calcularSubtotal();
        const frete = tipoEntrega === 'entrega' ? Number(taxaFrete || 0) : 0;
        return subtotal + frete;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const subtotal = calcularSubtotal();
        const frete = tipoEntrega === 'entrega' ? Number(taxaFrete || 0) : 0;
        const valorFinal = subtotal + frete;
        
        let descricaoFinal = '';

        if (modo === 'avulso') {
            if (subtotal <= 0) {
                setError('Digite um valor válido maior que zero.');
                return;
            }
            descricaoFinal = descricao;
        } else {
            if (carrinho.length === 0) {
                setError('Adicione pelo menos um produto ao pedido.');
                return;
            }
            descricaoFinal = carrinho.map(item => `${item.quantidade}x ${item.nome}`).join(', ');
        }

        setLoading(true);

        try {
            await api.post('/whatsapp/chats/send-payment', {
                jid: jid,
                valor: valorFinal,
                descricao: descricaoFinal,
                modo: modo,
                itens: modo === 'produtos' ? carrinho : [],
                tipoEntrega: tipoEntrega, 
                taxaFrete: frete
            });

            setSuccess('Cobrança enviada com sucesso!');
            setTimeout(() => handleClose(), 2000);

        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao gerar cobrança.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setValor('');
        setDescricao('');
        setCarrinho([]);
        setModo('avulso');
        setTipoEntrega('retirada');
        setTaxaFrete('');
        setError('');
        setSuccess('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" size={modo === 'produtos' ? 'lg' : 'md'}>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="fs-5 fw-bold text-dark d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle me-2" style={{ width: 40, height: 40 }}>
                        <i className="bi bi-cash-coin text-success"></i>
                    </div>
                    Maquininha Virtual
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                {success && <Alert variant="success" className="py-2 fw-bold small"><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>}

                <ButtonGroup className="w-100 mb-4 shadow-sm">
                    <ToggleButton
                        id="toggle-avulso" type="radio" variant={modo === 'avulso' ? 'success' : 'outline-secondary'}
                        name="radio-modo" value="avulso" checked={modo === 'avulso'}
                        onChange={(e) => setModo(e.currentTarget.value)} disabled={loading || success} className="fw-bold"
                    >
                        <i className="bi bi-currency-dollar me-2"></i> Valor Avulso
                    </ToggleButton>
                    <ToggleButton
                        id="toggle-produtos" type="radio" variant={modo === 'produtos' ? 'success' : 'outline-secondary'}
                        name="radio-modo" value="produtos" checked={modo === 'produtos'}
                        onChange={(e) => setModo(e.currentTarget.value)} disabled={loading || success} className="fw-bold"
                    >
                        <i className="bi bi-box-seam me-2"></i> Produtos
                    </ToggleButton>
                </ButtonGroup>

                <Form onSubmit={handleSubmit}>
                    {modo === 'avulso' ? (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted mb-1">Valor dos Serviços/Itens (R$)</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light fw-bold">R$</InputGroup.Text>
                                    <Form.Control type="text" placeholder="0,00" className="fs-5 fw-bold text-success"
                                        value={valor ? Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                        onChange={handleValorChange} disabled={loading || success} autoFocus
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold text-muted mb-1">Descrição (Opcional)</Form.Label>
                                <Form.Control type="text" placeholder="Ex: Manutenção de Computador" value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)} disabled={loading || success} maxLength={100}
                                />
                            </Form.Group>
                        </>
                    ) : (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted mb-1">Adicionar Produto</Form.Label>
                                {loadingProdutos ? (
                                    <div className="text-muted small"><Spinner animation="border" size="sm" className="me-2"/> Carregando estoque...</div>
                                ) : (
                                    <Form.Select onChange={adicionarAoCarrinho} disabled={loading || success} defaultValue="">
                                        <option value="" disabled>Selecione um produto do estoque...</option>
                                        {produtos.map(p => (
                                            <option key={p.id_produto} value={p.id_produto}>
                                                {p.nome} - {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>

                            <div className="mb-4">
                                <ListGroup variant="flush" className="border rounded">
                                    {carrinho.length === 0 ? (
                                        <ListGroup.Item className="text-center text-muted small py-3 bg-light">Nenhum produto selecionado.</ListGroup.Item>
                                    ) : (
                                        carrinho.map(item => (
                                            <ListGroup.Item key={item.id_produto} className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{item.nome}</div>
                                                    <div className="text-muted small">{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <ButtonGroup size="sm">
                                                        <Button variant="outline-secondary" onClick={() => alterarQuantidade(item.id_produto, -1)} disabled={loading || success}>-</Button>
                                                        <Button variant="light" disabled className="fw-bold text-dark px-3">{item.quantidade}</Button>
                                                        <Button variant="outline-secondary" onClick={() => alterarQuantidade(item.id_produto, 1)} disabled={loading || success}>+</Button>
                                                    </ButtonGroup>
                                                    <Button variant="link" className="text-danger p-0 ms-2 shadow-none" onClick={() => removerDoCarrinho(item.id_produto)} disabled={loading || success}><i className="bi bi-trash"></i></Button>
                                                </div>
                                            </ListGroup.Item>
                                        ))
                                    )}
                                </ListGroup>
                            </div>
                        </>
                    )}

                    <hr />

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted mb-2">Forma de Obtenção</Form.Label>
                        <div className="d-flex gap-4">
                            <Form.Check 
                                type="radio" label="Retirada na Loja" name="tipoEntrega" id="entrega-retirada"
                                checked={tipoEntrega === 'retirada'} disabled={loading || success}
                                onChange={() => handleTipoEntregaChange('retirada')}
                            />
                            <Form.Check 
                                type="radio" label="Entrega ao Cliente" name="tipoEntrega" id="entrega-delivery"
                                checked={tipoEntrega === 'entrega'} disabled={loading || success}
                                onChange={() => handleTipoEntregaChange('entrega')}
                            />
                        </div>
                    </Form.Group>

                    {tipoEntrega === 'entrega' && (
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted mb-1">Taxa de Entrega (R$)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light">R$</InputGroup.Text>
                                <Form.Control 
                                    type="text" placeholder="0,00" disabled={loading || success}
                                    value={taxaFrete ? Number(taxaFrete).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                    onChange={handleFreteChange}
                                />
                            </InputGroup>
                        </Form.Group>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-success bg-opacity-10 rounded">
                        <span className="fw-bold text-success">Total a Cobrar:</span>
                        <span className="fs-4 fw-bold text-success">
                            {calcularTotalFinal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>

                    <Button variant="success" type="submit" className="w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center" disabled={loading || success || (modo === 'produtos' && carrinho.length === 0)}>
                        {loading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Gerando Pix...</> : success ? 'Enviado!' : <><i className="bi bi-send-fill me-2"></i> Enviar Cobrança</>}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default PaymentModal;