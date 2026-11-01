import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import {
    Monitor,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    ShieldCheck,
    Hash,
    RefreshCw,
    AlertCircle,
    Info,
    ShoppingCart,
    Key,
    Copy,
    Check,
    Laptop,
    Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function CaixasManagerPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [caixasData, setCaixasData] = useState({
        caixas: [],
        total_caixas: 0,
        limite_caixas: 1,
        pode_adicionar: true
    });

    // Modais
    const [modalNovoCaixa, setModalNovoCaixa] = useState(false);
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [novoCaixaForm, setNovoCaixaForm] = useState({
        nome: '',
        numero_caixa: '',
        serie_numero: '',
        ultimo_numero: 0
    });

    const [modalEditarNumero, setModalEditarNumero] = useState(false);
    const [caixaEditando, setCaixaEditando] = useState(null);
    const [novoUltimoNumero, setNovoUltimoNumero] = useState('');
    const [salvandoNumero, setSalvandoNumero] = useState(false);
    const [regerandoTokenId, setRegerandoTokenId] = useState(null);

    // Modal Disparar Carga aos Caixas
    const [modalCargaOpen, setModalCargaOpen] = useState(false);
    const [caixasSelecionados, setCaixasSelecionados] = useState([]);
    const [disparandoCarga, setDisparandoCarga] = useState(false);
    const [opcoesCarga, setOpcoesCarga] = useState({
        produtos: true,
        categorias: true,
        formas_pagamento: true,
        fiscal: true
    });

    const handleAbrirModalCarga = () => {
        const ids = (caixasData.caixas || []).filter(c => c.ativo).map(c => c.id);
        setCaixasSelecionados(ids);
        setModalCargaOpen(true);
    };

    const toggleSelecionarTodos = () => {
        if (caixasSelecionados.length === (caixasData.caixas || []).length) {
            setCaixasSelecionados([]);
        } else {
            setCaixasSelecionados((caixasData.caixas || []).map(c => c.id));
        }
    };

    const toggleCaixaSelecionado = (id) => {
        setCaixasSelecionados(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleDispararCarga = async (e) => {
        e.preventDefault();
        if (caixasSelecionados.length === 0) {
            toast.warning("Selecione ao menos um caixa para receber a carga.");
            return;
        }

        setDisparandoCarga(true);
        try {
            const { data } = await api.post('/pdv/caixas/disparar-carga', {
                caixas_ids: caixasSelecionados,
                opcoes: opcoesCarga
            });
            toast.success(`🚀 ${data.message} (${data.total_produtos} produtos, ${data.total_categorias} categorias)`, { autoClose: 6000 });
            setModalCargaOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao disparar carga de dados.');
        } finally {
            setDisparandoCarga(false);
        }
    };

    const carregarCaixas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/pdv/caixas');
            setCaixasData(data);
        } catch (error) {
            console.error('Erro ao carregar caixas:', error);
            toast.error(error.response?.data?.message || 'Erro ao carregar lista de caixas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarCaixas();
    }, []);

    const handleCopiarToken = (token) => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        toast.info(`Token ${token} copiado para a área de transferência!`);
    };

    const handleRegerarToken = async (caixa) => {
        if (!window.confirm(`Deseja regerar o Token do ${caixa.nome}?\n\n⚠️ Atenção: Ao regerar o token, o computador anteriormente vinculado será desconectado e você precisará digitar o novo token no instalador do PDV Desktop.`)) {
            return;
        }

        setRegerandoTokenId(caixa.id);
        try {
            const { data } = await api.post(`/pdv/caixas/${caixa.id}/regerar-token`);
            toast.success(data.message || 'Novo token gerado com sucesso!');
            if (data.token_conexao) {
                navigator.clipboard.writeText(data.token_conexao);
                toast.info(`Novo token ${data.token_conexao} copiado para a área de transferência!`);
            }
            carregarCaixas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao regerar token do caixa.');
        } finally {
            setRegerandoTokenId(null);
        }
    };

    const handleAbrirNovoCaixa = () => {
        const proxNumero = (caixasData.caixas?.length || 0) + 1;
        setNovoCaixaForm({
            nome: `Caixa ${String(proxNumero).padStart(2, '0')}`,
            numero_caixa: proxNumero,
            serie_numero: proxNumero,
            ultimo_numero: 0
        });
        setModalNovoCaixa(true);
    };

    const handleSalvarNovoCaixa = async (e) => {
        e.preventDefault();
        setSalvandoCaixa(true);
        try {
            const { data } = await api.post('/pdv/caixas', {
                nome: novoCaixaForm.nome,
                numero_caixa: Number(novoCaixaForm.numero_caixa),
                serie_numero: Number(novoCaixaForm.serie_numero),
                ultimo_numero: Number(novoCaixaForm.ultimo_numero) || 0
            });
            const tokenCriado = data.caixa?.token_conexao;
            if (tokenCriado) {
                navigator.clipboard.writeText(tokenCriado);
                toast.success(`Caixa cadastrado com sucesso! Token gerado: ${tokenCriado} (copiado para a área de transferência).`, { autoClose: 6000 });
            } else {
                toast.success('Novo Caixa cadastrado com sucesso!');
            }
            setModalNovoCaixa(false);
            carregarCaixas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao cadastrar caixa.');
        } finally {
            setSalvandoCaixa(false);
        }
    };

    const handleAbrirEditarNumero = (caixa) => {
        setCaixaEditando(caixa);
        setNovoUltimoNumero(String(caixa.ultimo_numero ?? 0));
        setModalEditarNumero(true);
    };

    const handleSalvarEditarNumero = async (e) => {
        e.preventDefault();
        if (!caixaEditando) return;
        setSalvandoNumero(true);
        try {
            await api.put(`/pdv/caixas/${caixaEditando.id}`, {
                ultimo_numero: Number(novoUltimoNumero)
            });
            toast.success(`Sequência do ${caixaEditando.nome} atualizada para ${novoUltimoNumero}!`);
            setModalEditarNumero(false);
            carregarCaixas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao atualizar sequência fiscal.');
        } finally {
            setSalvandoNumero(false);
        }
    };

    const handleExcluirCaixa = async (caixa) => {
        if (!window.confirm(`Tem certeza que deseja excluir o ${caixa.nome}?\nEssa ação não pode ser desfeita.`)) {
            return;
        }
        try {
            await api.delete(`/pdv/caixas/${caixa.id}`);
            toast.success('Caixa excluído com sucesso!');
            carregarCaixas();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao excluir caixa.');
        }
    };

    return (
        <div className="container-fluid mt-4 pb-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Monitor size={26} className="text-primary" />
                        Gerenciamento de Caixas & Terminais PDV
                    </h4>
                    <p className="text-muted small mb-0">
                        Cadastre os caixas da loja e vincule cada terminal à sua própria Série de NFC-e (Modelo 65) com numeração sequencial independente.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={carregarCaixas}
                        className="btn btn-light border rounded-pill px-3 py-2 small fw-semibold d-flex align-items-center gap-1 shadow-xs"
                    >
                        <RefreshCw size={15} /> Atualizar
                    </button>
                    <button
                        type="button"
                        onClick={handleAbrirModalCarga}
                        className="btn btn-outline-success rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                        title="Enviar carga de dados do servidor para os caixas selecionados"
                    >
                        <Send size={15} /> Sincronizar / Enviar Carga
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/pdv')}
                        className="btn btn-outline-primary rounded-pill px-3 py-2 small fw-semibold d-flex align-items-center gap-1 shadow-xs"
                    >
                        <ShoppingCart size={15} /> Ir para o PDV
                    </button>
                    <button
                        type="button"
                        onClick={handleAbrirNovoCaixa}
                        disabled={!caixasData.pode_adicionar}
                        className="btn btn-primary rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-2 shadow-sm"
                    >
                        <Plus size={17} /> Cadastrar Novo Caixa
                    </button>
                </div>
            </div>

            {/* Cards de Resumo e Limite do Plano */}
            <Row className="g-3 mb-4">
                <Col md={4}>
                    <div className="p-3 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
                        <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary">
                            <Monitor size={28} />
                        </div>
                        <div>
                            <span className="text-muted small fw-bold d-block text-uppercase">Caixas Cadastrados</span>
                            <h4 className="fw-bold mb-0 text-dark">{caixasData.total_caixas}</h4>
                        </div>
                    </div>
                </Col>

                <Col md={4}>
                    <div className="p-3 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
                        <div className="p-3 rounded-3 bg-success bg-opacity-10 text-success">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <span className="text-muted small fw-bold d-block text-uppercase">Limite do Seu Plano</span>
                            <div className="d-flex align-items-center gap-2">
                                <h4 className="fw-bold mb-0 text-dark">
                                    {caixasData.total_caixas} / {caixasData.limite_caixas}
                                </h4>
                                <span className="small text-muted">caixas permitidos</span>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col md={4}>
                    <div className="p-3 bg-white border rounded-4 shadow-sm h-100 d-flex align-items-center gap-3">
                        <div className="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">
                            <Hash size={28} />
                        </div>
                        <div>
                            <span className="text-muted small fw-bold d-block text-uppercase">Modelo Fiscal PDV</span>
                            <h5 className="fw-bold mb-0 text-dark">Modelo 65 (NFC-e)</h5>
                            <small className="text-muted">1 Série exclusiva por Caixa</small>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Alerta de Limite do Plano */}
            {!caixasData.pode_adicionar && (
                <div
                    className="p-3 rounded-4 border mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', borderColor: 'rgba(234, 179, 8, 0.3)' }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <AlertCircle size={22} className="text-warning flex-shrink-0" />
                        <span className="small fw-semibold text-dark">
                            Você atingiu o limite de <strong>{caixasData.limite_caixas} caixa(s)</strong> do plano da sua loja. Para cadastrar mais caixas simultâneos, faça upgrade do plano SaaS.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/saas/planos')}
                        className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold"
                    >
                        Ver Planos
                    </button>
                </div>
            )}

            {/* Tabela de Caixas */}
            <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
                <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                    <h6 className="fw-bold mb-0 text-dark">Terminais de Caixa e Numerações NFC-e</h6>
                    <small className="text-muted">
                        Cada caixa físico deve ser configurado com seu número correspondente
                    </small>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted small mt-2 mb-0">Carregando caixas cadastrados...</p>
                    </div>
                ) : caixasData.caixas.length === 0 ? (
                    <div className="text-center py-5">
                        <Monitor size={48} className="text-muted opacity-50 mb-3" />
                        <h6 className="fw-bold text-dark">Nenhum caixa cadastrado ainda</h6>
                        <p className="text-muted small mb-3">
                            Clique no botão acima para cadastrar seu primeiro terminal de caixa.
                        </p>
                        <button
                            type="button"
                            onClick={handleAbrirNovoCaixa}
                            className="btn btn-primary rounded-pill px-4 py-2 small fw-bold"
                        >
                            <Plus size={16} className="me-1" /> Cadastrar Caixa 01
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-4">Terminal / Caixa</th>
                                    <th>Token de Conexão (.EXE)</th>
                                    <th>Nº do Caixa</th>
                                    <th>Modelo Documento</th>
                                    <th>Série NFC-e</th>
                                    <th>Último Nº Emitido</th>
                                    <th>Próximo Nº SEFAZ</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caixasData.caixas.map((c) => (
                                    <tr key={c.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                                                    <Monitor size={18} />
                                                </div>
                                                <div>
                                                    <span className="fw-bold text-dark d-block" style={{ fontSize: '13.5px' }}>
                                                        {c.nome}
                                                    </span>
                                                    <small className="text-muted" style={{ fontSize: '11px' }}>
                                                        ID: {c.id.substring(0, 8)}...
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <code className="bg-light px-2.5 py-1 rounded-3 border fw-bold text-primary font-monospace shadow-xs" style={{ fontSize: '12.5px', letterSpacing: '0.5px' }}>
                                                    {c.token_conexao || 'Gerando...'}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopiarToken(c.token_conexao)}
                                                    className="btn btn-sm btn-light border p-1 rounded-circle shadow-xs"
                                                    title="Copiar Token de Conexão"
                                                >
                                                    <Copy size={13} className="text-muted" />
                                                </button>
                                                {c.dispositivo_vinculado ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1" style={{ fontSize: '10px' }} title={`Vinculado ao HWID: ${c.hardware_id}`}>
                                                        <Laptop size={11} /> Pareado
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                                                        Aguardando Instalação
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg="dark" className="rounded-pill px-3 py-2 font-monospace" style={{ fontSize: '12px' }}>
                                                Caixa {String(c.numero_caixa).padStart(2, '0')}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg="info" className="text-white rounded-pill px-2.5 py-1.5" style={{ fontSize: '11px' }}>
                                                Modelo 65 (NFC-e)
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className="fw-bold text-primary font-monospace" style={{ fontSize: '13px' }}>
                                                Série {c.serie_numero || c.serie?.serie || c.numero_caixa}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold font-monospace text-dark" style={{ fontSize: '14px' }}>
                                                    {c.ultimo_numero ?? 0}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAbrirEditarNumero(c)}
                                                    className="btn btn-sm btn-light border p-1 rounded-circle"
                                                    title="Ajustar Sequência de Numeração SEFAZ"
                                                >
                                                    <Edit3 size={13} className="text-muted" />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-success bg-opacity-10 text-success fw-bold font-monospace px-2.5 py-1.5 rounded-pill" style={{ fontSize: '12px' }}>
                                                {c.proximo_numero || (Number(c.ultimo_numero || 0) + 1)}
                                            </span>
                                        </td>
                                        <td>
                                            {c.ativo ? (
                                                <span className="badge bg-success rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                                                    Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex justify-content-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRegerarToken(c)}
                                                    disabled={regerandoTokenId === c.id}
                                                    className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 small text-dark"
                                                    title="Regerar Token e Desvincular Máquina"
                                                >
                                                    {regerandoTokenId === c.id ? (
                                                        <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                                                    ) : (
                                                        <Key size={12} />
                                                    )}
                                                    <span>Regerar Token</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAbrirEditarNumero(c)}
                                                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 small"
                                                    title="Alterar Numeração SEFAZ"
                                                >
                                                    <Hash size={13} /> Numeração
                                                </button>
                                                {caixasData.caixas.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleExcluirCaixa(c)}
                                                        className="btn btn-sm btn-outline-danger rounded-pill p-1.5"
                                                        title="Excluir Caixa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Informações de Ajuda e Boas Práticas SEFAZ */}
            <div className="p-3 bg-white border rounded-4 shadow-sm mt-4 d-flex align-items-start gap-3">
                <Info size={22} className="text-primary flex-shrink-0 mt-1" />
                <div className="small text-muted" style={{ lineHeight: '1.5' }}>
                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '13px' }}>
                        Como funciona o vínculo entre Caixas e Séries da SEFAZ?
                    </h6>
                    Conforme o padrão fiscal nacional da Nota Fiscal de Consumidor Eletrônica (NFC-e Modelo 65), cada ponto de venda (terminal PDV físico) opera com uma série única (ex: <strong>Caixa 1 usa Série 1</strong>, <strong>Caixa 2 usa Série 2</strong>). Dessa forma, se dois caixas emitirem notas fiscais no mesmo segundo, nenhuma numeração se sobrepõe, e cada terminal mantém sua sequência numérica cronológica sem rejeições de duplicidade na SEFAZ.
                </div>
            </div>

            {/* MODAL: CADASTRAR NOVO CAIXA */}
            <Modal
                show={modalNovoCaixa}
                onHide={() => setModalNovoCaixa(false)}
                centered
                contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
            >
                <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                            <Plus size={20} />
                        </div>
                        <h6 className="fw-bold mb-0 text-dark">Cadastrar Novo Terminal de Caixa</h6>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setModalNovoCaixa(false)}></button>
                </div>

                <Form onSubmit={handleSalvarNovoCaixa}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="small fw-bold text-muted mb-1">Nome do Caixa</Form.Label>
                                <Form.Control
                                    required
                                    value={novoCaixaForm.nome}
                                    onChange={e => setNovoCaixaForm({ ...novoCaixaForm, nome: e.target.value })}
                                    placeholder="Ex: Caixa 02 - Salão"
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold text-muted mb-1">Nº do Terminal</Form.Label>
                                <Form.Control
                                    type="number"
                                    required
                                    value={novoCaixaForm.numero_caixa}
                                    onChange={e => setNovoCaixaForm({ ...novoCaixaForm, numero_caixa: e.target.value, serie_numero: e.target.value })}
                                    min="1"
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold text-muted mb-1">Série NFC-e (Mod. 65)</Form.Label>
                                <Form.Control
                                    type="number"
                                    required
                                    value={novoCaixaForm.serie_numero}
                                    onChange={e => setNovoCaixaForm({ ...novoCaixaForm, serie_numero: e.target.value })}
                                    min="1"
                                />
                            </Col>
                            <Col md={12}>
                                <Form.Label className="small fw-bold text-muted mb-1">Último Número Emitido</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={novoCaixaForm.ultimo_numero}
                                    onChange={e => setNovoCaixaForm({ ...novoCaixaForm, ultimo_numero: e.target.value })}
                                    min="0"
                                />
                                <Form.Text className="text-muted small">
                                    Deixe 0 se esta série nunca foi utilizada na SEFAZ. O primeiro cupom emitido será o número 1.
                                </Form.Text>
                            </Col>
                            <Col md={12}>
                                <div className="p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center gap-3">
                                    <div className="p-2 rounded-circle bg-primary bg-opacity-20 text-primary flex-shrink-0">
                                        <Key size={20} />
                                    </div>
                                    <div className="small">
                                        <strong className="text-primary d-block">Geração Automática do Token de Conexão:</strong>
                                        <span className="text-muted">
                                            Um token exclusivo (ex: <code>CX-9A7B-81F2</code>) será gerado automaticamente para você inserir no instalador do <strong>PDV Desktop (.exe)</strong> e sincronizar as vendas.
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <div className="p-3 px-4 border-top bg-light d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-light border rounded-pill px-3 py-2 small fw-bold"
                            onClick={() => setModalNovoCaixa(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={salvandoCaixa}
                            className="btn btn-primary rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-2"
                        >
                            {salvandoCaixa ? <Spinner animation="border" size="sm" /> : <Plus size={16} />}
                            Salvar Caixa
                        </button>
                    </div>
                </Form>
            </Modal>

            {/* MODAL: EDITAR ÚLTIMO NÚMERO EMITIDO */}
            <Modal
                show={modalEditarNumero}
                onHide={() => setModalEditarNumero(false)}
                centered
                contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
            >
                <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                            <Hash size={20} />
                        </div>
                        <h6 className="fw-bold mb-0 text-dark">
                            Ajustar Sequência SEFAZ: {caixaEditando?.nome}
                        </h6>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setModalEditarNumero(false)}></button>
                </div>

                <Form onSubmit={handleSalvarEditarNumero}>
                    <Modal.Body className="p-4">
                        <div
                            className="p-3 rounded-4 border mb-3 small"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                            <strong className="text-danger d-block mb-1">Atenção com a Sequência Fiscal:</strong>
                            A SEFAZ rejeita notas fiscais com números já emitidos ou que pulem numeração sem justificativa (inutilização). Altere este campo apenas se você estiver sincronizando o sistema com numerações emitidas anteriormente em outro software.
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Último Número Emitido na Série {caixaEditando?.serie_numero || caixaEditando?.serie?.serie}</Form.Label>
                            <Form.Control
                                type="number"
                                required
                                value={novoUltimoNumero}
                                onChange={e => setNovoUltimoNumero(e.target.value)}
                                min="0"
                                className="font-monospace fw-bold fs-5"
                            />
                            <Form.Text className="text-muted small">
                                A próxima NFC-e emitida neste caixa será o número: <strong>{Number(novoUltimoNumero || 0) + 1}</strong>
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>

                    <div className="p-3 px-4 border-top bg-light d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-light border rounded-pill px-3 py-2 small fw-bold"
                            onClick={() => setModalEditarNumero(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={salvandoNumero}
                            className="btn btn-primary rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-2"
                        >
                            {salvandoNumero ? <Spinner animation="border" size="sm" /> : <CheckCircle2 size={16} />}
                            Confirmar Alteração
                        </button>
                    </div>
                </Form>
            </Modal>

            {/* MODAL: DISPARAR CARGA DE DADOS PARA OS CAIXAS SELECIONADOS */}
            <Modal
                show={modalCargaOpen}
                onHide={() => setModalCargaOpen(false)}
                centered
                size="lg"
                contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
            >
                <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                            <Send size={20} />
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark">Enviar Lote de Informações aos Caixas PDV</h6>
                            <small className="text-muted">Selecione quais caixas físicos receberão o catálogo e regras fiscais atualizados</small>
                        </div>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setModalCargaOpen(false)}></button>
                </div>

                <Form onSubmit={handleDispararCarga}>
                    <Modal.Body className="p-4">
                        {/* 1. SELEÇÃO DE CAIXAS */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                <span className="small fw-bold text-uppercase text-muted">
                                    1. Caixas Destino ({caixasSelecionados.length} de {(caixasData.caixas || []).length} selecionados)
                                </span>
                                <button
                                    type="button"
                                    onClick={toggleSelecionarTodos}
                                    className="btn btn-link btn-sm p-0 text-decoration-none fw-bold"
                                    style={{ fontSize: '12px' }}
                                >
                                    {caixasSelecionados.length === (caixasData.caixas || []).length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </button>
                            </div>

                            <Row className="g-2">
                                {(caixasData.caixas || []).map(cx => {
                                    const isSelected = caixasSelecionados.includes(cx.id);
                                    return (
                                        <Col md={6} key={cx.id}>
                                            <div
                                                onClick={() => toggleCaixaSelecionado(cx.id)}
                                                className={`p-3 rounded-3 border cursor-pointer transition-all d-flex align-items-center justify-content-between ${
                                                    isSelected
                                                        ? 'bg-primary bg-opacity-10 border-primary shadow-xs'
                                                        : 'bg-light border-secondary border-opacity-25 opacity-75'
                                                }`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="pointer-events-none"
                                                    />
                                                    <div>
                                                        <strong className="text-dark d-block" style={{ fontSize: '13px' }}>{cx.nome}</strong>
                                                        <small className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                                                            {cx.token_conexao || 'Sem Token'}
                                                        </small>
                                                    </div>
                                                </div>
                                                <Badge bg="dark" className="rounded-pill" style={{ fontSize: '10px' }}>
                                                    Série {cx.serie_numero || cx.numero_caixa}
                                                </Badge>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>

                        {/* 2. DADOS DO LOTE */}
                        <div className="mb-3">
                            <span className="small fw-bold text-uppercase text-muted d-block mb-2 pb-1 border-bottom">
                                2. Conteúdo do Lote de Sincronização
                            </span>

                            <div className="d-flex flex-column gap-2 bg-light p-3 rounded-4 border">
                                <Form.Check
                                    type="checkbox"
                                    id="chkProdutos"
                                    label="📦 Catálogo Completo de Produtos (Preços, Códigos de Barras, Unidades e Estoque)"
                                    checked={opcoesCarga.produtos}
                                    onChange={e => setOpcoesCarga({ ...opcoesCarga, produtos: e.target.checked })}
                                    className="fw-semibold small"
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="chkCategorias"
                                    label="📑 Categorias do Cardápio / Loja"
                                    checked={opcoesCarga.categorias}
                                    onChange={e => setOpcoesCarga({ ...opcoesCarga, categorias: e.target.checked })}
                                    className="fw-semibold small"
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="chkFormas"
                                    label="💳 Formas de Pagamento Homologadas SEFAZ (Dinheiro, PIX, Cartão, Vales)"
                                    checked={opcoesCarga.formas_pagamento}
                                    onChange={e => setOpcoesCarga({ ...opcoesCarga, formas_pagamento: e.target.checked })}
                                    className="fw-semibold small"
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="chkFiscal"
                                    label="🏛️ Parâmetros Fiscais da Empresa Emitente e Séries NFC-e"
                                    checked={opcoesCarga.fiscal}
                                    onChange={e => setOpcoesCarga({ ...opcoesCarga, fiscal: e.target.checked })}
                                    className="fw-semibold small"
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-25 small text-muted">
                            <Info size={16} className="text-info me-1" />
                            Ao disparar a carga, os caixas desktop (.exe) selecionados puxarão automaticamente essas informações e atualizarão seus bancos locais <code>config.db</code> sem interromper as vendas em andamento.
                        </div>
                    </Modal.Body>

                    <Modal.Footer className="border-0 bg-light px-4 py-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill px-3 py-2 small fw-semibold"
                            onClick={() => setModalCargaOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={disparandoCarga || caixasSelecionados.length === 0}
                            className="btn btn-success rounded-pill px-4 py-2 small fw-bold d-flex align-items-center gap-2 shadow-sm"
                        >
                            {disparandoCarga ? <Spinner size="sm" /> : <Send size={16} />}
                            Disparar Carga para {caixasSelecionados.length} Caixa(s)
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
