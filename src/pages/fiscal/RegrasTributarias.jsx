import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Spinner, Badge, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { Plus, Edit, Trash2, Calculator, ShieldCheck, RefreshCw } from 'lucide-react';

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'EX'
];

const RegrasTributarias = () => {
    const [abaAtiva, setAbaAtiva] = useState('icms');
    const [regras, setRegras] = useState([]);
    const [cstsIbs, setCstsIbs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const initialForm = {
        id: '',
        nome_regra: '',
        validade_inicio: new Date().toISOString().split('T')[0],
        validade_fim: '',
        uf_origem: '',
        uf_destino: '',
        ncm: '',
        cfop: '',
        cst_csosn: '102',
        cst: '',
        cClassTrib: '',
        mva_st: '',
        aliquota_icms: '',
        aliquota_icms_st: '',
        aliquota: '',
        aliquota_pis: '',
        aliquota_cofins: '',
        aliquota_ibs: '',
        aliquota_cbs: ''
    };

    const [formData, setFormData] = useState(initialForm);

    // Estado do Simulador Tributário
    const [simForm, setSimForm] = useState({
        uf_origem: 'PA',
        uf_destino: 'PA',
        ncm: '21069090',
        cfop: '5102',
        valor_item: '100.00',
        frete: '0',
        seguro: '0',
        outros: '0',
        desconto: '0'
    });
    const [simResult, setSimResult] = useState(null);
    const [simulando, setSimulando] = useState(false);

    const flatSelectStyle = {
        height: '48px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)'
    };

    const fetchRegras = async () => {
        if (abaAtiva === 'simulador') return;
        setLoading(true);
        try {
            const { data } = await api.get(`/fiscal/regras/${abaAtiva}`);
            setRegras(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Erro ao carregar regras tributárias.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCstIbs = async () => {
        try {
            const { data } = await api.get('/fiscal/tabelas/cst-ibs-com-classificacoes');
            setCstsIbs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        setFormData(initialForm);
        fetchRegras();
        if (abaAtiva === 'ibs-cbs') {
            fetchCstIbs();
        }
    }, [abaAtiva]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.nome_regra || !formData.validade_inicio) {
            return toast.warning('Preencha o Nome da Regra e a Validade Inicial.');
        }
        setSalvando(true);
        try {
            const payload = { ...formData };
            if (!payload.id) delete payload.id;
            await api.post(`/fiscal/regras/${abaAtiva}`, payload);
            toast.success('Regra tributária salva com sucesso!');
            setFormData(initialForm);
            fetchRegras();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar regra tributária.');
        } finally {
            setSalvando(false);
        }
    };

    const handleEdit = (r) => {
        setFormData({
            id: r.id,
            nome_regra: r.nome_regra || '',
            validade_inicio: r.validade_inicio ? new Date(r.validade_inicio).toISOString().split('T')[0] : '',
            validade_fim: r.validade_fim ? new Date(r.validade_fim).toISOString().split('T')[0] : '',
            uf_origem: r.uf_origem || '',
            uf_destino: r.uf_destino || '',
            ncm: r.ncm || '',
            cfop: r.cfop || '',
            cst_csosn: r.cst_csosn || '',
            cst: r.cst || '',
            cClassTrib: r.cClassTrib || '',
            mva_st: r.mva_st ?? '',
            aliquota_icms: r.aliquota ?? r.aliquota_icms ?? '',
            aliquota_icms_st: r.aliquota_st ?? r.aliquota_icms_st ?? '',
            aliquota: r.aliquota ?? '',
            aliquota_pis: r.aliquota_pis ?? '',
            aliquota_cofins: r.aliquota_cofins ?? '',
            aliquota_ibs: r.aliquota_ibs ?? '',
            aliquota_cbs: r.aliquota_cbs ?? ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente excluir esta regra tributária?')) return;
        try {
            await api.delete(`/fiscal/regras/${abaAtiva}/${id}`);
            toast.success('Regra excluída com sucesso.');
            fetchRegras();
        } catch (error) {
            toast.error('Erro ao excluir regra.');
        }
    };

    const handleSimular = async (e) => {
        e.preventDefault();
        setSimulando(true);
        try {
            const { data } = await api.post('/fiscal/regras/calcular-item', {
                uf_origem: simForm.uf_origem,
                uf_destino: simForm.uf_destino,
                ncm: simForm.ncm,
                cfop: simForm.cfop,
                valor_item: Number(simForm.valor_item || 0),
                frete: Number(simForm.frete || 0),
                seguro: Number(simForm.seguro || 0),
                outros: Number(simForm.outros || 0),
                desconto: Number(simForm.desconto || 0)
            });
            setSimResult(data);
            toast.success('Cálculo tributário simulado!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao simular impostos.');
        } finally {
            setSimulando(false);
        }
    };

    const activeCstObj = cstsIbs.find(c => c.codigo === formData.cst);
    const activeClassificacoes = activeCstObj?.classificacoes || [];
    const classTribDetails = activeClassificacoes.find(c => c.codigo === formData.cClassTrib);

    const tabs = [
        { id: 'icms', label: 'ICMS / CSOSN' },
        { id: 'pis-cofins', label: 'PIS / COFINS' },
        { id: 'ipi', label: 'IPI' },
        { id: 'ibs-cbs', label: 'IBS / CBS (Reforma Tributária)' },
        { id: 'simulador', label: 'Simulador de Impostos' }
    ];

    return (
        <div className="container-fluid mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Motor de Regras Tributárias</h4>
                    <small className="text-muted">
                        Configure as regras automáticas de ICMS, PIS/COFINS, IPI e IBS/CBS aplicadas na emissão de NF-e e NFC-e.
                    </small>
                </div>
                {abaAtiva !== 'simulador' && (
                    <LightButton onClick={fetchRegras}>
                        <RefreshCw size={16} className="me-2" /> Atualizar
                    </LightButton>
                )}
            </div>

            {/* Navegação de Abas */}
            <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setAbaAtiva(t.id)}
                        className={`btn rounded-pill px-4 py-2 fw-semibold small transition-all ${
                            abaAtiva === t.id
                                ? 'btn-primary shadow-sm'
                                : 'btn-light text-secondary border'
                        }`}
                    >
                        {t.id === 'simulador' && <Calculator size={15} className="me-1" />}
                        {t.label}
                    </button>
                ))}
            </div>

            {abaAtiva === 'simulador' ? (
                <Row className="g-4">
                    <Col lg={5}>
                        <div className="bg-white rounded-4 border p-4 shadow-sm">
                            <h5 className="fw-bold mb-3 d-flex align-items-center">
                                <Calculator size={20} className="me-2 text-primary" /> Simular Item Fiscal
                            </h5>
                            <Form onSubmit={handleSimular}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">UF Origem</Form.Label>
                                        <Form.Select
                                            style={flatSelectStyle}
                                            value={simForm.uf_origem}
                                            onChange={e => setSimForm({ ...simForm, uf_origem: e.target.value })}
                                        >
                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">UF Destino</Form.Label>
                                        <Form.Select
                                            style={flatSelectStyle}
                                            value={simForm.uf_destino}
                                            onChange={e => setSimForm({ ...simForm, uf_destino: e.target.value })}
                                        >
                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">NCM do Produto</Form.Label>
                                        <CustomInput
                                            value={simForm.ncm}
                                            onChange={e => setSimForm({ ...simForm, ncm: e.target.value })}
                                            placeholder="Ex: 21069090"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">CFOP da Operação</Form.Label>
                                        <CustomInput
                                            value={simForm.cfop}
                                            onChange={e => setSimForm({ ...simForm, cfop: e.target.value })}
                                            placeholder="Ex: 5102"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">Valor do Produto (R$)</Form.Label>
                                        <CustomInput
                                            type="number"
                                            step="0.01"
                                            value={simForm.valor_item}
                                            onChange={e => setSimForm({ ...simForm, valor_item: e.target.value })}
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-semibold mb-1">Desconto (R$)</Form.Label>
                                        <CustomInput
                                            type="number"
                                            step="0.01"
                                            value={simForm.desconto}
                                            onChange={e => setSimForm({ ...simForm, desconto: e.target.value })}
                                        />
                                    </Col>
                                    <Col md={12} className="pt-2">
                                        <CtaButton type="submit" className="w-100" disabled={simulando}>
                                            {simulando ? <Spinner size="sm" /> : 'Executar Motor Tributário'}
                                        </CtaButton>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </Col>

                    <Col lg={7}>
                        <div className="bg-white rounded-4 border p-4 shadow-sm h-100">
                            <h5 className="fw-bold mb-3 d-flex align-items-center">
                                <ShieldCheck size={20} className="me-2 text-success" /> Resultado do Motor Tributário
                            </h5>
                            {!simResult ? (
                                <div className="text-center py-5 text-muted">
                                    Preencha os dados ao lado e clique em <strong>Executar Motor Tributário</strong> para testar quais regras serão aplicadas.
                                </div>
                            ) : (
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Card className="border rounded-4 p-3 h-100 bg-light bg-opacity-50">
                                            <h6 className="fw-bold text-primary mb-2">ICMS</h6>
                                            <div className="small">
                                                <div><strong>Regra:</strong> {simResult.tributacao?.icms?.regra_aplicada || 'Padrão / Simples'}</div>
                                                <div><strong>CST/CSOSN:</strong> <Badge bg="secondary">{simResult.tributacao?.icms?.cst_csosn}</Badge></div>
                                                <div><strong>Base de Cálculo:</strong> R$ {Number(simResult.tributacao?.icms?.base || 0).toFixed(2)}</div>
                                                <div><strong>Alíquota:</strong> {Number(simResult.tributacao?.icms?.aliquota || 0).toFixed(2)}%</div>
                                                <div><strong>Valor ICMS:</strong> R$ {Number(simResult.tributacao?.icms?.valor || 0).toFixed(2)}</div>
                                                <div><strong>Valor ICMS ST:</strong> R$ {Number(simResult.tributacao?.icms_st?.valor || 0).toFixed(2)}</div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="border rounded-4 p-3 h-100 bg-light bg-opacity-50">
                                            <h6 className="fw-bold text-info mb-2">PIS / COFINS</h6>
                                            <div className="small">
                                                <div><strong>Regra:</strong> {simResult.tributacao?.pis?.regra_aplicada || 'Padrão'}</div>
                                                <div><strong>CST:</strong> <Badge bg="secondary">{simResult.tributacao?.pis?.cst}</Badge></div>
                                                <div><strong>PIS ({simResult.tributacao?.pis?.aliquota || 0}%):</strong> R$ {Number(simResult.tributacao?.pis?.valor || 0).toFixed(2)}</div>
                                                <div><strong>COFINS ({simResult.tributacao?.cofins?.aliquota || 0}%):</strong> R$ {Number(simResult.tributacao?.cofins?.valor || 0).toFixed(2)}</div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="border rounded-4 p-3 h-100 bg-light bg-opacity-50">
                                            <h6 className="fw-bold text-warning text-dark mb-2">IPI</h6>
                                            <div className="small">
                                                <div><strong>Regra:</strong> {simResult.tributacao?.ipi?.regra_aplicada || 'Isento / Não Tributado'}</div>
                                                <div><strong>CST:</strong> <Badge bg="secondary">{simResult.tributacao?.ipi?.cst}</Badge></div>
                                                <div><strong>Alíquota:</strong> {Number(simResult.tributacao?.ipi?.aliquota || 0).toFixed(2)}%</div>
                                                <div><strong>Valor IPI:</strong> R$ {Number(simResult.tributacao?.ipi?.valor || 0).toFixed(2)}</div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="border rounded-4 p-3 h-100 bg-light bg-opacity-50">
                                            <h6 className="fw-bold text-success mb-2">IBS / CBS (Reforma Tributária)</h6>
                                            <div className="small">
                                                <div><strong>CST IBS/CBS:</strong> <Badge bg="success">{simResult.tributacao?.ibs?.cst || '000'}</Badge></div>
                                                <div><strong>cClassTrib:</strong> <code>{simResult.tributacao?.ibs?.cClassTrib || '000001'}</code></div>
                                                <div><strong>IBS ({simResult.tributacao?.ibs?.aliquota || 0}%):</strong> R$ {Number(simResult.tributacao?.ibs?.valor || 0).toFixed(2)}</div>
                                                <div><strong>CBS ({simResult.tributacao?.cbs?.aliquota || 0}%):</strong> R$ {Number(simResult.tributacao?.cbs?.valor || 0).toFixed(2)}</div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    </Col>
                </Row>
            ) : (
                <>
                    {/* Formulário de Criação/Edição de Regra */}
                    <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                        <h5 className="fw-bold mb-3">
                            {formData.id ? `Editando Regra (${abaAtiva.toUpperCase()})` : `Nova Regra de ${abaAtiva.toUpperCase()}`}
                        </h5>
                        <Form onSubmit={handleSave}>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Label className="small fw-semibold mb-1">Nome da Regra</Form.Label>
                                    <CustomInput
                                        value={formData.nome_regra}
                                        onChange={e => setFormData({ ...formData, nome_regra: e.target.value })}
                                        placeholder="Ex: Regra Geral Simples Nacional - CSOSN 102"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label className="small fw-semibold mb-1">Validade Início</Form.Label>
                                    <CustomInput
                                        type="date"
                                        value={formData.validade_inicio}
                                        onChange={e => setFormData({ ...formData, validade_inicio: e.target.value })}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label className="small fw-semibold mb-1">Validade Fim (Opcional)</Form.Label>
                                    <CustomInput
                                        type="date"
                                        value={formData.validade_fim}
                                        onChange={e => setFormData({ ...formData, validade_fim: e.target.value })}
                                    />
                                </Col>

                                {abaAtiva === 'icms' && (
                                    <>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">UF Origem</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={formData.uf_origem}
                                                onChange={e => setFormData({ ...formData, uf_origem: e.target.value })}
                                            >
                                                <option value="">Todas (*)</option>
                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">UF Destino</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={formData.uf_destino}
                                                onChange={e => setFormData({ ...formData, uf_destino: e.target.value })}
                                            >
                                                <option value="">Todas (*)</option>
                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">NCM (Vazio = Todos)</Form.Label>
                                            <CustomInput
                                                value={formData.ncm}
                                                onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                                                placeholder="Ex: 21069090"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">CFOP (Vazio = Todos)</Form.Label>
                                            <CustomInput
                                                value={formData.cfop}
                                                onChange={e => setFormData({ ...formData, cfop: e.target.value })}
                                                placeholder="Ex: 5102"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">CST / CSOSN</Form.Label>
                                            <CustomInput
                                                value={formData.cst_csosn}
                                                onChange={e => setFormData({ ...formData, cst_csosn: e.target.value })}
                                                placeholder="Ex: 102 ou 00"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota ICMS (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_icms}
                                                onChange={e => setFormData({ ...formData, aliquota_icms: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">MVA ST (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.mva_st}
                                                onChange={e => setFormData({ ...formData, mva_st: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota ICMS ST (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_icms_st}
                                                onChange={e => setFormData({ ...formData, aliquota_icms_st: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                    </>
                                )}

                                {abaAtiva === 'pis-cofins' && (
                                    <>
                                        <Col md={4}>
                                            <Form.Label className="small fw-semibold mb-1">CST PIS/COFINS</Form.Label>
                                            <CustomInput
                                                value={formData.cst}
                                                onChange={e => setFormData({ ...formData, cst: e.target.value })}
                                                placeholder="Ex: 49, 07, 01"
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota PIS (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_pis}
                                                onChange={e => setFormData({ ...formData, aliquota_pis: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota COFINS (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_cofins}
                                                onChange={e => setFormData({ ...formData, aliquota_cofins: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                    </>
                                )}

                                {abaAtiva === 'ipi' && (
                                    <>
                                        <Col md={6}>
                                            <Form.Label className="small fw-semibold mb-1">CST IPI</Form.Label>
                                            <CustomInput
                                                value={formData.cst}
                                                onChange={e => setFormData({ ...formData, cst: e.target.value })}
                                                placeholder="Ex: 53, 99, 50"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota IPI (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota}
                                                onChange={e => setFormData({ ...formData, aliquota: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </Col>
                                    </>
                                )}

                                {abaAtiva === 'ibs-cbs' && (
                                    <>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">NCM (Opcional)</Form.Label>
                                            <CustomInput
                                                value={formData.ncm}
                                                onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                                                placeholder="Ex: 84713010"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">CFOP (Opcional)</Form.Label>
                                            <CustomInput
                                                value={formData.cfop}
                                                onChange={e => setFormData({ ...formData, cfop: e.target.value })}
                                                placeholder="Ex: 5102"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota IBS (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_ibs}
                                                onChange={e => setFormData({ ...formData, aliquota_ibs: e.target.value })}
                                                placeholder="0.10"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="small fw-semibold mb-1">Alíquota CBS (%)</Form.Label>
                                            <CustomInput
                                                type="number"
                                                step="0.01"
                                                value={formData.aliquota_cbs}
                                                onChange={e => setFormData({ ...formData, aliquota_cbs: e.target.value })}
                                                placeholder="0.90"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small fw-semibold mb-1">CST IBS/CBS</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={formData.cst}
                                                onChange={e => setFormData({ ...formData, cst: e.target.value, cClassTrib: '' })}
                                            >
                                                <option value="">Selecione um CST...</option>
                                                {cstsIbs.map(c => (
                                                    <option key={c.id} value={c.codigo}>{c.codigo} - {c.descricao}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small fw-semibold mb-1">cClassTrib (Classificação Tributária)</Form.Label>
                                            <Form.Select
                                                style={flatSelectStyle}
                                                value={formData.cClassTrib}
                                                disabled={!formData.cst}
                                                onChange={e => setFormData({ ...formData, cClassTrib: e.target.value })}
                                            >
                                                <option value="">{formData.cst ? 'Selecione a classificação...' : 'Selecione o CST primeiro'}</option>
                                                {activeClassificacoes.map(c => (
                                                    <option key={c.id} value={c.codigo}>{c.codigo} - {c.descricao_reduzida}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        {classTribDetails && (
                                            <Col md={12}>
                                                <div className="p-3 rounded-4 border bg-light small">
                                                    <strong>Detalhes cClassTrib {classTribDetails.codigo}:</strong>{' '}
                                                    Redução IBS: {classTribDetails.reducao_percentual_ibs || 0}% |{' '}
                                                    Redução CBS: {classTribDetails.reducao_percentual_cbs || 0}% |{' '}
                                                    Tributação Regular: {classTribDetails.tributacao_regular ? 'Sim' : 'Não'} |{' '}
                                                    Crédito Presumido: {classTribDetails.credito_presumido ? 'Sim' : 'Não'}
                                                </div>
                                            </Col>
                                        )}
                                    </>
                                )}

                                <Col md={12} className="d-flex gap-2 pt-2">
                                    <CtaButton type="submit" disabled={salvando}>
                                        <Plus size={18} className="me-1" />
                                        {salvando ? 'Salvando...' : formData.id ? 'Atualizar Regra' : 'Salvar Regra'}
                                    </CtaButton>
                                    {formData.id && (
                                        <LightButton type="button" onClick={() => setFormData(initialForm)}>
                                            Cancelar Edição
                                        </LightButton>
                                    )}
                                </Col>
                            </Row>
                        </Form>
                    </div>

                    {/* Tabela de Regras Cadastradas */}
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">NOME DA REGRA</th>
                                        <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">VIGÊNCIA</th>
                                        <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">PARÂMETROS TÉCNICOS</th>
                                        <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regras.map(r => (
                                        <tr key={r.id}>
                                            <td className="py-3 px-4 fw-bold">{r.nome_regra}</td>
                                            <td className="py-3 px-4 small text-muted">
                                                {r.validade_inicio ? new Date(r.validade_inicio).toLocaleDateString('pt-BR') : '-'} até{' '}
                                                {r.validade_fim ? new Date(r.validade_fim).toLocaleDateString('pt-BR') : 'Atual'}
                                            </td>
                                            <td className="py-3 px-4 small">
                                                {abaAtiva === 'icms' && (
                                                    <>
                                                        <Badge bg="secondary" className="me-2">CST/CSOSN: {r.cst_csosn}</Badge>
                                                        <span className="text-muted">
                                                            UF: {r.uf_origem || '*'} → {r.uf_destino || '*'} | NCM: {r.ncm || '*'} | CFOP: {r.cfop || '*'} | Alíq: {Number(r.aliquota ?? r.aliquota_icms ?? 0)}%
                                                        </span>
                                                    </>
                                                )}
                                                {abaAtiva === 'pis-cofins' && (
                                                    <>
                                                        <Badge bg="info" text="dark" className="me-2">CST: {r.cst}</Badge>
                                                        <span className="text-muted">PIS: {Number(r.aliquota_pis || 0)}% | COFINS: {Number(r.aliquota_cofins || 0)}%</span>
                                                    </>
                                                )}
                                                {abaAtiva === 'ipi' && (
                                                    <>
                                                        <Badge bg="warning" text="dark" className="me-2">CST: {r.cst}</Badge>
                                                        <span className="text-muted">Alíquota: {Number(r.aliquota || 0)}%</span>
                                                    </>
                                                )}
                                                {abaAtiva === 'ibs-cbs' && (
                                                    <>
                                                        <Badge bg="success" className="me-2">CST: {r.cst || '*'}</Badge>
                                                        <Badge bg="dark" className="me-2">cClassTrib: {r.cClassTrib || '*'}</Badge>
                                                        <span className="text-muted">
                                                            NCM: {r.ncm || '*'} | CFOP: {r.cfop || '*'} | IBS: {Number(r.aliquota_ibs || 0)}% | CBS: {Number(r.aliquota_cbs || 0)}%
                                                        </span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-end">
                                                <LightButton className="btn-sm me-2 px-2" onClick={() => handleEdit(r)}>
                                                    <Edit size={16} />
                                                </LightButton>
                                                <RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleDelete(r.id)}>
                                                    <Trash2 size={16} />
                                                </RedButton>
                                            </td>
                                        </tr>
                                    ))}
                                    {regras.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5 text-muted">
                                                Nenhuma regra cadastrada para {abaAtiva.toUpperCase()}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RegrasTributarias;
