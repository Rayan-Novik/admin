import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Button, Form, Modal, Badge, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion'; // Para animações suaves
import api from '../../../services/api';
import { toast } from 'react-toastify';

const CouponsModule = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dados auxiliares
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const initialFormState = {
        codigo: '',
        descricao: '',
        tipo_desconto: 'PERCENTUAL',
        valor: '',
        data_validade: '',
        valor_minimo: '',
        usos_maximos: '',
        alvo: 'TOTAL_CARRINHO',
        id_produto_alvo: '',
        id_categoria_alvo: '',
        id_marca_alvo: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    // --- CARREGAMENTO DE DADOS ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [couponsRes, prodRes, catRes, brandRes] = await Promise.all([
                api.get('/cupons'),
                api.get('/produtos'),
                api.get('/categorias'),
                api.get('/marcas')
            ]);

            // Filtra apenas ativos/não deletados (ajuste conforme seu backend)
            const activeCoupons = couponsRes.data.filter(cupom => cupom.ativo !== false);
            setCoupons(activeCoupons);

            setProducts(prodRes.data);
            setCategories(catRes.data);
            setBrands(brandRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: coupons.length,
        ativos: coupons.filter(c => new Date(c.data_validade) >= new Date()).length,
        expirados: coupons.filter(c => new Date(c.data_validade) < new Date()).length
    }), [coupons]);

    // --- HANDLERS ---
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este cupom?')) {
            try {
                await api.delete(`/cupons/${id}`);
                toast.success('Cupom removido!');
                fetchData(); 
            } catch (error) {
                fetchData(); // Recarrega para garantir consistência
                toast.info('Cupom arquivado com sucesso.');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            
            // Limpeza de IDs não usados
            if (payload.alvo !== 'PRODUTO') payload.id_produto_alvo = null;
            if (payload.alvo !== 'CATEGORIA') payload.id_categoria_alvo = null;
            if (payload.alvo !== 'MARCA') payload.id_marca_alvo = null;

            await api.post('/cupons', payload);
            toast.success('Cupom criado com sucesso!');
            setShowModal(false);
            setFormData(initialFormState);
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao salvar cupom.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Helper para verificar status
    const getStatus = (cupom) => {
        const isExpired = new Date(cupom.data_validade) < new Date();
        const isLimitReached = cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos;
        
        if (isExpired) return { text: 'Expirado', bg: 'danger', icon: 'bi-calendar-x' };
        if (isLimitReached) return { text: 'Esgotado', bg: 'secondary', icon: 'bi-slash-circle' };
        return { text: 'Ativo', bg: 'success', icon: 'bi-check-circle' };
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={6}>
                    <h2 className="fw-bold mb-0 text-dark">Cupons de Desconto</h2>
                    <p className="text-muted mb-0 small">Gerencie códigos promocionais e regras de desconto.</p>
                </Col>
                <Col md={12} lg={6}>
                    <Row className="g-2 justify-content-lg-end">
                        <Col xs={6} sm={4}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>TOTAL</small>
                                    <span className="fw-bold text-dark">{stats.total}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVOS</small>
                                    <span className="fw-bold text-success">{stats.ativos}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={4}>
                            <Button 
                                variant="dark" 
                                onClick={() => { setFormData(initialFormState); setShowModal(true); }} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0 fw-bold"
                            >
                                <i className="bi bi-plus-lg fs-5"></i>
                                <span style={{fontSize:'0.7rem'}}>NOVO CUPOM</span>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Lista de Cupons (Cards Verticais) */}
            <AnimatePresence>
                {coupons.length === 0 ? (
                    <div className="text-center p-5 border rounded-4 bg-light text-muted">
                        <i className="bi bi-ticket-perforated fs-1 mb-3 d-block opacity-25"></i>
                        <p>Nenhum cupom cadastrado.</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} xl={3} className="g-4">
                        {coupons.map(cupom => {
                            const status = getStatus(cupom);
                            
                            return (
                                <Col key={cupom.id_cupom}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ y: -5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className={`h-100 shadow-sm border-0 rounded-4 overflow-hidden ${status.text !== 'Ativo' ? 'opacity-75' : ''}`}>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <Badge bg="light" text="dark" className="border fs-6 fw-bold font-monospace mb-1 px-3 py-2">
                                                            {cupom.codigo}
                                                        </Badge>
                                                        <small className="text-muted d-block mt-1">{cupom.descricao || 'Sem descrição'}</small>
                                                    </div>
                                                    <Badge bg={status.bg} pill className="shadow-sm">
                                                        <i className={`bi ${status.icon} me-1`}></i> {status.text}
                                                    </Badge>
                                                </div>

                                                <div className="my-3 py-3 border-top border-bottom">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <div className={`rounded-circle p-2 me-3 ${cupom.tipo_desconto === 'PERCENTUAL' ? 'bg-primary' : 'bg-success'} bg-opacity-10 text-${cupom.tipo_desconto === 'PERCENTUAL' ? 'primary' : 'success'}`}>
                                                            <i className={`bi ${cupom.tipo_desconto === 'PERCENTUAL' ? 'bi-percent' : 'bi-currency-dollar'} fs-5`}></i>
                                                        </div>
                                                        <div>
                                                            <span className="d-block small text-muted text-uppercase fw-bold">Desconto</span>
                                                            <span className="fw-bold fs-5 text-dark">
                                                                {cupom.tipo_desconto === 'PERCENTUAL' ? `${Number(cupom.valor)}%` : formatCurrency(cupom.valor)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center">
                                                        <div className="rounded-circle p-2 me-3 bg-secondary bg-opacity-10 text-secondary">
                                                            <i className="bi bi-bullseye fs-5"></i>
                                                        </div>
                                                        <div>
                                                            <span className="d-block small text-muted text-uppercase fw-bold">Aplicado Em</span>
                                                            <span className="text-dark small">
                                                                {cupom.alvo === 'TOTAL_CARRINHO' && 'Carrinho Completo'}
                                                                {cupom.alvo === 'FRETE' && 'Frete'}
                                                                {cupom.alvo === 'PRODUTO' && (cupom.produtos?.nome || 'Produto Específico')}
                                                                {cupom.alvo === 'CATEGORIA' && (cupom.categorias?.nome || 'Categoria')}
                                                                {cupom.alvo === 'MARCA' && (cupom.marcas?.nome || 'Marca')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto d-flex justify-content-between align-items-center text-muted small">
                                                    <span>
                                                        <i className="bi bi-people me-1"></i> {cupom.usos_atuais} / {cupom.usos_maximos || '∞'}
                                                    </span>
                                                    <span>
                                                        <i className="bi bi-calendar-event me-1"></i> {new Date(cupom.data_validade).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="d-grid mt-3">
                                                    <Button variant="outline-danger" size="sm" className="border-0 bg-light" onClick={() => handleDelete(cupom.id_cupom)}>
                                                        <i className="bi bi-trash me-2"></i> Excluir Cupom
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </AnimatePresence>

            {/* --- MODAL DE CRIAÇÃO (Estilizado) --- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered contentClassName="rounded-4 border-0">
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold fs-5">Criar Novo Cupom</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="pt-3 pb-4">
                        <p className="text-muted small mb-4">Preencha os detalhes da promoção abaixo.</p>
                        
                        <Row className="g-3">
                            {/* Bloco Principal */}
                            <Col md={12}>
                                <Card className="bg-light border-0 rounded-3 p-3">
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Código (Ex: VERAO10)</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    value={formData.codigo}
                                                    onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '')})}
                                                    placeholder="CÓDIGO"
                                                    required
                                                    className="fw-bold text-uppercase border-0 shadow-sm"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Descrição Interna</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    value={formData.descricao}
                                                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                                                    placeholder="Para controle interno..."
                                                    className="border-0 shadow-sm"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            {/* Valores */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Desconto</Form.Label>
                                    <Form.Select 
                                        value={formData.tipo_desconto}
                                        onChange={e => setFormData({...formData, tipo_desconto: e.target.value})}
                                        className="border-0 shadow-sm bg-light"
                                    >
                                        <option value="PERCENTUAL">Porcentagem (%)</option>
                                        <option value="FIXO">Valor Fixo (R$)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Valor do Desconto</Form.Label>
                                    <InputGroup className="shadow-sm">
                                        <InputGroup.Text className="bg-white border-0 text-muted">
                                            {formData.tipo_desconto === 'PERCENTUAL' ? '%' : 'R$'}
                                        </InputGroup.Text>
                                        <Form.Control 
                                            type="number" 
                                            value={formData.valor}
                                            onChange={e => setFormData({...formData, valor: e.target.value})}
                                            required
                                            placeholder="0.00"
                                            className="border-0"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            <Col md={12}><hr className="my-2 opacity-10"/></Col>

                            {/* Regras de Alvo */}
                            <Col md={12}>
                                <h6 className="fw-bold small text-primary mb-3"><i className="bi bi-bullseye me-1"></i> Regras de Aplicação</h6>
                                <Row className="g-3">
                                    <Col md={5}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-1">Aplicar Em:</Form.Label>
                                            <Form.Select 
                                                value={formData.alvo}
                                                onChange={e => setFormData({...formData, alvo: e.target.value})}
                                                className="border-0 shadow-sm bg-light text-primary fw-bold"
                                            >
                                                <option value="TOTAL_CARRINHO">Todo o Carrinho (Padrão)</option>
                                                <option value="PRODUTO">Produto Específico</option>
                                                <option value="CATEGORIA">Categoria Específica</option>
                                                <option value="MARCA">Marca Específica</option>
                                                <option value="FRETE">Apenas no Frete</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={7}>
                                        {formData.alvo === 'PRODUTO' && (
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Escolha o Produto</Form.Label>
                                                <Form.Select 
                                                    value={formData.id_produto_alvo}
                                                    onChange={e => setFormData({...formData, id_produto_alvo: e.target.value})}
                                                    required
                                                    className="border-0 shadow-sm"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {products.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        )}
                                        {formData.alvo === 'CATEGORIA' && (
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Escolha a Categoria</Form.Label>
                                                <Form.Select 
                                                    value={formData.id_categoria_alvo}
                                                    onChange={e => setFormData({...formData, id_categoria_alvo: e.target.value})}
                                                    required
                                                    className="border-0 shadow-sm"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        )}
                                        {formData.alvo === 'MARCA' && (
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Escolha a Marca</Form.Label>
                                                <Form.Select 
                                                    value={formData.id_marca_alvo}
                                                    onChange={e => setFormData({...formData, id_marca_alvo: e.target.value})}
                                                    required
                                                    className="border-0 shadow-sm"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {brands.map(b => <option key={b.id_marca} value={b.id_marca}>{b.nome}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        )}
                                        {['TOTAL_CARRINHO', 'FRETE'].includes(formData.alvo) && (
                                            <div className="d-flex align-items-center h-100 text-muted small fst-italic">
                                                O desconto será aplicado no subtotal {formData.alvo === 'FRETE' ? 'do envio' : 'dos produtos'}.
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </Col>

                            <Col md={12}><hr className="my-2 opacity-10"/></Col>

                            {/* Restrições */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Mínimo (R$)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        value={formData.valor_minimo}
                                        onChange={e => setFormData({...formData, valor_minimo: e.target.value})}
                                        placeholder="0.00"
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Válido Até</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.data_validade}
                                        onChange={e => setFormData({...formData, data_validade: e.target.value})}
                                        required
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Limite Usos</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        value={formData.usos_maximos}
                                        onChange={e => setFormData({...formData, usos_maximos: e.target.value})}
                                        placeholder="∞"
                                        className="border-0 shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)} className="text-decoration-none text-muted rounded-pill">Cancelar</Button>
                        <Button variant="dark" type="submit" className="px-4 rounded-pill fw-bold shadow-sm" disabled={saving}>
                            {saving ? <Spinner size="sm" /> : 'Salvar Cupom'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default CouponsModule;