import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';

// 🟢 NOSSOS COMPONENTES UNIVERSAIS DE UI
import { CustomInput } from '../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton } from '../components/ui/buttons/CtaButton';
import { SquareButton, RedSquareButton } from '../components/ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../components/ui/listagem/FlatList';

// 🟢 PERMISSÕES FOCADAS NA OPERAÇÃO + CONFIGURAÇÕES DA LOJA
const PERMISSOES_AGRUPADAS = [
    {
        categoria: 'Vendas & Pedidos',
        icone: 'bi-cart-check',
        itens: [
            { id: 'PDV_ACCESS', label: 'Acessar Caixa/PDV', icon: 'bi-pc-display' },
            { id: 'PEDIDOS_VIEW', label: 'Visualizar Pedidos Online', icon: 'bi-receipt' },
            { id: 'PEDIDOS_MANAGE', label: 'Despachar / Editar Status de Pedidos', icon: 'bi-truck' },
            { id: 'CLIENTES_MANAGE', label: 'Gerenciar Clientes', icon: 'bi-person-vcard' }
        ]
    },
    {
        categoria: 'Ifood',
        icone: '/images/ifood-logo-0.png',
        itens: [
            { id: 'IFOOD_VIEW', label: 'Visualizar Pedidos do Ifood', icon: 'bi-receipt' },
            { id: 'IFOOD_SEND', label: 'Enviar Mensagens no Ifood', icon: 'bi-send' },
            { id: 'IFOOD_MANAGE', label: 'Administrar Pedidos & Produtos Ifood', icon: 'bi-truck' }
        ]
    },
    {
        categoria: 'Produtos & Estoque',
        icone: 'bi-box-seam',
        itens: [
            { id: 'PRODUTOS_VIEW', label: 'Visualizar Lista de Produtos', icon: 'bi-eye' },
            { id: 'PRODUTOS_MANAGE', label: 'Criar / Editar / Excluir Produtos', icon: 'bi-pencil-square' },
            { id: 'ESTOQUE_MANAGE', label: 'Gerenciar Estoque e Fornecedores', icon: 'bi-boxes' },
            { id: 'AVALIACOES_MANAGE', label: 'Gerenciar Avaliações de Clientes', icon: 'bi-star-half' }
        ]
    },
    {
        categoria: 'Marketing & Vitrine',
        icone: 'bi-megaphone',
        itens: [
            { id: 'MARKETING_VIEW', label: 'Visualizar Campanhas e Resultados', icon: 'bi-bar-chart' },
            { id: 'MARKETING_MANAGE', label: 'Criar e Gerenciar Campanhas', icon: 'bi-badge-ad' }
        ]
    },
    {
        categoria: 'Caixa & Relatórios',
        icone: 'bi-graph-up-arrow',
        itens: [
            { id: 'DASHBOARD_VIEW', label: 'Visualizar Dashboard Principal', icon: 'bi-speedometer2' },
            { id: 'RELATORIOS_VIEW', label: 'Visualizar Relatórios e Faturamento', icon: 'bi-pie-chart' },
            { id: 'FINANCEIRO_MANAGE', label: 'Fazer Sangria/Suprimento no Caixa', icon: 'bi-cash-coin' }
        ]
    },
    {
        categoria: 'Administrativo & Financeiro',
        icone: 'bi-briefcase',
        itens: [
            { id: 'FINANCEIRO_VIEW', label: 'Acessar Auditoria Financeira', icon: 'bi-file-earmark-ruled' },
            { id: 'CONTAS_MANAGE', label: 'Gerenciar Contas Pagar/Receber', icon: 'bi-bank' },
            { id: 'EQUIPE_VIEW', label: 'Visualizar Equipe e Cargos', icon: 'bi-person-badge' },
            { id: 'EQUIPE_MANAGE', label: 'Gerenciar Usuários e Permissões', icon: 'bi-people' }
        ]
    },
    {
        categoria: 'Configurações da Loja',
        icone: 'bi-gear',
        itens: [
            { id: 'CONFIG_APARENCIA', label: 'Aparência da Loja', icon: 'bi-palette' },
            { id: 'CONFIG_DOMINIO', label: 'Domínio Próprio', icon: 'bi-globe' },
            { id: 'CONFIG_UNIDADES', label: 'Unidades Físicas', icon: 'bi-shop-window' },
            { id: 'CONFIG_ENVIO', label: 'Regras de Envio', icon: 'bi-truck-flatbed' },
            { id: 'CONFIG_PIX', label: 'Desconto Pix', icon: 'bi-lightning-charge' },
            { id: 'CONFIG_EMAIL', label: 'Servidor de E-mail', icon: 'bi-envelope' }
        ]
    },
    {
        categoria: 'Atendimento & WhatsApp',
        icone: 'bi-whatsapp',
        itens: [
            { id: 'WHATSAPP_VIEW', label: 'Visualizar Conversas do WhatsApp', icon: 'bi-chat-left-dots' },
            { id: 'WHATSAPP_SEND', label: 'Enviar Mensagens no WhatsApp', icon: 'bi-send' },
            { id: 'WHATSAPP_MANAGE', label: 'Administrar Integração do WhatsApp', icon: 'bi-sliders' }
        ]
    },
    {
        categoria: 'Integrações & API',
        icone: 'bi-braces',
        itens: [
            { id: 'CONFIG_GATEWAYS', label: 'Configurar Gateways de Pagamento', icon: 'bi-credit-card' },
            { id: 'CONFIG_INTEGRATIONS', label: 'Gerenciar Chaves de API e Webhooks', icon: 'bi-code-slash' }
        ]
    }
];

