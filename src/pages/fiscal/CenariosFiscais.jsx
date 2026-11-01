import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Modal, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CenariosFiscais = () => {
    const [cenarios, setCenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [formData, setFormData] = useState({
        id: '', operacao: '', documento: 'NFC-e', finalidade: 1, modelo: '65',
        cfop_padrao: '', movimenta_estoque: true, gera_financeiro: true
    });

    const fetchCenarios = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/fiscal/cenarios');
            setCenarios(data);
        } catch (error) {
            toast.error('Erro ao carregar cenários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCenarios(); }, []);

    const handleOpenModal = (cenario = null) => {
        if (cenario) {
            setFormData(cenario);
        } else {
            setFormData({
                id: '', operacao: '', documento: 'NFC-e', finalidade: 1, modelo: '65',
                cfop_padrao: '', movimenta_estoque: true, gera_financeiro: true
            });
        }
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.operacao || !formData.cfop_padrao) return toast.warning('Preencha a operação e o CFOP.');
        setSalvando(true);
        try {
            const payload = { ...formData, finalidade: Number(formData.finalidade) };
            if (formData.id) {
                await api.put(`/fiscal/cenarios/${formData.id}`, payload);
                toast.success('Cenário atualizado!');
            } else {
                await api.post('/fiscal/cenarios', payload);
                toast.success('Cenário criado!');
            }
            setModalOpen(false);
            fetchCenarios();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar cenário.');
        } finally {
            setSalvando(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este cenário? Ele sumirá do PDV.')) return;
        try {
            await api.delete(`/fiscal/cenarios/${id}`);
            toast.success('Removido com sucesso.');
            fetchCenarios();
        } catch (error) {
            toast.error('Erro ao excluir.');
        }
    };

    const flatSelectStyle = { height: '48px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)' };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Cenários Fiscais</h4>
                    <small className="text-muted">Configure os botões e regras de venda para o seu PDV.</small>
                </div>
                <CtaButton onClick={() => handleOpenModal()}>
                    <Plus size={18} className="me-2" /> Novo Cenário
                </CtaButton>
            </div>

            {loading ? <Spinner animation="border" variant="primary" /> : (
                <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">OPERAÇÃO</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">TIPO</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">CFOP</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-center">ESTOQUE / FINANC.</th>
                                <th className="py-3 px-4 text-end border-bottom-0">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cenarios.map(cen => (
                                <tr key={cen.id}>
                                    <td className="py-3 px-4 fw-bold">{cen.operacao}</td>
                                    <td className="py-3 px-4">
                                        <Badge bg={cen.modelo === '55' ? 'primary' : 'info'} className="bg-opacity-10 text-dark border">
                                            {cen.documento} (Mod {cen.modelo})
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 fw-medium text-secondary">{cen.cfop_padrao}</td>
                                    <td className="py-3 px-4 text-center">
                                        {cen.movimenta_estoque ? <Badge bg="success" className="me-1">Estoque</Badge> : null}
                                        {cen.gera_financeiro ? <Badge bg="warning" text="dark">Financeiro</Badge> : null}
                                    </td>
                                    <td className="py-3 px-4 text-end">
                                        <LightButton className="btn-sm me-2 px-2" onClick={() => handleOpenModal(cen)}><Edit size={16} /></LightButton>
                                        <RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleDelete(cen.id)}><Trash2 size={16} /></RedButton>
                                    </td>
                                </tr>
                            ))}
                            {cenarios.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhum cenário configurado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold fs-5">{formData.id ? 'Editar Cenário' : 'Novo Cenário'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label className="small fw-semibold mb-1">Nome da Operação (Aparece no PDV)</Form.Label>
                            <CustomInput value={formData.operacao} onChange={(e) => setFormData({...formData, operacao: e.target.value})} placeholder="Ex: Venda Balcão NFC-e" />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-semibold mb-1">Documento</Form.Label>
                            <Form.Select style={flatSelectStyle} value={formData.documento} onChange={(e) => setFormData({...formData, documento: e.target.value, modelo: e.target.value === 'NF-e' ? '55' : '65'})}>
                                <option value="NFC-e">NFC-e (Cupom)</option>
                                <option value="NF-e">NF-e (Nota Grande)</option>
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-semibold mb-1">Finalidade</Form.Label>
                            <Form.Select style={flatSelectStyle} value={formData.finalidade} onChange={(e) => setFormData({...formData, finalidade: e.target.value})}>
                                <option value={1}>1 - Normal</option>
                                <option value={2}>2 - Complementar</option>
                                <option value={3}>3 - Ajuste</option>
                                <option value={4}>4 - Devolução</option>
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-semibold mb-1">CFOP Padrão</Form.Label>
                            <CustomInput value={formData.cfop_padrao} onChange={(e) => setFormData({...formData, cfop_padrao: e.target.value})} placeholder="Ex: 5102" />
                        </Col>
                        <Col md={6}>
                            <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center bg-light">
                                <span className="fw-semibold small">Baixar Estoque Automaticamente?</span>
                                <Form.Check type="switch" checked={formData.movimenta_estoque} onChange={(e) => setFormData({...formData, movimenta_estoque: e.target.checked})} className="fs-5 m-0" />
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="p-3 border rounded-4 d-flex justify-content-between align-items-center bg-light">
                                <span className="fw-semibold small">Gerar Contas a Receber?</span>
                                <Form.Check type="switch" checked={formData.gera_financeiro} onChange={(e) => setFormData({...formData, gera_financeiro: e.target.checked})} className="fs-5 m-0" />
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <LightButton onClick={() => setModalOpen(false)}>Cancelar</LightButton>
                    <CtaButton onClick={handleSave} disabled={salvando}>{salvando ? <Spinner size="sm" /> : 'Salvar Cenário'}</CtaButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CenariosFiscais;