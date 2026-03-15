import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Table, Button, Badge, 
    Form, InputGroup, Modal, Tab, Tabs, Spinner, Alert 
} from 'react-bootstrap';
import { 
    Plus, Search, ArrowUpCircle, ArrowDownCircle, 
    DollarSign, Calendar, CheckCircle, AlertCircle, FileText 
} from 'lucide-react';
import api from '../../services/api'; 

// --- HELPERS ---
const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
};

const formatDateHora = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
};

const getStatusBadge = (status) => {
    const map = {
        'PENDENTE': 'warning',
        'PAGO': 'success',
        'PARCIALMENTE_PAGO': 'info',
        'VENCIDO': 'danger',
        'CANCELADO': 'secondary'
    };
    return <Badge bg={map[status] || 'secondary'}>{status ? status.replace('_', ' ') : 'N/A'}</Badge>;
};

// Helper para calcular dias restantes
const getDaysDiff = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateString);
    target.setMinutes(target.getMinutes() + target.getTimezoneOffset());
    
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export default function FinancialModule() {
    const [activeTab, setActiveTab] = useState('payables'); 
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    
    // Datas padrão (Mês atual)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        startDate: firstDay,
        endDate: lastDay, 
        status: 'TODOS'
    });

    // Estados dos Modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false); 
    
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [noteData, setNoteData] = useState(null); 
    const [loadingNote, setLoadingNote] = useState(false); // ✅ Loading específico para o modal de nota

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get('/admin/financial/dashboard', { 
                params: { startDate: filters.startDate, endDate: filters.endDate } 
            });
            setDashboard(res.data);
        } catch (error) {
            console.error("Erro dashboard:", error);
        }
    }, [filters.startDate, filters.endDate]);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'payables' ? '/admin/financial/payables' : '/admin/financial/receivables';
            const res = await api.get(endpoint, { params: filters });
            
            // Ordenação: Vencidos > Pendentes Próximos > Pagos
            const sortedData = (res.data || []).sort((a, b) => {
                if (a.status === 'PAGO' && b.status !== 'PAGO') return 1;
                if (a.status !== 'PAGO' && b.status === 'PAGO') return -1;
                return new Date(a.data_vencimento) - new Date(b.data_vencimento);
            });
            
            setData(sortedData);
        } catch (error) {
            console.error("Erro lista:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters]);

    useEffect(() => {
        fetchDashboard();
        fetchAccounts();
    }, [fetchDashboard, fetchAccounts]);

    // ✅ Função para abrir o modal e buscar os detalhes (baixas)
    const handleOpenNoteModal = async (conta) => {
        setNoteData(conta); // Define dados básicos primeiro
        setShowNoteModal(true);
        setLoadingNote(true);

        try {
            // Define o endpoint correto baseado na aba (pagar ou receber)
            const type = activeTab === 'payables' ? 'payables' : 'receivables';
            
            // Chama o endpoint de detalhe (que deve incluir as baixas/transações)
            // Se você não tiver um endpoint específico getById, precisará criar ou garantir que o endpoint de lista traga 'baixas'
            // Aqui assumo que vamos tentar buscar pelo ID
            const { data } = await api.get(`/admin/financial/${type}/${conta.id}`);
            
            setNoteData(data); // Atualiza com os dados completos (incluindo baixas)
        } catch (error) {
            console.error("Erro ao buscar detalhes da conta:", error);
            alert("Não foi possível carregar o histórico de pagamentos.");
        } finally {
            setLoadingNote(false);
        }
    };

    // --- MODAL: CRIAR CONTA ---
    const CreateAccountModal = () => {
        const [formData, setFormData] = useState({
            descricao: '', valor_total: '', data_vencimento: new Date().toISOString().split('T')[0],
            parcelas: 1, id_categoria: '', id_fornecedor: '' 
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                if (activeTab === 'receivables') return alert("Criação manual bloqueada para recebíveis.");
                
                const payload = {
                    ...formData,
                    valor_total: parseFloat(formData.valor_total),
                    parcelas: parseInt(formData.parcelas),
                    id_fornecedor: formData.id_fornecedor ? parseInt(formData.id_fornecedor) : null
                };

                await api.post('/admin/financial/payables', payload);
                setShowCreateModal(false);
                fetchAccounts(); fetchDashboard();
            } catch (error) {
                alert("Erro: " + (error.response?.data?.message || error.message));
            }
        };

        return (
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nova Despesa / Conta a Pagar</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control required type="text" placeholder="Ex: Aluguel, Sistema, Luz" onChange={e => setFormData({...formData, descricao: e.target.value})} />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Valor Total (R$)</Form.Label>
                                    <Form.Control required type="number" step="0.01" onChange={e => setFormData({...formData, valor_total: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>1º Vencimento</Form.Label>
                                    <Form.Control required type="date" value={formData.data_vencimento} onChange={e => setFormData({...formData, data_vencimento: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Parcelas</Form.Label>
                                    <Form.Control type="number" min="1" max="60" value={formData.parcelas} onChange={e => setFormData({...formData, parcelas: e.target.value})} />
                                    <Form.Text className="text-muted">Serão criados {formData.parcelas} registros mensais.</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>ID Fornecedor (Opcional)</Form.Label>
                                    <Form.Control type="number" onChange={e => setFormData({...formData, id_fornecedor: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                        <Button variant="danger" type="submit">Gerar Contas</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        );
    };

    // --- MODAL: BAIXAR CONTA ---
    const SettleModal = () => {
        const [baixaData, setBaixaData] = useState({
            valor: 0, data_baixa: new Date().toISOString().split('T')[0],
            forma_pagamento: 'PIX', juros: 0, desconto: 0, observacao: ''
        });

        useEffect(() => {
            if (selectedAccount) setBaixaData(prev => ({ ...prev, valor: selectedAccount.saldo_restante }));
        }, [selectedAccount]);

        const handleBaixa = async (e) => {
            e.preventDefault();
            try {
                const type = activeTab === 'payables' ? 'payables' : 'receivables';
                const action = activeTab === 'payables' ? 'pay' : 'receive';
                const payload = {
                    ...baixaData,
                    valor: parseFloat(baixaData.valor),
                    juros: parseFloat(baixaData.juros),
                    desconto: parseFloat(baixaData.desconto)
                };
                await api.post(`/admin/financial/${type}/${selectedAccount.id}/${action}`, payload);
                setShowSettleModal(false);
                fetchAccounts(); fetchDashboard();
            } catch (error) {
                alert("Erro: " + (error.response?.data?.message || error.message));
            }
        };

        if (!selectedAccount) return null;

        return (
            <Modal show={showSettleModal} onHide={() => setShowSettleModal(false)}>
                <Modal.Header closeButton className={activeTab === 'payables' ? 'bg-danger text-white' : 'bg-success text-white'}>
                    <Modal.Title>
                        {activeTab === 'payables' ? 'Pagar Conta' : 'Receber Conta'} #{selectedAccount.id}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleBaixa}>
                    <Modal.Body>
                        <Alert variant="light" className="mb-3 border">
                            <h5 className="mb-1">{selectedAccount.descricao}</h5>
                            <div className="d-flex justify-content-between text-muted">
                                <span>Vencimento: {formatDate(selectedAccount.data_vencimento)}</span>
                                <span>Saldo: <strong>{formatCurrency(selectedAccount.saldo_restante)}</strong></span>
                            </div>
                        </Alert>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Valor Pago</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>R$</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" required value={baixaData.valor} onChange={e => setBaixaData({...baixaData, valor: e.target.value})} />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data Pagamento</Form.Label>
                                    <Form.Control type="date" required value={baixaData.data_baixa} onChange={e => setBaixaData({...baixaData, data_baixa: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Meio de Pagto</Form.Label>
                                    <Form.Select value={baixaData.forma_pagamento} onChange={e => setBaixaData({...baixaData, forma_pagamento: e.target.value})}>
                                        <option value="PIX">Pix</option>
                                        <option value="DINHEIRO">Dinheiro</option>
                                        <option value="BOLETO">Boleto</option>
                                        <option value="CARTAO_CREDITO">Cartão Crédito</option>
                                        <option value="TRANSFERENCIA">Transferência</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Juros / Multa</Form.Label>
                                    <Form.Control type="number" step="0.01" value={baixaData.juros} onChange={e => setBaixaData({...baixaData, juros: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Observação</Form.Label>
                            <Form.Control as="textarea" rows={2} value={baixaData.observacao} onChange={e => setBaixaData({...baixaData, observacao: e.target.value})} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowSettleModal(false)}>Cancelar</Button>
                        <Button variant={activeTab === 'payables' ? 'danger' : 'success'} type="submit">Confirmar Baixa</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        );
    };

    // --- MODAL: VER NOTA (DETALHES) ---
    const NoteModal = () => {
        if (!noteData) return null;

        // "baixas" (recebimentos) ou "pagamentos" (despesas)
        // O backend geralmente retorna isso dentro do objeto da conta se usarmos um 'include'
        const transacoes = noteData.baixas || noteData.pagamentos || [];

        return (
            <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalhes Financeiros</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingNote ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Carregando histórico...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-3 bg-light rounded border">
                                <h5 className="fw-bold">{noteData.descricao}</h5>
                                <Row className="mt-2 text-muted small">
                                    <Col>Vencimento: <strong>{formatDate(noteData.data_vencimento)}</strong></Col>
                                    <Col>Valor Original: <strong>{formatCurrency(noteData.valor_total)}</strong></Col>
                                    <Col>Saldo: <strong>{formatCurrency(noteData.saldo_restante)}</strong></Col>
                                </Row>
                            </div>

                            <h6 className="fw-bold mb-3"><i className="bi bi-receipt"></i> Histórico de Pagamentos</h6>
                            
                            {transacoes.length === 0 ? (
                                <Alert variant="warning">Nenhum pagamento registrado para esta conta ainda.</Alert>
                            ) : (
                                <Table striped bordered hover size="sm" responsive className="small">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Data</th>
                                            <th>Forma</th>
                                            <th className="text-end">Valor Bruto</th>
                                            <th className="text-end">Taxas/Desc</th>
                                            <th className="text-end">Líquido (Real)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transacoes.map((tx, idx) => (
                                            <tr key={idx}>
                                                <td>{formatDateHora(tx.data_baixa)}</td>
                                                <td>{tx.forma_pagamento}</td>
                                                {/* Valor Bruto = O que o cliente pagou (valor) */}
                                                <td className="text-end">{formatCurrency(tx.valor)}</td>
                                                {/* Taxas = O que foi descontado (desconto) */}
                                                <td className="text-end text-danger">{tx.desconto > 0 ? `-${formatCurrency(tx.desconto)}` : '-'}</td>
                                                {/* Líquido = O que entrou (valor_total_movimento) */}
                                                <td className="text-end fw-bold text-success">{formatCurrency(tx.valor_total_movimento)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}

                            {/* Exibe observações detalhadas se houver */}
                            {transacoes.map((tx, idx) => tx.observacao && (
                                <Alert key={idx} variant="secondary" className="small mt-2">
                                    <strong>Nota {idx + 1}:</strong> {tx.observacao}
                                </Alert>
                            ))}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Fechar</Button>
                </Modal.Footer>
            </Modal>
        );
    };

    return (
        <Container fluid className="py-4 bg-light min-vh-100">
            {/* TOPO */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-0">Gestão Financeira</h3>
                    <small className="text-muted">Fluxo de Caixa e Contas</small>
                </div>
                {activeTab === 'payables' && (
                    <Button variant="danger" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-2 shadow-sm">
                        <Plus size={20} /> Nova Despesa
                    </Button>
                )}
            </div>

            {/* DASHBOARD RESUMO */}
            {dashboard && dashboard.resumo && (
                <Row className="g-3 mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm border-start border-4 border-success">
                            <Card.Body>
                                <small className="text-muted fw-bold">ENTRADAS</small>
                                <h4 className="fw-bold text-success mb-0">{formatCurrency(dashboard.resumo.total_entradas)}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm border-start border-4 border-danger">
                            <Card.Body>
                                <small className="text-muted fw-bold">SAÍDAS</small>
                                <h4 className="fw-bold text-danger mb-0">{formatCurrency(dashboard.resumo.total_saidas)}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className={`border-0 shadow-sm border-start border-4 ${dashboard.resumo.saldo_periodo >= 0 ? 'border-primary' : 'border-warning'}`}>
                            <Card.Body>
                                <small className="text-muted fw-bold">SALDO LÍQUIDO</small>
                                <h4 className={`fw-bold mb-0 ${dashboard.resumo.saldo_periodo >= 0 ? 'text-primary' : 'text-warning'}`}>{formatCurrency(dashboard.resumo.saldo_periodo)}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-danger text-white">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <small className="text-white-50 fw-bold">ATRASADAS</small>
                                        <h4 className="fw-bold mb-0">{formatCurrency(dashboard.resumo.divida_atrasada)}</h4>
                                    </div>
                                    <AlertCircle size={28} className="text-white opacity-50" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* FILTROS E TABELA */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white pt-3 pb-0 border-bottom-0">
                    <Row className="g-2 align-items-center mb-3">
                        <Col md={8}>
                            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-bottom-0">
                                <Tab eventKey="payables" title={<span className={activeTab === 'payables' ? 'text-danger fw-bold' : 'text-muted'}>🔴 Contas a Pagar</span>} />
                                <Tab eventKey="receivables" title={<span className={activeTab === 'receivables' ? 'text-success fw-bold' : 'text-muted'}>🟢 Contas a Receber</span>} />
                            </Tabs>
                        </Col>
                        <Col md={4} className="d-flex gap-2 justify-content-end pb-2">
                            <Form.Control type="date" size="sm" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} style={{maxWidth: '130px'}} />
                            <span className="text-muted align-self-center">até</span>
                            <Form.Control type="date" size="sm" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} style={{maxWidth: '130px'}} />
                            <Button size="sm" variant="outline-secondary" onClick={() => {fetchDashboard(); fetchAccounts();}}><Search size={16}/></Button>
                        </Col>
                    </Row>
                </Card.Header>

                <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4">Descrição</th>
                                <th>Vencimento</th>
                                <th>Parcela</th>
                                <th>Valor</th>
                                <th>Saldo</th>
                                <th className="text-center">Status</th>
                                <th className="text-end pe-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-5 text-muted">Nenhum registro encontrado para este período.</td></tr>
                            ) : (
                                data.map((conta) => {
                                    const daysDiff = getDaysDiff(conta.data_vencimento);
                                    const isLate = daysDiff < 0 && conta.status !== 'PAGO';
                                    const isToday = daysDiff === 0 && conta.status !== 'PAGO';

                                    return (
                                        <tr key={conta.id} className={isLate ? 'table-danger' : ''}>
                                            <td className="ps-4 fw-bold text-dark">
                                                {conta.descricao}
                                                {conta.fornecedor && <div className="small text-muted fw-normal">{conta.fornecedor.nome_loja}</div>}
                                                {/* Nome do Cliente se for receber */}
                                                {activeTab === 'receivables' && conta.usuarios && <div className="small text-muted fw-normal">{conta.usuarios.nome_completo}</div>}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={isLate ? 'text-danger fw-bold' : (isToday ? 'text-warning fw-bold' : '')}>
                                                        {formatDate(conta.data_vencimento)}
                                                    </span>
                                                    {isLate && <Badge bg="danger">-{Math.abs(daysDiff)}d</Badge>}
                                                    {isToday && <Badge bg="warning" text="dark">Hoje</Badge>}
                                                </div>
                                            </td>
                                            <td>
                                                {conta.parcela_total > 1 ? (
                                                    <Badge bg="secondary">{conta.parcela_numero}/{conta.parcela_total}</Badge>
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td>{formatCurrency(conta.valor_total)}</td>
                                            <td className="fw-bold">{formatCurrency(conta.saldo_restante)}</td>
                                            <td className="text-center">{getStatusBadge(conta.status)}</td>
                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    {/* ✅ BOTÃO VER NOTA (Chama a função de busca) */}
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        title="Ver Detalhes e Taxas"
                                                        onClick={() => handleOpenNoteModal(conta)}
                                                    >
                                                        <FileText size={16} />
                                                    </Button>

                                                    {/* BOTÃO BAIXAR (SÓ SE NÃO ESTIVER PAGO) */}
                                                    {conta.status !== 'PAGO' && conta.status !== 'CANCELADO' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant={activeTab === 'payables' ? 'outline-danger' : 'outline-success'}
                                                            onClick={() => { setSelectedAccount(conta); setShowSettleModal(true); }}
                                                        >
                                                            <CheckCircle size={16} className="me-1" />
                                                            {activeTab === 'payables' ? 'Pagar' : 'Receber'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card>

            <CreateAccountModal />
            <SettleModal />
            <NoteModal />
        </Container>
    );
}