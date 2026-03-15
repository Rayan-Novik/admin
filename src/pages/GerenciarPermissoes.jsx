import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Spinner, Alert, Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FaSave, FaSync, FaPlus, FaTrash, FaInfoCircle, FaCheck, FaLock, FaStore, FaGlobe, FaChartLine, FaCogs, FaUserTag, FaBoxOpen } from 'react-icons/fa';
import api from '../services/api';
import { usePermissionContext } from '../contexts/PermissionContext';
import { toast } from 'react-toastify';

// --- LISTA DE PERMISSÕES ---
const ALL_ACTIONS = [
    // --- GERAL ---
    { id: 'view_dashboard', label: 'Visualizar Dashboard', category: 'Geral', description: 'Gráficos e resumos.' },
    
    // --- LOJA FÍSICA ---
    { id: 'view_pdv_caixa', label: 'Acessar Caixa (Pagamento)', category: 'Loja Física', description: 'Receber valores e fechar caixa.' },
    { id: 'view_pdv_vendedor', label: 'Acessar Balcão (Vendedor)', category: 'Loja Física', description: 'Fazer pré-venda/orçamentos.' },
    { id: 'pdv_allow_direct_sale', label: 'Venda Direta no Caixa', category: 'Loja Física', description: 'Permite adicionar itens no caixa.' },
    { id: 'pdv_discount', label: 'Aplicar Descontos', category: 'Loja Física', description: 'Permissão para dar descontos.' },

    // --- CADASTROS ---
    { id: 'manage_clients', label: 'Gerenciar Clientes', category: 'Cadastros', description: 'Criar e editar clientes.' },
    { id: 'manage_products', label: 'Gerenciar Produtos', category: 'Cadastros', description: 'Catálogo, preços e fotos.' },
    { id: 'manage_stock', label: 'Ajuste de Estoque', category: 'Cadastros', description: 'Entrada/Saída manual.' },
    
    // --- ONLINE ---
    { id: 'view_ecommerce', label: 'Painel E-commerce', category: 'Online', description: 'Visão geral do site.' },
    { id: 'manage_orders', label: 'Processar Pedidos', category: 'Online', description: 'Status e envio de pedidos.' },
    
    // --- APPS ---
    { id: 'view_ifood', label: 'Gestão iFood', category: 'Integrações', description: 'Cardápio e pedidos iFood.' },
    { id: 'view_ml', label: 'Gestão Mercado Livre', category: 'Integrações', description: 'Anúncios e perguntas ML.' },
    
    // --- ADMIN ---
    { id: 'manage_users', label: 'Gerenciar Usuários', category: 'Admin', description: 'Criar contas e senhas.' },
    { id: 'manage_financial', label: 'Financeiro Completo', category: 'Admin', description: 'Relatórios de lucro e DRE.' },
    { id: 'manage_permissions', label: 'Gerenciar Cargos', category: 'Admin', description: 'Alterar acessos (Perigo).' },
];

const CATEGORY_ICONS = {
    'Geral': <FaChartLine className="text-secondary"/>,
    'Loja Física': <FaStore className="text-success"/>,
    'Cadastros': <FaBoxOpen className="text-info"/>,
    'Online': <FaGlobe className="text-primary"/>,
    'Integrações': <FaSync className="text-warning"/>,
    'Admin': <FaCogs className="text-danger"/>
};

