import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Modal, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { Plus, Edit, Trash2, Hash, CreditCard, Users, Webhook, Ban, Monitor, Edit3 } from 'lucide-react';

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'EX'
];

const CODIGOS_SEFAZ_PAGAMENTO = [
    { value: '01', label: '01 - Dinheiro' },
    { value: '02', label: '02 - Cheque' },
    { value: '03', label: '03 - Cartão de Crédito' },
    { value: '04', label: '04 - Cartão de Débito' },
    { value: '05', label: '05 - Cartão da Loja (Private Label)' },
    { value: '10', label: '10 - Vale Alimentação' },
    { value: '11', label: '11 - Vale Refeição' },
    { value: '12', label: '12 - Vale Presente' },
    { value: '13', label: '13 - Vale Combustível' },
    { value: '15', label: '15 - Boleto Bancário' },
    { value: '16', label: '16 - Depósito Bancário' },
    { value: '17', label: '17 - Pagamento Instantâneo (PIX) - Dinâmico' },
    { value: '18', label: '18 - Transferência Bancária / Carteira Digital' },
    { value: '19', label: '19 - Programa de Fidelidade / Cashback' },
    { value: '20', label: '20 - Pagamento Instantâneo (PIX) - Estático' },
    { value: '90', label: '90 - Sem Pagamento' },
    { value: '99', label: '99 - Outros' }
];

