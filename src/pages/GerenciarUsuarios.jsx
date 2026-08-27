import React, { useState, useEffect, useMemo } from 'react';
import { Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// 🟢 NOSSOS COMPONENTES UNIVERSAIS DE UI
import { CustomInput } from '../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton, GreenButton } from '../components/ui/buttons/CtaButton';
import { SquareButton, RedSquareButton } from '../components/ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../components/ui/listagem/FlatList';

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
    // LÓGICA DE PERMISSÕES DO FRONTEND
    // ==============================================================
    let isAdminGlobal = false;
    let temView = false;
    let temManage = false;

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (!val) continue;

            const upperVal = val.toUpperCase();

            if (upperVal.includes('PROPRIETÁRIO') || 
                upperVal.includes('PROPRIETARIO') || 
                upperVal.includes('"ROLE":"ADMIN"') || 
                upperVal.includes('"ROLE":"DONO"') || 
                upperVal.includes('"ISADMIN":TRUE')) {
                isAdminGlobal = true;
            }

            if (upperVal.includes('EQUIPE_VIEW')) temView = true;
            if (upperVal.includes('EQUIPE_MANAGE')) temManage = true;
        }
    } catch (error) {
        console.error("Erro ao varrer permissões", error);
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="p-4 rounded-4 d-flex align-items-center justify-content-between flex-shrink-0 flex-grow-1" >
            <div>
                <div className="text-uppercase fw-bold text-secondary mb-1" style={{ fontSize: '10px', letterSpacing: '1px' }}>{title}</div>
                <div className="fs-3 fw-black text-dark" style={{ lineHeight: 1 }}>{value}</div>
            </div>
            <div className={`bg-${color} bg-opacity-10 text-${color} rounded-4 d-flex align-items-center justify-content-center`} style={{ width: '56px', height: '56px' }}>
                <i className={`bi ${icon} fs-3`}></i>
            </div>
        </div>
    );

    const flatSelectStyle = {
        height: '50px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)', color: 'var(--text-primary, #0F172A)',
        fontSize: '14px', boxShadow: 'none', width: '100%', padding: '0 15px'
    };

    // 🛑 BLOQUEIO PARA QUEM NÃO PODE VER A TELA
    if (!podeVer) {
        return (
            <div className="d-flex justify-content-center pt-5 mt-5">
                <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-4 text-center border border-danger border-opacity-25 shadow-sm">
                    <i className="bi bi-shield-lock-fill display-4 mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="mb-0">Você não tem permissão ('EQUIPE_VIEW') para visualizar este setor.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <div className="w-100 mx-auto pt-lg-4 pt-3 px-3 px-lg-4" style={{ maxWidth: '1200px' }}>
                
                {/* --- CABEÇALHO --- */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-people me-3 opacity-75"></i>
                            Gestão de Equipe
                        </h4>
                        <p className="mb-0 mt-1 text-secondary" style={{ fontSize: '0.875rem' }}>
                            {podeEditar 
                                ? "Controle os acessos e permissões dos funcionários da loja."
                                : "Visualize os colaboradores e suas informações de acesso."}
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <SquareButton onClick={loadData} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise fs-5"></i>}
                        </SquareButton>
                    </div>
                </div>

                {/* --- KPIs (Scrollável no Mobile) --- */}
                <div className="d-flex gap-3 pb-2 mb-4 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <MinimalStatCard title="Total Equipe" value={stats.total} icon="bi-people-fill" color="primary" />
                    <MinimalStatCard title="Gestão" value={stats.gestao} icon="bi-shield-lock-fill" color="warning" />
                    <MinimalStatCard title="Operacional" value={stats.operacional} icon="bi-person-workspace" color="success" />
                    <MinimalStatCard title="Inativos" value={stats.inativos} icon="bi-person-fill-slash" color="secondary" />
                </div>

                {/* --- CONTROLES DE BUSCA E ADIÇÃO --- */}
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 border-bottom pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex-grow-1" style={{ maxWidth: '400px' }}>
                        <CustomInput 
                            icon="bi-search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar funcionário..."
                        />
                    </div>

                    {podeEditar && (
                        <CtaButton onClick={handleCreateClick}>
                            <i className="bi bi-plus-lg me-2"></i> Novo Colaborador
                        </CtaButton>
                    )}
                </div>

                {/* --- FLATLIST DA EQUIPE --- */}
                <div className="p-0">
                    <AnimatePresence mode='wait'>
                        {loading ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="d-flex flex-column align-items-center justify-content-center py-5 mt-4">
                                <i className="bi bi-arrow-clockwise display-4 text-primary" style={{ animation: 'spin 1s linear infinite' }}></i>
                                <p className="mt-3 text-secondary fw-medium">Carregando equipe...</p>
                            </motion.div>
                        ) : (
                            <FlatListContainer 
                                loading={false} 
                                empty={filteredFuncionarios.length === 0} 
                                emptyMessage="Nenhum colaborador encontrado com esta busca." 
                                emptyIcon="bi-person-vcard"
                            >
                                <FlatListHeader>
                                    <div className="col-lg-3 ps-2">Funcionário</div>
                                    <div className="col-lg-3">Acesso</div>
                                    <div className="col-lg-2">Cargo</div>
                                    <div className="col-lg-2 text-center">Status</div>
                                    {podeEditar && <div className="col-lg-2 text-end pe-2">Ações</div>}
                                </FlatListHeader>

                                {filteredFuncionarios.map((func) => (
                                    <motion.div 
                                        key={func.id_funcionario} 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="w-100"
                                    >
                                        <FlatListItem className="py-3">
                                            <div className="row w-100 m-0 align-items-center">
                                                
                                                {/* 1. Nome / Avatar */}
                                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0 d-flex align-items-center">
                                                    <div 
                                                        className={`rounded-circle d-flex align-items-center justify-content-center bg-${getRoleColor(func.role)} bg-opacity-10 text-${getRoleColor(func.role)} fw-bold flex-shrink-0 me-3 ${!func.ativo && 'opacity-50'}`} 
                                                        style={{ width: '48px', height: '48px', fontSize: '15px' }}
                                                    >
                                                        {getInitials(func.nome_completo)}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className={`fw-bold text-truncate ${!func.ativo ? 'text-decoration-line-through opacity-50' : 'text-dark'}`} style={{ fontSize: '14px' }}>
                                                            {func.nome_completo}
                                                        </div>
                                                        <div className="text-secondary small fw-medium mt-1">ID: #{func.id_funcionario}</div>
                                                    </div>
                                                </div>

                                                {/* 2. E-mail / Código */}
                                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0">
                                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Acesso:</span>
                                                    <div className="fw-medium text-dark text-truncate d-inline-block align-bottom w-100" style={{ fontSize: '13px' }}>
                                                        {func.email}
                                                    </div>
                                                    {func.codigo_acesso && (
                                                        <div className="small text-secondary mt-1">
                                                            <i className="bi bi-key-fill me-1"></i> {func.codigo_acesso}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. Cargo */}
                                                <div className="col-6 col-lg-2 p-0 mb-3 mb-lg-0">
                                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Cargo:</span>
                                                    <span className={`badge bg-${getRoleColor(func.role)} bg-opacity-10 text-${getRoleColor(func.role)} px-3 py-2 rounded-pill fw-bold text-uppercase d-inline-block`} style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                                                        {func.role || 'SEM CARGO'}
                                                    </span>
                                                </div>

                                                {/* 4. Status */}
                                                <div className="col-6 col-lg-2 p-0 mb-3 mb-lg-0 text-lg-center">
                                                    <span className={`badge px-3 py-2 rounded-pill fw-bold bg-opacity-10 border border-opacity-25 ${func.ativo ? 'bg-success text-success border-success' : 'bg-secondary text-secondary border-secondary'}`} style={{ fontSize: '11px' }}>
                                                        {func.ativo ? 'Ativo' : 'Bloqueado'}
                                                    </span>
                                                </div>

                                                {/* 5. Ações */}
                                                {podeEditar && (
                                                    <div className="col-12 col-lg-2 p-0 mt-2 mt-lg-0 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                                                        <SquareButton onClick={() => handleEditClick(func)} color="var(--bg-sidebar, #F4F6FA)">
                                                            <i className="bi bi-pencil text-primary"></i>
                                                        </SquareButton>
                                                        <RedSquareButton onClick={() => handleDeleteClick(func)}>
                                                            <i className="bi bi-trash"></i>
                                                        </RedSquareButton>
                                                    </div>
                                                )}
                                            </div>
                                        </FlatListItem>
                                    </motion.div>
                                ))}
                            </FlatListContainer>
                        )}
                    </AnimatePresence>

                    <div className="text-center mt-4 text-secondary small fw-medium">
                        Mostrando {filteredFuncionarios.length} colaboradores
                    </div>
                </div>
            </div>

            {/* --- MODAL CRIAÇÃO/EDIÇÃO (SEM BOOTSTRAP FORMS) --- */}
            {podeEditar && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
                            <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                        </button>
                        <h4 className="fw-bold mb-1">{formData.id_funcionario ? 'Editar Colaborador' : 'Novo Colaborador'}</h4>
                        <p className="mb-0 opacity-75 small">Preencha os dados de acesso e cargo.</p>
                    </div>
                    
                    <form onSubmit={handleSave}>
                        <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            {cargos.length === 0 && (
                                <div className="bg-warning bg-opacity-10 text-dark p-3 rounded-4 mb-4 border border-warning border-opacity-25 small fw-medium">
                                    <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                                    Você ainda não criou nenhum cargo personalizado. Vá no menu "Cargos e Permissões" para criar.
                                </div>
                            )}

                            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Informações Pessoais</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-12">
                                    <label className="fw-semibold small text-dark mb-1">Nome Completo</label>
                                    <CustomInput required value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} placeholder="Ex: João da Silva" />
                                </div>
                                <div className="col-md-7">
                                    <label className="fw-semibold small text-dark mb-1">E-mail de Acesso</label>
                                    <CustomInput type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
                                </div>
                                <div className="col-md-5">
                                    <label className="fw-semibold small text-dark mb-1">Código PDV (Opcional)</label>
                                    <CustomInput value={formData.codigo_acesso} onChange={(e) => setFormData({...formData, codigo_acesso: e.target.value})} placeholder="Ex: 1234" />
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3 pt-3 border-top" style={{ borderColor: 'rgba(100, 116, 139, 0.15)' }}>
                                <div>
                                    <h6 className="text-uppercase small fw-bold mb-0" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Segurança e Permissões</h6>
                                    <small className="text-secondary">Defina se a conta está ativa ou bloqueada.</small>
                                </div>
                                <Form.Check 
                                    type="switch"
                                    id="status-switch"
                                    label={formData.ativo ? "Conta Ativa" : "Conta Bloqueada"}
                                    checked={formData.ativo}
                                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                                    className={`fw-bold fs-6 m-0 ${formData.ativo ? 'text-success' : 'text-danger'}`}
                                />
                            </div>
                            
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="fw-semibold small text-dark mb-1">Cargo / Função</label>
                                    <select 
                                        required 
                                        value={formData.id_cargo || ''} 
                                        onChange={(e) => {
                                            const cargoSelecionado = cargos.find(c => String(c.id_cargo) === e.target.value);
                                            setFormData({ ...formData, id_cargo: cargoSelecionado.id_cargo, role: cargoSelecionado.nome });
                                        }} 
                                        style={flatSelectStyle}
                                    >
                                        <option value="" disabled>Selecione um Cargo</option>
                                        {cargos.map(cargo => (
                                            <option key={cargo.id_cargo} value={cargo.id_cargo}>{cargo.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="fw-semibold small text-dark mb-1">{formData.id_funcionario ? 'Nova Senha (vazio para manter)' : 'Senha Inicial'}</label>
                                    <CustomInput type="password" required={!formData.id_funcionario} value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} placeholder="******" />
                                </div>
                            </div>
                        </Modal.Body>

                        <Modal.Footer className="border-0 pt-0 px-4 pb-4 d-flex gap-2" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            <LightButton type="button" onClick={() => setShowModal(false)} className="flex-grow-1">
                                Cancelar
                            </LightButton>
                            <GreenButton type="submit" disabled={cargos.length === 0} className="flex-grow-1">
                                Salvar Colaborador
                            </GreenButton>
                        </Modal.Footer>
                    </form>
                </Modal>
            )}

            {/* --- MODAL EXCLUSÃO (SEM BOOTSTRAP ALERTS NATIVOS) --- */}
            {podeEditar && (
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" contentClassName="border-0 rounded-4 shadow-lg">
                    <Modal.Body className="p-5 text-center" style={{ backgroundColor: 'var(--bg-sidebar)', borderRadius: '16px' }}>
                        <div className="mb-4 text-danger bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-trash3-fill display-5"></i>
                        </div>
                        <h4 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Remover Colaborador?</h4>
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Você está prestes a excluir permanentemente <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nome}</strong> da sua equipe.<br/>
                            Se quiser apenas bloquear o acesso, considere editar e desativar a conta.
                        </p>
                        
                        <div className="d-flex gap-3 justify-content-center mt-2">
                            <LightButton type="button" onClick={() => setShowDeleteModal(false)} className="px-4" style={{ height: '46px' }}>
                                Cancelar
                            </LightButton>
                            <RedButton type="button" onClick={() => performDelete(deleteData.id_funcionario)} className="px-4" style={{ height: '46px' }}>
                                Sim, Remover
                            </RedButton>
                        </div>
                    </Modal.Body>
                </Modal>
            )}

        </div>
    );
};

export default GerenciarEquipe;