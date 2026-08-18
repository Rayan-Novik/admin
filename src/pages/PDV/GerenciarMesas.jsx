import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

const GerenciarMesas = () => {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ id_mesa: null, nome: '', status: 'LIVRE' });

    useEffect(() => {
        carregarMesas();
    }, []);

    const carregarMesas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/mesas');
            setMesas(data);
        } catch (error) {
            toast.error("Erro ao carregar mesas.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({ id_mesa: null, nome: '', status: 'LIVRE' });
        setIsEditing(false);
    };

    const handleShowCreate = () => {
        setFormData({ id_mesa: null, nome: '', status: 'LIVRE' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleShowEdit = (mesa) => {
        setFormData(mesa);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/mesas/${formData.id_mesa}`, formData);
                toast.success("Mesa atualizada!");
            } else {
                await api.post('/mesas', formData);
                toast.success("Mesa criada com sucesso!");
            }
            carregarMesas();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar mesa.");
        }
    };

    const handleDelete = async (id_mesa) => {
        if (!window.confirm("Tem certeza que deseja excluir esta mesa?")) return;
        try {
            await api.delete(`/mesas/${id_mesa}`);
            toast.success("Mesa excluída!");
            carregarMesas();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao excluir mesa.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'LIVRE': return <Badge bg="success">Livre</Badge>;
            case 'OCUPADA': return <Badge bg="danger">Ocupada</Badge>;
            case 'RESERVADA': return <Badge bg="warning" text="dark">Reservada</Badge>;
            case 'FECHANDO': return <Badge bg="info">Fechando Pagamento</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Gestão de Mesas</h2>
                    <p className="text-muted mb-0">Cadastre as mesas e balcões da sua loja física</p>
                </div>
                <Button variant="primary" onClick={handleShowCreate} className="d-flex align-items-center">
                    <i className="bi bi-plus-lg me-2"></i> Nova Mesa
                </Button>
            </div>

            <Card className="shadow-sm border-0 clean-card">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : mesas.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-shop h1 d-block mb-3"></i>
                            <h5>Nenhuma mesa cadastrada</h5>
                            <p>Clique no botão acima para adicionar a primeira mesa do salão.</p>
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Identificação da Mesa</th>
                                    <th>Status Atual</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mesas.map((mesa) => (
                                    <tr key={mesa.id_mesa}>
                                        <td className="text-muted">#{mesa.id_mesa}</td>
                                        <td className="fw-bold">{mesa.nome}</td>
                                        <td>{getStatusBadge(mesa.status)}</td>
                                        <td className="text-end">
                                            <Button variant="light" size="sm" className="me-2 text-primary" onClick={() => handleShowEdit(mesa)}>
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(mesa.id_mesa)}>
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleClose}>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditing ? 'Editar Mesa' : 'Nova Mesa'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Identificação da Mesa</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ex: Mesa 01, Camarote VIP"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Status Inicial</Form.Label>
                            <Form.Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="LIVRE">Livre</option>
                                <option value="OCUPADA">Ocupada</option>
                                <option value="RESERVADA">Reservada</option>
                            </Form.Select>
                            <Form.Text className="text-muted">O sistema altera o status automaticamente quando uma comanda é aberta.</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                        <Button variant="primary" type="submit">Salvar Mesa</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default GerenciarMesas;