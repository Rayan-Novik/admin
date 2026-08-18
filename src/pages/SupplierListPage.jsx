import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Card, Spinner, Badge, Row, Col, InputGroup, Image as BsImage } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

// --- FUNÇÕES DE FORMATAÇÃO (MÁSCARAS) ---
const formatDocument = (value) => {
    if (!value) return '';
    const raw = value.replace(/\D/g, ''); 
    if (raw.length <= 11) {
        return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4').substring(0, 14);
    }
    return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5').substring(0, 18);
};

// --- COMPONENTE DE CARD DE KPI ---
const SupplierKPI = ({ title, value, icon, color, onClick, active }) => (
    <Card 
        className={`shadow-sm h-100 border-0 clean-card transition-hover`} 
        style={{ 
            cursor: 'pointer',
            outline: active ? `2px solid ${color}` : 'none'
        }}
        onClick={onClick}
    >
        <Card.Body className="p-3 d-flex align-items-center">
            <div className="d-flex align-items-center justify-content-center shadow-sm me-3" 
                 style={{ backgroundColor: `${color}15`, color: color, borderRadius: '0.75rem', width: '45px', height: '45px' }}>
                <i className={`bi ${icon} fs-5`}></i>
            </div>
            <div>
                <span className="small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{title}</span>
                <h4 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>{value}</h4>
            </div>
        </Card.Body>
    </Card>
);

const SupplierListPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos'); 
    
    // --- ESTADOS PARA O MODAL DE PRODUTOS ---
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedSupplierProducts, setSelectedSupplierProducts] = useState([]);
    const [modalSupplierName, setModalSupplierName] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [formData, setFormData] = useState({
        nome_loja: '',
        documento: '',      
        contato_whats: '',
        email: '',
        responsavel: '',    
        endereco: '',
        reputacao: 3,
        prazo_medio: '',
        status: 'Ativo'     
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
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', transition: 'background-color 0.2s ease', paddingBottom: '2rem' }}>
            <Container fluid="lg" className="pt-4">
                
                {/* Header com Busca Inteligente */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2">
                    <div className="mb-3 mb-md-0">
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-truck me-3 opacity-75"></i>
                            Hub de Fornecedores
                        </h4>
                        <p className="small mt-1 mb-0" style={{ color: 'var(--text-secondary)' }}>Pesquise por nome, CPF ou CNPJ</p>
                    </div>
                    <div className="d-flex gap-2">
                        <InputGroup className="shadow-sm rounded-pill overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                            <InputGroup.Text className="border-0 ps-3" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-secondary)' }}>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control 
                                placeholder="Nome, CPF ou CNPJ..." 
                                className="border-0 shadow-none py-2" 
                                style={{ width: '280px', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '14px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <Button variant="dark" className="rounded-pill px-4 shadow-sm fw-bold border-0" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }} onClick={() => handleOpenModal()}>
                            <i className="bi bi-plus-lg me-2"></i> Novo
                        </Button>
                    </div>
                </div>

                {/* KPIs CLICÁVEIS */}
                <Row className="g-3 mb-4">
                    <Col md={4}>
                        <SupplierKPI 
                            title="Total de Parceiros" 
                            value={suppliers.length} 
                            icon="bi-buildings" 
                            color="#3b82f6" 
                            active={filterStatus === 'Todos'}
                            onClick={() => setFilterStatus('Todos')}
                        />
                    </Col>
                    <Col md={4}>
                        <SupplierKPI 
                            title="Fornecedores Ativos" 
                            value={suppliers.filter(s => s.status === 'Ativo').length} 
                            icon="bi-check-all" 
                            color="#22c55e" 
                            active={filterStatus === 'Ativo'}
                            onClick={() => setFilterStatus('Ativo')}
                        />
                    </Col>
                    <Col md={4}>
                        <SupplierKPI 
                            title="Produtos Vinculados" 
                            value={totalProdutos} 
                            icon="bi-box-seam" 
                            color="#8b5cf6" 
                            onClick={() => handleViewProducts(null)}
                        />
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                ) : (
                    <div className="clean-card mb-4">
                        <Table responsive className="align-middle mb-0 table-borderless">
                            <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <tr>
                                    <th className="ps-4 py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fornecedor / Identificação</th>
                                    <th className="py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Contato Responsável</th>
                                    <th className="py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>WhatsApp</th>
                                    <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Produtos</th>
                                    <th className="py-3 text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Performance</th>
                                    <th className="py-3 text-center text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="py-3 pe-4 text-end text-uppercase fw-semibold" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map((s) => (
                                    <tr key={s.id_fornecedor} className="border-bottom hover-effect" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-initials me-3 fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)', width: '36px', height: '36px', fontSize: '14px' }}>
                                                    {s.nome_loja.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{s.nome_loja}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                        <i className="bi bi-person-vcard me-1"></i>
                                                        {formatDocument(s.documento) || 'Não informado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-medium" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{s.responsavel || '---'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.email || 'Sem e-mail'}</div>
                                        </td>
                                        <td>
                                            {s.contato_whats ? (
                                                <Button 
                                                    href={`https://wa.me/55${s.contato_whats.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    variant="success"
                                                    className="rounded-pill px-3 py-1 fw-medium btn-whats shadow-sm border-0 d-inline-flex align-items-center"
                                                    style={{ fontSize: '11px' }}
                                                >
                                                    <i className="bi bi-whatsapp me-2 fs-6"></i>WhatsApp
                                                </Button>
                                            ) : <span style={{ color: 'var(--text-secondary)' }}>---</span>}
                                        </td>
                                        <td className="text-center">
                                            <Badge 
                                                bg="light" 
                                                text="dark" 
                                                className="border rounded-pill px-3 py-2 transition-hover" 
                                                style={{ cursor: 'pointer', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} 
                                                onClick={() => handleViewProducts(s)}
                                            >
                                                <i className="bi bi-box-seam me-2 text-primary"></i>{s._count?.produtos || 0} itens
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="text-warning mb-1" style={{ fontSize: '12px' }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <i key={i} className={`bi ${i < s.reputacao ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                                                ))}
                                            </div>
                                            <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><i className="bi bi-clock me-1"></i> {s.prazo_medio || 0} dias</small>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg={s.status === 'Ativo' ? 'success' : 'danger'} className={`px-2 py-1 fw-medium bg-opacity-10 border border-opacity-25 text-${s.status === 'Ativo' ? 'success' : 'danger'} border-${s.status === 'Ativo' ? 'success' : 'danger'}`}>
                                                {s.status}
                                            </Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Button variant="light" size="sm" className="border d-flex align-items-center justify-content-center shadow-sm btn-icon" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }} onClick={() => handleOpenModal(s)}>
                                                    <i className="bi bi-pencil text-primary"></i>
                                                </Button>
                                                <Button variant="light" size="sm" className="border d-flex align-items-center justify-content-center shadow-sm btn-icon" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }} onClick={() => handleDelete(s.id_fornecedor)}>
                                                    <i className="bi bi-trash text-danger"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* --- MODAL DE PRODUTOS VINCULADOS --- */}
                <Modal show={showProductsModal} onHide={() => setShowProductsModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button 
                            onClick={() => setShowProductsModal(false)} 
                            className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}
                        >
                            <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                        </button>
                        <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-25 p-2 rounded-3 me-3">
                                <i className="bi bi-boxes fs-4 text-white"></i>
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0">Produtos Vinculados</h5>
                                <small className="opacity-75">{modalSupplierName}</small>
                            </div>
                        </div>
                    </div>

                    <Modal.Body className="p-0" style={{ maxHeight: '60vh', overflowY: 'auto', backgroundColor: 'var(--bg-sidebar)' }}>
                        {selectedSupplierProducts.length > 0 ? (
                            <Table hover className="mb-0 align-middle table-borderless" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-main)' }}>
                                    <tr>
                                        <th className="ps-4 py-3 fw-semibold text-uppercase border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Item</th>
                                        <th className="py-3 fw-semibold text-uppercase border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Nome</th>
                                        <th className="text-end pe-4 py-3 fw-semibold text-uppercase border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Preço</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSupplierProducts.map(p => (
                                        <tr key={p.id_produto} className="border-bottom hover-effect" style={{ borderColor: 'var(--border-color)' }}>
                                            <td className="ps-4">
                                                <BsImage src={p.imagem_url || 'https://placehold.co/40?text=Img'} width={40} height={40} className="rounded border shadow-sm" style={{objectFit: 'cover'}} />
                                            </td>
                                            <td className="fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{p.nome}</td>
                                            <td className="text-end pe-4 fw-bold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                                R$ {Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                <i className="bi bi-search mb-3 fs-2 opacity-25 d-block"></i>
                                <p style={{ fontSize: '13px' }}>Nenhum produto associado a este parceiro.</p>
                            </div>
                        )}
                    </Modal.Body>
                </Modal>

                {/* --- MODAL PROFISSIONAL DE CADASTRO/EDIÇÃO --- */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden modal-dark-fix">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}
                        >
                            <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                        </button>
                        <h4 className="fw-bold mb-1">{editMode ? 'Ficha do Parceiro' : 'Nova Homologação'}</h4>
                        <p className="mb-0 opacity-75 small">Dados fiscais e de contato</p>
                    </div>
                    
                    <Modal.Body className="p-4 form-dark-fix" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <Form onSubmit={handleSubmit}>
                            <Row className="g-3">
                                <Col md={12} className="mb-2"><small className="fw-bold text-uppercase ls-1" style={{ color: 'var(--text-primary)' }}>Informações de Contrato</small></Col>
                                <Col md={7}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Razão Social / Nome da Loja</Form.Label>
                                        <Form.Control required value={formData.nome_loja} onChange={(e) => setFormData({...formData, nome_loja: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>CPF ou CNPJ</Form.Label>
                                        <Form.Control 
                                            required
                                            value={formData.documento} 
                                            onChange={handleDocumentChange} 
                                            className="border shadow-none py-2 px-3 form-dark-input" 
                                            style={{ fontSize: '13px' }}
                                            placeholder="000.000.000-00" 
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={12} className="mt-4 mb-2"><small className="fw-bold text-uppercase ls-1" style={{ color: 'var(--text-primary)' }}>Comercial e Contato</small></Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>WhatsApp Corporativo</Form.Label>
                                        <Form.Control value={formData.contato_whats} onChange={(e) => setFormData({...formData, contato_whats: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} placeholder="DDD + Número" />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>E-mail para Pedidos</Form.Label>
                                        <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Pessoa de Contato</Form.Label>
                                        <Form.Control value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} placeholder="Nome" />
                                    </Form.Group>
                                </Col>

                                <Col md={12} className="mt-4 mb-2"><small className="fw-bold text-uppercase ls-1" style={{ color: 'var(--text-primary)' }}>Performance e Logística</small></Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Status</Form.Label>
                                        <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }}>
                                            <option value="Ativo">Ativo / Homologado</option>
                                            <option value="Suspenso">Suspenso / Em Revisão</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Reputação Interna</Form.Label>
                                        <Form.Select value={formData.reputacao} onChange={(e) => setFormData({...formData, reputacao: Number(e.target.value)})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }}>
                                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Estrelas</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Prazo de Envio Médio</Form.Label>
                                        <Form.Control type="number" value={formData.prazo_medio} onChange={(e) => setFormData({...formData, prazo_medio: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} placeholder="Dias" />
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Endereço Sede / CD</Form.Label>
                                        <Form.Control value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="border shadow-none py-2 px-3 form-dark-input" style={{ fontSize: '13px' }} placeholder="Rua, Cidade - UF" />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-grid mt-4 pt-2">
                                <Button variant="dark" type="submit" className="rounded-3 py-3 fw-semibold border-0 shadow-sm" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                                    {editMode ? 'Atualizar Cadastro' : 'Finalizar Homologação'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Container>

            {/* 🟢 CSS GLOBAL DO NOVO DESIGN ADAPTADO PARA DARK MODE */}
            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    box-shadow: none;
                    overflow: hidden;
                }
                .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .transition-hover:hover { transform: translateY(-3px); }
                .hover-effect:hover td { background-color: var(--bg-hover, #f8fafc) !important; }
                
                .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; }
                .btn-whats { background-color: #22c55e !important; color: white !important; transition: all 0.2s ease; }
                .btn-whats:hover { background-color: #16a34a !important; transform: scale(1.05); color: white !important; }
                .ls-1 { letter-spacing: 0.5px; }

                /* Força os filhos da tabela Desktop a respeitarem o dark mode */
                body.dark-mode table { color: var(--text-primary) !important; border-color: var(--border-color) !important; }
                body.dark-mode thead th { background-color: var(--bg-sidebar) !important; color: var(--text-secondary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody td { background-color: var(--bg-sidebar) !important; color: var(--text-primary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody tr:hover td { background-color: var(--bg-hover) !important; }

                /* Ajustes de Modal e Forms para Dark Mode */
                body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                body.dark-mode .form-dark-fix { background-color: var(--bg-sidebar); }
                body.dark-mode .form-dark-input { background-color: var(--bg-main) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important; }
                body.dark-mode .form-dark-input:focus { background-color: var(--bg-main); color: var(--text-primary); }
                body.dark-mode .form-dark-input::placeholder { color: var(--text-secondary); opacity: 0.7; }
                body.dark-mode select.form-dark-input { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"); }
            `}</style>
        </div>
    );
};

export default SupplierListPage;