const TODAS_PERMISSOES = PERMISSOES_AGRUPADAS.flatMap(grupo => grupo.itens.map(item => item.id));

const GerenciarCargos = () => {
    // ==============================================================
    // LÓGICA DE PERMISSÕES 100% BLINDADA
    // ==============================================================
    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('tenant') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) { }

    const roleUpper = String(dadosUser.role || '').toUpperCase();

    const isDono = !dadosUser.role ||
        roleUpper === 'PROPRIETÁRIO' ||
        roleUpper === 'DONO' ||
        roleUpper === 'ADMIN' ||
        dadosUser.isAdmin === true;

    let permissoesUsuario = [];
    if (Array.isArray(dadosUser.permissoes)) permissoesUsuario = dadosUser.permissoes;
    else if (dadosUser.cargo && Array.isArray(dadosUser.cargo.permissoes)) permissoesUsuario = dadosUser.cargo.permissoes;

    const podeVer = isDono || permissoesUsuario.includes('EQUIPE_VIEW') || permissoesUsuario.includes('EQUIPE_MANAGE');
    const podeEditar = isDono || permissoesUsuario.includes('EQUIPE_MANAGE');

    // ==============================================================
    // ESTADOS
    // ==============================================================
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id_cargo: null,
        nome: '',
        descricao: '',
        permissoes: [],
        ativo: true
    });

    const fetchCargos = async () => {
        if (!podeVer) return;
        setLoading(true);
        try {
            const { data } = await api.get('/cargos');

            // 🟢 CRIA O CARGO "DONO" FAKE E JOGA NO TOPO DA LISTA
            const cargoDonoMaster = {
                id_cargo: 'master_dono',
                nome: 'Dono / Proprietário',
                descricao: 'Acesso total e irrestrito ao sistema.',
                permissoes: TODAS_PERMISSOES,
                ativo: true,
                _count: { funcionarios: '∞' }
            };

            setCargos([cargoDonoMaster, ...data]);
        } catch (error) {
            toast.error('Erro ao carregar os cargos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCargos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateClick = () => {
        if (!podeEditar) return;
        setFormData({ id_cargo: null, nome: '', descricao: '', permissoes: [], ativo: true });
        setShowModal(true);
    };

    const handleEditClick = (cargo) => {
        if (!podeEditar) return;
        if (cargo.id_cargo === 'master_dono') {
            toast.info('O cargo de Proprietário não pode ser modificado.');
            return;
        }

        setFormData({
            id_cargo: cargo.id_cargo,
            nome: cargo.nome,
            descricao: cargo.descricao || '',
            permissoes: cargo.permissoes || [],
            ativo: cargo.ativo
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (id) => {
        if (!podeEditar) return;
        if (id === 'master_dono') return; 

        if (window.confirm('Tem certeza que deseja excluir este cargo?')) {
            try {
                await api.delete(`/cargos/${id}`);
                toast.success('Cargo excluído com sucesso!');
                fetchCargos();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erro ao excluir cargo.');
            }
        }
    };

    const handleCheckboxToggle = (permId) => {
        if (!podeEditar) return;
        setFormData(prev => {
            const hasPerm = prev.permissoes.includes(permId);
            if (hasPerm) {
                return { ...prev, permissoes: prev.permissoes.filter(p => p !== permId) };
            } else {
                return { ...prev, permissoes: [...prev.permissoes, permId] };
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!podeEditar) return;
        
        setSaving(true);
        try {
            if (formData.id_cargo && formData.id_cargo !== 'master_dono') {
                await api.put(`/cargos/${formData.id_cargo}`, formData);
                toast.success('Cargo atualizado!');
            } else {
                await api.post('/cargos', formData);
                toast.success('Cargo criado com sucesso!');
            }
            setShowModal(false);
            fetchCargos();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar cargo.');
        } finally {
            setSaving(false);
        }
    };

    // 🛑 BLOQUEIO PARA QUEM NÃO PODE VER A TELA
    if (!podeVer) {
        return (
            <div className="d-flex justify-content-center pt-5 mt-5">
                <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-4 text-center border border-danger border-opacity-25 shadow-sm">
                    <i className="bi bi-shield-lock-fill display-4 mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="mb-0">Você não tem permissão para visualizar este setor.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <div className="w-100 mx-auto pt-lg-4 pt-3 px-3 px-lg-4" style={{ maxWidth: '1200px' }}>

                {/* ========================================================= */}
                {/* CABEÇALHO */}
                {/* ========================================================= */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-shield-lock me-3 opacity-75"></i>
                            Cargos e Permissões
                        </h4>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {podeEditar
                                ? "Crie funções personalizadas e defina o que cada membro da equipe pode acessar."
                                : "Lista de cargos da equipe e suas respectivas permissões de acesso."}
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        <SquareButton onClick={fetchCargos} disabled={loading} color="var(--bg-sidebar, #FFFFFF)" style={{ height: '46px' }}>
                            {loading ? <i className="bi bi-arrow-clockwise d-inline-block" style={{ animation: 'spin 1s linear infinite' }}></i> : <i className="bi bi-arrow-clockwise fs-5"></i>}
                        </SquareButton>
                        
                        {podeEditar && (
                            <CtaButton onClick={handleCreateClick} className="px-4 text-white" style={{ height: '46px', borderRadius: '12px' }}>
                                <i className="bi bi-plus-lg me-2"></i> Novo Cargo
                            </CtaButton>
                        )}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* LISTAGEM DE CARGOS (FlatList Inteligente) */}
                {/* ========================================================= */}
                <div className="p-0 px-lg-0">
                    <AnimatePresence mode='wait'>
                        {loading ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="d-flex flex-column align-items-center justify-content-center py-5 mt-4">
                                <i className="bi bi-arrow-clockwise display-4 text-primary" style={{ animation: 'spin 1s linear infinite' }}></i>
                                <p className="mt-3 text-secondary fw-medium">Carregando cargos...</p>
                            </motion.div>
                        ) : (
                            <FlatListContainer 
                                loading={false} 
                                empty={cargos.length === 0} 
                                emptyMessage="Nenhum cargo encontrado." 
                                emptyIcon="bi-shield-lock"
                            >
                                <FlatListHeader>
                                    <div className="col-lg-4 ps-2">Nome do Cargo</div>
                                    <div className="col-lg-2">Membros</div>
                                    <div className="col-lg-4">Permissões</div>
                                    {podeEditar && <div className="col-lg-2 text-end pe-2">Ações</div>}
                                </FlatListHeader>

                                {cargos.map((cargo) => {
                                    const isMaster = cargo.id_cargo === 'master_dono';

                                    return (
                                        <motion.div key={cargo.id_cargo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-100">
                                            <FlatListItem 
                                                className="py-3" 
                                                style={{ 
                                                    backgroundColor: isMaster ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-main, #FFFFFF)',
                                                    borderColor: isMaster ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)' 
                                                }}
                                            >
                                                <div className="row w-100 m-0 align-items-center">
                                                    
                                                    {/* 1. Nome do Cargo */}
                                                    <div className="col-12 col-lg-4 p-0 mb-3 mb-lg-0 d-flex flex-column justify-content-center">
                                                        <div className="fw-bold d-flex align-items-center mb-1" style={{ color: isMaster ? '#b45309' : 'var(--text-primary)', fontSize: '15px' }}>
                                                            {isMaster && <i className="bi bi-star-fill me-2 text-warning"></i>}
                                                            {cargo.nome}
                                                        </div>
                                                        <div className="text-secondary small fw-medium text-truncate" style={{ fontSize: '12px' }}>
                                                            {cargo.descricao || 'Sem descrição'}
                                                        </div>
                                                    </div>

                                                    {/* 2. Membros */}
                                                    <div className="col-6 col-lg-2 p-0 mb-3 mb-lg-0">
                                                        <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Membros:</span>
                                                        <span className={`px-3 py-1 rounded-pill fw-bold bg-opacity-10 border border-opacity-25 ${isMaster ? 'bg-warning text-warning border-warning' : 'bg-secondary text-secondary border-secondary'}`} style={{ fontSize: '11px' }}>
                                                            <i className="bi bi-people-fill me-1"></i> {cargo._count?.funcionarios || 0}
                                                        </span>
                                                    </div>

                                                    {/* 3. Permissões */}
                                                    <div className="col-6 col-lg-4 p-0 mb-3 mb-lg-0">
                                                        <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                                            <i className="bi bi-key-fill text-warning me-2"></i>
                                                            {isMaster ? 'Acesso Total ao Sistema' : `${cargo.permissoes?.length || 0} acessos liberados`}
                                                        </div>
                                                    </div>

                                                    {/* 4. Ações */}
                                                    {podeEditar && (
                                                        <div className="col-12 col-lg-2 p-0 mt-2 mt-lg-0 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                                                            {isMaster ? (
                                                                <span className="bg-dark bg-opacity-10 text-secondary rounded-pill px-3 py-2 fw-medium" style={{ fontSize: '11px' }}>
                                                                    <i className="bi bi-lock-fill me-1"></i> Inalterável
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <SquareButton onClick={() => handleEditClick(cargo)} color="var(--bg-sidebar, #F4F6FA)">
                                                                        <i className="bi bi-pencil text-primary"></i>
                                                                    </SquareButton>
                                                                    <RedSquareButton onClick={() => handleDeleteClick(cargo.id_cargo)} disabled={cargo._count?.funcionarios > 0} title={cargo._count?.funcionarios > 0 ? "Remova os funcionários deste cargo primeiro" : "Excluir"}>
                                                                        <i className="bi bi-trash"></i>
                                                                    </RedSquareButton>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FlatListItem>
                                        </motion.div>
                                    );
                                })}
                            </FlatListContainer>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL DE CRIAÇÃO E EDIÇÃO (Com switches fixos na borda) */}
            {/* ========================================================= */}
            {podeEditar && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
                            <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                        </button>
                        <h4 className="fw-bold mb-1">{formData.id_cargo ? 'Editar Cargo' : 'Novo Cargo'}</h4>
                        <p className="mb-0 opacity-75 small">Defina o nome do cargo e escolha o que ele pode acessar na loja.</p>
                    </div>

                    <form onSubmit={handleSave}>
                        <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            <div className="row g-3 mb-4">
                                <div className="col-md-12">
                                    <label className="fw-semibold small text-dark mb-1">Nome do Cargo (Ex: Gerente, Atendente)</label>
                                    <CustomInput required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Digite o nome..." />
                                </div>
                                <div className="col-md-12">
                                    <label className="fw-semibold small text-dark mb-1">Descrição (Opcional)</label>
                                    <CustomInput value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva brevemente as responsabilidades..." />
                                </div>
                            </div>

                            <hr style={{ borderColor: 'var(--border-color)', opacity: 0.5 }} className="mb-4" />

                            <div className="mt-2">
                                {PERMISSOES_AGRUPADAS.map((grupo, idx) => (
                                    <div key={idx} className="mb-4">
                                        
                                        {/* Título do Grupo */}
                                        <h6 className="fw-bold text-primary mb-3 d-flex align-items-center text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                            {grupo.icone.startsWith('/') ? ( 
                                                <img src={grupo.icone} alt={grupo.categoria} style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8, filter: 'brightness(0) saturate(100%) invert(35%) sepia(96%) saturate(2202%) hue-rotate(206deg) brightness(101%) contrast(105%)' }} /> 
                                            ) : ( 
                                                <i className={`bi ${grupo.icone} me-2 fs-5`}></i> 
                                            )} 
                                            {grupo.categoria}
                                        </h6>

                                        {/* Permissões do Grupo */}
                                        <div className="row g-3">
                                            {grupo.itens.map((perm) => {
                                                const isChecked = formData.permissoes.includes(perm.id);
                                                
                                                return (
                                                    <div className="col-md-6" key={perm.id}>
                                                        <div 
                                                            className="form-check form-switch m-0 d-flex align-items-center p-3 rounded-4 border" 
                                                            style={{ 
                                                                cursor: 'pointer',
                                                                borderColor: isChecked ? '#0A84FF' : 'rgba(100, 116, 139, 0.2)',
                                                                backgroundColor: isChecked ? 'rgba(10, 132, 255, 0.05)' : 'var(--bg-main, #FFFFFF)',
                                                                transition: 'all 0.2s ease'
                                                            }} 
                                                            onClick={() => handleCheckboxToggle(perm.id)}
                                                        >
                                                            {/* 🟢 O segredo do fix: ms-0 anula a margem negativa que joga o botão pra fora */}
                                                            <input 
                                                                className="form-check-input m-0 ms-0 me-3 shadow-none flex-shrink-0" 
                                                                type="checkbox" 
                                                                checked={isChecked} 
                                                                onChange={() => {}} 
                                                                style={{ cursor: 'pointer', width: '36px', height: '18px' }}
                                                            />
                                                            <label className="form-check-label d-flex align-items-center m-0 w-100" style={{ cursor: 'pointer' }}>
                                                                <i className={`bi ${perm.icon} me-2 fs-5 ${isChecked ? 'text-primary' : 'text-secondary'}`}></i>
                                                                <span className="fw-bold" style={{ fontSize: '13px', color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                    {perm.label}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                ))}
                            </div>

                            <div className="text-muted small mt-4 p-3 bg-warning bg-opacity-10 rounded-4 text-warning border border-warning border-opacity-25 fw-medium">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Atenção:</strong> O Proprietário (Dono) já possui acesso total garantido pelo sistema, por isso não precisa marcar essas opções.
                            </div>
                        </Modal.Body>
                        
                        <Modal.Footer className="border-0 pt-0 px-4 pb-4 d-flex gap-2" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            <LightButton type="button" onClick={() => setShowModal(false)} className="flex-grow-1" style={{ height: '46px' }}>
                                Cancelar
                            </LightButton>
                            <CtaButton type="submit" disabled={saving} className="flex-grow-1" style={{ height: '46px' }}>
                                {saving ? <i className="bi bi-arrow-clockwise me-2 d-inline-block" style={{ animation: 'spin 1s linear infinite' }}></i> : null}
                                Salvar Cargo
                            </CtaButton>
                        </Modal.Footer>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default GerenciarCargos;