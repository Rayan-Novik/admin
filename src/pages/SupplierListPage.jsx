import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Modal, Form, Card, Spinner, Badge, Row, Col, InputGroup, Dropdown, Image as BsImage } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

// --- FUNÇÕES DE FORMATAÇÃO (MÁSCARAS) ---
const formatDocument = (value) => {
    if (!value) return '';
    const raw = value.replace(/\D/g, ''); // Remove tudo que não é número
    if (raw.length <= 11) {
        // Máscara CPF: 000.000.000-00
        return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4').substring(0, 14);
    }
    // Máscara CNPJ: 00.000.000/0000-00
    return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5').substring(0, 18);
};

// --- COMPONENTE DE CARD DE KPI ---
const SupplierKPI = ({ title, value, icon, color, onClick, active }) => (
    <Card 
        className={`shadow-sm h-100 border-0 transition-hover ${active ? 'border-primary' : ''}`} 
        style={{ 
            borderRadius: '1rem', 
            cursor: 'pointer',
            outline: active ? `2px solid ${color}` : 'none'
        }}
        onClick={onClick}
    >
        <Card.Body className="p-3 d-flex align-items-center">
            <div className="d-flex align-items-center justify-content-center shadow-sm me-3" 
                 style={{ backgroundColor: `${color}15`, color: color, borderRadius: '0.75rem', width: '45px', height: '45px' }}>
                <i className={`fas ${icon} fs-5`}></i>
            </div>
            <div>
                <span className="small fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{title}</span>
                <h4 className="mb-0 fw-bold text-dark">{value}</h4>
            </div>
        </Card.Body>
    </Card>
);

const SupplierListPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos' ou 'Ativo'
    
    // --- ESTADOS PARA O MODAL DE PRODUTOS ---
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedSupplierProducts, setSelectedSupplierProducts] = useState([]);
    const [modalSupplierName, setModalSupplierName] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [formData, setFormData] = useState({
        nome_loja: '',
        documento: '',      // CNPJ/CPF
        contato_whats: '',
        email: '',
        responsavel: '',    // Pessoa de contato
        endereco: '',
        reputacao: 3,
        prazo_medio: '',
        status: 'Ativo'     // Ativo / Suspenso
    });

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/fornecedores');
            setSuppliers(data);
        } catch (error) {
            toast.error('Erro ao carregar banco de fornecedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // --- FUNÇÃO PARA BUSCAR E MOSTRAR PRODUTOS NO MODAL ---
    const handleViewProducts = async (supplier = null) => {
        try {
            // Se 'supplier' for nulo, buscamos todos os produtos que possuem id_fornecedor vinculado
            const { data } = await api.get('/produtos');
            let filtered;
            
            if (supplier) {
                filtered = data.filter(p => p.id_fornecedor === supplier.id_fornecedor);
                setModalSupplierName(supplier.nome_loja);
            } else {
                filtered = data.filter(p => p.id_fornecedor !== null);
                setModalSupplierName('Todos os Parceiros');
            }

            setSelectedSupplierProducts(filtered);
            setShowProductsModal(true);
        } catch (error) {
            toast.error('Erro ao buscar produtos vinculados.');
        }
    };

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditMode(true);
            setSelectedId(supplier.id_fornecedor);
            setFormData({
                nome_loja: supplier.nome_loja,
                documento: formatDocument(supplier.documento || ''),
                contato_whats: supplier.contato_whats || '',
                email: supplier.email || '',
                responsavel: supplier.responsavel || '',
                endereco: supplier.endereco || '',
                reputacao: supplier.reputacao || 3,
                prazo_medio: supplier.prazo_medio || '',
                status: supplier.status || 'Ativo'
            });
        } else {
            setEditMode(false);
            setFormData({ nome_loja: '', documento: '', contato_whats: '', email: '', responsavel: '', endereco: '', reputacao: 3, prazo_medio: '', status: 'Ativo' });
        }
        setShowModal(true);
    };

    const handleDocumentChange = (e) => {
        const maskedValue = formatDocument(e.target.value);
        setFormData({ ...formData, documento: maskedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formData,
            documento: formData.documento.replace(/\D/g, '')
        };

        try {
            if (editMode) {
                await api.put(`/fornecedores/${selectedId}`, dataToSubmit);
                toast.success('Fornecedor atualizado!');
            } else {
                await api.post('/fornecedores', dataToSubmit);
                toast.success('Fornecedor homologado!');
            }
            setShowModal(false);
            fetchSuppliers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao processar');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este parceiro?')) {
            try {
                await api.delete(`/fornecedores/${id}`);
                toast.success('Removido!');
                fetchSuppliers();
            } catch (error) {
                toast.error('Erro ao excluir: verifique se há produtos vinculados.');
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s => {
        const search = searchTerm.toLowerCase();
        const docRaw = s.documento ? s.documento.replace(/\D/g, '') : '';
        const searchRaw = search.replace(/\D/g, '');

        const matchesSearch = s.nome_loja.toLowerCase().includes(search) || (searchRaw !== '' && docRaw.includes(searchRaw));
        const matchesCard = filterStatus === 'Todos' ? true : s.status === filterStatus;

        return matchesSearch && matchesCard;
    });

    const totalProdutos = suppliers.reduce((acc, s) => acc + (s._count?.produtos || 0), 0);

    return (
        <Container fluid className="py-4 bg-light min-vh-100">
            {/* Header com Busca Inteligente */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2">
                <div className="mb-3 mb-md-0">
                    <h2 className="fw-bold text-dark mb-0">Hub de Fornecedores</h2>
                    <p className="text-muted small">Pesquise por nome, CPF ou CNPJ</p>
                </div>
                <div className="d-flex gap-2">
                    <InputGroup className="shadow-sm rounded-pill overflow-hidden border bg-white">
                        <InputGroup.Text className="bg-white border-0 ps-3">
                            <i className="fas fa-search text-muted"></i>
                        </InputGroup.Text>
                        <Form.Control 
                            placeholder="Nome, CPF ou CNPJ..." 
                            className="border-0 shadow-none py-2" 
                            style={{ width: '280px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <Button variant="dark" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => handleOpenModal()}>
                        <i className="fas fa-plus me-2"></i> Novo
                    </Button>
                </div>
            </div>

            {/* KPIs CLICÁVEIS */}
            <Row className="g-3 mb-4">
                <Col md={4}>
                    <SupplierKPI 
                        title="Total de Parceiros" 
                        value={suppliers.length} 
                        icon="fa-truck" 
                        color="#0d6efd" 
                        active={filterStatus === 'Todos'}
                        onClick={() => setFilterStatus('Todos')}
                    />
                </Col>
                <Col md={4}>
                    <SupplierKPI 
                        title="Fornecedores Ativos" 
                        value={suppliers.filter(s => s.status === 'Ativo').length} 
                        icon="fa-check-double" 
                        color="#198754" 
                        active={filterStatus === 'Ativo'}
                        onClick={() => setFilterStatus('Ativo')}
                    />
                </Col>
                <Col md={4}>
                    <SupplierKPI 
                        title="Produtos Vinculados" 
                        value={totalProdutos} 
                        icon="fa-boxes" 
                        color="#6f42c1" 
                        onClick={() => handleViewProducts(null)}
                    />
                </Col>
            </Row>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <Table hover responsive className="align-middle mb-0 small">
                        <thead className="bg-white border-bottom">
                            <tr className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                                <th className="ps-4 py-3">Fornecedor / Identificação</th>
                                <th>Contato Responsável</th>
                                <th>WhatsApp</th>
                                <th className="text-center">Produtos</th>
                                <th>Performance</th>
                                <th className="text-center">Status</th>
                                <th className="text-end pe-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredSuppliers.map((s) => (
                                <tr key={s.id_fornecedor}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-initials me-3 bg-dark text-white fw-bold rounded-circle">
                                                {s.nome_loja.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{s.nome_loja}</div>
                                                <div className="text-muted" style={{fontSize: '0.75rem'}}>
                                                    <i className="far fa-id-card me-1"></i>
                                                    {formatDocument(s.documento) || 'Não informado'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="fw-medium text-dark">{s.responsavel || '---'}</div>
                                        <div className="text-muted" style={{fontSize: '0.75rem'}}>{s.email || 'Sem e-mail'}</div>
                                    </td>
                                    <td>
                                        {s.contato_whats ? (
                                            <Button 
                                                href={`https://wa.me/55${s.contato_whats.replace(/\D/g, '')}`}
                                                target="_blank"
                                                variant="success"
                                                className="rounded-pill px-3 py-1 fw-bold btn-whats shadow-sm border-0 d-inline-flex align-items-center"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                <i className="fab fa-whatsapp me-2 fs-6"></i>WhatsApp
                                            </Button>
                                        ) : '---'}
                                    </td>
                                    <td className="text-center">
                                        <Badge 
                                            bg="light" 
                                            text="dark" 
                                            className="border rounded-pill px-3 py-2 transition-hover" 
                                            style={{cursor: 'pointer'}} 
                                            onClick={() => handleViewProducts(s)}
                                        >
                                            <i className="fas fa-box-open me-2 text-primary"></i>{s._count?.produtos || 0} itens
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="text-warning mb-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <i key={i} className={`${i < s.reputacao ? 'fas' : 'far'} fa-star`}></i>
                                            ))}
                                        </div>
                                        <small className="text-muted"><i className="far fa-clock me-1"></i> {s.prazo_medio || 0} dias</small>
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={s.status === 'Ativo' ? 'success' : 'danger'} className="rounded-pill px-3">
                                            {s.status}
                                        </Badge>
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button variant="light" className="rounded-circle btn-icon shadow-sm" onClick={() => handleOpenModal(s)}><i className="fas fa-pen text-primary"></i></Button>
                                            <Button variant="light" className="rounded-circle btn-icon shadow-sm" onClick={() => handleDelete(s.id_fornecedor)}><i className="fas fa-trash text-danger"></i></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            {/* --- MODAL DE PRODUTOS VINCULADOS --- */}
            <Modal show={showProductsModal} onHide={() => setShowProductsModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #a29bfe 100%)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fw-bold mb-0"><i className="fas fa-boxes me-2"></i>Produtos Vinculados</h5>
                            <small className="opacity-75">{modalSupplierName}</small>
                        </div>
                        <button onClick={() => setShowProductsModal(false)} className="btn btn-link text-white p-0"><i className="fas fa-times fs-4"></i></button>
                    </div>
                </div>
                <Modal.Body className="p-0" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {selectedSupplierProducts.length > 0 ? (
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light small text-muted text-uppercase">
                                <tr>
                                    <th className="ps-4 py-2">Item</th>
                                    <th>Nome</th>
                                    <th className="text-end pe-4">Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSupplierProducts.map(p => (
                                    <tr key={p.id_produto}>
                                        <td className="ps-4">
                                            <BsImage src={p.imagem_url || 'https://placehold.co/40'} width={40} height={40} className="rounded border shadow-sm" style={{objectFit: 'cover'}} />
                                        </td>
                                        <td className="fw-bold small">{p.nome}</td>
                                        <td className="text-end pe-4 fw-bold text-primary">
                                            R$ {Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-search mb-3 fs-2 opacity-25"></i>
                            <p>Nenhum produto associado a este parceiro.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="secondary" className="rounded-pill px-4 fw-bold" onClick={() => setShowProductsModal(false)}>Fechar</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Profissional de Cadastro/Edição */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="p-4 text-white position-relative" style={{ background: 'linear-gradient(135deg, #1c1e21 0%, #495057 100%)' }}>
                    <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle btn-close-white shadow-sm" style={{ width: '32px', height: '32px', border: 'none' }}>
                        <i className="bi bi-x-lg text-dark"></i>
                    </button>
                    <h4 className="fw-bold mb-1">{editMode ? 'Ficha do Parceiro' : 'Nova Homologação'}</h4>
                    <p className="mb-0 opacity-75 small">Dados fiscais e de contato</p>
                </div>
                
                <Modal.Body className="p-4 bg-light">
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={12} className="mb-2"><small className="text-primary fw-bold text-uppercase ls-1">Informações de Contrato</small></Col>
                            <Col md={7}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Razão Social / Nome da Loja</Form.Label>
                                    <Form.Control required value={formData.nome_loja} onChange={(e) => setFormData({...formData, nome_loja: e.target.value})} className="border-0 shadow-sm py-2 px-3" />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">CPF ou CNPJ</Form.Label>
                                    <Form.Control 
                                        required
                                        value={formData.documento} 
                                        onChange={handleDocumentChange} 
                                        className="border-0 shadow-sm py-2 px-3" 
                                        placeholder="000.000.000-00 ou 00.000..." 
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mt-4 mb-2"><small className="text-primary fw-bold text-uppercase ls-1">Comercial e Contato</small></Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">WhatsApp Corporativo</Form.Label>
                                    <Form.Control value={formData.contato_whats} onChange={(e) => setFormData({...formData, contato_whats: e.target.value})} className="border-0 shadow-sm py-2 px-3" placeholder="DDD + Número" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">E-mail para Pedidos</Form.Label>
                                    <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border-0 shadow-sm py-2 px-3" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Pessoa de Contato</Form.Label>
                                    <Form.Control value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} className="border-0 shadow-sm py-2 px-3" placeholder="Nome do vendedor/contato" />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mt-4 mb-2"><small className="text-primary fw-bold text-uppercase ls-1">Performance e Logística</small></Col>
                            <Col md={4}>
                                <Form.Label className="small fw-bold text-muted">Status do Fornecedor</Form.Label>
                                <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="border-0 shadow-sm py-2 px-3">
                                    <option value="Ativo">Ativo / Homologado</option>
                                    <option value="Suspenso">Suspenso / Em Revisão</option>
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Label className="small fw-bold text-muted">Reputação Interna</Form.Label>
                                <Form.Select value={formData.reputacao} onChange={(e) => setFormData({...formData, reputacao: Number(e.target.value)})} className="border-0 shadow-sm py-2 px-3">
                                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Estrelas</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Prazo de Envio (Média)</Form.Label>
                                    <Form.Control type="number" value={formData.prazo_medio} onChange={(e) => setFormData({...formData, prazo_medio: e.target.value})} className="border-0 shadow-sm py-2 px-3" placeholder="Dias" />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Endereço Sede / CD</Form.Label>
                                    <Form.Control value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="border-0 shadow-sm py-2 px-3" placeholder="Rua, Cidade - UF" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-grid mt-4">
                            <Button variant="dark" type="submit" className="rounded-pill py-3 fw-bold shadow">
                                {editMode ? 'ATUALIZAR CADASTRO' : 'FINALIZAR HOMOLOGAÇÃO'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <style>{`
                .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .transition-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; }
                .avatar-initials { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
                .btn-icon { width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; }
                .btn-whats { background-color: #25d366 !important; color: white !important; transition: all 0.2s ease; }
                .btn-whats:hover { background-color: #1ebe57 !important; transform: scale(1.05); color: white !important; }
                .ls-1 { letter-spacing: 0.5px; }
            `}</style>
        </Container>
    );
};

export default SupplierListPage;