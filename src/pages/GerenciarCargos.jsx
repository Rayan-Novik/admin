import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Spinner, Badge, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

// 🟢 1. PERMISSÕES FOCADAS NA OPERAÇÃO + CONFIGURAÇÕES DA LOJA
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
// 🟢 2. PEGA TODAS AS PERMISSÕES POSSÍVEIS (Para dar pro Dono)
const TODAS_PERMISSOES = PERMISSOES_AGRUPADAS.flatMap(grupo => grupo.itens.map(item => item.id));

const GerenciarCargos = () => {
    // ==============================================================
    // 🟢 LÓGICA DE PERMISSÕES 100% BLINDADA
    // ==============================================================
    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('tenant') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) { }

    const roleUpper = String(dadosUser.role || '').toUpperCase();

    // Se não tiver ROLE, ou se for Proprietário/Admin, É O DONO!
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

    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
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

            // 🟢 3. CRIA O CARGO "DONO" FAKE E JOGA NO TOPO DA LISTA
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
    }, []);

    const handleCreateClick = () => {
        if (!podeEditar) return;
        setFormData({ id_cargo: null, nome: '', descricao: '', permissoes: [], ativo: true });
        setShowModal(true);
    };

    const handleEditClick = (cargo) => {
        if (!podeEditar) return;
        // Impede que o modal abra se tentarem clicar no cargo do Dono
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
        if (id === 'master_dono') return; // Segurança extra

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
        }
    };

    if (!podeVer) {
        return (
            <Container className="pt-5 mt-5 text-center">
                <Alert variant="danger" className="d-inline-block p-4 rounded-4 shadow-sm border-0">
                    <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="text-muted mb-0">Você não tem permissão para visualizar este setor.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid="lg" className="pt-4">

                {/* CABEÇALHO */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-shield-lock me-2 opacity-75"></i>
                            Cargos e Permissões
                        </h4>
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {podeEditar
                                ? "Crie funções personalizadas e defina o que cada membro da equipe pode acessar."
                                : "Lista de cargos da equipe e suas respectivas permissões de acesso."}
                        </p>
                    </div>

                    {podeEditar && (
                        <div className="mt-3 mt-md-0">
                            <Button variant="primary" onClick={handleCreateClick} className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm">
                                <i className="bi bi-plus-lg"></i> Novo Cargo
                            </Button>
                        </div>
                    )}
                </div>

                {/* LISTAGEM DE CARGOS */}
                <div className="clean-card mb-4">
                    {loading ? (
                        <div className="text-center p-5" style={{ color: 'var(--text-secondary)' }}>
                            <Spinner animation="border" variant="secondary" />
                            <p className="mt-3 small fw-medium">Carregando cargos...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className='align-middle mb-0 text-nowrap table-borderless table-dark-fix'>
                                <thead style={{ backgroundColor: 'var(--bg-main)' }}>
                                    <tr className="text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                        <th className="py-3 ps-4">Nome do Cargo</th>
                                        <th className="py-3">Membros</th>
                                        <th className="py-3">Permissões</th>
                                        {podeEditar && <th className="py-3 pe-4 text-end">Ações</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargos.length > 0 ? cargos.map((cargo) => {
                                        const isMaster = cargo.id_cargo === 'master_dono';

                                        return (
                                            <tr
                                                key={cargo.id_cargo}
                                                className={podeEditar && !isMaster ? "hover-effect cursor-pointer" : ""}
                                                onClick={() => {
                                                    if (podeEditar && !isMaster) handleEditClick(cargo);
                                                    if (isMaster) toast.info('O cargo de Proprietário não pode ser editado.');
                                                }}
                                                style={{ backgroundColor: isMaster ? 'rgba(245, 158, 11, 0.05)' : '' }} // Destaca o dono de laranjinha
                                            >
                                                <td className="ps-4 py-3">
                                                    <div className="fw-bold d-flex align-items-center" style={{ color: isMaster ? '#b45309' : 'var(--text-primary)' }}>
                                                        {isMaster && <i className="bi bi-star-fill me-2 text-warning"></i>}
                                                        {cargo.nome}
                                                    </div>
                                                    <div className="small" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {cargo.descricao || 'Sem descrição'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={isMaster ? "warning" : "secondary"} className={`bg-opacity-10 rounded-pill px-3 ${isMaster ? "text-warning border border-warning" : "text-secondary"}`}>
                                                        <i className="bi bi-people-fill me-1"></i>
                                                        {cargo._count?.funcionarios || 0} Usuários
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="small fw-medium" style={{ color: 'var(--text-primary)' }}>
                                                        <i className="bi bi-key-fill text-warning me-1"></i>
                                                        {isMaster ? 'Acesso Total' : `${cargo.permissoes?.length || 0} acessos liberados`}
                                                    </div>
                                                </td>

                                                {podeEditar && (
                                                    <td className="pe-4 text-end" onClick={(e) => e.stopPropagation()}>
                                                        {isMaster ? (
                                                            <Badge bg="dark" className="bg-opacity-10 text-muted rounded-pill px-3 fw-normal">
                                                                <i className="bi bi-lock-fill me-1"></i> Inalterável
                                                            </Badge>
                                                        ) : (
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <Button variant="light" size="sm" className="text-primary rounded-3 border-0 bg-opacity-10 shadow-none" onClick={() => handleEditClick(cargo)} style={{ backgroundColor: 'var(--bg-main)' }}>
                                                                    <i className="bi bi-pencil-fill"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="light"
                                                                    size="sm"
                                                                    className="text-danger rounded-3 border-0 bg-opacity-10 shadow-none"
                                                                    onClick={() => handleDeleteClick(cargo.id_cargo)}
                                                                    style={{ backgroundColor: 'var(--bg-main)' }}
                                                                    disabled={cargo._count?.funcionarios > 0}
                                                                    title={cargo._count?.funcionarios > 0 ? "Remova os funcionários deste cargo primeiro" : "Excluir Cargo"}
                                                                >
                                                                    <i className="bi bi-trash-fill"></i>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={podeEditar ? "4" : "3"} className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                                Nenhum cargo encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </Container>

            {/* 🟢 MODAL SÓ É RENDERIZADO SE PUDER EDITAR */}
            {podeEditar && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg" contentClassName="modal-dark-fix">
                    <Modal.Header closeButton className="border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                        <Modal.Title className="fw-bold h5" style={{ color: 'var(--text-primary)' }}>
                            {formData.id_cargo ? 'Editar Cargo' : 'Novo Cargo'}
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSave}>
                        <Modal.Body className="pt-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>

                            <Row className="g-3 mb-4">
                                <Col md={12}>
                                    <Form.Floating>
                                        <Form.Control type="text" placeholder="Nome do Cargo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required className="border-0 shadow-none form-dark-fix fw-bold" />
                                        <label>Nome do Cargo (Ex: Gerente, Atendente)</label>
                                    </Form.Floating>
                                </Col>
                                <Col md={12}>
                                    <Form.Floating>
                                        <Form.Control type="text" placeholder="Descrição (Opcional)" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="border-0 shadow-none form-dark-fix" />
                                        <label>Descrição (Opcional)</label>
                                    </Form.Floating>
                                </Col>
                            </Row>

                            <hr style={{ borderColor: 'var(--border-color)', opacity: 0.5 }} />

                            <div className="mt-4">
                                {PERMISSOES_AGRUPADAS.map((grupo, idx) => (
                                    <div key={idx} className="mb-4">
                                        <h6 className="fw-bold text-primary mb-3 d-flex align-items-center text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>{grupo.icone.startsWith('/') ? ( <img src={grupo.icone} alt={grupo.categoria} style={{ width: 22, height: 22, objectFit: 'contain', marginRight: 8 }} /> ) : ( <i className={`bi ${grupo.icone} me-2 fs-5`}></i> )} {grupo.categoria}
                                        </h6>

                                        <Row className="g-3">
                                            {grupo.itens.map((perm) => {
                                                const isChecked = formData.permissoes.includes(perm.id);
                                                return (
                                                    <Col md={6} key={perm.id}>
                                                        <div
                                                            className={`p-3 rounded-3 border d-flex align-items-center cursor-pointer hover-effect ${isChecked ? 'border-primary' : ''}`}
                                                            style={{
                                                                borderColor: isChecked ? '' : 'var(--border-color)',
                                                                backgroundColor: isChecked ? 'rgba(13, 110, 253, 0.05)' : 'var(--bg-main)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => handleCheckboxToggle(perm.id)}
                                                        >
                                                            <Form.Check
                                                                type="checkbox"
                                                                id={`perm-${perm.id}`}
                                                                checked={isChecked}
                                                                onChange={() => { }}
                                                                className="me-3 shadow-none custom-checkbox"
                                                            />
                                                            <div className="d-flex align-items-center" style={{ color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                <i className={`bi ${perm.icon} me-2 fs-5 ${isChecked ? 'text-primary' : ''}`}></i>
                                                                <span className="fw-medium" style={{ fontSize: '0.85rem' }}>{perm.label}</span>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </div>
                                ))}
                            </div>

                            <div className="text-muted small mt-4 p-3 bg-warning bg-opacity-10 rounded-3 text-warning border border-warning border-opacity-25">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Atenção:</strong> O Proprietário (Dono) já possui acesso total garantido pelo sistema, por isso não precisa marcar essas opções.
                            </div>

                        </Modal.Body>
                        <Modal.Footer className="border-top pt-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                            <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4 bg-opacity-10 border-0 text-secondary" style={{ backgroundColor: 'var(--bg-main)' }}>Cancelar</Button>
                            <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm">Salvar Cargo</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}

            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .table-dark-fix { --bs-table-bg: transparent; color: var(--text-primary); }
                .table-dark-fix th { color: var(--text-secondary); font-weight: 600; border-bottom: 1px solid var(--border-color); }
                .table-dark-fix td { border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                .hover-effect { transition: all 0.2s; }
                .hover-effect:hover { background-color: var(--bg-hover, #f1f5f9); }
                .cursor-pointer { cursor: pointer; }
                
                body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                body.dark-mode .form-dark-fix { background-color: var(--bg-main) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important; }
                body.dark-mode .form-dark-fix:focus { background-color: var(--bg-main) !important; color: var(--text-primary) !important; }
                body.dark-mode .btn-close { filter: invert(1); }
                body.dark-mode .form-floating > label { color: var(--text-secondary); }
            `}</style>
        </div>
    );
};

export default GerenciarCargos;