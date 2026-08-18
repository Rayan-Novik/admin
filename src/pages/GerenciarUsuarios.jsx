import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Badge, Spinner, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

// Helper para gerar iniciais do nome
const getInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const GerenciarEquipe = () => {
    // ==============================================================
    // 🟢 LÓGICA DE PERMISSÕES DO FRONTEND (OPÇÃO NUCLEAR ☢️)
    // ==============================================================
    let isAdminGlobal = false;
    let temView = false;
    let temManage = false;

    try {
        // Varre ABSOLUTAMENTE TUDO que está salvo no localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (!val) continue;

            const upperVal = val.toUpperCase();

            // Se a palavra PROPRIETÁRIO ou ADMIN estiver na sessão, é o Dono!
            if (upperVal.includes('PROPRIETÁRIO') || 
                upperVal.includes('PROPRIETARIO') || 
                upperVal.includes('"ROLE":"ADMIN"') || 
                upperVal.includes('"ROLE":"DONO"') || 
                upperVal.includes('"ISADMIN":TRUE')) {
                isAdminGlobal = true;
            }

            // Se achar as permissões salvas na sessão do funcionário
            if (upperVal.includes('EQUIPE_VIEW')) temView = true;
            if (upperVal.includes('EQUIPE_MANAGE')) temManage = true;
        }
    } catch (error) {
        console.error("Erro ao varrer permissões", error);
    }

    // O Dono vê e edita tudo. O funcionário precisa da permissão.
    const podeVer = isAdminGlobal || temView || temManage;
    const podeEditar = isAdminGlobal || temManage;
    // ==============================================================

    const [funcionarios, setFuncionarios] = useState([]);
    const [cargos, setCargos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Controle dos Modais
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteData, setDeleteData] = useState({ id_funcionario: null, nome: '' });
    
    // Estado do formulário
    const [formData, setFormData] = useState({
        id_funcionario: '', nome_completo: '', email: '', role: '', id_cargo: '',
        senha: '', codigo_acesso: '', ativo: true
    });

    const loadData = async () => {
        if (!podeVer) return;
        setLoading(true);
        try {
            const [staffRes, cargosRes] = await Promise.all([
                api.get('/usuarios/staff').catch(() => ({ data: [] })),
                api.get('/cargos').catch(() => ({ data: [] })) 
            ]);
            setFuncionarios(staffRes.data || []);
            setCargos(cargosRes.data || []);
        } catch (error) {
            console.log("Acesso negado ao buscar a equipe.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        loadData(); 
    }, []);

    const filteredFuncionarios = useMemo(() => {
        if (!searchTerm) return funcionarios;
        const lowerTerm = searchTerm.toLowerCase();
        return funcionarios.filter(f => 
            f.nome_completo.toLowerCase().includes(lowerTerm) || 
            f.email.toLowerCase().includes(lowerTerm) ||
            (f.role && f.role.toLowerCase().includes(lowerTerm))
        );
    }, [funcionarios, searchTerm]);

    const stats = useMemo(() => {
        const total = funcionarios.length;
        const gestao = funcionarios.filter(f => f.role?.toUpperCase().includes('ADMIN') || f.role?.toUpperCase().includes('GERENTE') || f.role?.toUpperCase().includes('PROPRIETÁRIO')).length;
        const operacional = total - gestao;
        const inativos = funcionarios.filter(f => !f.ativo).length;
        return { total, gestao, operacional, inativos };
    }, [funcionarios]);

    const performDelete = async (id) => {
        if (!podeEditar) return;
        try {
            await api.delete(`/usuarios/staff/${id}`);
            toast.success('Colaborador removido!');
            setFuncionarios(funcionarios.filter(f => f.id_funcionario !== id));
            setShowDeleteModal(false); 
        } catch (error) {
            toast.error('Erro ao excluir. Verifique suas permissões.');
        }
    };

    const handleDeleteClick = (func) => {
        if (!podeEditar) return;
        setDeleteData({ id_funcionario: func.id_funcionario, nome: func.nome_completo });
        setShowDeleteModal(true);
    };

    const handleCreateClick = () => {
        if (!podeEditar) return;
        setFormData({
            id_funcionario: '', nome_completo: '', email: '', 
            id_cargo: cargos.length > 0 ? cargos[0].id_cargo : '', 
            role: cargos.length > 0 ? cargos[0].nome : 'ATENDENTE',
            senha: '', codigo_acesso: '', ativo: true
        });
        setShowModal(true);
    };

    const handleEditClick = (func) => {
        if (!podeEditar) return;
        setFormData({
            id_funcionario: func.id_funcionario, 
            nome_completo: func.nome_completo, 
            email: func.email,
            role: func.role, 
            id_cargo: func.id_cargo || '',
            codigo_acesso: func.codigo_acesso || '',
            ativo: func.ativo,
            senha: '' 
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!podeEditar) return;
        try {
            const payload = {
                nome_completo: formData.nome_completo, 
                email: formData.email,
                role: formData.role, 
                id_cargo: formData.id_cargo ? parseInt(formData.id_cargo) : null,
                codigo_acesso: formData.codigo_acesso,
                ativo: formData.ativo
            };

            if (formData.senha) payload.senha = formData.senha;

            if (formData.id_funcionario) {
                await api.put(`/usuarios/staff/${formData.id_funcionario}`, payload);
                toast.success('Equipe atualizada!');
            } else {
                if (!formData.senha) {
                    toast.warning('Defina uma senha inicial.');
                    return;
                }
                await api.post('/usuarios/staff', payload);
                toast.success('Colaborador adicionado!');
            }
            
            setShowModal(false);
            loadData(); 
        } catch (error) {
            toast.error('Erro ao salvar dados. Verifique suas permissões.');
        }
    };

    const getRoleColor = (roleName) => {
        if (!roleName) return 'info';
        const r = roleName.toUpperCase();
        if (r.includes('ADMIN') || r.includes('PROPRIETÁRIO') || r.includes('DONO')) return 'danger';
        if (r.includes('GERENTE') || r.includes('SUPERVISOR')) return 'warning';
        if (r.includes('CAIXA')) return 'success';
        if (r.includes('ATENDENTE')) return 'primary';
        return 'info'; 
    };

    const MinimalStatCard = ({ title, value, icon, color }) => (
        <div className="clean-card p-4 h-100 d-flex align-items-center justify-content-between">
            <div>
                <div className="kpi-title text-uppercase" style={{ letterSpacing: '1px' }}>{title}</div>
                <div className="kpi-value">{value}</div>
            </div>
            <div className={`bg-${color} bg-opacity-10 p-3 rounded-4 d-flex align-items-center justify-content-center text-${color}`} style={{width: '60px', height: '60px'}}>
                <i className={`bi ${icon} fs-3`}></i>
            </div>
        </div>
    );

    // 🛑 BLOQUEIO PARA QUEM NÃO PODE VER A TELA
    if (!podeVer) {
        return (
            <Container className="pt-5 mt-5 text-center">
                <Alert variant="danger" className="d-inline-block p-4 rounded-4 shadow-sm border-0">
                    <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="text-muted mb-0">Você não tem permissão ('EQUIPE_VIEW') para visualizar este setor.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid="lg" className="pt-4">
                
                {/* --- CABEÇALHO --- */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-people me-2 opacity-75"></i>
                            Gestão de Equipe
                        </h4>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {podeEditar 
                                ? "Controle os acessos e permissões dos funcionários da loja."
                                : "Visualize os colaboradores e suas informações de acesso."}
                        </p>
                    </div>
                    <div className="d-flex gap-2 mt-3 mt-md-0">
                        <Button 
                            variant="outline-secondary" 
                            onClick={loadData} 
                            disabled={loading} 
                            className="border-0 shadow-sm d-flex align-items-center justify-content-center" 
                            style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '8px' }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loading ? 'spin-icon' : ''}`}></i>
                        </Button>
                    </div>
                </div>

                {/* --- KPIs --- */}
                <Row className="g-4 mb-4">
                    <Col lg={3} md={6} xs={6}>
                        <MinimalStatCard title="Total Equipe" value={stats.total} icon="bi-people-fill" color="primary" />
                    </Col>
                    <Col lg={3} md={6} xs={6}>
                        <MinimalStatCard title="Gestão" value={stats.gestao} icon="bi-shield-lock-fill" color="warning" />
                    </Col>
                    <Col lg={3} md={6} xs={6}>
                        <MinimalStatCard title="Operacional" value={stats.operacional} icon="bi-person-workspace" color="success" />
                    </Col>
                    <Col lg={3} md={6} xs={6}>
                        <MinimalStatCard title="Inativos" value={stats.inativos} icon="bi-person-fill-slash" color="secondary" />
                    </Col>
                </Row>

                {/* --- TABELA (CLEAN CARD) --- */}
                <div className="clean-card mb-4">
                    <div className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <InputGroup className="w-auto" style={{minWidth: '300px'}}>
                            <InputGroup.Text className="border-0 ps-3 rounded-start-pill" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control 
                                type="search" 
                                placeholder="Buscar funcionário..." 
                                className="border-0 py-2 rounded-end-pill shadow-none form-dark-fix" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </InputGroup>

                        {/* 🟢 ESCONDE O BOTÃO SE NÃO PUDER EDITAR */}
                        {podeEditar && (
                            <Button variant="primary" onClick={handleCreateClick} className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm">
                                <i className="bi bi-plus-lg"></i> Novo Colaborador
                            </Button>
                        )}
                    </div>

                    <div className="p-0">
                        {loading ? (
                            <div className="text-center p-5" style={{ color: 'var(--text-secondary)' }}>
                                <Spinner animation="border" variant="secondary" />
                                <p className="mt-3 small fw-medium">Carregando equipe...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className='align-middle mb-0 text-nowrap table-borderless table-dark-fix'>
                                    <thead style={{ backgroundColor: 'var(--bg-main)' }}>
                                        <tr className="text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                                            <th className="py-3 ps-4">Funcionário</th>
                                            <th className="py-3">Acesso</th>
                                            <th className="py-3">Cargo</th>
                                            <th className="py-3">Status</th>
                                            {/* 🟢 ESCONDE A COLUNA SE NÃO PUDER EDITAR */}
                                            {podeEditar && <th className="py-3 pe-4 text-end">Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFuncionarios.length > 0 ? filteredFuncionarios.map((func) => (
                                            <tr 
                                                key={func.id_funcionario} 
                                                className={podeEditar ? "hover-effect cursor-pointer" : ""}
                                                onClick={() => podeEditar && handleEditClick(func)}
                                            >
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div 
                                                            className={`rounded-circle d-flex align-items-center justify-content-center bg-${getRoleColor(func.role)} bg-opacity-10 text-${getRoleColor(func.role)} fw-bold ${!func.ativo && 'opacity-50'}`} 
                                                            style={{width: '40px', height: '40px', fontSize: '0.9rem'}}
                                                        >
                                                            {getInitials(func.nome_completo)}
                                                        </div>
                                                        <div>
                                                            <div className={`fw-bold ${!func.ativo ? 'text-decoration-line-through opacity-50' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                                                {func.nome_completo}
                                                            </div>
                                                            <div className="small" style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>ID: #{func.id_funcionario}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div style={{ color: 'var(--text-primary)' }}>{func.email}</div>
                                                    {func.codigo_acesso && (
                                                        <div className="small mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                            <i className="bi bi-key-fill me-1"></i> {func.codigo_acesso}
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <Badge bg={`${getRoleColor(func.role)}`} className="bg-opacity-10 text-uppercase px-3 py-2 rounded-pill border border-0" text={getRoleColor(func.role)}>
                                                        {func.role || 'SEM CARGO'}
                                                    </Badge>
                                                </td>

                                                <td>
                                                    {func.ativo ? (
                                                        <Badge bg="success" className="bg-opacity-10 text-success rounded-pill px-3">Ativo</Badge>
                                                    ) : (
                                                        <Badge bg="secondary" className="bg-opacity-10 text-secondary rounded-pill px-3">Bloqueado</Badge>
                                                    )}
                                                </td>

                                                {/* 🟢 ESCONDE OS BOTÕES SE NÃO PUDER EDITAR */}
                                                {podeEditar && (
                                                    <td className="pe-4 text-end" onClick={(e) => e.stopPropagation()}>
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button variant="light" size="sm" className="text-primary rounded-3 border-0 bg-opacity-10 shadow-none" onClick={() => handleEditClick(func)} style={{ backgroundColor: 'var(--bg-main)' }}>
                                                                <i className="bi bi-pencil-fill"></i>
                                                            </Button>
                                                            <Button variant="light" size="sm" className="text-danger rounded-3 border-0 bg-opacity-10 shadow-none" onClick={() => handleDeleteClick(func)} style={{ backgroundColor: 'var(--bg-main)' }}>
                                                                <i className="bi bi-trash-fill"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={podeEditar ? "5" : "4"} className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                                    Nenhum colaborador encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                    <div className="p-3 text-center small border-top" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-sidebar)' }}>
                        Mostrando {filteredFuncionarios.length} colaboradores
                    </div>
                </div>
            </Container>

            {/* --- MODAL CRIAÇÃO/EDIÇÃO (SÓ RENDERIZA SE PUDER EDITAR) --- */}
            {podeEditar && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg" contentClassName="modal-dark-fix">
                    <Modal.Header closeButton className="border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                        <Modal.Title className="fw-bold h5" style={{ color: 'var(--text-primary)' }}>
                            {formData.id_funcionario ? 'Editar Colaborador' : 'Novo Colaborador'}
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSave}>
                        <Modal.Body className="pt-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            
                            {/* 🟢 ALERTA SE NÃO TIVER CARGOS CRIADOS */}
                            {cargos.length === 0 && (
                                <Alert variant="warning" className="border-0 rounded-3 small">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Você ainda não criou nenhum cargo personalizado. Vá no menu "Cargos e Permissões" para criar.
                                </Alert>
                            )}

                            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Informações Pessoais</h6>
                            <Row className="g-3 mb-4">
                                <Col md={12}>
                                    <Form.Floating>
                                        <Form.Control type="text" placeholder="Nome" value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} required className="border-0 shadow-none form-dark-fix"/>
                                        <label>Nome Completo</label>
                                    </Form.Floating>
                                </Col>
                                <Col md={7}>
                                    <Form.Floating>
                                        <Form.Control type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="border-0 shadow-none form-dark-fix"/>
                                        <label>E-mail de Acesso</label>
                                    </Form.Floating>
                                </Col>
                                <Col md={5}>
                                    <Form.Floating>
                                        <Form.Control type="text" placeholder="Código" value={formData.codigo_acesso} onChange={(e) => setFormData({...formData, codigo_acesso: e.target.value})} className="border-0 shadow-none form-dark-fix"/>
                                        <label>Código PDV (Opcional)</label>
                                    </Form.Floating>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-uppercase small fw-bold mb-0" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Segurança e Permissões</h6>
                                <Form.Check 
                                    type="switch"
                                    id="status-switch"
                                    label={formData.ativo ? "Conta Ativa" : "Conta Bloqueada"}
                                    checked={formData.ativo}
                                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                                    className={`fw-bold ${formData.ativo ? 'text-success' : 'text-danger'}`}
                                />
                            </div>
                            
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Floating>
                                        <Form.Select 
                                            value={formData.id_cargo || ''} 
                                            onChange={(e) => {
                                                const cargoSelecionado = cargos.find(c => String(c.id_cargo) === e.target.value);
                                                setFormData({
                                                    ...formData, 
                                                    id_cargo: cargoSelecionado.id_cargo,
                                                    role: cargoSelecionado.nome
                                                });
                                            }} 
                                            className="border-0 shadow-none form-dark-fix"
                                            required
                                        >
                                            <option value="" disabled>Selecione um Cargo</option>
                                            {cargos.map(cargo => (
                                                <option key={cargo.id_cargo} value={cargo.id_cargo}>
                                                    {cargo.nome}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <label>Cargo / Função</label>
                                    </Form.Floating>
                                </Col>
                                <Col md={6}>
                                    <Form.Floating>
                                        <Form.Control type="password" placeholder="Senha" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required={!formData.id_funcionario} className="border-0 shadow-none form-dark-fix" />
                                        <label>{formData.id_funcionario ? 'Nova Senha (vazio para manter)' : 'Senha Inicial'}</label>
                                    </Form.Floating>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer className="border-top pt-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                            <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4 bg-opacity-10 border-0 text-secondary" style={{ backgroundColor: 'var(--bg-main)' }}>Cancelar</Button>
                            <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold" disabled={cargos.length === 0}>Salvar Colaborador</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}

            {/* --- MODAL EXCLUSÃO (SÓ RENDERIZA SE PUDER EDITAR) --- */}
            {podeEditar && (
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" contentClassName="modal-dark-fix">
                    <Modal.Body className="p-5 text-center" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <div className="mb-4 text-danger bg-danger bg-opacity-10 p-4 rounded-circle d-inline-block">
                            <i className="bi bi-trash3-fill fs-1"></i>
                        </div>
                        <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Remover Colaborador?</h4>
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Você está prestes a excluir permanentemente <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nome}</strong> da sua equipe.<br/>
                            Se quiser apenas bloquear o acesso, considere editar e desativar a conta.
                        </p>
                        
                        <div className="d-flex gap-2 justify-content-center mt-2">
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4 bg-opacity-10 border-0 text-secondary" style={{ backgroundColor: 'var(--bg-main)' }}>Cancelar</Button>
                            <Button variant="danger" onClick={() => performDelete(deleteData.id_funcionario)} className="rounded-pill px-4 fw-bold">Sim, Remover</Button>
                        </div>
                    </Modal.Body>
                </Modal>
            )}

            {/* --- CSS GLOBAL DO DESIGN CLEAN CARD & DARK MODE --- */}
            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    box-shadow: none;
                    overflow: hidden;
                }
                .kpi-title {
                    color: var(--text-secondary, #64748b);
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 6px;
                }
                .kpi-value {
                    color: var(--text-primary, #0f172a);
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 1;
                }
                
                /* FIX PARA TABELAS NO MODO ESCURO */
                .table-dark-fix {
                    --bs-table-bg: transparent;
                    color: var(--text-primary);
                }
                .table-dark-fix th {
                    color: var(--text-secondary);
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-color);
                }
                .table-dark-fix td {
                    border-bottom: 1px solid var(--border-color);
                    vertical-align: middle;
                }

                /* HOVER EFFECTS */
                .hover-effect {
                    transition: background-color 0.2s;
                }
                .hover-effect:hover {
                    background-color: var(--bg-hover, #f1f5f9);
                }
                .cursor-pointer {
                    cursor: pointer;
                }

                /* MODAL E FORMS DARK MODE FIXES */
                body.dark-mode .modal-dark-fix {
                    background-color: var(--bg-sidebar);
                    border-color: var(--border-color);
                }
                body.dark-mode .form-dark-fix {
                    background-color: var(--bg-main) !important;
                    border-color: var(--border-color) !important;
                    color: var(--text-primary) !important;
                }
                body.dark-mode .form-dark-fix:focus {
                    background-color: var(--bg-main) !important;
                    color: var(--text-primary) !important;
                }
                body.dark-mode .btn-close {
                    filter: invert(1);
                }
                body.dark-mode .form-floating > label {
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
};

export default GerenciarEquipe;