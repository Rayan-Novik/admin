import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { Plus, Trash2, Search, Database } from 'lucide-react';

const TabelasFiscais = () => {
    const [tabelaAtiva, setTabelaAtiva] = useState('cfop');
    const [dados, setDados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [busca, setBusca] = useState('');

    const initialForm = {
        codigo: '',
        descricao: '',
        tipo_operacao: 'SAIDA',
        aplicacao: 'INTERNA',
        aliquota_nacional: '',
        aliquota_importada: ''
    };

    const [formData, setFormData] = useState(initialForm);

    const flatSelectStyle = {
        height: '48px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)'
    };

    const tabs = [
        { id: 'cfop', label: 'CFOP' },
        { id: 'ncm', label: 'NCM' },
        { id: 'cest', label: 'CEST' },
        { id: 'origem', label: 'Origem da Mercadoria' },
        { id: 'cst', label: 'CST (Regime Normal)' },
        { id: 'csosn', label: 'CSOSN (Simples Nacional)' },
        { id: 'cst-ibs-com-classificacoes', label: 'IBS / CBS (cClassTrib)' }
    ];

    const fetchDados = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/fiscal/tabelas/${tabelaAtiva}`);
            setDados(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Erro ao carregar registros da tabela fiscal.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setFormData(initialForm);
        setBusca('');
        fetchDados();
    }, [tabelaAtiva]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.codigo || !formData.descricao) {
            return toast.warning('Preencha o código e a descrição.');
        }
        setSalvando(true);
        try {
            await api.post(`/fiscal/tabelas/${tabelaAtiva}`, formData);
            toast.success('Registro salvo com sucesso!');
            setFormData(initialForm);
            fetchDados();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Erro ao salvar registro.');
        } finally {
            setSalvando(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente excluir este código fiscal?')) return;
        try {
            await api.delete(`/fiscal/tabelas/${tabelaAtiva}/${id}`);
            toast.success('Registro removido.');
            fetchDados();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao remover registro.');
        }
    };

    const dadosFiltrados = dados.filter(item => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
            String(item.codigo || '').toLowerCase().includes(termo) ||
            String(item.descricao || '').toLowerCase().includes(termo)
        );
    });

    return (
        <div className="container-fluid mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Tabelas Fiscais de Apoio (SEFAZ)</h4>
                    <small className="text-muted">
                        Gerencie e consulte códigos oficiais de CFOP, NCM, CEST, Origem, CST, CSOSN e Classificações Tributárias IBS/CBS.
                    </small>
                </div>
            </div>

            {/* Abas */}
            <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTabelaAtiva(t.id)}
                        className={`btn rounded-pill px-4 py-2 fw-semibold small ${
                            tabelaAtiva === t.id ? 'btn-primary shadow-sm' : 'btn-light text-secondary border'
                        }`}
                    >
                        <Database size={14} className="me-1" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Formulário de Cadastro (exceto aba consolidada IBS/CBS) */}
            {tabelaAtiva !== 'cst-ibs-com-classificacoes' && (
                <div className="bg-white rounded-4 border p-4 shadow-sm mb-4">
                    <h6 className="fw-bold mb-3">Adicionar / Atualizar em {tabs.find(t => t.id === tabelaAtiva)?.label}</h6>
                    <Form onSubmit={handleSave}>
                        <Row className="g-3 align-items-end">
                            <Col md={3}>
                                <Form.Label className="small fw-semibold mb-1">Código Oficial</Form.Label>
                                <CustomInput
                                    value={formData.codigo}
                                    onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                    placeholder={tabelaAtiva === 'cfop' ? 'Ex: 5102' : 'Código'}
                                />
                            </Col>
                            <Col md={tabelaAtiva === 'cfop' || tabelaAtiva === 'ncm' ? 5 : 7}>
                                <Form.Label className="small fw-semibold mb-1">Descrição</Form.Label>
                                <CustomInput
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descrição oficial SEFAZ"
                                />
                            </Col>

                            {tabelaAtiva === 'cfop' && (
                                <>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Operação</Form.Label>
                                        <Form.Select
                                            style={flatSelectStyle}
                                            value={formData.tipo_operacao}
                                            onChange={e => setFormData({ ...formData, tipo_operacao: e.target.value })}
                                        >
                                            <option value="SAIDA">Saída</option>
                                            <option value="ENTRADA">Entrada</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Destino</Form.Label>
                                        <Form.Select
                                            style={flatSelectStyle}
                                            value={formData.aplicacao}
                                            onChange={e => setFormData({ ...formData, aplicacao: e.target.value })}
                                        >
                                            <option value="INTERNA">Interna</option>
                                            <option value="INTERESTADUAL">Interestadual</option>
                                            <option value="EXTERIOR">Exterior</option>
                                        </Form.Select>
                                    </Col>
                                </>
                            )}

                            {tabelaAtiva === 'ncm' && (
                                <>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Alíq. Nac. (%)</Form.Label>
                                        <CustomInput
                                            type="number"
                                            step="0.01"
                                            value={formData.aliquota_nacional}
                                            onChange={e => setFormData({ ...formData, aliquota_nacional: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="small fw-semibold mb-1">Alíq. Imp. (%)</Form.Label>
                                        <CustomInput
                                            type="number"
                                            step="0.01"
                                            value={formData.aliquota_importada}
                                            onChange={e => setFormData({ ...formData, aliquota_importada: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </Col>
                                </>
                            )}

                            <Col md={tabelaAtiva === 'cfop' || tabelaAtiva === 'ncm' ? 12 : 2} className="text-end">
                                <CtaButton type="submit" className="w-100" disabled={salvando}>
                                    <Plus size={16} className="me-1" /> {salvando ? 'Salvando...' : 'Salvar'}
                                </CtaButton>
                            </Col>
                        </Row>
                    </Form>
                </div>
            )}

            {/* Barra de Pesquisa */}
            <div className="bg-white rounded-4 border p-3 shadow-sm mb-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        className="form-control border-0 bg-transparent shadow-none"
                        placeholder="Filtrar por código ou descrição..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
                <Badge bg="primary" className="rounded-pill px-3 py-2">
                    {dadosFiltrados.length} registros
                </Badge>
            </div>

            {/* Listagem */}
            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0" style={{ width: '140px' }}>CÓDIGO</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">DESCRIÇÃO</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">DETALHES</th>
                                <th className="py-3 px-4 text-end text-muted small fw-semibold border-bottom-0" style={{ width: '100px' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dadosFiltrados.map(d => (
                                <tr key={d.id || d.codigo}>
                                    <td className="py-3 px-4 fw-bold font-monospace">{d.codigo}</td>
                                    <td className="py-3 px-4">{d.descricao}</td>
                                    <td className="py-3 px-4 small text-muted">
                                        {d.tipo_operacao && (
                                            <Badge bg={d.tipo_operacao === 'SAIDA' ? 'info' : 'warning'} text="dark" className="me-2">
                                                {d.tipo_operacao} / {d.aplicacao}
                                            </Badge>
                                        )}
                                        {d.aliquota_nacional !== undefined && d.aliquota_nacional !== null && (
                                            <Badge bg="secondary" className="me-2">IBPT Nac: {Number(d.aliquota_nacional)}%</Badge>
                                        )}
                                        {Array.isArray(d.classificacoes) && (
                                            <div>
                                                <Badge bg="success" className="mb-1">{d.classificacoes.length} cClassTrib vinculados</Badge>
                                                <div className="text-muted" style={{ maxHeight: '90px', overflowY: 'auto', fontSize: '11px' }}>
                                                    {d.classificacoes.slice(0, 8).map(c => (
                                                        <div key={c.id}><code>{c.codigo}</code> - {c.descricao_reduzida}</div>
                                                    ))}
                                                    {d.classificacoes.length > 8 && <div>...e mais {d.classificacoes.length - 8} classificações</div>}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-end">
                                        {tabelaAtiva !== 'cst-ibs-com-classificacoes' && (
                                            <RedButton
                                                className="btn-sm px-2 bg-transparent text-danger border-0"
                                                onClick={() => handleDelete(d.id)}
                                            >
                                                <Trash2 size={16} />
                                            </RedButton>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {dadosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TabelasFiscais;
