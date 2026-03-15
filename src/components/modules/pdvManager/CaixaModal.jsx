import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Table, Badge } from 'react-bootstrap';
import { FaCashRegister, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaCalculator } from 'react-icons/fa';
import { abrirCaixa, conferirCaixa, fecharCaixa } from './pdvService';

export default function CaixaModal({ isOpen, mode, onClose, onSuccess }) {
    // Estados para Abertura
    const [saldoInicial, setSaldoInicial] = useState('');
    
    // Estados para Fechamento
    const [valores, setValores] = useState({ DINHEIRO: '', PIX: '', CREDITO: '', DEBITO: '' });
    const [conferencia, setConferencia] = useState(null); // Resultado da conferência
    const [observacoes, setObservacoes] = useState('');
    const [step, setStep] = useState(1); // 1 = Digitar, 2 = Conferir
    const [loading, setLoading] = useState(false);

    const handleReset = () => {
        setSaldoInicial('');
        setValores({ DINHEIRO: '', PIX: '', CREDITO: '', DEBITO: '' });
        setConferencia(null);
        setObservacoes('');
        setStep(1);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Ação de Abrir Caixa (Simples)
    const handleAbrir = async () => {
        try {
            setLoading(true);
            await abrirCaixa(saldoInicial || 0, observacoes);
            handleClose();
            onSuccess();
        } catch (error) {
            alert('Erro ao abrir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Passo 1 do Fechamento: Enviar valores para o backend conferir
    const handleConferir = async () => {
        try {
            setLoading(true);
            const resultado = await conferirCaixa(valores);
            setConferencia(resultado);
            setStep(2); // Vai para a tela de resultado
        } catch (error) {
            alert('Erro ao conferir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Passo 2 do Fechamento: Confirmar mesmo com divergências
    const handleFechar = async () => {
        // Se houver divergência, obriga a ter observação
        if (conferencia?.divergencia_total !== 0 && observacoes.trim().length < 5) {
            alert("⚠️ Atenção: Como há divergência de valores (Quebra ou Sobra), você DEVE escrever uma justificativa nas observações.");
            return;
        }

        try {
            setLoading(true);
            await fecharCaixa(valores, observacoes);
            handleClose();
            onSuccess();
            alert("Caixa fechado com sucesso!");
        } catch (error) {
            alert('Erro ao fechar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onHide={handleClose} centered backdrop="static" size={mode === 'fechar' && step === 2 ? 'lg' : 'md'}>
            <Modal.Header closeButton className={mode === 'abrir' ? 'bg-primary text-white' : 'bg-danger text-white'}>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FaCashRegister /> {mode === 'abrir' ? 'Abrir Novo Caixa' : 'Fechar Caixa Atual'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* === MODO ABRIR CAIXA === */}
                {mode === 'abrir' && (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Saldo Inicial (Fundo de Troco)</Form.Label>
                            <div className="input-group">
                                <span className="input-group-text">R$</span>
                                <Form.Control 
                                    type="number" 
                                    autoFocus
                                    placeholder="0.00" 
                                    value={saldoInicial} 
                                    onChange={e => setSaldoInicial(e.target.value)} 
                                    className="fs-4 fw-bold text-primary"
                                />
                            </div>
                            <Form.Text className="text-muted">
                                Conte o dinheiro físico na gaveta antes de começar.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Observações (Opcional)</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={2} 
                                value={observacoes} 
                                onChange={e => setObservacoes(e.target.value)} 
                            />
                        </Form.Group>
                    </Form>
                )}

                {/* === MODO FECHAR CAIXA: PASSO 1 (DIGITAÇÃO) === */}
                {mode === 'fechar' && step === 1 && (
                    <div>
                        <Alert variant="warning" className="small">
                            <FaExclamationTriangle className="me-2"/>
                            Por favor, conte os valores <b>fisicamente</b> antes de digitar. O sistema irá comparar com as vendas registradas.
                        </Alert>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-bold text-success">💵 Dinheiro (Gaveta)</Form.Label>
                                    <Form.Control type="number" placeholder="0.00" value={valores.DINHEIRO} onChange={e => setValores({...valores, DINHEIRO: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-bold text-info">💠 Pix (App Banco)</Form.Label>
                                    <Form.Control type="number" placeholder="0.00" value={valores.PIX} onChange={e => setValores({...valores, PIX: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-bold text-primary">💳 Cartão Crédito</Form.Label>
                                    <Form.Control type="number" placeholder="0.00" value={valores.CREDITO} onChange={e => setValores({...valores, CREDITO: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-bold text-secondary">💳 Cartão Débito</Form.Label>
                                    <Form.Control type="number" placeholder="0.00" value={valores.DEBITO} onChange={e => setValores({...valores, DEBITO: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* === MODO FECHAR CAIXA: PASSO 2 (CONFERÊNCIA) === */}
                {mode === 'fechar' && step === 2 && conferencia && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 fw-bold">Resultado da Conferência</h5>
                            {conferencia.divergencia_total === 0 ? (
                                <Badge bg="success" className="p-2"><FaCheckCircle/> CAIXA BATIDO</Badge>
                            ) : (
                                <Badge bg="danger" className="p-2"><FaTimesCircle/> DIVERGÊNCIA ENCONTRADA</Badge>
                            )}
                        </div>

                        <Table bordered size="sm" className="text-center align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>Método</th>
                                    <th>Sistema (Esperado)</th>
                                    <th>Você Informou</th>
                                    <th>Diferença</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conferencia.conferencia.map((item) => (
                                    <tr key={item.metodo} className={item.diferenca !== 0 ? 'bg-danger bg-opacity-10' : ''}>
                                        <td className="fw-bold text-start ps-3">{item.metodo}</td>
                                        <td className="text-muted">R$ {item.esperado.toFixed(2)}</td>
                                        <td className="fw-bold">R$ {item.informado.toFixed(2)}</td>
                                        <td className={item.diferenca === 0 ? 'text-success' : (item.diferenca > 0 ? 'text-primary fw-bold' : 'text-danger fw-bold')}>
                                            {item.diferenca > 0 ? `+ R$ ${item.diferenca.toFixed(2)}` : `R$ ${item.diferenca.toFixed(2)}`}
                                            {item.diferenca !== 0 && (
                                                <div style={{fontSize: '0.65rem'}}>{item.diferenca > 0 ? '(SOBRA)' : '(QUEBRA)'}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="fw-bold">
                                <tr>
                                    <td colSpan="3" className="text-end pe-3">Saldo Final Total:</td>
                                    <td className={conferencia.divergencia_total < 0 ? 'text-danger' : 'text-success'}>
                                        R$ {conferencia.divergencia_total.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </Table>

                        {conferencia.divergencia_total !== 0 && (
                            <Form.Group className="mt-3">
                                <Form.Label className="text-danger fw-bold">Justificativa da Divergência (Obrigatório):</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={2} 
                                    placeholder="Ex: Dei troco errado; Cliente pagou a mais; Esqueci de lançar sangria..."
                                    value={observacoes}
                                    onChange={e => setObservacoes(e.target.value)}
                                    className="border-danger"
                                    autoFocus
                                />
                            </Form.Group>
                        )}
                        
                        {conferencia.divergencia_total === 0 && (
                            <Form.Group className="mt-3">
                                <Form.Label>Observações Finais (Opcional):</Form.Label>
                                <Form.Control as="textarea" rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                            </Form.Group>
                        )}
                    </div>
                )}

            </Modal.Body>

            <Modal.Footer>
                {mode === 'abrir' && (
                    <Button variant="primary" className="w-100 py-2 fw-bold" onClick={handleAbrir} disabled={loading}>
                        {loading ? 'Abrindo...' : 'CONFIRMAR ABERTURA'}
                    </Button>
                )}

                {mode === 'fechar' && step === 1 && (
                    <Button variant="primary" className="w-100 py-2 fw-bold" onClick={handleConferir} disabled={loading}>
                        <FaCalculator className="me-2"/> CONFERIR VALORES
                    </Button>
                )}

                {mode === 'fechar' && step === 2 && (
                    <div className="d-flex w-100 gap-2">
                        <Button variant="outline-secondary" className="w-50" onClick={() => setStep(1)}>
                            Voltar e Corrigir
                        </Button>
                        <Button 
                            variant={conferencia?.divergencia_total !== 0 ? "danger" : "success"} 
                            className="w-50 fw-bold" 
                            onClick={handleFechar} 
                            disabled={loading}
                        >
                            {conferencia?.divergencia_total !== 0 ? 'FECHAR COM DIVERGÊNCIA' : 'CONFIRMAR FECHAMENTO'}
                        </Button>
                    </div>
                )}
            </Modal.Footer>
        </Modal>
    );
}