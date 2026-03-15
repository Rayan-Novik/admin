import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Spinner, Form, InputGroup, Button } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

// Formatador de Data e Hora
const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateStr));
};

// ✅ Lógica de Formatação Inteligente (Identifica se precisa de vírgula ou não)
const formatQty = (val, unit) => {
    const num = Number(val);
    if (isNaN(num)) return '0';

    // Lista de unidades que SEMPRE devem ter 3 casas decimais
    const decimalUnits = ['KG', 'G', 'M', 'CM', 'L', 'ML', 'M2', 'M3'];
    
    if (decimalUnits.includes(unit)) {
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });
    }

    // Unidades de contagem (UN, CX, PCT, PAR)
    // Mostra inteiros sem vírgula, e decimais apenas se existirem (ex: 1.5 UN)
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3 
    });
};

const GlobalAuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        fetchGlobalHistory();
    }, []);

    const fetchGlobalHistory = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/produtos/auditoria/global'); 
            setLogs(data);
        } catch (error) {
            toast.error("Erro ao carregar auditoria do sistema.");
        } finally {
            setLoading(false);
        }
    };

    // Filtragem local rápida
    const filteredLogs = logs.filter(log => 
        log.usuario.toLowerCase().includes(filterText.toLowerCase()) ||
        log.produto?.nome.toLowerCase().includes(filterText.toLowerCase()) ||
        (log.tipo_evento === 'DADOS' && log.detalhes.campo.toLowerCase().includes(filterText.toLowerCase()))
    );

    return (
        <Container fluid className="py-4 bg-light min-vh-100">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-0"><i className="bi bi-shield-lock-fill me-2 text-primary"></i>Auditoria Global do Sistema</h2>
                    <p className="text-muted mb-0">Rastreabilidade completa de todas as alterações de produtos e estoque.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-primary" onClick={fetchGlobalHistory}>
                        <i className="bi bi-arrow-clockwise me-2"></i>Atualizar
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white p-3">
                    <InputGroup>
                        <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search"></i></InputGroup.Text>
                        <Form.Control 
                            placeholder="Filtrar por usuário, produto ou campo..." 
                            className="border-start-0 bg-light"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </InputGroup>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover striped className="mb-0 align-middle table-sm" style={{ fontSize: '0.9rem' }}>
                                <thead className="bg-dark text-white">
                                    <tr>
                                        <th className="ps-3 py-3">Data / Hora</th>
                                        <th className="py-3">Usuário Responsável</th>
                                        <th className="py-3">Produto Afetado</th>
                                        <th className="py-3">Tipo de Ação</th>
                                        <th className="py-3">Detalhes Técnicos (De ➝ Para)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => {
                                        // ✅ Obtém a unidade do produto para formatar corretamente
                                        const unit = log.produto?.unidade || 'UN';

                                        return (
                                            <tr key={log.id}>
                                                {/* 1. DATA */}
                                                <td className="ps-3 fw-bold text-secondary font-monospace" style={{width: '150px'}}>
                                                    {formatDate(log.data)}
                                                </td>

                                                {/* 2. USUÁRIO */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{width: 30, height: 30}}>
                                                            <i className="bi bi-person-fill text-muted"></i>
                                                        </div>
                                                        <span className="fw-bold text-dark">{log.usuario}</span>
                                                    </div>
                                                </td>

                                                {/* 3. PRODUTO */}
                                                <td>
                                                    {log.produto ? (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <img 
                                                                src={log.produto.imagem_url || 'https://via.placeholder.com/30'} 
                                                                alt="" 
                                                                className="rounded border"
                                                                style={{width: 35, height: 35, objectFit: 'cover'}} 
                                                            />
                                                            <div className="d-flex flex-column" style={{lineHeight: '1.1'}}>
                                                                <span className="fw-bold text-truncate" style={{maxWidth: '200px'}}>{log.produto.nome}</span>
                                                                <small className="text-muted">ID: {log.produto.id_produto} • <Badge bg="light" text="dark" className="border ms-1">{unit}</Badge></small>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-danger fst-italic">Produto Excluído</span>
                                                    )}
                                                </td>

                                                {/* 4. TIPO */}
                                                <td>
                                                    {log.tipo_evento === 'ESTOQUE' ? (
                                                        <Badge bg={log.detalhes.tipo === 'ENTRADA' ? 'success' : 'danger'} className="text-uppercase">
                                                            <i className={`bi bi-${log.detalhes.tipo === 'ENTRADA' ? 'box-arrow-in-down' : 'box-arrow-up' } me-1`}></i>
                                                            Estoque ({log.detalhes.tipo})
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="info" text="dark" className="text-uppercase border border-info bg-opacity-25">
                                                            <i className="bi bi-pencil-square me-1"></i>
                                                            Edição de Dados
                                                        </Badge>
                                                    )}
                                                </td>

                                                {/* 5. DETALHES (O CORAÇÃO DO LOG) */}
                                                <td className="py-3">
                                                    {log.tipo_evento === 'ESTOQUE' ? (
                                                        // Layout para Estoque
                                                        <div>
                                                            <span className={`fw-bold fs-6 ${log.detalhes.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                                                                {/* ✅ Aplica formatação correta e mostra unidade */}
                                                                {log.detalhes.tipo === 'ENTRADA' ? '+' : '-'}{formatQty(log.detalhes.qtd, unit)} {unit}
                                                            </span>
                                                            <span className="text-muted ms-2 small">
                                                                (Saldo: {formatQty(log.detalhes.saldo, unit)} {unit})
                                                            </span>
                                                            <div className="text-muted small mt-1">
                                                                <i className="bi bi-chat-left-text me-1"></i>
                                                                {log.detalhes.motivo} • <span className="fst-italic">{log.detalhes.origem}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Layout para Dados
                                                        <div>
                                                            <div className="d-flex align-items-center mb-1">
                                                                <span className="badge bg-secondary me-2">{log.detalhes.campo}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2 font-monospace small bg-light p-2 rounded border">
                                                                <span className="text-danger text-decoration-line-through text-truncate" style={{maxWidth: '120px'}}>
                                                                    {log.detalhes.de}
                                                                </span>
                                                                <i className="bi bi-arrow-right text-muted"></i>
                                                                <span className="text-success fw-bold text-truncate" style={{maxWidth: '120px'}}>
                                                                    {log.detalhes.para}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-muted">
                                                Nenhum registro encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="bg-white text-muted small text-end">
                    Mostrando os últimos 100 eventos do sistema.
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default GlobalAuditPage;