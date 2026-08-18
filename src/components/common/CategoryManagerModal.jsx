import { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Form, InputGroup, Alert, Spinner, Accordion, Badge, useAccordionButton } from 'react-bootstrap';
import api from '../../services/api';

// --- COMPONENTE CUSTOMIZADO PARA O ACORDEÃO (CORREÇÃO DO ERRO) ---
// Isso substitui o botão padrão do Accordion para evitar "Button dentro de Button"
const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionButton(eventKey);
    return (
        <div 
            onClick={decoratedOnClick} 
            style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center' }}
        >
            {children}
        </div>
    );
};

const CategoryManagerModal = ({ show, handleClose, initialCategories, onUpdate }) => {
    const [categories, setCategories] = useState(initialCategories);
    
    // Estados de Criação
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    
    // Estados de Edição (Inline)
    const [editingCategory, setEditingCategory] = useState(null); 
    const [editingSubCategory, setEditingSubCategory] = useState(null); 

    // Loadings
    const [loading, setLoading] = useState(false);
    const [subLoading, setSubLoading] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    // =========================================================================
    //                              CATEGORIAS (PAI)
    // =========================================================================

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/categorias', { nome: newCategoryName });
            setNewCategoryName('');
            onUpdate(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao adicionar categoria.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCategory = async (categoryId) => {
        if (window.confirm('Tem a certeza? Isso pode afetar produtos existentes.')) {
            try {
                await api.delete(`/categorias/${categoryId}`);
                onUpdate();
            } catch (err) {
                alert(err.response?.data?.message || 'Erro ao remover.');
            }
        }
    };

    const startEditingCategory = (cat) => {
        setEditingCategory({ id: cat.id_categoria, nome: cat.nome });
    };

    const saveCategoryEdit = async () => {
        if (!editingCategory.nome.trim()) return;
        try {
            await api.put(`/categorias/${editingCategory.id}`, { nome: editingCategory.nome });
            setEditingCategory(null);
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao atualizar categoria.');
        }
    };

    // =========================================================================
    //                              SUBCATEGORIAS
    // =========================================================================

    const handleAddSubCategory = async (e, parentId) => {
        e.preventDefault();
        if (!newSubCategoryName.trim()) return;
        setSubLoading(parentId);
        try {
            await api.post('/categorias/sub', { nome: newSubCategoryName, id_categoria: parentId });
            setNewSubCategoryName('');
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao adicionar sub.');
        } finally {
            setSubLoading(null);
        }
    };

    const handleRemoveSubCategory = async (subId) => {
        if (window.confirm('Remover esta subcategoria?')) {
            try {
                await api.delete(`/categorias/sub/${subId}`);
                onUpdate();
            } catch (err) {
                alert(err.response?.data?.message || 'Erro ao remover sub.');
            }
        }
    };

    const startEditingSub = (sub) => {
        setEditingSubCategory({ id: sub.id_subcategoria, nome: sub.nome });
    };

    const saveSubCategoryEdit = async () => {
        if (!editingSubCategory.nome.trim()) return;
        try {
            await api.put(`/categorias/sub/${editingSubCategory.id}`, { nome: editingSubCategory.nome });
            setEditingSubCategory(null);
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao atualizar subcategoria.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="category-manager-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <Modal.Title className="fw-bold fs-4">Gerenciar Categorias</Modal.Title>
                    <p className="text-muted small mb-0">Organize a estrutura da sua loja.</p>
                </div>
            </Modal.Header>
            
            <Modal.Body className="pt-4">
                {error && <Alert variant="danger" className="rounded-3 shadow-sm border-0">{error}</Alert>}
                
                {/* --- HEADER DE CRIAÇÃO --- */}
                <div className="p-4 mb-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25">
                    <Form onSubmit={handleAddCategory}>
                        <Form.Label className="fw-bold text-primary small text-uppercase mb-2">Nova Categoria Principal</Form.Label>
                        <InputGroup className="shadow-sm rounded-pill overflow-hidden bg-white">
                            <span className="input-group-text border-0 bg-white ps-3 text-primary">
                                <i className="bi bi-folder-plus fs-5"></i>
                            </span>
                            <Form.Control
                                className="border-0 py-2 shadow-none"
                                placeholder="Ex: Eletrônicos..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <Button variant="primary" type="submit" disabled={loading} className="px-4 fw-bold">
                                {loading ? <Spinner size="sm" /> : 'Adicionar'}
                            </Button>
                        </InputGroup>
                    </Form>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold text-secondary mb-0">Estrutura Atual</h6>
                    <Badge bg="light" text="dark" className="border">
                        {categories.length} Categorias
                    </Badge>
                </div>
                
                {/* --- LISTA DE CATEGORIAS --- */}
                <div className="custom-scrollbar" style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }}>
                    <Accordion defaultActiveKey="0" className="d-flex flex-column gap-3">
                        {categories.map((cat, index) => (
                            <Accordion.Item 
                                eventKey={String(index)} 
                                key={cat.id_categoria} 
                                className="border-0 shadow-sm rounded-4 overflow-hidden"
                            >
                                {/* AQUI É A CORREÇÃO: Usamos uma div wrapper em vez de Accordion.Header direto */}
                                <div className="d-flex align-items-center w-100 py-2 px-3 border-bottom custom-accordion-header bg-white">
                                    
                                    {/* Componente CustomToggle lida com o clique para abrir/fechar */}
                                    <CustomToggle eventKey={String(index)}>
                                        <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '40px', height: '40px'}}>
                                            <i className="bi bi-folder2-open text-warning fs-5"></i>
                                        </div>

                                        {/* --- MODO DE EDIÇÃO (CATEGORIA) --- */}
                                        {editingCategory && editingCategory.id === cat.id_categoria ? (
                                            <div className="flex-grow-1 d-flex gap-2 align-items-center me-3" onClick={(e) => e.stopPropagation()}>
                                                <Form.Control 
                                                    size="sm" 
                                                    value={editingCategory.nome} 
                                                    onChange={(e) => setEditingCategory({...editingCategory, nome: e.target.value})}
                                                    autoFocus
                                                />
                                                <Button size="sm" variant="success" onClick={saveCategoryEdit} className="d-flex align-items-center"><i className="bi bi-check-lg"></i></Button>
                                                <Button size="sm" variant="secondary" onClick={() => setEditingCategory(null)} className="d-flex align-items-center"><i className="bi bi-x-lg"></i></Button>
                                            </div>
                                        ) : (
                                            // --- MODO DE VISUALIZAÇÃO (CATEGORIA) ---
                                            <div className="flex-grow-1">
                                                <div className="fw-bold text-dark">{cat.nome}</div>
                                                <div className="text-muted small" style={{fontSize: '0.75rem'}}>
                                                    {cat.subcategorias?.length || 0} subcategorias
                                                </div>
                                            </div>
                                        )}
                                    </CustomToggle>
                                    
                                    {/* Botões de Ação (FORA do toggle, então não conflita) */}
                                    {(!editingCategory || editingCategory.id !== cat.id_categoria) && (
                                        <div className="d-flex gap-1 ms-2">
                                            <Button 
                                                variant="light" size="sm" 
                                                className="text-primary border-0 rounded-circle p-2 hover-bg-primary-light"
                                                onClick={() => startEditingCategory(cat)}
                                                title="Editar Nome"
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button 
                                                variant="light" size="sm" 
                                                className="text-danger border-0 rounded-circle p-2 hover-bg-danger-light"
                                                onClick={() => handleRemoveCategory(cat.id_categoria)}
                                                title="Excluir Categoria"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                <Accordion.Body className="bg-light bg-opacity-25 p-0">
                                    <div className="p-3">
                                        {/* Formulário Nova Subcategoria */}
                                        <div className="mb-3 px-1">
                                            <Form onSubmit={(e) => handleAddSubCategory(e, cat.id_categoria)}>
                                                <InputGroup size="sm">
                                                    <Form.Control
                                                        className="rounded-start-pill border-secondary border-opacity-25"
                                                        placeholder="Nova subcategoria..."
                                                        value={newSubCategoryName}
                                                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                                                    />
                                                    <Button 
                                                        variant="dark" type="submit" 
                                                        disabled={subLoading === cat.id_categoria}
                                                        className="rounded-end-pill px-3"
                                                    >
                                                        {subLoading === cat.id_categoria ? <Spinner size="sm"/> : <i className="bi bi-plus-lg"></i>}
                                                    </Button>
                                                </InputGroup>
                                            </Form>
                                        </div>

                                        {/* Lista de Subcategorias */}
                                        <ListGroup variant="flush" className="bg-transparent">
                                            {cat.subcategorias && cat.subcategorias.length > 0 ? (
                                                cat.subcategorias.map(sub => (
                                                    <ListGroup.Item 
                                                        key={sub.id_subcategoria} 
                                                        className="d-flex justify-content-between align-items-center py-2 bg-transparent border-bottom border-light px-2 sub-item-hover rounded-2"
                                                    >
                                                        <div className="d-flex align-items-center flex-grow-1 me-2">
                                                            <i className="bi bi-arrow-return-right text-muted me-2 small"></i>
                                                            
                                                            {/* --- MODO DE EDIÇÃO (SUBCATEGORIA) --- */}
                                                            {editingSubCategory && editingSubCategory.id === sub.id_subcategoria ? (
                                                                <div className="d-flex gap-2 w-100">
                                                                    <Form.Control 
                                                                        size="sm" 
                                                                        value={editingSubCategory.nome} 
                                                                        onChange={(e) => setEditingSubCategory({...editingSubCategory, nome: e.target.value})}
                                                                        autoFocus
                                                                    />
                                                                    <Button size="sm" variant="success" onClick={saveSubCategoryEdit}><i className="bi bi-check"></i></Button>
                                                                    <Button size="sm" variant="secondary" onClick={() => setEditingSubCategory(null)}><i className="bi bi-x"></i></Button>
                                                                </div>
                                                            ) : (
                                                                // --- MODO DE VISUALIZAÇÃO (SUBCATEGORIA) ---
                                                                <span className="text-secondary fw-medium">{sub.nome}</span>
                                                            )}
                                                        </div>

                                                        {/* Botões de Ação da Subcategoria */}
                                                        {(!editingSubCategory || editingSubCategory.id !== sub.id_subcategoria) && (
                                                            <div className="d-flex gap-1">
                                                                <Button 
                                                                    variant="link" className="text-muted p-0 text-decoration-none hover-text-primary me-2" 
                                                                    size="sm" onClick={() => startEditingSub(sub)}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </Button>
                                                                <Button 
                                                                    variant="link" className="text-muted p-0 text-decoration-none hover-text-danger" 
                                                                    size="sm" onClick={() => handleRemoveSubCategory(sub.id_subcategoria)}
                                                                >
                                                                    <i className="bi bi-x-circle-fill"></i>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </ListGroup.Item>
                                                ))
                                            ) : (
                                                <div className="text-center py-3 text-muted small fst-italic">
                                                    Nenhuma subcategoria.
                                                </div>
                                            )}
                                        </ListGroup>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            </Modal.Body>

            <style>{`
                .hover-bg-danger-light:hover { background-color: #fee2e2 !important; color: #dc3545 !important; }
                .hover-bg-primary-light:hover { background-color: #e0f2fe !important; color: #0d6efd !important; }
                .sub-item-hover:hover { background-color: rgba(0,0,0,0.03) !important; }
                .hover-text-danger:hover { color: #dc3545 !important; }
                .hover-text-primary:hover { color: #0d6efd !important; }
                
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            `}</style>
        </Modal>
    );
};

export default CategoryManagerModal;