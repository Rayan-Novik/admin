import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Badge, Spinner, Row, Col, OverlayTrigger, Tooltip, Alert} from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';
import { usePermission } from '../hooks/usePermission';

// Helper para gerar iniciais do nome (Visual Moderno)
const getInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const GerenciarUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { can } = usePermission();

    // Controle dos Modais
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Dados para exclusão
    const [deleteData, setDeleteData] = useState({ id_usuario: null, nome: '', cpfConfirmacao: '' });
    
    // Estado do formulário
    const [formData, setFormData] = useState({
        id_usuario: '', nome_completo: '', email: '', role: 'CLIENTE',
        senha: '', codigo_acesso: '', cpfConfirmacao: '', currentRole: '' 
    });

    // --- CARREGAMENTO DE DADOS ---
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = searchTerm ? `/usuarios/search/${searchTerm}` : '/usuarios';
            const { data } = await api.get(url);
            setUsers(data);
        } catch (error) {
            toast.error('Erro ao buscar usuários.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/permissoes');
            if (data && typeof data === 'object') {
                setAvailableRoles(Object.keys(data));
            }
        } catch (error) {
            console.error("Erro ao buscar cargos", error);
        }
    };

    useEffect(() => { fetchRoles(); }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => { fetchUsers(); }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // --- 📊 LÓGICA DO DASHBOARD ---
    const stats = useMemo(() => {
        const total = users.length;
        const equipe = users.filter(u => u.role !== 'CLIENTE').length;
        const clientes = users.filter(u => u.role === 'CLIENTE').length;
        // Exemplo: Alerta se for cliente sem CPF (ajuste conforme seu backend retorna)
        const alertas = users.filter(u => u.role === 'CLIENTE' && (!u.cpf && !u.cpf_criptografado)).length;
        return { total, equipe, clientes, alertas };
    }, [users]);

    // --- OPERAÇÕES CRUD ---
    const performDelete = async (id, cpf = null) => {
        try {
            const config = cpf ? { data: { cpfConfirmacao: cpf } } : {};
            await api.delete(`/usuarios/${id}`, config);
            toast.success('Usuário removido!');
            setUsers(users.filter(u => u.id_usuario !== id));
            setShowDeleteModal(false); 
        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao excluir.';
            toast.error(msg);
        }
    };

    const handleDeleteClick = (user) => {
        if (user.role === 'CLIENTE') {
            setDeleteData({ id_usuario: user.id_usuario, nome: user.nome_completo, cpfConfirmacao: '' });
            setShowDeleteModal(true);
        } else {
            if (window.confirm(`Excluir membro da equipe: ${user.nome_completo}?`)) {
                performDelete(user.id_usuario);
            }
        }
    };

    const handleConfirmDelete = (e) => {
        e.preventDefault();
        performDelete(deleteData.id_usuario, deleteData.cpfConfirmacao);
    };

    const handleCreateClick = () => {
        setFormData({
            id_usuario: '', nome_completo: '', email: '', role: 'CLIENTE',
            senha: '', codigo_acesso: '', cpfConfirmacao: '', currentRole: ''
        });
        setShowModal(true);
    };

    const handleEditClick = (user) => {
        setFormData({
            id_usuario: user.id_usuario, nome_completo: user.nome_completo, email: user.email,
            role: user.role, currentRole: user.role, codigo_acesso: user.codigo_acesso || '',
            senha: '', cpfConfirmacao: ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (formData.id_usuario) {
                const payload = {
                    nome_completo: formData.nome_completo, email: formData.email,
                    role: formData.role, codigo_acesso: formData.codigo_acesso,
                    isAdmin: formData.role === 'ADMIN'
                };
                
                if (formData.currentRole === 'CLIENTE') {
                    if (!formData.cpfConfirmacao) {
                        toast.warning('Confirme o CPF para salvar.');
                        return;
                    }
                    payload.cpfConfirmacao = formData.cpfConfirmacao;
                }
                if (formData.senha) payload.senha = formData.senha;
                
                await api.put(`/usuarios/${formData.id_usuario}`, payload);
                toast.success('Usuário atualizado!');
            } else {
                if (!formData.senha) {
                    toast.warning('Defina uma senha inicial.');
                    return;
                }
                await api.post('/usuarios', {
                    nome: formData.nome_completo, email: formData.email,
                    senha: formData.senha, role: formData.role, codigo_acesso: formData.codigo_acesso
                });
                toast.success('Usuário criado!');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar.');
        }
    };

    // --- CONFIGURAÇÃO VISUAL ---
    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'danger';
            case 'CAIXA': return 'success';
            case 'ATENDENTE': return 'primary';
            case 'CLIENTE': return 'secondary';
            default: return 'info';
        }
    };

    // Componente de Card de Estatística Minimalista
    const StatCard = ({ title, value, icon, color }) => (
        <Col md={3}>
            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                <Card.Body className="d-flex align-items-center justify-content-between p-4">
                    <div>
                        <p className="text-uppercase text-muted fw-bold mb-1" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>{title}</p>
                        <h2 className="fw-bold mb-0 text-dark">{value}</h2>
                    </div>
                    <div className={`bg-${color} bg-opacity-10 p-3 rounded-4 d-flex align-items-center justify-content-center text-${color}`} style={{width: '60px', height: '60px'}}>
                        <i className={`bi ${icon} fs-3`}></i>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <Container fluid className="px-md-5 py-5 bg-light min-vh-100">
            
            {/* Header Moderno */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-end mb-5">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Gerenciar Usuários</h4>
                    <p className="text-muted mb-0 small">Visão geral, métricas e controle de acessos da plataforma.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="white" onClick={fetchUsers} disabled={loading} className="rounded-circle shadow-sm p-2 border-0">
                        <i className={`bi bi-arrow-clockwise text-primary ${loading ? 'spin-icon' : ''}`}></i>
                    </Button>
                </div>
            </div>

            {/* Dashboard Minimalista */}
            <Row className="g-4 mb-5">
                <StatCard title="Total Contas" value={stats.total} icon="bi-people-fill" color="primary" />
                <StatCard title="Clientes" value={stats.clientes} icon="bi-bag-check-fill" color="success" />
                <StatCard title="Equipe Interna" value={stats.equipe} icon="bi-shield-check" color="info" />
                <StatCard title="Atenção" value={stats.alertas} icon="bi-exclamation-diamond-fill" color="warning" />
            </Row>

            {/* Área de Conteúdo Principal */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                {/* Barra de Ferramentas Integrada */}
                <div className="p-4 border-bottom bg-white d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <InputGroup className="w-auto" style={{minWidth: '300px'}}>
                        <InputGroup.Text className="bg-light border-0 ps-3 rounded-start-pill">
                            <i className="bi bi-search text-muted"></i>
                        </InputGroup.Text>
                        <Form.Control 
                            type="search" 
                            placeholder="Buscar usuário..." 
                            className="bg-light border-0 py-2 rounded-end-pill shadow-none" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </InputGroup>

                    {can('manage_users') && (
                        <Button variant="dark" onClick={handleCreateClick} className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm">
                            <i className="bi bi-plus-lg"></i> Novo Usuário
                        </Button>
                    )}
                </div>

                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted small fw-medium">Carregando dados...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className='align-middle mb-0 text-nowrap table-borderless'>
                                <thead className="bg-light">
                                    <tr className="text-muted text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                                        <th className="py-3 ps-4">Usuário</th>
                                        <th className="py-3">Contato</th>
                                        <th className="py-3">Cargo</th>
                                        <th className="py-3">Status</th>
                                        <th className="py-3 pe-4 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id_usuario} className="border-bottom">
                                            {/* Coluna Nome + Avatar */}
                                            <td className="ps-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div 
                                                        className={`rounded-circle d-flex align-items-center justify-content-center bg-${getRoleColor(user.role)} bg-opacity-10 text-${getRoleColor(user.role)} fw-bold`} 
                                                        style={{width: '40px', height: '40px', fontSize: '0.9rem'}}
                                                    >
                                                        {getInitials(user.nome_completo)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{user.nome_completo}</div>
                                                        <div className="text-muted small" style={{fontSize: '0.75rem'}}>ID: #{user.id_usuario}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Coluna Contato */}
                                            <td>
                                                <div className="text-dark">{user.email}</div>
                                                {user.codigo_acesso && (
                                                    <div className="text-muted small">
                                                        <i className="bi bi-key-fill me-1"></i>
                                                        {user.codigo_acesso}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Coluna Cargo */}
                                            <td>
                                                <Badge bg={`${getRoleColor(user.role)}`} className="bg-opacity-10 text-uppercase px-3 py-2 rounded-pill border border-0" text={getRoleColor(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>

                                            {/* Coluna Status/Alertas */}
                                            <td>
                                                {user.role === 'CLIENTE' && (!user.cpf && !user.cpf_criptografado) ? (
                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Cadastro incompleto (sem CPF)</Tooltip>}>
                                                        <Badge bg="warning" text="dark" className="rounded-pill">
                                                            <i className="bi bi-exclamation-circle-fill me-1"></i> Atenção
                                                        </Badge>
                                                    </OverlayTrigger>
                                                ) : (
                                                    <Badge bg="success" className="bg-opacity-10 text-success rounded-pill">Ativo</Badge>
                                                )}
                                            </td>

                                            {/* Coluna Ações */}
                                            <td className="pe-4 text-end">
                                                {can('manage_users') ? (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button variant="light" size="sm" className="text-primary rounded-3" onClick={() => handleEditClick(user)}>
                                                            <i className="bi bi-pencil-fill"></i>
                                                        </Button>
                                                        <Button variant="light" size="sm" className="text-danger rounded-3" onClick={() => handleDeleteClick(user)}>
                                                            <i className="bi bi-trash-fill"></i>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small fst-italic">Visualizar</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="bg-white border-0 py-3 text-center text-muted small">
                    Mostrando {users.length} registros
                </Card.Footer>
            </Card>

            {/* Modal Criação/Edição */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold h5">
                        {formData.id_usuario ? 'Editar Registro' : 'Novo Registro'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="pt-4">
                        <h6 className="text-uppercase text-muted small fw-bold mb-3">Informações Pessoais</h6>
                        <Row className="g-3 mb-4">
                            <Col md={12}>
                                <Form.Floating>
                                    <Form.Control type="text" placeholder="Nome" value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} required className="bg-light border-0"/>
                                    <label>Nome Completo</label>
                                </Form.Floating>
                            </Col>
                            <Col md={7}>
                                <Form.Floating>
                                    <Form.Control type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="bg-light border-0"/>
                                    <label>E-mail</label>
                                </Form.Floating>
                            </Col>
                            <Col md={5}>
                                <Form.Floating>
                                    <Form.Control type="text" placeholder="Código" value={formData.codigo_acesso} onChange={(e) => setFormData({...formData, codigo_acesso: e.target.value})} className="bg-light border-0"/>
                                    <label>Código de Acesso (Opcional)</label>
                                </Form.Floating>
                            </Col>
                        </Row>

                        <h6 className="text-uppercase text-muted small fw-bold mb-3">Segurança e Permissões</h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Floating>
                                    <Form.Select value={formData.role} onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))} className="bg-light border-0">
                                        {availableRoles.length > 0 ? availableRoles.map(role => <option key={role} value={role}>{role}</option>) : <option value="CLIENTE">CLIENTE</option>}
                                    </Form.Select>
                                    <label>Cargo / Função</label>
                                </Form.Floating>
                            </Col>
                            <Col md={6}>
                                <Form.Floating>
                                    <Form.Control type="password" placeholder="Senha" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required={!formData.id_usuario} className="bg-light border-0" />
                                    <label>{formData.id_usuario ? 'Nova Senha (vazio para manter)' : 'Senha Inicial'}</label>
                                </Form.Floating>
                            </Col>
                        </Row>

                        {formData.id_usuario && formData.currentRole === 'CLIENTE' && (
                            <Alert variant="warning" className="mt-4 mb-0 border-0 d-flex align-items-center gap-3">
                                <i className="bi bi-shield-lock-fill fs-3"></i>
                                <div className="w-100">
                                    <strong className="d-block mb-1">Verificação de Segurança</strong>
                                    <Form.Control size="sm" type="text" value={formData.cpfConfirmacao} onChange={(e) => setFormData({...formData, cpfConfirmacao: e.target.value})} required placeholder="Digite o CPF do cliente para confirmar a edição..." className="border-warning bg-white" />
                                </div>
                            </Alert>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">Cancelar</Button>
                        <Button variant="dark" type="submit" className="rounded-pill px-4">Salvar Alterações</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Exclusão (Design de Perigo) */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
                <Modal.Body className="p-5 text-center">
                    <div className="mb-4 text-danger bg-danger bg-opacity-10 p-4 rounded-circle d-inline-block">
                        <i className="bi bi-trash3-fill fs-1"></i>
                    </div>
                    <h4 className="fw-bold mb-2">Excluir Conta?</h4>
                    <p className="text-muted mb-4">
                        Você está prestes a remover <strong>{deleteData.nome}</strong>.<br/>
                        Esta ação não pode ser desfeita.
                    </p>
                    
                    <Form onSubmit={handleConfirmDelete} className="text-start bg-light p-3 rounded-3 mb-4">
                        <Form.Label className="small fw-bold text-uppercase text-muted">Confirmação de Segurança</Form.Label>
                        <Form.Control type="text" value={deleteData.cpfConfirmacao} onChange={(e) => setDeleteData({...deleteData, cpfConfirmacao: e.target.value})} required className="border-danger" placeholder="Digite o CPF do cliente..." autoFocus />
                    </Form>
                    
                    <div className="d-flex gap-2 justify-content-center">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">Cancelar</Button>
                        <Button variant="danger" type="submit" className="rounded-pill px-4">Sim, Excluir</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default GerenciarUsuarios;