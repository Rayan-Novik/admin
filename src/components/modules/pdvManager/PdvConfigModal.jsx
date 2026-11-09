import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Row, Col, Form, Badge, Spinner, Button, Table } from 'react-bootstrap';
import {
    Settings,
    ShieldCheck,
    Printer,
    Keyboard,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    Volume2,
    Monitor,
    Plus,
    Edit3,
    Check,
    Lock,
    Save,
    MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { getPdvConfig, savePdvConfig } from './pdvService';
import { CtaButton, LightButton } from '../../ui/buttons/CtaButton';
import { usePermission } from '../../../hooks/usePermission';

export default function PdvConfigModal({ isOpen, onClose, initialTab = 'caixas', onConfigChange, onSave }) {
    const navigate = useNavigate();
    const { can, user } = usePermission();

    // Permissão de alteração fiscal
    const podeAlternarModoFiscal = Boolean(
        user?.is_dono ||
        user?.isAdmin ||
        user?.role === 'ADMIN' ||
        can('FISCAL_MANAGE') ||
        can('PDV_ALTERAR_MODO_FISCAL')
    );

    const [activeTab, setActiveTab] = useState(() => (initialTab ? String(initialTab).toLowerCase() : 'caixas'));
    const [config, setConfig] = useState(getPdvConfig());
    const [loadingFiscalInfo, setLoadingFiscalInfo] = useState(false);
    const [cenarios, setCenarios] = useState([]);
    const [empresaFiscal, setEmpresaFiscal] = useState(null);
    const [seriesFiscais, setSeriesFiscais] = useState([]);

    // Caixas & Séries
    const [caixasData, setCaixasData] = useState({ caixas: [], total_caixas: 0, limite_caixas: 1, pode_adicionar: false });
    const [loadingCaixas, setLoadingCaixas] = useState(false);
    const [showFormNovoCaixa, setShowFormNovoCaixa] = useState(false);
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [novoCaixaForm, setNovoCaixaForm] = useState({ nome: '', numero_caixa: '', serie_numero: '', ultimo_numero: 0 });
    const [caixaEditandoId, setCaixaEditandoId] = useState(null);
    const [ultimoNumeroEdit, setUltimoNumeroEdit] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab ? String(initialTab).toLowerCase() : 'fiscal');
            setConfig(getPdvConfig());
            carregarDadosFiscais();
            carregarCaixas();
            api.get('/pdv/modulos-config').then(res => {
                if (res.data?.modulos) {
                    setConfig(prev => ({ ...prev, modulo_entregas_mapa: res.data.modulos.entregas_mapa !== false }));
                }
            }).catch(() => {});
        }
    }, [isOpen, initialTab]);

    const carregarCaixas = async () => {
        setLoadingCaixas(true);
        try {
            const { data } = await api.get('/pdv/caixas');
            setCaixasData(data);

            // Se o terminal não tiver caixa_id configurado, seleciona o primeiro
            const currentCfg = getPdvConfig();
            if (!currentCfg.caixa_id && data.caixas && data.caixas.length > 0) {
                const c1 = data.caixas[0];
                setConfig(prev => ({
                    ...prev,
                    caixa_id: c1.id,
                    numero_caixa: c1.numero_caixa,
                    serie_numero: c1.serie_numero
                }));
            }
        } catch (err) {
            console.error('Erro ao buscar caixas do PDV:', err);
        } finally {
            setLoadingCaixas(false);
        }
    };

    const carregarDadosFiscais = async () => {
        setLoadingFiscalInfo(true);
        try {
            const [resCenarios, resEmpresas, resSeries, resCfg] = await Promise.all([
                api.get('/fiscal/cenarios').catch(() => ({ data: [] })),
                api.get('/fiscal/empresas').catch(() => ({ data: [] })),
                api.get('/fiscal/series').catch(() => ({ data: [] })),
                api.get('/fiscal/config').catch(() => ({ data: null }))
            ]);

            const listaCenarios = Array.isArray(resCenarios.data) ? resCenarios.data : [];
            setCenarios(listaCenarios);

            let empObj = null;
            if (Array.isArray(resEmpresas.data)) {
                empObj = resEmpresas.data.find(e =>
                    e.estabelecimentos?.some(est => est.certificados?.some(c => c.ativo))
                ) || resEmpresas.data[0] || null;
            } else if (resEmpresas.data && typeof resEmpresas.data === 'object' && resEmpresas.data.id) {
                empObj = resEmpresas.data;
            }
            setEmpresaFiscal(empObj);

            setSeriesFiscais(Array.isArray(resSeries.data) ? resSeries.data : []);

            // Se ainda não tinha cenário selecionado, pré-seleciona o de NFC-e (65)
            const currentCfg = getPdvConfig();
            if (!currentCfg.cenario_id && listaCenarios.length > 0) {
                const padrao65 = listaCenarios.find(c => String(c.modelo) === '65') || listaCenarios[0];
                if (padrao65) {
                    setConfig(prev => ({ ...prev, cenario_id: padrao65.id }));
                }
            }
            if (resCfg.data?.ambiente && !localStorage.getItem('ararinha_pdv_config_v1')) {
                setConfig(prev => ({
                    ...prev,
                    ambiente_fiscal: (resCfg.data.ambiente === 'PRODUCAO' || resCfg.data.ambiente === 1 || resCfg.data.ambiente === '1') ? 1 : 2
                }));
            }
        } catch (err) {
            console.error('Erro ao carregar resumo fiscal no PDV:', err);
        } finally {
            setLoadingFiscalInfo(false);
        }
    };

    const handleSave = () => {
        const saved = savePdvConfig(config);
        if (config.modulo_entregas_mapa !== undefined) {
            api.put('/pdv/modulos-config', { entregas_mapa: config.modulo_entregas_mapa }).catch(() => {});
        }
        if (onConfigChange) onConfigChange(saved);
        if (onSave) onSave(saved);
        toast.success('Configurações do PDV salvas com sucesso!');
        onClose();
    };

    const handleSelecionarCaixaTerminal = (caixa) => {
        setConfig(prev => ({
            ...prev,
            caixa_id: caixa.id,
            numero_caixa: caixa.numero_caixa,
            serie_numero: caixa.serie_numero
        }));
        toast.info(`Terminal configurado para operar como: ${caixa.nome} (Série ${caixa.serie_numero})`);
    };

    const handleCriarNovoCaixa = async (e) => {
        e.preventDefault();
        setSalvandoCaixa(true);
        try {
            const { data } = await api.post('/pdv/caixas', novoCaixaForm);
            toast.success(data.message || 'Caixa cadastrado com sucesso!');
            setShowFormNovoCaixa(false);
            setNovoCaixaForm({ nome: '', numero_caixa: '', serie_numero: '', ultimo_numero: 0 });
            await carregarCaixas();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao cadastrar caixa.');
        } finally {
            setSalvandoCaixa(false);
        }
    };

    const handleSalvarUltimoNumero = async (caixaId) => {
        try {
            await api.put(`/pdv/caixas/${caixaId}`, {
                ultimo_numero: Number(ultimoNumeroEdit)
            });
            toast.success('Último número de emissão atualizado!');
            setCaixaEditandoId(null);
            setUltimoNumeroEdit('');
            await carregarCaixas();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao atualizar numeração da série.');
        }
    };

    const flatSelectStyle = {
        height: '46px',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-main, #f8fafc)',
        color: 'var(--text-primary, #0f172a)',
        fontWeight: 500
    };

    const estab = empresaFiscal?.estabelecimentos?.find(est =>
        est.certificados?.some(c => c.ativo)
    ) || empresaFiscal?.estabelecimentos?.[0] || null;
    const certAtivo = estab?.certificados?.find(c => c.ativo) || estab?.certificados?.[0] || (empresaFiscal?.certificado_ativo ? { ativo: true, validade_fim: empresaFiscal?.certificado_vencimento, titular: empresaFiscal?.razao_social } : null);

    const ATALHOS = [
        { tecla: 'F1', acao: 'Abrir Ajuda e Mapa de Teclas de Atalho' },
        { tecla: 'F2', acao: 'Finalizar Venda / Abrir Pagamento' },
        { tecla: 'F3', acao: 'Identificar Cliente ou Informar CPF/CNPJ na Nota' },
        { tecla: 'F4', acao: 'Focar na Busca de Produtos / Código de Barras' },
        { tecla: 'F6', acao: 'Histórico de Vendas e Emissão / 2ª Via de Notas' },
        { tecla: 'F7', acao: 'Registrar Sangria ou Suprimento de Caixa' },
        { tecla: 'F8', acao: 'Relatório do Turno Atual' },
        { tecla: 'F9', acao: 'Alternar Rápido: MODO FISCAL (NFC-e) ↔ NÃO FISCAL (Gerentes/Admins)' },
        { tecla: 'F10', acao: 'Abrir Configurações do PDV e Caixas' },
        { tecla: '1 a 9', acao: 'No Pagamento: Selecionar Formas de Pagamento SEFAZ' },
        { tecla: 'Enter', acao: 'Confirmar Pagamento / Iniciar Nova Venda' },
        { tecla: 'Esc', acao: 'Fechar Janela / Limpar Busca' }
    ];

    return (
        <Modal show={isOpen} onHide={onClose} centered size="lg" contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-sidebar, #fff)', borderColor: 'var(--border-color, #e2e8f0)' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Configurações do PDV</h5>
                        <small className="text-muted">Personalize o modo fiscal, caixas, séries de NFC-e e impressora térmica</small>
                    </div>
                </div>
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            {/* Abas */}
            <div className="px-4 pt-3 border-bottom d-flex gap-2 flex-wrap" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderColor: 'var(--border-color, #e2e8f0)' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('fiscal')}
                    className={`btn rounded-top-3 px-4 py-2 fw-bold small border-0 d-flex align-items-center gap-2 ${activeTab === 'fiscal' ? 'bg-white text-primary shadow-sm border-top border-primary border-2' : 'text-secondary'}`}
                >
                    <ShieldCheck size={16} /> Modo Fiscal
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('caixas')}
                    className={`btn rounded-top-3 px-4 py-2 fw-bold small border-0 d-flex align-items-center gap-2 ${activeTab === 'caixas' ? 'bg-white text-primary shadow-sm border-top border-primary border-2' : 'text-secondary'}`}
                >
                    <Monitor size={16} /> Caixas & Séries NFC-e
                    <Badge bg="primary" className="rounded-pill ms-1" style={{ fontSize: '10px' }}>
                        {caixasData.total_caixas}
                    </Badge>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('operacao')}
                    className={`btn rounded-top-3 px-4 py-2 fw-bold small border-0 d-flex align-items-center gap-2 ${activeTab === 'operacao' ? 'bg-white text-primary shadow-sm border-top border-primary border-2' : 'text-secondary'}`}
                >
                    <Printer size={16} /> Impressão & Caixa
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('atalhos')}
                    className={`btn rounded-top-3 px-4 py-2 fw-bold small border-0 d-flex align-items-center gap-2 ${activeTab === 'atalhos' ? 'bg-white text-primary shadow-sm border-top border-primary border-2' : 'text-secondary'}`}
                >
                    <Keyboard size={16} /> Teclas de Atalho
                </button>
            </div>

            <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar, #fff)', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* ABA 1: FISCAL */}
                {activeTab === 'fiscal' && (
                    <div className="d-flex flex-column gap-4">
                        {/* Card Principal: Fiscal vs Não Fiscal */}
                        <div className={`p-4 rounded-4 border-2 border transition-all ${config.modo_fiscal ? 'border-success bg-success bg-opacity-10' : 'border-secondary bg-light'}`}>
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <Badge bg={config.modo_fiscal ? 'success' : 'secondary'} className="px-3 py-1 rounded-pill">
                                            {config.modo_fiscal ? 'ATIVO: MODO FISCAL SEFAZ' : 'ATIVO: MODO NÃO FISCAL'}
                                        </Badge>
                                        <span className="text-muted small fw-semibold">(Atalho: F9)</span>
                                    </div>
                                    <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {config.modo_fiscal
                                            ? 'O PDV está configurado para emitir Cupom Fiscal (NFC-e / NF-e)'
                                            : 'O PDV está configurado para vendas rápidas SEM emissão fiscal (Recibo Interno)'}
                                    </h6>
                                    <small className="text-muted d-block">
                                        {config.modo_fiscal
                                            ? 'As vendas finalizadas transmitem a NFC-e para a SEFAZ usando a Série vinculada a cada Caixa.'
                                            : 'As vendas serão salvas apenas no controle interno/financeiro (recibo de venda não fiscal).'}
                                    </small>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, modo_fiscal: true })}
                                        className={`btn rounded-pill px-4 py-2 fw-bold ${config.modo_fiscal ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white'}`}
                                    >
                                        Fiscal (NFC-e)
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!podeAlternarModoFiscal}
                                        onClick={() => {
                                            if (!podeAlternarModoFiscal) {
                                                toast.error('Apenas administradores podem desativar o Modo Fiscal.');
                                                return;
                                            }
                                            setConfig({ ...config, modo_fiscal: false });
                                        }}
                                        className={`btn rounded-pill px-4 py-2 fw-bold ${!config.modo_fiscal ? 'btn-dark shadow-sm' : 'btn-outline-secondary bg-white'}`}
                                        title={!podeAlternarModoFiscal ? 'Acesso restrito para gerentes' : 'Mudar para Não Fiscal'}
                                    >
                                        {!podeAlternarModoFiscal && <Lock size={14} className="me-1" />}
                                        Não Fiscal
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Opções quando Modo Fiscal está ativo */}
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold text-secondary mb-1">Comportamento no Checkout</Form.Label>
                                <Form.Select
                                    style={flatSelectStyle}
                                    value={config.comportamento_fiscal}
                                    onChange={e => setConfig({ ...config, comportamento_fiscal: e.target.value })}
                                >
                                    <option value="AUTOMATICO_NFCE">Emitir NFC-e Automaticamente ao Finalizar</option>
                                    <option value="PERGUNTAR">Escolher no Pagamento (NFC-e, NF-e ou Recibo)</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label className="small fw-bold text-secondary mb-1">Ambiente de Transmissão SEFAZ</Form.Label>
                                <Form.Select
                                    style={flatSelectStyle}
                                    value={config.ambiente_fiscal}
                                    onChange={e => setConfig({ ...config, ambiente_fiscal: Number(e.target.value) })}
                                >
                                    <option value={2}>Ambiente 2 - HOMOLOGAÇÃO (Testes sem valor fiscal)</option>
                                    <option value={1}>Ambiente 1 - PRODUÇÃO (Válido juridicamente)</option>
                                </Form.Select>
                            </Col>

                            <Col md={12}>
                                <Form.Label className="small fw-bold text-secondary mb-1">Cenário Fiscal Padrão (Regras Tributárias / CFOP / Tributação)</Form.Label>
                                <Form.Select
                                    style={flatSelectStyle}
                                    value={config.cenario_id}
                                    onChange={e => setConfig({ ...config, cenario_id: e.target.value })}
                                >
                                    {cenarios.length === 0 ? (
                                        <option value="">Carregando cenários fiscais...</option>
                                    ) : (
                                        cenarios.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.descricao} (Modelo {c.modelo === '65' ? 'NFC-e' : 'NF-e'} | CFOP {c.cfop_padrao})
                                            </option>
                                        ))
                                    )}
                                </Form.Select>
                            </Col>
                        </Row>

                        {/* Status de Conexão com Certificado */}
                        <div className="p-3 rounded-4 border bg-light d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                {certAtivo ? (
                                    <div className="text-success"><CheckCircle2 size={32} /></div>
                                ) : (
                                    <div className="text-warning"><AlertTriangle size={32} /></div>
                                )}
                                <div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                                        {certAtivo ? 'Certificado Digital A1 Conectado' : 'Atenção: Nenhum Certificado A1 Ativo'}
                                    </div>
                                    <small className="text-muted d-block">
                                        {certAtivo
                                            ? `Titular: ${certAtivo.titular || empresaFiscal?.razao_social} • Válido até ${certAtivo.validade_fim ? new Date(certAtivo.validade_fim).toLocaleDateString('pt-BR') : '2027'}`
                                            : 'Faça upload do seu certificado .PFX nas Configurações Fiscais da empresa.'}
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { onClose(); navigate('/admin/fiscal/configuracoes'); }}
                                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                            >
                                <ExternalLink size={14} /> Dados Fiscais
                            </button>
                        </div>
                    </div>
                )}

                {/* ABA 2: CAIXAS & SÉRIES NFC-E (SOLICITAÇÃO PRINCIPAL DO CLIENTE) */}
                {activeTab === 'caixas' && (
                    <div className="d-flex flex-column gap-3">
                        {/* Banner de Limite de Caixas do Plano SaaS */}
                        <div
                            className="p-3 rounded-4 border d-flex justify-content-between align-items-center flex-wrap gap-2"
                            style={{
                                backgroundColor: caixasData.pode_adicionar ? 'rgba(59, 130, 246, 0.05)' : 'rgba(234, 179, 8, 0.08)',
                                borderColor: caixasData.pode_adicionar ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.3)'
                            }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <Monitor size={22} className="text-primary" />
                                <div>
                                    <span className="fw-bold d-block" style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>
                                        Terminais & Séries de NFC-e da Loja
                                    </span>
                                    <small className="text-muted" style={{ fontSize: '12px' }}>
                                        Plano atual: <strong>{caixasData.total_caixas}</strong> de <strong>{caixasData.limite_caixas}</strong> caixa(s) cadastrado(s).
                                        Cada caixa opera com sua série única e sequência de numeração independente.
                                    </small>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        navigate('/admin/caixas');
                                    }}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-xs"
                                    title="Abrir Tela Completa de Gerenciamento de Caixas"
                                >
                                    <ExternalLink size={14} /> Tela de Caixas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!caixasData.pode_adicionar) {
                                            toast.warning(`Limite de caixas atingido para o plano da loja (${caixasData.limite_caixas} caixa(s)). Altere o plano para adicionar mais caixas.`);
                                            return;
                                        }
                                        const proxNum = caixasData.total_caixas + 1;
                                        setNovoCaixaForm({
                                            nome: `Caixa ${String(proxNum).padStart(2, '0')}`,
                                            numero_caixa: proxNum,
                                            serie_numero: proxNum,
                                            ultimo_numero: 0
                                        });
                                        setShowFormNovoCaixa(true);
                                    }}
                                    className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
                                >
                                    <Plus size={16} /> Cadastrar Novo Caixa
                                </button>
                            </div>
                        </div>

                        {/* Formulário para Cadastrar Novo Caixa */}
                        {showFormNovoCaixa && (
                            <form onSubmit={handleCriarNovoCaixa} className="p-3 border rounded-4 bg-light mb-2">
                                <h6 className="fw-bold mb-2 text-primary" style={{ fontSize: '13px' }}>
                                    Cadastrar Novo Terminal de Caixa
                                </h6>
                                <Row className="g-2">
                                    <Col md={4}>
                                        <Form.Label className="small fw-bold text-muted mb-1">Nome do Caixa</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            required
                                            value={novoCaixaForm.nome}
                                            onChange={e => setNovoCaixaForm({ ...novoCaixaForm, nome: e.target.value })}
                                            placeholder="Ex: Caixa 02 - Salão"
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="small fw-bold text-muted mb-1">Nº Caixa</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            required
                                            value={novoCaixaForm.numero_caixa}
                                            onChange={e => setNovoCaixaForm({ ...novoCaixaForm, numero_caixa: e.target.value, serie_numero: e.target.value })}
                                            min="1"
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label className="small fw-bold text-muted mb-1">Série NFC-e (Mod. 65)</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            required
                                            value={novoCaixaForm.serie_numero}
                                            onChange={e => setNovoCaixaForm({ ...novoCaixaForm, serie_numero: e.target.value })}
                                            min="1"
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label className="small fw-bold text-muted mb-1">Último Nº Emitido</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            value={novoCaixaForm.ultimo_numero}
                                            onChange={e => setNovoCaixaForm({ ...novoCaixaForm, ultimo_numero: e.target.value })}
                                            min="0"
                                            placeholder="0 para novo"
                                        />
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowFormNovoCaixa(false)}
                                        className="btn btn-sm btn-light border rounded-pill px-3"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={salvandoCaixa}
                                        className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                    >
                                        {salvandoCaixa ? <Spinner size="sm" /> : 'Confirmar e Criar Caixa'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Lista de Caixas Cadastrados */}
                        <div className="table-responsive border rounded-4 overflow-hidden">
                            <Table hover className="m-0 align-middle">
                                <thead className="bg-light text-secondary small">
                                    <tr>
                                        <th>Terminal / Caixa</th>
                                        <th>Série NFC-e</th>
                                        <th>Último Nº Emitido</th>
                                        <th>Próxima Nota</th>
                                        <th className="text-end">Operação no Terminal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingCaixas ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted">
                                                <Spinner size="sm" className="me-2" /> Carregando caixas do PDV...
                                            </td>
                                        </tr>
                                    ) : caixasData.caixas.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted">
                                                Nenhum caixa cadastrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        caixasData.caixas.map(cx => {
                                            const isSelected = config.caixa_id === cx.id || (!config.caixa_id && cx.numero_caixa === 1);
                                            return (
                                                <tr key={cx.id} className={isSelected ? 'table-primary table-opacity-10' : ''}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className={`p-2 rounded-3 ${isSelected ? 'bg-primary text-white' : 'bg-light text-secondary'}`}>
                                                                <Monitor size={16} />
                                                            </div>
                                                            <div>
                                                                <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                                                    {cx.nome}
                                                                </strong>
                                                                <small className="d-block text-muted" style={{ fontSize: '11px' }}>
                                                                    Caixa #{cx.numero_caixa}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg="dark" className="rounded-pill px-3 py-1 font-monospace">
                                                            Modelo 65 • Série {cx.serie_numero}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {caixaEditandoId === cx.id ? (
                                                            <div className="d-flex align-items-center gap-1" style={{ maxWidth: '140px' }}>
                                                                <Form.Control
                                                                    size="sm"
                                                                    type="number"
                                                                    value={ultimoNumeroEdit}
                                                                    onChange={e => setUltimoNumeroEdit(e.target.value)}
                                                                    min="0"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSalvarUltimoNumero(cx.id)}
                                                                    className="btn btn-sm btn-success rounded-3 p-1"
                                                                    title="Salvar"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fw-bold font-monospace" style={{ fontSize: '13.5px' }}>
                                                                    #{cx.ultimo_numero}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCaixaEditandoId(cx.id);
                                                                        setUltimoNumeroEdit(String(cx.ultimo_numero));
                                                                    }}
                                                                    className="btn btn-sm btn-link text-secondary p-0 text-decoration-none"
                                                                    title="Ajustar último número emitido"
                                                                >
                                                                    <Edit3 size={13} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-primary fw-bold font-monospace" style={{ fontSize: '13.5px' }}>
                                                            #{cx.proximo_numero}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        {isSelected ? (
                                                            <Badge bg="success" className="rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center gap-1">
                                                                <CheckCircle2 size={13} /> Caixa deste Computador
                                                            </Badge>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelecionarCaixaTerminal(cx)}
                                                                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                                                            >
                                                                Usar este Caixa
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* ABA 3: OPERAÇÃO & IMPRESSÃO */}
                {activeTab === 'operacao' && (
                    <div className="d-flex flex-column gap-3">
                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center bg-primary bg-opacity-10 border-primary border-opacity-25">
                            <div>
                                <div className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <MapPin size={18} className="text-primary" /> Módulo de Mapa de Entregas no PDV Desktop (.exe)
                                </div>
                                <small className="text-muted">Exibe a aba "ENTREGAS" com mapa, rotas ativas e radar de motoboys nos caixas desktop instalados</small>
                            </div>
                            <Form.Check
                                type="switch"
                                className="fs-4 m-0"
                                checked={config.modulo_entregas_mapa !== false}
                                onChange={e => setConfig({ ...config, modulo_entregas_mapa: e.target.checked })}
                            />
                        </div>

                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>Exibir Campo de CPF/CNPJ na Nota no Caixa</div>
                                <small className="text-muted">Permite digitar o CPF/CNPJ do consumidor direto na cesta ou tela de pagamento</small>
                            </div>
                            <Form.Check
                                type="switch"
                                className="fs-4 m-0"
                                checked={config.solicitar_cpf_nota}
                                onChange={e => setConfig({ ...config, solicitar_cpf_nota: e.target.checked })}
                            />
                        </div>

                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>Impressão Automática Pós-Venda</div>
                                <small className="text-muted">Abre a janela de impressão do DANFCE / Recibo automaticamente após finalizar a venda</small>
                            </div>
                            <Form.Check
                                type="switch"
                                className="fs-4 m-0"
                                checked={config.imprimir_automatico}
                                onChange={e => setConfig({ ...config, imprimir_automatico: e.target.checked })}
                            />
                        </div>

                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>Exibir Barra de Teclas de Atalho no Rodapé</div>
                                <small className="text-muted">Mostra os botões clicáveis com as teclas F1 a F10 na parte inferior do PDV</small>
                            </div>
                            <Form.Check
                                type="switch"
                                className="fs-4 m-0"
                                checked={config.exibir_barra_atalhos}
                                onChange={e => setConfig({ ...config, exibir_barra_atalhos: e.target.checked })}
                            />
                        </div>

                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Volume2 size={18} className="text-primary" /> Som de Bip do Caixa
                                </div>
                                <small className="text-muted">Emite efeito sonoro ao adicionar itens na cesta e ao concluir uma venda</small>
                            </div>
                            <Form.Check
                                type="switch"
                                className="fs-4 m-0"
                                checked={config.som_bip}
                                onChange={e => setConfig({ ...config, som_bip: e.target.checked })}
                            />
                        </div>

                        <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>Formato da Bobina Térmica</div>
                                <small className="text-muted">Define a largura padrão para impressão de cupons e recibos no PDV</small>
                            </div>
                            <Form.Select
                                style={{ ...flatSelectStyle, width: '180px' }}
                                value={config.largura_bobina}
                                onChange={e => setConfig({ ...config, largura_bobina: e.target.value })}
                            >
                                <option value="80mm">Bobina 80mm</option>
                                <option value="58mm">Bobina 58mm</option>
                            </Form.Select>
                        </div>
                    </div>
                )}

                {/* ABA 4: ATALHOS */}
                {activeTab === 'atalhos' && (
                    <div>
                        <p className="small text-muted mb-3">
                            Use o teclado para operar o PDV com máxima velocidade sem precisar do mouse:
                        </p>
                        <div className="row g-2">
                            {ATALHOS.map((item, idx) => (
                                <div key={idx} className="col-12 col-md-6">
                                    <div className="p-3 border rounded-4 d-flex align-items-center justify-content-between bg-light h-100">
                                        <span className="small fw-semibold" style={{ color: 'var(--text-primary)' }}>{item.acao}</span>
                                        <Badge bg="dark" className="font-monospace px-3 py-2 rounded-3 ms-2">
                                            {item.tecla}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-top p-3 d-flex justify-content-between" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderColor: 'var(--border-color, #e2e8f0)' }}>
                <LightButton type="button" onClick={onClose}>Fechar</LightButton>
                <CtaButton type="button" onClick={handleSave}>Salvar Configurações do PDV</CtaButton>
            </Modal.Footer>
        </Modal>
    );
}
