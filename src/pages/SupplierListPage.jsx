import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// 🟢 NOSSOS COMPONENTES UNIVERSAIS DE UI (SEM BOOTSTRAP)
import { CtaButton, LightButton } from '../components/ui/buttons/CtaButton';
import { SquareButton, RedSquareButton, GreenSquareButton } from '../components/ui/buttons/SquareButton';
import { CustomInput } from '../components/ui/SearchInput/SearchInput';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../components/ui/listagem/FlatList';

// --- FUNÇÕES DE FORMATAÇÃO (MÁSCARAS) ---
const formatDocument = (value) => {
    if (!value) return '';
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 11) {
        return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4').substring(0, 14);
    }
    return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5').substring(0, 18);
};

// --- COMPONENTE DE CARD DE KPI LIMPO ---
const SupplierKPI = ({ title, value, icon, color, onClick, active }) => (
    <div 
        className="p-3 rounded-4 d-flex align-items-center flex-shrink-0 flex-grow-1"
        style={{
            backgroundColor: 'var(--bg-sidebar, #F4F6FA)',
            border: `1px solid ${active ? color : 'rgba(100, 116, 139, 0.15)'}`,
            cursor: 'pointer',
            minWidth: '220px',
            transition: 'all 0.2s ease',
            boxShadow: active ? `0 4px 12px ${color}20` : 'none'
        }}
        onClick={onClick}
    >
        <div className="d-flex align-items-center justify-content-center rounded-4 me-3 flex-shrink-0"
            style={{ backgroundColor: `${color}15`, color: color, width: '48px', height: '48px' }}>
            <i className={`bi ${icon} fs-4`}></i>
        </div>
        <div>
            <span className="fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{title}</span>
            <h4 className="mb-0 fw-black" style={{ color: 'var(--text-primary)' }}>{value}</h4>
        </div>
    </div>
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
        nome_loja: '', documento: '', contato_whats: '', email: '', 
        responsavel: '', endereco: '', reputacao: 3, prazo_medio: '', status: 'Ativo'
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

    const flatSelectStyle = {
        height: '50px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px',
        backgroundColor: 'var(--bg-main, #FFFFFF)', color: 'var(--text-primary, #0F172A)',
        fontSize: '14px', boxShadow: 'none', width: '100%', padding: '0 15px'
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <div className="w-100 mx-auto pt-lg-4 pt-3" style={{ maxWidth: '1200px' }}>

                {/* ========================================================= */}
                {/* CABEÇALHO E CONTROLES */}
                {/* ========================================================= */}
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 px-3 px-lg-0 gap-3">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-truck me-3 opacity-75"></i>
                            Hub de Fornecedores
                        </h4>
                        <small className="mt-1 d-block" style={{ color: 'var(--text-secondary)' }}>Gerencie parceiros, marcas e reposição de estoque.</small>
                    </div>
                </div>

                {/* KPIs CLICÁVEIS COM SCROLL NO MOBILE */}
                <div className="d-flex gap-3 px-3 px-lg-0 pb-2 mb-4 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <SupplierKPI title="Total de Parceiros" value={suppliers.length} icon="bi-buildings" color="#0d6efd" active={filterStatus === 'Todos'} onClick={() => setFilterStatus('Todos')} />
                    <SupplierKPI title="Fornecedores Ativos" value={suppliers.filter(s => s.status === 'Ativo').length} icon="bi-check-all" color="#10B981" active={filterStatus === 'Ativo'} onClick={() => setFilterStatus('Ativo')} />
                    <SupplierKPI title="Produtos Vinculados" value={totalProdutos} icon="bi-box-seam" color="#8b5cf6" onClick={() => handleViewProducts(null)} />
                </div>

                <div className="d-flex flex-column flex-lg-row gap-3 px-3 px-lg-0 mb-4 border-bottom pb-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex-grow-1">
                        <CustomInput icon="bi-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar por Nome, CPF ou CNPJ..." />
                    </div>
                    <CtaButton color="#10B981" onClick={() => handleOpenModal()} className="px-4 text-white">
                        <i className="bi bi-plus-lg me-2"></i> Novo Parceiro
                    </CtaButton>
                </div>

                {/* ========================================================= */}
                {/* CONTEÚDO (Nossa FlatList Inteligente) */}
                {/* ========================================================= */}
                <div className="p-0 px-lg-0">
                    <AnimatePresence mode='wait'>
                        {loading ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="d-flex flex-column align-items-center justify-content-center py-5 mt-4">
                                <i className="bi bi-arrow-clockwise display-4 text-primary" style={{ animation: 'spin 1s linear infinite' }}></i>
                                <p className="mt-3 text-secondary fw-medium">Carregando parceiros...</p>
                            </motion.div>
                        ) : (
                            <FlatListContainer 
                                loading={false} 
                                empty={filteredSuppliers.length === 0} 
                                emptyMessage="Nenhum fornecedor encontrado com os filtros atuais." 
                                emptyIcon="bi-truck"
                            >
                                <FlatListHeader>
                                    <div className="col-lg-3 ps-2">Fornecedor / Identificação</div>
                                    <div className="col-lg-2">Contato Responsável</div>
                                    <div className="col-lg-2">WhatsApp</div>
                                    <div className="col-lg-1 text-center">Produtos</div>
                                    <div className="col-lg-2">Performance</div>
                                    <div className="col-lg-1 text-center">Status</div>
                                    <div className="col-lg-1 text-end pe-2">Ações</div>
                                </FlatListHeader>

                                {filteredSuppliers.map((s) => (
                                    <motion.div key={s.id_fornecedor} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-100">
                                        <FlatListItem className="py-3">
                                            <div className="row w-100 m-0 align-items-center">
                                                
                                                {/* 1. Nome/Doc */}
                                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0 d-flex align-items-center">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 flex-shrink-0" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)', width: '40px', height: '40px', fontSize: '14px' }}>
                                                        {s.nome_loja.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '14px' }}>{s.nome_loja}</div>
                                                        <div className="text-secondary small fw-medium text-truncate"><i className="bi bi-person-vcard me-1"></i>{formatDocument(s.documento) || 'Não informado'}</div>
                                                    </div>
                                                </div>

                                                {/* 2. Responsavel */}
                                                <div className="col-12 col-lg-2 p-0 mb-3 mb-lg-0">
                                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Contato:</span>
                                                    <div className="fw-bold text-dark text-truncate d-inline-block align-bottom" style={{ fontSize: '13px', maxWidth: '100%' }}>{s.responsavel || '---'}</div>
                                                    <div className="text-secondary text-truncate" style={{ fontSize: '11px', maxWidth: '100%' }}>{s.email || 'Sem e-mail'}</div>
                                                </div>

                                                {/* 3. WhatsApp */}
                                                <div className="col-12 col-lg-2 p-0 mb-3 mb-lg-0">
                                                    {s.contato_whats ? (
                                                        <a href={`https://wa.me/55${s.contato_whats.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                            <span className="bg-success text-white px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center" style={{ fontSize: '11px', transition: 'transform 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}>
                                                                <i className="bi bi-whatsapp me-2 fs-6"></i>WhatsApp
                                                            </span>
                                                        </a>
                                                    ) : <span className="text-secondary">---</span>}
                                                </div>

                                                {/* 4. Produtos */}
                                                <div className="col-6 col-lg-1 p-0 mb-3 mb-lg-0 text-lg-center">
                                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Itens:</span>
                                                    <span className="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => handleViewProducts(s)}>
                                                        <i className="bi bi-box-seam me-1"></i> {s._count?.produtos || 0}
                                                    </span>
                                                </div>

                                                {/* 5. Performance */}
                                                <div className="col-6 col-lg-2 p-0 mb-3 mb-lg-0">
                                                    <div className="text-warning mb-1" style={{ fontSize: '12px' }}>
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <i key={i} className={`bi ${i < s.reputacao ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                                                        ))}
                                                    </div>
                                                    <div className="text-secondary fw-medium text-truncate" style={{ fontSize: '11px' }}><i className="bi bi-clock me-1"></i> {s.prazo_medio || 0} dias (Prazo)</div>
                                                </div>

                                                {/* 6. Status */}
                                                <div className="col-6 col-lg-1 p-0 mb-3 mb-lg-0 text-lg-center">
                                                    <span className={`px-2 py-1 rounded-pill fw-bold bg-opacity-10 border border-opacity-25 ${s.status === 'Ativo' ? 'bg-success text-success border-success' : 'bg-danger text-danger border-danger'}`} style={{ fontSize: '11px' }}>
                                                        {s.status}
                                                    </span>
                                                </div>

                                                {/* 7. Ações */}
                                                <div className="col-6 col-lg-1 p-0 mt-2 mt-lg-0 d-flex flex-wrap justify-content-lg-end align-items-center gap-2">
                                                    <SquareButton onClick={() => handleOpenModal(s)} color="var(--bg-sidebar, #F4F6FA)">
                                                        <i className="bi bi-pencil text-primary"></i>
                                                    </SquareButton>
                                                    <RedSquareButton onClick={() => handleDelete(s.id_fornecedor)}>
                                                        <i className="bi bi-trash"></i>
                                                    </RedSquareButton>
                                                </div>
                                            </div>
                                        </FlatListItem>
                                    </motion.div>
                                ))}
                            </FlatListContainer>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL DE PRODUTOS VINCULADOS */}
            {/* ========================================================= */}
            <Modal show={showProductsModal} onHide={() => setShowProductsModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                    <button onClick={() => setShowProductsModal(false)} className="position-absolute top-0 end-0 m-3 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
                        <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                    </button>
                    <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-25 p-2 rounded-4 me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
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
                        <FlatListContainer loading={false} empty={false}>
                            <FlatListHeader>
                                <div className="col-2 ps-4">Item</div>
                                <div className="col-7">Nome</div>
                                <div className="col-3 text-end pe-4">Preço</div>
                            </FlatListHeader>
                            {selectedSupplierProducts.map(p => (
                                <FlatListItem key={p.id_produto} className="py-2 border-0 border-bottom rounded-0 mx-0">
                                    <div className="row w-100 m-0 align-items-center">
                                        <div className="col-2 ps-2">
                                            <img src={p.imagem_url || 'https://placehold.co/40?text=Img'} alt="img" className="rounded-3 border shadow-sm" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                        </div>
                                        <div className="col-7 fw-bold text-dark text-truncate" style={{ fontSize: '13px' }}>
                                            {p.nome}
                                        </div>
                                        <div className="col-3 text-end pe-2 fw-black text-success" style={{ fontSize: '14px' }}>
                                            R$ {Number(p.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </FlatListItem>
                            ))}
                        </FlatListContainer>
                    ) : (
                        <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                            <i className="bi bi-search mb-3 fs-1 opacity-25 d-block"></i>
                            <p className="fw-medium">Nenhum produto associado a este parceiro.</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* ========================================================= */}
            {/* MODAL DE CADASTRO/EDIÇÃO (SEM FORMS DO BOOTSTRAP) */}
            {/* ========================================================= */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                    <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
                        <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                    </button>
                    <h4 className="fw-bold mb-1">{editMode ? 'Ficha do Parceiro' : 'Nova Homologação'}</h4>
                    <p className="mb-0 opacity-75 small">Dados fiscais e de contato</p>
                </div>

                <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-12 mb-1"><small className="fw-bold text-uppercase" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>Informações de Contrato</small></div>
                            
                            <div className="col-md-7">
                                <label className="fw-semibold small text-dark mb-1">Razão Social / Nome da Loja</label>
                                <CustomInput required value={formData.nome_loja} onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })} placeholder="Nome da Empresa" />
                            </div>
                            
                            <div className="col-md-5">
                                <label className="fw-semibold small text-dark mb-1">CPF ou CNPJ</label>
                                <CustomInput required value={formData.documento} onChange={handleDocumentChange} placeholder="000.000.000-00" />
                            </div>

                            <div className="col-md-12 mt-4 mb-1"><small className="fw-bold text-uppercase" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>Comercial e Contato</small></div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">WhatsApp Corporativo</label>
                                <CustomInput value={formData.contato_whats} onChange={(e) => setFormData({ ...formData, contato_whats: e.target.value })} placeholder="DDD + Número" />
                            </div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">E-mail para Pedidos</label>
                                <CustomInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" />
                            </div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">Pessoa de Contato</label>
                                <CustomInput value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome" />
                            </div>

                            <div className="col-md-12 mt-4 mb-1"><small className="fw-bold text-uppercase" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>Performance e Logística</small></div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={flatSelectStyle}>
                                    <option value="Ativo">Ativo / Homologado</option>
                                    <option value="Suspenso">Suspenso / Em Revisão</option>
                                </select>
                            </div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">Reputação Interna</label>
                                <select value={formData.reputacao} onChange={(e) => setFormData({ ...formData, reputacao: Number(e.target.value) })} style={flatSelectStyle}>
                                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Estrelas</option>)}
                                </select>
                            </div>
                            
                            <div className="col-md-4">
                                <label className="fw-semibold small text-dark mb-1">Prazo de Envio Médio</label>
                                <CustomInput type="number" value={formData.prazo_medio} onChange={(e) => setFormData({ ...formData, prazo_medio: e.target.value })} placeholder="Dias" />
                            </div>
                            
                            <div className="col-md-12">
                                <label className="fw-semibold small text-dark mb-1">Endereço Sede / CD</label>
                                <CustomInput value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} placeholder="Rua, Cidade - UF" />
                            </div>
                        </div>

                        <div className="d-grid mt-4 pt-3 border-top" style={{ borderColor: 'rgba(100, 116, 139, 0.15)' }}>
                            <CtaButton type="submit" className="w-100 py-3 fs-6">
                                {editMode ? 'Atualizar Cadastro' : 'Finalizar Homologação'}
                            </CtaButton>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SupplierListPage;