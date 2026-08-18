// IfoodComboModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Card, Button, Spinner, Form, Row, Col, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

const IfoodComboModal = ({ show, onHide, produto, todosProdutos, onSuccess }) => {
    const [loadingCombo, setLoadingCombo] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [comboGroups, setComboGroups] = useState([]);
    const [hasExistingCombo, setHasExistingCombo] = useState(false);

    useEffect(() => {
        if (show && produto) {
            fetchComboData();
        }
    }, [show, produto]);

    const fetchComboData = async () => {
        setLoadingCombo(true);
        setHasExistingCombo(false);
        try {
            const response = await api.get(`/ifood/produtos/${produto.id_produto}/combo`);
            const dadosBanco = response.data;

            if (dadosBanco && dadosBanco.length > 0) {
                const gruposFormatados = dadosBanco.map(g => ({
                    nome: g.nome,
                    minimo: g.minimo,
                    maximo: g.maximo,
                    tipo_grupo: g.tipo_grupo || 'INGREDIENT',
                    complementos: g.complementos.map(c => ({
                        id_produto_add: c.id_produto_add.toString(),
                        preco_adicional: parseFloat(c.preco_adicional)
                    }))
                }));
                setComboGroups(gruposFormatados);
                setHasExistingCombo(true);
            } else {
                setComboGroups([{ nome: '', tipo_grupo: 'INGREDIENT', minimo: 1, maximo: 1, complementos: [{ id_produto_add: '', preco_adicional: 0 }] }]);
            }
        } catch (error) {
            setComboGroups([{ nome: '', tipo_grupo: 'INGREDIENT', minimo: 1, maximo: 1, complementos: [{ id_produto_add: '', preco_adicional: 0 }] }]);
        } finally {
            setLoadingCombo(false);
        }
    };

    const addGroup = () => setComboGroups([...comboGroups, { nome: '', tipo_grupo: 'INGREDIENT', minimo: 0, maximo: 1, complementos: [] }]);

    const addComplemento = (gIndex) => {
        const newGroups = [...comboGroups];
        newGroups[gIndex].complementos.push({ id_produto_add: '', preco_adicional: 0 });
        setComboGroups(newGroups);
    };

    const updateGroup = (gIndex, field, value) => {
        const newGroups = [...comboGroups];
        newGroups[gIndex][field] = value;
        setComboGroups(newGroups);
    };

    const updateComplemento = (gIndex, cIndex, field, value) => {
        const newGroups = [...comboGroups];
        newGroups[gIndex].complementos[cIndex][field] = value;
        setComboGroups(newGroups);
    };

    const removeComplemento = (gIndex, cIndex) => {
        const newGroups = [...comboGroups];
        newGroups[gIndex].complementos.splice(cIndex, 1);
        setComboGroups(newGroups);
    };

    const removeGroup = (gIndex) => {
        const newGroups = [...comboGroups];
        newGroups.splice(gIndex, 1);
        setComboGroups(newGroups);
    };

    const handleSaveCombo = async () => {
        setIsSaving(true);
        try {
            await api.post(`/ifood/produtos/${produto.id_produto}/combo`, { grupos: comboGroups });
            toast.success('Combo salvo e sincronizado no iFood!');
            onSuccess();
            onHide();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar combo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCombo = async () => {
        if (!window.confirm('Tem certeza que deseja apagar esse combo?')) return;
        setIsSaving(true);
        try {
            await api.delete(`/ifood/produtos/${produto.id_produto}/combo`);
            toast.success('Combo removido com sucesso!');
            onSuccess();
            onHide();
        } catch (error) {
            toast.error('Erro ao remover combo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" contentClassName="modal-dark-fix border-0">
            <Modal.Header closeButton className="border-bottom border-light-subtle py-3 px-4">
                <Modal.Title className="ifood-text-primary d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                        <i className="bi bi-boxes text-primary"></i>
                    </div>
                    <div>
                        <span className="d-block fs-5 fw-bold">Configurar Combo</span>
                        <small className="ifood-text-secondary fw-normal fs-6">{produto?.nome}</small>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-main)', maxHeight: '70vh', overflowY: 'auto' }}>
                {loadingCombo ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 ifood-text-secondary">Buscando estrutura do combo...</p>
                    </div>
                ) : (
                    <>
                        {comboGroups.map((grupo, gIndex) => (
                            <Card className="mb-4 border-light-subtle shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-sidebar)', borderRadius: '15px' }} key={gIndex}>
                                <Card.Header className="d-flex justify-content-between align-items-center border-bottom border-light-subtle py-3 px-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-list-task text-primary"></i>
                                        <h6 className="mb-0 fw-bold ifood-text-primary">Grupo {gIndex + 1}</h6>
                                    </div>
                                    <Button variant="link" className="text-danger p-0 text-decoration-none small d-flex align-items-center gap-1" onClick={() => removeGroup(gIndex)}>
                                        <i className="bi bi-trash3"></i> Remover Grupo
                                    </Button>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-3 mb-4">
                                        <Col md={4}>
                                            <Form.Label className="ifood-text-secondary small fw-bold">NOME DO GRUPO</Form.Label>
                                            <Form.Control type="text" placeholder="Ex: Escolha o sabor" value={grupo.nome} onChange={e => updateGroup(gIndex, 'nome', e.target.value)} className="form-dark-fix rounded-3" />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="ifood-text-secondary small fw-bold">CLASSIFICAÇÃO IFOOD</Form.Label>
                                            <Form.Select value={grupo.tipo_grupo || 'INGREDIENT'} onChange={e => updateGroup(gIndex, 'tipo_grupo', e.target.value)} className="form-dark-fix rounded-3">
                                                <option value="INGREDIENT">Ingredientes</option>
                                                <option value="SPECIFICATION">Especificações</option>
                                                <option value="CROSS_SELL">Cross-sell</option>
                                                <option value="DISPOSABLE">Descartáveis</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="ifood-text-secondary small fw-bold">MÍN.</Form.Label>
                                            <Form.Control type="number" min="0" value={grupo.minimo} onChange={e => updateGroup(gIndex, 'minimo', e.target.value)} className="form-dark-fix rounded-3" />
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="ifood-text-secondary small fw-bold">MÁX.</Form.Label>
                                            <Form.Control type="number" min="1" value={grupo.maximo} onChange={e => updateGroup(gIndex, 'maximo', e.target.value)} className="form-dark-fix rounded-3" />
                                        </Col>
                                    </Row>

                                    <div className="bg-black bg-opacity-10 p-3 rounded-4 border border-light-subtle border-opacity-10">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="ifood-text-primary small fw-bold mb-0">PRODUTOS DISPONÍVEIS NESTE GRUPO</h6>
                                            <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill">
                                                {grupo.complementos.length} itens
                                            </Badge>
                                        </div>

                                        {grupo.complementos.map((comp, cIndex) => (
                                            <Row className="g-2 mb-2 align-items-center" key={cIndex}>
                                                <Col md={7}>
                                                    <Form.Select value={comp.id_produto_add} onChange={e => updateComplemento(gIndex, cIndex, 'id_produto_add', e.target.value)} className="form-dark-fix rounded-3">
                                                        <option value="">Selecione um item...</option>
                                                        {todosProdutos.filter(p => p.id_produto !== produto?.id_produto).map(p => (
                                                            <option key={p.id_produto} value={p.id_produto}>
                                                                {p.nome} (R$ {parseFloat(p.preco).toFixed(2)})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="input-group">
                                                        <span className="input-group-text form-dark-fix border-end-0 text-success rounded-start-3">R$</span>
                                                        <Form.Control type="number" step="0.01" placeholder="Adicional" value={comp.preco_adicional} onChange={e => updateComplemento(gIndex, cIndex, 'preco_adicional', e.target.value)} className="form-dark-fix border-start-0 rounded-end-3" />
                                                    </div>
                                                </Col>
                                                <Col md={1} className="text-end">
                                                    <Button variant="link" className="text-danger p-0" onClick={() => removeComplemento(gIndex, cIndex)}>
                                                        <i className="bi bi-x-lg"></i>
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))}

                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="mt-3 rounded-3 fw-bold border-0 bg-primary bg-opacity-10 d-flex align-items-center gap-2"
                                            onClick={() => addComplemento(gIndex)}
                                        >
                                            <i className="bi bi-plus-lg"></i> Adicionar Item
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}

                        <Button
                            variant="primary"
                            onClick={addGroup}
                            className="w-100 py-3 rounded-4 shadow-sm fw-bold border-0 d-flex align-items-center justify-content-center gap-2 mb-3"
                            style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', color: '#0d6efd' }}
                        >
                            <i className="bi bi-plus-circle-fill"></i> NOVO GRUPO DE OPÇÕES
                        </Button>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className="border-top border-light-subtle py-3 px-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="w-100 d-flex justify-content-between align-items-center">
                    <div>
                        {hasExistingCombo && (
                            <Button variant="outline-danger" className="rounded-3 border-0 bg-danger bg-opacity-10 px-3 fw-bold" onClick={handleDeleteCombo} disabled={isSaving}>
                                <i className="bi bi-trash3 me-2"></i> EXCLUIR COMBO
                            </Button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" className="rounded-3 px-4 fw-bold border-light-subtle ifood-text-primary" onClick={onHide} disabled={isSaving}>
                            CANCELAR
                        </Button>
                        <Button variant="success" className="rounded-3 px-4 fw-bold shadow-sm" onClick={handleSaveCombo} disabled={isSaving || loadingCombo}>
                            {isSaving ? (
                                <><Spinner size="sm" className="me-2" /> SALVANDO...</>
                            ) : (
                                <><i className="bi bi-cloud-check-fill me-2"></i> SALVAR E SINCRONIZAR</>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default IfoodComboModal;