const CadastrosFiscais = () => {
    const [abaAtiva, setAbaAtiva] = useState('series');
    const [loading, setLoading] = useState(false);

    // 1. Séries & Inutilização
    const [series, setSeries] = useState([]);
    const [estabelecimentos, setEstabelecimentos] = useState([]);
    const [serieForm, setSerieForm] = useState({ estabelecimento_id: '', modelo: '55', serie: '1' });
    const [inutModal, setInutModal] = useState(false);
    const [inutLoading, setInutLoading] = useState(false);
    const [inutForm, setInutForm] = useState({
        estabelecimento_id: '',
        modelo: '55',
        serie: '1',
        numero_inicial: '',
        numero_final: '',
        justificativa: ''
    });

    // 1.5 Caixas & Séries NFC-e
    const [caixasData, setCaixasData] = useState({ caixas: [], total_caixas: 0, limite_caixas: 1, pode_adicionar: true });
    const [modalNovoCaixa, setModalNovoCaixa] = useState(false);
    const [novoCaixaForm, setNovoCaixaForm] = useState({ nome: '', numero_caixa: '', serie_numero: '', ultimo_numero: 0 });
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [modalEditarNumero, setModalEditarNumero] = useState(false);
    const [caixaEditando, setCaixaEditando] = useState(null);
    const [novoUltimoNumero, setNovoUltimoNumero] = useState('');
    const [salvandoNumero, setSalvandoNumero] = useState(false);

    // 2. Formas de Pagamento SEFAZ
    const [formas, setFormas] = useState([]);
    const [formaForm, setFormaForm] = useState({ id: '', descricao: '', codigo_sefaz: '01' });

    // 3. Destinatários Fiscais
    const [destinatarios, setDestinatarios] = useState([]);
    const [destForm, setDestForm] = useState({
        id: '',
        cpf_cnpj: '',
        razao_social: '',
        ie: '',
        tipo_contribuinte: 'NAO_CONTRIBUINTE',
        logradouro: '',
        numero: '',
        bairro: '',
        cep: '',
        municipio: '',
        uf: 'PA',
        codigo_municipio_ibge: ''
    });

    // 4. Webhooks Fiscais
    const [webhooks, setWebhooks] = useState([]);
    const [webhookForm, setWebhookForm] = useState({ url: '', eventos: 'ALL', secret: '' });

    const flatSelectStyle = {
        height: '48px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)'
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            if (abaAtiva === 'series') {
                const [resSeries, resEst] = await Promise.all([
                    api.get('/fiscal/series'),
                    api.get('/fiscal/estabelecimentos')
                ]);
                const listaSeries = Array.isArray(resSeries.data) ? resSeries.data : [];
                const listaEst = Array.isArray(resEst.data) ? resEst.data : [];
                setSeries(listaSeries);
                setEstabelecimentos(listaEst);
                if (listaEst.length > 0 && !serieForm.estabelecimento_id) {
                    setSerieForm(prev => ({ ...prev, estabelecimento_id: listaEst[0].id }));
                    setInutForm(prev => ({ ...prev, estabelecimento_id: listaEst[0].id }));
                }
            } else if (abaAtiva === 'caixas') {
                const { data } = await api.get('/pdv/caixas');
                setCaixasData(data);
            } else if (abaAtiva === 'formas-pagamento') {
                const { data } = await api.get('/fiscal/formas-pagamento');
                setFormas(Array.isArray(data) ? data : []);
            } else if (abaAtiva === 'destinatarios') {
                const { data } = await api.get('/fiscal/destinatarios');
                setDestinatarios(Array.isArray(data) ? data : []);
            } else if (abaAtiva === 'webhooks') {
                const { data } = await api.get('/fiscal/webhooks');
                setWebhooks(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados fiscais.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [abaAtiva]);

    // Handlers Séries
    const handleSalvarSerie = async (e) => {
        e.preventDefault();
        if (!serieForm.estabelecimento_id || !serieForm.serie) {
            return toast.warning('Selecione o estabelecimento e informe a série.');
        }
        try {
            await api.post('/fiscal/series', {
                estabelecimento_id: serieForm.estabelecimento_id,
                modelo: serieForm.modelo,
                serie: Number(serieForm.serie)
            });
            toast.success('Série criada com sucesso!');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao criar série.');
        }
    };

    const handleInutilizar = async (e) => {
        e.preventDefault();
        if (!inutForm.justificativa || inutForm.justificativa.length < 15) {
            return toast.warning('A justificativa deve ter no mínimo 15 caracteres.');
        }
        setInutLoading(true);
        try {
            const { data } = await api.post('/fiscal/notas/inutilizar', {
                estabelecimento_id: inutForm.estabelecimento_id,
                modelo: Number(inutForm.modelo),
                serie: Number(inutForm.serie),
                numero_inicial: Number(inutForm.numero_inicial),
                numero_final: Number(inutForm.numero_final),
                justificativa: inutForm.justificativa
            });
            toast.success(data.mensagem || 'Faixa de numeração inutilizada com sucesso!');
            setInutModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao inutilizar numeração na SEFAZ.');
        } finally {
            setInutLoading(false);
        }
    };

    // Handlers Formas de Pagamento
    const handleSalvarForma = async (e) => {
        e.preventDefault();
        if (!formaForm.descricao || !formaForm.codigo_sefaz) {
            return toast.warning('Preencha a descrição e o código SEFAZ.');
        }
        try {
            await api.post('/fiscal/formas-pagamento', {
                id: formaForm.id || undefined,
                descricao: formaForm.descricao,
                codigo_sefaz: formaForm.codigo_sefaz
            });
            toast.success('Forma de pagamento salva!');
            setFormaForm({ id: '', descricao: '', codigo_sefaz: '01' });
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar forma de pagamento.');
        }
    };

    const handleExcluirForma = async (id) => {
        if (!window.confirm('Excluir esta forma de pagamento?')) return;
        try {
            await api.delete(`/fiscal/formas-pagamento/${id}`);
            toast.success('Excluída com sucesso.');
            carregarDados();
        } catch (error) {
            toast.error('Erro ao excluir forma de pagamento.');
        }
    };

    // Handlers Destinatários
    const handleSalvarDestinatario = async (e) => {
        e.preventDefault();
        if (!destForm.cpf_cnpj || !destForm.razao_social) {
            return toast.warning('CPF/CNPJ e Nome/Razão Social são obrigatórios.');
        }
        try {
            if (destForm.id) {
                await api.put(`/fiscal/destinatarios/${destForm.id}`, destForm);
                toast.success('Destinatário atualizado!');
            } else {
                await api.post('/fiscal/destinatarios', destForm);
                toast.success('Destinatário cadastrado!');
            }
            setDestForm({
                id: '', cpf_cnpj: '', razao_social: '', ie: '', tipo_contribuinte: 'NAO_CONTRIBUINTE',
                logradouro: '', numero: '', bairro: '', cep: '', municipio: '', uf: 'PA', codigo_municipio_ibge: ''
            });
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar destinatário.');
        }
    };

    const handleExcluirDestinatario = async (id) => {
        if (!window.confirm('Deseja excluir este destinatário?')) return;
        try {
            await api.delete(`/fiscal/destinatarios/${id}`);
            toast.success('Destinatário removido.');
            carregarDados();
        } catch (error) {
            toast.error('Erro ao remover destinatário.');
        }
    };

    // Handlers Webhooks
    const handleSalvarWebhook = async (e) => {
        e.preventDefault();
        if (!webhookForm.url) return toast.warning('Informe a URL do Webhook.');
        try {
            await api.post('/fiscal/webhooks', webhookForm);
            toast.success('Webhook cadastrado!');
            setWebhookForm({ url: '', eventos: 'ALL', secret: '' });
            carregarDados();
        } catch (error) {
            toast.error('Erro ao cadastrar webhook.');
        }
    };

    const handleToggleWebhook = async (wh) => {
        try {
            await api.put(`/fiscal/webhooks/${wh.id}`, { ativo: !wh.ativo });
            carregarDados();
        } catch (error) {
            toast.error('Erro ao atualizar status do webhook.');
        }
    };

    const handleExcluirWebhook = async (id) => {
        if (!window.confirm('Excluir este webhook?')) return;
        try {
            await api.delete(`/fiscal/webhooks/${id}`);
            toast.success('Webhook removido.');
            carregarDados();
        } catch (error) {
            toast.error('Erro ao excluir webhook.');
        }
    };

    // Handlers Caixas & Séries NFC-e
    const handleSalvarNovoCaixa = async (e) => {
        e.preventDefault();
        setSalvandoCaixa(true);
        try {
            await api.post('/pdv/caixas', {
                nome: novoCaixaForm.nome,
                numero_caixa: Number(novoCaixaForm.numero_caixa),
                serie_numero: Number(novoCaixaForm.serie_numero),
                ultimo_numero: Number(novoCaixaForm.ultimo_numero) || 0
            });
            toast.success('Novo Caixa cadastrado com sucesso!');
            setModalNovoCaixa(false);
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao cadastrar caixa.');
        } finally {
            setSalvandoCaixa(false);
        }
    };

    const handleSalvarEditarNumero = async (e) => {
        e.preventDefault();
        if (!caixaEditando) return;
        setSalvandoNumero(true);
        try {
            await api.put(`/pdv/caixas/${caixaEditando.id}`, {
                ultimo_numero: Number(novoUltimoNumero)
            });
            toast.success('Sequência do caixa atualizada com sucesso!');
            setModalEditarNumero(false);
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao atualizar numeração.');
        } finally {
            setSalvandoNumero(false);
        }
    };

    const handleExcluirCaixa = async (caixa) => {
        if (!window.confirm(`Tem certeza que deseja excluir o ${caixa.nome}?`)) return;
        try {
            await api.delete(`/pdv/caixas/${caixa.id}`);
            toast.success('Caixa excluído com sucesso!');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao excluir caixa.');
        }
    };

    const tabs = [
        { id: 'series', label: 'Séries & Inutilização SEFAZ', icon: Hash },
        { id: 'caixas', label: 'Caixas & Terminais PDV', icon: Monitor },
        { id: 'formas-pagamento', label: 'Formas de Pagamento SEFAZ', icon: CreditCard },
        { id: 'destinatarios', label: 'Destinatários Fiscais', icon: Users },
        { id: 'webhooks', label: 'Webhooks Fiscais', icon: Webhook }
    ];

    return (
        <div className="container-fluid mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Cadastros Auxiliares Fiscais</h4>
                    <small className="text-muted">
                        Gerencie séries de numeração, inutilização SEFAZ, formas de pagamento, destinatários e webhooks de eventos.
                    </small>
                </div>
                {abaAtiva === 'series' && (
                    <RedButton onClick={() => setInutModal(true)}>
                        <Ban size={16} className="me-2" /> Inutilizar Numeração SEFAZ
                    </RedButton>
                )}
            </div>

            {/* Abas */}
            <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setAbaAtiva(t.id)}
                            className={`btn rounded-pill px-4 py-2 fw-semibold small ${
                                abaAtiva === t.id ? 'btn-primary shadow-sm' : 'btn-light text-secondary border'
                            }`}
                        >
                            <Icon size={15} className="me-2" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <>
                    {/* ABA 1: SÉRIES */}
                    {abaAtiva === 'series' && (
                        <>
                            <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                                <h6 className="fw-bold mb-3">Cadastrar Nova Série Fiscal</h6>
                                <Form onSubmit={handleSalvarSerie}>
                                    <Row className="g-3 align-items-end">
                                        <Col md={5}>
                                            <Form.Label className="small fw-semibold mb-1">Estabelecimento Emitente</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={serieForm.estabelecimento_id}
                                                onChange={e => setSerieForm({ ...serieForm, estabelecimento_id: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                {estabelecimentos.map(est => (
                                                    <option key={est.id} value={est.id}>
                                                        {est.cnpj} - {est.nome || 'Matriz'}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Modelo de Documento</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={serieForm.modelo}
                                                onChange={e => setSerieForm({ ...serieForm, modelo: e.target.value })}
                                            >
                                                <option value="55">55 - NF-e (Nota Grande)</option>
                                                <option value="65">65 - NFC-e (Cupom Fiscal)</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Série</Form.Label>
                                            <CustomInput
                                                type="number"
                                                value={serieForm.serie}
                                                onChange={e => setSerieForm({ ...serieForm, serie: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <CtaButton type="submit" className="w-100">
                                                <Plus size={16} className="me-1" /> Criar Série
                                            </CtaButton>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>

                            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">MODELO</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">SÉRIE</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">ÚLTIMO NÚMERO EMITIDO</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">PRÓXIMA NOTA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {series.map(s => {
                                            const ultimo = s.numeracoes?.ultimo_numero ?? 0;
                                            return (
                                                <tr key={s.id}>
                                                    <td className="py-3 px-4">
                                                        <Badge bg={s.modelo === '55' ? 'primary' : 'info'}>
                                                            Modelo {s.modelo} ({s.modelo === '55' ? 'NF-e' : 'NFC-e'})
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 fw-bold">Série {s.serie}</td>
                                                    <td className="py-3 px-4 font-monospace fw-bold text-secondary">#{ultimo}</td>
                                                    <td className="py-3 px-4 font-monospace text-success fw-bold">#{ultimo + 1}</td>
                                                </tr>
                                            );
                                        })}
                                        {series.length === 0 && (
                                            <tr><td colSpan="4" className="text-center py-5 text-muted">Nenhuma série cadastrada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ABA: CAIXAS & TERMINAIS PDV (NFC-E) */}
                    {abaAtiva === 'caixas' && (
                        <>
                            <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <h6 className="fw-bold mb-1">Terminais de Caixa & Séries NFC-e (Modelo 65)</h6>
                                        <small className="text-muted">
                                            Cada terminal opera com sua série exclusiva e numeração sequencial independente na SEFAZ.
                                        </small>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg={caixasData.pode_adicionar ? 'primary' : 'warning'} className="px-3 py-2 rounded-pill">
                                            {caixasData.total_caixas} de {caixasData.limite_caixas} caixas do plano
                                        </Badge>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const prox = (caixasData.caixas?.length || 0) + 1;
                                                setNovoCaixaForm({
                                                    nome: `Caixa ${String(prox).padStart(2, '0')}`,
                                                    numero_caixa: prox,
                                                    serie_numero: prox,
                                                    ultimo_numero: 0
                                                });
                                                setModalNovoCaixa(true);
                                            }}
                                            disabled={!caixasData.pode_adicionar}
                                            className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm"
                                        >
                                            <Plus size={16} /> Cadastrar Novo Caixa
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">TERMINAL</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">Nº CAIXA</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">SÉRIE NFC-E</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">ÚLTIMO Nº EMITIDO</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">PRÓXIMA NOTA</th>
                                            <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {caixasData.caixas.map(c => (
                                            <tr key={c.id}>
                                                <td className="py-3 px-4">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Monitor size={18} className="text-primary" />
                                                        <span className="fw-bold">{c.nome}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge bg="dark" className="rounded-pill font-monospace">
                                                        Caixa {String(c.numero_caixa).padStart(2, '0')}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 fw-bold text-primary">
                                                    Série {c.serie_numero || c.serie?.serie || c.numero_caixa}
                                                </td>
                                                <td className="py-3 px-4 font-monospace fw-bold text-secondary">
                                                    #{c.ultimo_numero ?? 0}
                                                </td>
                                                <td className="py-3 px-4 font-monospace text-success fw-bold">
                                                    #{c.proximo_numero || (Number(c.ultimo_numero || 0) + 1)}
                                                </td>
                                                <td className="py-3 px-4 text-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCaixaEditando(c);
                                                            setNovoUltimoNumero(String(c.ultimo_numero ?? 0));
                                                            setModalEditarNumero(true);
                                                        }}
                                                        className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 me-1"
                                                        title="Ajustar Último Número Emitido"
                                                    >
                                                        <Edit3 size={13} className="me-1" /> Numeração
                                                    </button>
                                                    {caixasData.caixas.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleExcluirCaixa(c)}
                                                            className="btn btn-sm btn-outline-danger rounded-pill p-1.5"
                                                            title="Excluir Caixa"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {caixasData.caixas.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5 text-muted">
                                                    Nenhum caixa cadastrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ABA 2: FORMAS DE PAGAMENTO */}
                    {abaAtiva === 'formas-pagamento' && (
                        <>
                            <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                                <h6 className="fw-bold mb-3">
                                    {formaForm.id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento SEFAZ'}
                                </h6>
                                <Form onSubmit={handleSalvarForma}>
                                    <Row className="g-3 align-items-end">
                                        <Col md={5}>
                                            <Form.Label className="small fw-semibold mb-1">Descrição Interna</Form.Label>
                                            <CustomInput
                                                value={formaForm.descricao}
                                                onChange={e => setFormaForm({ ...formaForm, descricao: e.target.value })}
                                                placeholder="Ex: PIX Loja, Cartão Crédito Stone, Dinheiro"
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Form.Label className="small fw-semibold mb-1">Código Oficial SEFAZ (tPag)</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={formaForm.codigo_sefaz}
                                                onChange={e => setFormaForm({ ...formaForm, codigo_sefaz: e.target.value })}
                                            >
                                                {CODIGOS_SEFAZ_PAGAMENTO.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <CtaButton type="submit" className="w-100">
                                                <Plus size={16} className="me-1" /> Salvar
                                            </CtaButton>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>

                            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">DESCRIÇÃO</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">CÓDIGO SEFAZ</th>
                                            <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formas.map(f => (
                                            <tr key={f.id}>
                                                <td className="py-3 px-4 fw-bold">{f.descricao}</td>
                                                <td className="py-3 px-4">
                                                    <Badge bg="secondary" className="font-monospace">tPag {f.codigo_sefaz}</Badge>
                                                </td>
                                                <td className="py-3 px-4 text-end">
                                                    <LightButton className="btn-sm me-2 px-2" onClick={() => setFormaForm(f)}>
                                                        <Edit size={16} />
                                                    </LightButton>
                                                    <RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleExcluirForma(f.id)}>
                                                        <Trash2 size={16} />
                                                    </RedButton>
                                                </td>
                                            </tr>
                                        ))}
                                        {formas.length === 0 && (
                                            <tr><td colSpan="3" className="text-center py-5 text-muted">Nenhuma forma de pagamento cadastrada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ABA 3: DESTINATÁRIOS FISCAIS */}
                    {abaAtiva === 'destinatarios' && (
                        <>
                            <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                                <h6 className="fw-bold mb-3">
                                    {destForm.id ? 'Editando Destinatário' : 'Novo Destinatário Fiscal (Cliente NF-e)'}
                                </h6>
                                <Form onSubmit={handleSalvarDestinatario}>
                                    <Row className="g-3">
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">CPF ou CNPJ</Form.Label>
                                            <CustomInput
                                                value={destForm.cpf_cnpj}
                                                onChange={e => setDestForm({ ...destForm, cpf_cnpj: e.target.value })}
                                                placeholder="Somente números"
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Form.Label className="small fw-semibold mb-1">Nome / Razão Social</Form.Label>
                                            <CustomInput
                                                value={destForm.razao_social}
                                                onChange={e => setDestForm({ ...destForm, razao_social: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Inscrição Estadual</Form.Label>
                                            <CustomInput
                                                value={destForm.ie}
                                                onChange={e => setDestForm({ ...destForm, ie: e.target.value })}
                                                placeholder="ISENTO ou nº"
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Contribuinte</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={destForm.tipo_contribuinte}
                                                onChange={e => setDestForm({ ...destForm, tipo_contribuinte: e.target.value })}
                                            >
                                                <option value="NAO_CONTRIBUINTE">Não Contribuinte</option>
                                                <option value="CONTRIBUINTE">Contribuinte ICMS</option>
                                                <option value="ISENTO">Isento</option>
                                            </Form.Select>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Label className="small fw-semibold mb-1">Logradouro</Form.Label>
                                            <CustomInput
                                                value={destForm.logradouro}
                                                onChange={e => setDestForm({ ...destForm, logradouro: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Número</Form.Label>
                                            <CustomInput
                                                value={destForm.numero}
                                                onChange={e => setDestForm({ ...destForm, numero: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Bairro</Form.Label>
                                            <CustomInput
                                                value={destForm.bairro}
                                                onChange={e => setDestForm({ ...destForm, bairro: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">CEP</Form.Label>
                                            <CustomInput
                                                value={destForm.cep}
                                                onChange={e => setDestForm({ ...destForm, cep: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="small fw-semibold mb-1">Município</Form.Label>
                                            <CustomInput
                                                value={destForm.municipio}
                                                onChange={e => setDestForm({ ...destForm, municipio: e.target.value })}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">UF</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={destForm.uf}
                                                onChange={e => setDestForm({ ...destForm, uf: e.target.value })}
                                            >
                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Código IBGE Cidade</Form.Label>
                                            <CustomInput
                                                value={destForm.codigo_municipio_ibge}
                                                onChange={e => setDestForm({ ...destForm, codigo_municipio_ibge: e.target.value })}
                                                placeholder="Ex: 1502400"
                                            />
                                        </Col>
                                        <Col md={3} className="d-flex align-items-end gap-2">
                                            <CtaButton type="submit" className="w-100">
                                                <Plus size={16} className="me-1" /> {destForm.id ? 'Atualizar' : 'Salvar'}
                                            </CtaButton>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>

                            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">CPF / CNPJ</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">RAZÃO SOCIAL / NOME</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">CIDADE / UF</th>
                                            <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {destinatarios.map(d => (
                                            <tr key={d.id}>
                                                <td className="py-3 px-4 font-monospace">{d.cpf_cnpj}</td>
                                                <td className="py-3 px-4 fw-bold">{d.razao_social}</td>
                                                <td className="py-3 px-4 text-muted">{d.municipio || '-'} / {d.uf || '-'}</td>
                                                <td className="py-3 px-4 text-end">
                                                    <LightButton className="btn-sm me-2 px-2" onClick={() => setDestForm({ ...d, ie: d.ie || '' })}>
                                                        <Edit size={16} />
                                                    </LightButton>
                                                    <RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleExcluirDestinatario(d.id)}>
                                                        <Trash2 size={16} />
                                                    </RedButton>
                                                </td>
                                            </tr>
                                        ))}
                                        {destinatarios.length === 0 && (
                                            <tr><td colSpan="4" className="text-center py-5 text-muted">Nenhum destinatário cadastrado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ABA 4: WEBHOOKS */}
                    {abaAtiva === 'webhooks' && (
                        <>
                            <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                                <h6 className="fw-bold mb-3">Cadastrar Novo Webhook Fiscal (Eventos HTTP)</h6>
                                <Form onSubmit={handleSalvarWebhook}>
                                    <Row className="g-3 align-items-end">
                                        <Col md={5}>
                                            <Form.Label className="small fw-semibold mb-1">URL do Endpoint</Form.Label>
                                            <CustomInput
                                                value={webhookForm.url}
                                                onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                                                placeholder="https://seu-sistema.com.br/webhook/sefaz"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Eventos</Form.Label>
                                            <CustomInput
                                                value={webhookForm.eventos}
                                                onChange={e => setWebhookForm({ ...webhookForm, eventos: e.target.value })}
                                                placeholder="ALL, NFE_AUTORIZADA..."
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="small fw-semibold mb-1">Secret (HMAC)</Form.Label>
                                            <CustomInput
                                                value={webhookForm.secret}
                                                onChange={e => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                                                placeholder="Opcional"
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <CtaButton type="submit" className="w-100">
                                                <Plus size={16} className="me-1" /> Salvar
                                            </CtaButton>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>

                            <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">ENDPOINT</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">EVENTOS</th>
                                            <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">STATUS</th>
                                            <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {webhooks.map(wh => (
                                            <tr key={wh.id}>
                                                <td className="py-3 px-4 font-monospace small">{wh.url}</td>
                                                <td className="py-3 px-4"><Badge bg="info" text="dark">{wh.eventos}</Badge></td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        bg={wh.ativo ? 'success' : 'secondary'}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleToggleWebhook(wh)}
                                                    >
                                                        {wh.ativo ? 'ATIVO' : 'INATIVO'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-end">
                                                    <RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleExcluirWebhook(wh.id)}>
                                                        <Trash2 size={16} />
                                                    </RedButton>
                                                </td>
                                            </tr>
                                        ))}
                                        {webhooks.length === 0 && (
                                            <tr><td colSpan="4" className="text-center py-5 text-muted">Nenhum webhook configurado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Modal de Inutilização SEFAZ */}
            <Modal show={inutModal} onHide={() => setInutModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5 text-danger d-flex align-items-center">
                        <Ban size={20} className="me-2" /> Inutilizar Faixa de Numeração SEFAZ
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleInutilizar}>
                    <Modal.Body>
                        <p className="small text-muted mb-3">
                            Utilize quando houver quebra de sequência na numeração das notas fiscais (números pulados que nunca foram enviados à SEFAZ).
                        </p>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="small fw-semibold mb-1">Estabelecimento</Form.Label>
                                <Form.Select
                                    style={flatSelectStyle}
                                    value={inutForm.estabelecimento_id}
                                    onChange={e => setInutForm({ ...inutForm, estabelecimento_id: e.target.value })}
                                >
                                    {estabelecimentos.map(est => (
                                        <option key={est.id} value={est.id}>{est.cnpj} - {est.nome || 'Matriz'}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Modelo</Form.Label>
                                <Form.Select
                                    style={flatSelectStyle}
                                    value={inutForm.modelo}
                                    onChange={e => setInutForm({ ...inutForm, modelo: e.target.value })}
                                >
                                    <option value="55">55 - NF-e</option>
                                    <option value="65">65 - NFC-e</option>
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Série</Form.Label>
                                <CustomInput
                                    type="number"
                                    value={inutForm.serie}
                                    onChange={e => setInutForm({ ...inutForm, serie: e.target.value })}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Número Inicial</Form.Label>
                                <CustomInput
                                    type="number"
                                    value={inutForm.numero_inicial}
                                    onChange={e => setInutForm({ ...inutForm, numero_inicial: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Número Final</Form.Label>
                                <CustomInput
                                    type="number"
                                    value={inutForm.numero_final}
                                    onChange={e => setInutForm({ ...inutForm, numero_final: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col md={12}>
                                <Form.Label className="small fw-semibold mb-1">Justificativa (Mín. 15 caracteres)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={inutForm.justificativa}
                                    onChange={e => setInutForm({ ...inutForm, justificativa: e.target.value })}
                                    placeholder="Ex: Quebra de sequência de numeração por falha técnica no sistema emissor."
                                    required
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <LightButton type="button" onClick={() => setInutModal(false)}>Cancelar</LightButton>
                        <RedButton type="submit" disabled={inutLoading}>
                            {inutLoading ? <Spinner size="sm" /> : 'Transmitir Inutilização'}
                        </RedButton>
                    </Modal.Footer>
                </Form>
            </Modal>

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
                            {salvandoNumero ? <Spinner animation="border" size="sm" /> : <Plus size={16} />}
                            Confirmar Alteração
                        </button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CadastrosFiscais;
