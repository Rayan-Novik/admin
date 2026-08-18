import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Modal, Form, Image, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ComunicadoFormModal = ({ show, handleClose, onSave, comunicado }) => {
    const [formData, setFormData] = useState({ titulo: '', imagem_url: '', link_url: '', ativo: false });
    
    useEffect(() => {
        if (comunicado) { setFormData(comunicado); } 
        else { setFormData({ titulo: '', imagem_url: '', link_url: '', ativo: false }); }
    }, [comunicado]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold h5">{comunicado ? 'Editar Comunicado' : 'Adicionar Comunicado'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">TÍTULO (PARA IDENTIFICAÇÃO)</Form.Label>
                        <Form.Control type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="bg-light border-0 py-2" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">URL DA IMAGEM</Form.Label>
                        <Form.Control type="text" name="imagem_url" value={formData.imagem_url} onChange={handleChange} className="bg-light border-0 py-2" required />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted">LINK DE DESTINO (OPCIONAL)</Form.Label>
                        <Form.Control type="text" name="link_url" value={formData.link_url} onChange={handleChange} className="bg-light border-0 py-2" placeholder="/categoria/promocoes" />
                    </Form.Group>
                    
                    <div className="p-3 bg-light rounded-4 mb-4">
                        <Form.Check 
                            type="switch" 
                            id="ativo-switch"
                            label={<strong className="text-dark">Ativar este comunicado na loja</strong>} 
                            name="ativo" 
                            checked={formData.ativo} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <Button variant="dark" type="submit" className="w-100 rounded-pill fw-bold py-2 shadow-sm">
                        {comunicado ? 'Atualizar Comunicado' : 'Salvar Comunicado'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

const ComunicadoManager = () => {
    const [comunicados, setComunicados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentComunicado, setCurrentComunicado] = useState(null);

    const fetchComunicados = async () => {
        try {
            setLoading(true);
            // 🟢 BLINDAGEM SILENCIOSA: Ignora o erro 403 e retorna array vazio
            const { data } = await api.get('/comunicados').catch(() => ({ data: [] }));
            setComunicados(data || []);
        } catch (err) { 
            console.log("Acesso negado ou erro ao buscar comunicados.");
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchComunicados(); }, []);

    const handleShowModal = (comunicado = null) => {
        setCurrentComunicado(comunicado);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        try {
            if (currentComunicado) {
                await api.put(`/comunicados/${currentComunicado.id_comunicado}`, formData);
                toast.success('Comunicado atualizado!');
            } else {
                await api.post('/comunicados', formData);
                toast.success('Comunicado criado!');
            }
            fetchComunicados();
            setShowModal(false);
        } catch (err) { 
            toast.error('Não foi possível guardar o comunicado. Verifique suas permissões.'); 
        }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este comunicado?')) {
            try {
                await api.delete(`/comunicados/${id}`);
                toast.success('Comunicado apagado!');
                fetchComunicados();
            } catch (err) { 
                toast.error('Erro ao apagar. Verifique suas permissões.'); 
            }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="dark" /></div>;

    return (
        <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold text-dark mb-1">Pop-ups e Comunicados</h5>
                    <p className="text-muted small mb-0">Gerencie os avisos que aparecem na tela inicial da sua loja.</p>
                </div>
                <Button variant="dark" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => handleShowModal()}>
                    <i className="bi bi-plus-lg me-2"></i> Adicionar
                </Button>
            </div>
            
            {comunicados.length === 0 ? (
                <div className="text-center p-5 border border-dashed rounded-4 bg-light text-muted">
                    <i className="bi bi-window-stack fs-1 mb-3 d-block opacity-25"></i>
                    <h6 className="fw-bold text-dark">Nenhum comunicado ativo</h6>
                    <p className="mb-0 small">Crie um novo pop-up para avisar seus clientes sobre promoções.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle text-nowrap mb-0 border-top">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="py-3 px-3 border-bottom-0">Imagem</th>
                                <th className="py-3 px-3 border-bottom-0">Título</th>
                                <th className="py-3 px-3 border-bottom-0">Link</th>
                                <th className="py-3 px-3 border-bottom-0 text-center">Status</th>
                                <th className="py-3 px-3 border-bottom-0 text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comunicados.map(c => (
                                <tr key={c.id_comunicado}>
                                    <td className="px-3">
                                        <div className="rounded-3 overflow-hidden border shadow-sm" style={{ width: '60px', height: '40px' }}>
                                            <Image src={c.imagem_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </td>
                                    <td className="px-3 fw-bold text-dark">{c.titulo}</td>
                                    <td className="px-3 text-muted small">{c.link_url || <span className="fst-italic opacity-50">Sem link</span>}</td>
                                    <td className="px-3 text-center">
                                        {c.ativo 
                                            ? <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2">Ativo</Badge> 
                                            : <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-2">Inativo</Badge>
                                        }
                                    </td>
                                    <td className="px-3 text-end">
                                        <Button variant="light" size="sm" className="me-2 rounded-3 text-primary border shadow-sm" onClick={() => handleShowModal(c)}>
                                            <i className="bi bi-pencil-fill"></i>
                                        </Button>
                                        <Button variant="light" size="sm" className="rounded-3 text-danger border shadow-sm" onClick={() => deleteHandler(c.id_comunicado)}>
                                            <i className="bi bi-trash-fill"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
            
            {showModal && <ComunicadoFormModal show={showModal} handleClose={() => setShowModal(false)} onSave={handleSave} comunicado={currentComunicado} />}

            <style>{`
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default ComunicadoManager;