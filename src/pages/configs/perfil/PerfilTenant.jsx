import React, { useState, useEffect } from 'react';
import { Store, Globe, Lock, Save, Star, CalendarDays, ShieldCheck } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Nossos componentes universais de UI
import { GreenButton } from '../../../components/ui/buttons/CtaButton';
import { GreenSquareButton } from '../../../components/ui/buttons/SquareButton';
import { CustomInput } from '../../../components/ui/SearchInput/SearchInput'; 

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
                    <GreenButton onClick={handleSalvar} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-2" /> : <Save size={18} className="me-2" />} Salvar Alterações
                    </GreenButton>
                </div>

                {/* CABEÇALHO MOBILE (Invisível no Desktop) */}
                <div className="d-block d-lg-none px-3 mb-4 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                            <Store className="me-2 text-primary" size={22} /> Perfil da Empresa
                        </h4>
                        <GreenSquareButton onClick={handleSalvar} disabled={saving} size={42} radius={12}>
                            {saving ? <Spinner size="sm" /> : <Save size={18} />}
                        </GreenSquareButton>
                    </div>
                    <small className="d-block mt-1" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Gerencie os dados cadastrais do negócio.
                    </small>
                </div>

                <div className="px-3 px-lg-0">
                    <Row className="g-4">
                        <Col lg={8}>
                            {/* DADOS PRINCIPAIS */}
                            <Card className="border-0 bg-white rounded-4 mb-4 clean-card">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0" style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Dados Principais</h6>
                                </Card.Header>
                                <Card.Body className="p-4 pt-2">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark mb-1">Nome Fantasia (Aparece para o cliente)</Form.Label>
                                                <CustomInput 
                                                    icon="bi-shop"
                                                    name="nome_fantasia" 
                                                    value={formData.nome_fantasia} 
                                                    onChange={handleChange} 
                                                    placeholder="Ex: Ararinha Lanches" 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark mb-1">Razão Social</Form.Label>
                                                <CustomInput 
                                                    icon="bi-building"
                                                    name="razao_social" 
                                                    value={formData.razao_social} 
                                                    onChange={handleChange} 
                                                    placeholder="Sua Empresa LTDA" 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small d-flex justify-content-between text-dark mb-1">
                                                    <span>CNPJ / CPF</span>
                                                    <ShieldCheck size={14} className="text-success" title="Documento Verificado" />
                                                </Form.Label>
                                                <CustomInput 
                                                    icon="bi-card-text"
                                                    name="documento" 
                                                    value={formData.documento} 
                                                    disabled // Inalterável
                                                    className="opacity-75" // Deixa levemente apagado para indicar que não edita
                                                />
                                                <Form.Text className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                                                    Inalterável. Contate o suporte para mudar de titularidade.
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* ATENDIMENTO E CONTATO */}
                            <Card className="border-0 bg-white rounded-4 mb-4 mb-lg-0 clean-card">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0" style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Atendimento e Contato</h6>
                                </Card.Header>
                                <Card.Body className="p-4 pt-2">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark mb-1">WhatsApp / Telefone de Contato</Form.Label>
                                                <CustomInput 
                                                    icon="bi-whatsapp"
                                                    name="telefone_contato" 
                                                    value={formData.telefone_contato} 
                                                    onChange={handleChange} 
                                                    placeholder="(92) 99999-9999" 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark mb-1">Email de Suporte</Form.Label>
                                                <CustomInput 
                                                    icon="bi-envelope"
                                                    type="email"
                                                    name="email_contato" 
                                                    value={formData.email_contato} 
                                                    onChange={handleChange} 
                                                    placeholder="contato@sualoja.com" 
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* PLANO SAAS (Mantido Premium) */}
                            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-dark text-white position-relative overflow-hidden clean-card">
                                <div className="position-absolute opacity-10" style={{ top: '-20px', right: '-20px' }}>
                                    <Star size={120} />
                                </div>
                                <Card.Body className="p-4 position-relative z-1">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold text-warning mb-0 text-uppercase d-flex align-items-center" style={{ fontSize: '12px', letterSpacing: '1px' }}>
                                            <Star size={14} className="me-2" /> Meu Plano SaaS
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
                                    <Button variant="outline-light" size="sm" className="w-100 fw-bold border-opacity-50 py-2 rounded-pill transition-hover" onClick={() => window.location.href = '/admin/minha-fatura'}>
                                        Ver Faturas e Detalhes
                                    </Button>
                                </Card.Body>
                            </Card>

                            {/* IDENTIDADE WEB */}
                            <Card className="border-0 rounded-4 mb-4 clean-card" style={{ backgroundColor: '#F8FAFC' }}>
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                                        <Globe size={18} className="me-2"/> Identidade Web
                                    </h6>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold small text-dark mb-1">URL do Sistema (Slug)</Form.Label>
                                        <CustomInput 
                                            icon="bi-link-45deg"
                                            name="slug" 
                                            value={formData.slug} 
                                            onChange={handleChange} 
                                            placeholder="nomedasualoja"
                                        />
                                        <Form.Text className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                            Seu link padrão: <strong>{formData.slug}.ararinhacloud.shop</strong>
                                        </Form.Text>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-dark mb-1">Domínio Próprio (Opcional)</Form.Label>
                                        <CustomInput 
                                            icon="bi-globe"
                                            name="dominio_customizado" 
                                            value={formData.dominio_customizado} 
                                            onChange={handleChange} 
                                            placeholder="www.sualoja.com.br"
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 rounded-4 bg-danger bg-opacity-10 border border-danger border-opacity-25 clean-card">
                                <Card.Body className="p-4">
                                    <h6 className="fw-bold text-danger mb-2 d-flex align-items-center">
                                        <Lock size={16} className="me-2"/> Segurança da Conta
                                    </h6>
                                    <p className="small text-danger opacity-75 mb-0" style={{ lineHeight: '1.5' }}>
                                        Para alterar o email de login administrador ou a senha master da loja, utilize o menu de "Equipe e Permissões".
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>

            {/* 🟢 CSS GLOBAL DO NOVO DESIGN MOBILE (Mais limpo e elegante) */}
            <style>{`
                .perfil-wrapper {
                    background-color: var(--bg-main, #F1F5F9);
                    min-height: 100vh;
                }
                
                /* Cards unificados e minimalistas */
                .clean-card {
                    border: 1px solid rgba(100, 116, 139, 0.1) !important;
                    box-shadow: 0 4px 20px -10px rgba(0,0,0,0.05) !important;
                }

                .transition-hover { transition: all 0.2s ease; }
                .transition-hover:hover { transform: translateY(-2px); }

                @media (max-width: 991px) {
                    .perfil-wrapper {
                        background-color: #FFFFFF !important; /* No mobile, fundo branco limpo */
                    }
                    .clean-card {
                        border-radius: 20px !important;
                        background-color: #FFFFFF !important;
                        border: 1px solid #E2E8F0 !important;
                        box-shadow: 0 8px 30px rgba(0,0,0,0.03) !important; /* Sombra super suave */
                    }
                    /* Container do mobile com recuo pra respirar */
                    .container-fluid {
                        padding-left: 0.5rem !important;
                        padding-right: 0.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}