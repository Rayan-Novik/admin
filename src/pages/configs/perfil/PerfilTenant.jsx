import React, { useState, useEffect } from 'react';
import { Store, Phone, Mail, Globe, Lock, Save, Hash, Star, CalendarDays, ShieldCheck } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api';

export default function PerfilTenant() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        razao_social: '',
        documento: '',
        telefone_contato: '',
        email_contato: '',
        slug: '',
        dominio_customizado: '',
        plano: '',
        status_assinatura: '',
        data_vencimento: null
    });

    const carregarDados = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/tenants/info'); 
            setFormData({
                nome_fantasia: data.nome_fantasia || '',
                razao_social: data.razao_social || '',
                documento: data.documento || '',
                telefone_contato: data.telefone_contato || '',
                email_contato: data.email_contato || '',
                slug: data.slug || '',
                dominio_customizado: data.dominio_customizado || '',
                plano: data.plano || 'Básico',
                status_assinatura: data.status_assinatura || 'INATIVO',
                data_vencimento: data.data_vencimento || null
            });
        } catch (error) {
            toast.error("Erro ao carregar dados da loja.");
        } finally { 
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            const dataToUpdate = {
                nome_fantasia: formData.nome_fantasia,
                razao_social: formData.razao_social,
                documento: formData.documento, 
                telefone_contato: formData.telefone_contato,
                email_contato: formData.email_contato,
                slug: formData.slug,
                dominio_customizado: formData.dominio_customizado
            };

            await api.put('/tenants/info', dataToUpdate);
            
            localStorage.setItem('tenantName', formData.nome_fantasia);
            localStorage.setItem('tenantSlug', formData.slug);
            if(formData.dominio_customizado) localStorage.setItem('tenantDomain', formData.dominio_customizado);

            toast.success("Dados da loja atualizados com sucesso!");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar informações.");
        } finally {
            setSaving(false);
        }
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        return new Date(dataString).toLocaleDateString('pt-BR');
    };

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="perfil-wrapper">
            <Container fluid="lg" className="pb-5 px-lg-3 px-0 pt-lg-4 pt-3">
                
                {/* CABEÇALHO DESKTOP (Invisível no Mobile) */}
                <div className="d-none d-lg-flex justify-content-between align-items-center mb-4 px-3 px-lg-0">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                            <Store className="me-2 text-primary" size={24} /> Perfil da Empresa
                        </h4>
                        <small style={{ color: 'var(--text-secondary)' }}>Visualize e gerencie os dados cadastrais e fiscais do seu negócio.</small>
                    </div>
                    <Button variant="primary" className="fw-bold rounded-pill px-4 shadow-sm" onClick={handleSalvar} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-2" /> : <Save size={18} className="me-2" />} Salvar Alterações
                    </Button>
                </div>

                {/* CABEÇALHO MOBILE (Invisível no Desktop) */}
                <div className="d-block d-lg-none px-3 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                            <Store className="me-2 text-primary" size={22} /> Perfil da Empresa
                        </h4>
                    </div>
                    <Button variant="dark" className="w-100 fw-bold rounded-4 shadow-sm py-3" onClick={handleSalvar} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-2" /> : <Save size={18} className="me-2" />} Salvar Alterações
                    </Button>
                </div>

                <div className="px-3 px-lg-0">
                    <Row className="g-4">
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm rounded-4 mb-4 mobile-gray-card">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0 text-dark" style={{ fontSize: '13px', letterSpacing: '1px' }}>Dados Principais</h6>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Nome Fantasia (Aparece para o cliente)</Form.Label>
                                                <InputGroupWithIcon icon={<Store size={18}/>}>
                                                    <Form.Control type="text" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} placeholder="Ex: Ararinha Lanches" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Razão Social</Form.Label>
                                                <InputGroupWithIcon icon={<Store size={18}/>}>
                                                    <Form.Control type="text" name="razao_social" value={formData.razao_social} onChange={handleChange} placeholder="Sua Empresa LTDA" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small d-flex justify-content-between text-dark">
                                                    <span>CNPJ / CPF</span>
                                                    <ShieldCheck size={14} className="text-success" title="Documento Verificado" />
                                                </Form.Label>
                                                <InputGroupWithIcon icon={<Hash size={18}/>}>
                                                    <Form.Control type="text" value={formData.documento} disabled className="bg-white bg-opacity-50 text-muted fw-bold border-0" />
                                                </InputGroupWithIcon>
                                                <Form.Text className="text-muted" style={{ fontSize: '10px' }}>Inalterável. Contate o suporte para mudar de titularidade.</Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 mobile-gray-card mb-4 mb-lg-0">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0 text-dark" style={{ fontSize: '13px', letterSpacing: '1px' }}>Atendimento e Contato Público</h6>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">WhatsApp / Telefone de Contato</Form.Label>
                                                <InputGroupWithIcon icon={<Phone size={18}/>}>
                                                    <Form.Control type="text" name="telefone_contato" value={formData.telefone_contato} onChange={handleChange} placeholder="(92) 99999-9999" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Email de Suporte</Form.Label>
                                                <InputGroupWithIcon icon={<Mail size={18}/>}>
                                                    <Form.Control type="email" name="email_contato" value={formData.email_contato} onChange={handleChange} placeholder="contato@sualoja.com" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-dark text-white position-relative overflow-hidden">
                                <div className="position-absolute opacity-10" style={{ top: '-20px', right: '-20px' }}>
                                    <Star size={120} />
                                </div>
                                <Card.Body className="p-4 position-relative z-1">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold text-warning mb-0 text-uppercase d-flex align-items-center" style={{ fontSize: '13px', letterSpacing: '1px' }}>
                                            <Star size={16} className="me-2" /> Meu Plano SaaS
                                        </h6>
                                        <Badge bg={formData.status_assinatura === 'ATIVO' ? 'success' : 'danger'} className="text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                                            {formData.status_assinatura}
                                        </Badge>
                                    </div>
                                    <h3 className="fw-black mb-3 text-white">{formData.plano}</h3>
                                    <div className="d-flex align-items-center text-light opacity-75 mb-3" style={{ fontSize: '13px' }}>
                                        <CalendarDays size={16} className="me-2" />
                                        <span>Renova em: <strong>{formatarData(formData.data_vencimento)}</strong></span>
                                    </div>
                                    <Button variant="outline-light" size="sm" className="w-100 fw-bold border-opacity-50 py-2 rounded-pill" onClick={() => window.location.href = '/admin/minha-fatura'}>
                                        Ver Faturas e Detalhes
                                    </Button>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#eff6ff' }}>
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-primary mb-3"><Globe size={18} className="me-2"/> Identidade Web</h6>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold small text-dark">URL do Sistema (Slug)</Form.Label>
                                        <Form.Control type="text" name="slug" value={formData.slug} onChange={handleChange} className="bg-white border-0 shadow-sm" style={{ padding: '12px' }}/>
                                        <Form.Text className="text-muted" style={{ fontSize: '11px' }}>Seu link padrão: <strong>{formData.slug}.ararinhacloud.shop</strong></Form.Text>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-dark">Domínio Próprio (Opcional)</Form.Label>
                                        <Form.Control type="text" name="dominio_customizado" value={formData.dominio_customizado} onChange={handleChange} placeholder="www.sualoja.com.br" className="bg-white border-0 shadow-sm" style={{ padding: '12px' }} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-4 bg-danger bg-opacity-10 border border-danger border-opacity-25">
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-danger mb-2"><Lock size={18} className="me-2"/> Segurança da Conta</h6>
                                    <p className="small text-danger opacity-75 mb-0" style={{ lineHeight: '1.5' }}>Para alterar o email de login administrador ou a senha master da loja, utilize o menu de "Equipe e Permissões".</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .form-control {
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                
                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                @media (max-width: 991px) {
                    .perfil-wrapper {
                        background-color: var(--bg-main, #f8fafc) !important;
                        min-height: 100vh;
                    }
                    .mobile-gray-card {
                        background-color: #e6e6e6 !important;
                        border: none !important;
                        border-radius: 20px !important;
                        box-shadow: none !important;
                    }
                    /* Inputs dentro do mobile ficam brancos e sem bordas duras */
                    .mobile-gray-card .form-control {
                        background-color: #ffffff !important;
                        border: none !important;
                        border-radius: 12px;
                        padding: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
                    }
                }
            `}</style>
        </div>
    );
}

const InputGroupWithIcon = ({ icon, children }) => (
    <div className="position-relative d-flex align-items-center w-100">
        <div className="position-absolute ms-3 text-secondary opacity-75" style={{ zIndex: 5, pointerEvents: 'none' }}>
            {icon}
        </div>
        {React.cloneElement(children, { 
            className: `${children.props.className || ''} ps-5 w-100`,
            style: { ...children.props.style, height: '48px' } // Mais alto pro mobile
        })}
    </div>
);