const GerenciarPermissoes = () => {
    const { permissions, setPermissions, loadPermissions } = usePermissionContext();
    const [localPermissions, setLocalPermissions] = useState({});
    const [saving, setSaving] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    useEffect(() => {
        if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
            setLocalPermissions(permissions);
        } else {
            setLocalPermissions({});
        }
    }, [permissions]);

    const rolesVisiveis = Object.keys(localPermissions).filter(role => role !== 'CLIENTE');

    const groupedActions = ALL_ACTIONS.reduce((acc, action) => {
        if (!acc[action.category]) acc[action.category] = [];
        acc[action.category].push(action);
        return acc;
    }, {});

    const handleCheck = (role, actionId) => {
        if (role === 'ADMIN') return;
        setLocalPermissions(prev => {
            const rolePerms = prev[role] ? [...prev[role]] : [];
            if (rolePerms.includes(actionId)) {
                return { ...prev, [role]: rolePerms.filter(p => p !== actionId) };
            } else {
                return { ...prev, [role]: [...rolePerms, actionId] };
            }
        });
    };

    const handleAddRole = async () => {
        const name = newRoleName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, ''); 
        if (!name || localPermissions[name]) return toast.warning("Nome inválido ou já existe.");
        setLoadingAction(true);
        try {
            await api.post('/permissoes', { nomeCargo: name });
            toast.success(`Cargo ${name} criado!`);
            setNewRoleName('');
            await loadPermissions(); 
        } catch (error) {
            toast.error("Erro ao criar cargo.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (['ADMIN', 'CAIXA', 'ATENDENTE', 'GERENTE'].includes(role)) return toast.error("Cargo protegido.");
        if (window.confirm(`Excluir ${role}?`)) {
            setLoadingAction(true);
            try {
                await api.delete(`/permissoes/${role}`);
                toast.success(`Cargo removido.`);
                await loadPermissions();
            } catch (error) {
                toast.error("Erro ao remover.");
            } finally {
                setLoadingAction(false);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/permissoes', localPermissions);
            setPermissions(localPermissions);
            toast.success('Salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container fluid className="p-3 bg-light min-vh-100">
            {/* HEADER COMPACTO */}
            <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-3 shadow-sm">
                <h5 className="mb-0 fw-bold text-dark"><FaUserTag className="me-2 text-primary"/> Matriz de Acessos</h5>
                
                <div className="d-flex gap-2">
                    <div className="input-group input-group-sm" style={{maxWidth: 250}}>
                        <Form.Control 
                            placeholder="NOVO CARGO" 
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                            className="fw-bold text-uppercase"
                        />
                        <Button variant="dark" onClick={handleAddRole} disabled={loadingAction || !newRoleName}>
                            {loadingAction ? <Spinner size="sm"/> : <FaPlus/>}
                        </Button>
                    </div>
                    <Button variant="success" size="sm" onClick={handleSave} disabled={saving || loadingAction} className="fw-bold px-3">
                        {saving ? <Spinner size="sm"/> : <><FaSave className="me-1"/> SALVAR</>}
                    </Button>
                </div>
            </div>

            {/* TABELA COMPACTA */}
            <Card className="shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="table-responsive" style={{maxHeight: '80vh'}}>
                    <Table hover size="sm" className="mb-0 align-middle table-fixed-header">
                        <thead className="bg-light text-secondary position-sticky top-0 shadow-sm" style={{zIndex: 5}}>
                            <tr>
                                <th className="py-2 px-3 border-0 bg-light" style={{minWidth: '280px'}}>Funcionalidade</th>
                                {rolesVisiveis.map(role => (
                                    <th key={role} className="py-2 border-0 text-center bg-light" style={{minWidth: '100px'}}>
                                        <div className="d-flex flex-column align-items-center">
                                            <Badge bg={role === 'ADMIN' ? 'dark' : 'primary'} className="mb-1">{role}</Badge>
                                            {!['ADMIN', 'CAIXA', 'ATENDENTE', 'GERENTE'].includes(role) && (
                                                <small className="text-danger cursor-pointer" onClick={() => handleDeleteRole(role)} style={{fontSize: '0.65rem', cursor:'pointer'}}>excluir</small>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedActions).map(([category, actions]) => (
                                <React.Fragment key={category}>
                                    <tr className="bg-light border-bottom border-top">
                                        <td colSpan={rolesVisiveis.length + 1} className="py-1 px-3">
                                            <small className="fw-bold text-uppercase text-primary d-flex align-items-center">
                                                <span className="me-2">{CATEGORY_ICONS[category]}</span> {category}
                                            </small>
                                        </td>
                                    </tr>
                                    {actions.map((action) => (
                                        <tr key={action.id} style={{borderBottom: '1px solid #f8f9fa'}}>
                                            <td className="ps-3 py-2 border-end">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark small">{action.label}</span>
                                                    <span className="text-muted" style={{fontSize: '0.7rem', lineHeight: '1.1'}}>{action.description}</span>
                                                </div>
                                            </td>
                                            {rolesVisiveis.map(role => {
                                                const isChecked = role === 'ADMIN' ? true : localPermissions[role]?.includes(action.id);
                                                const isLocked = role === 'ADMIN';
                                                return (
                                                    <td key={`${role}-${action.id}`} className="text-center bg-white">
                                                        {isLocked ? (
                                                            <FaLock size={12} className="text-black-50"/>
                                                        ) : (
                                                            <Form.Check 
                                                                type="switch"
                                                                className="d-flex justify-content-center"
                                                                checked={!!isChecked}
                                                                onChange={() => handleCheck(role, action.id)}
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card>
        </Container>
    );
};

export default GerenciarPermissoes;