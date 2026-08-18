import React, { useState, useEffect } from 'react';
import { User, Briefcase, FileText, GraduationCap, Target, Save, Plus, X } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api'; 

import ImageUploader from '../../../components/common/ImageUploader'; 

export default function PerfilFuncionario() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        nome_completo: '',
        email: '',
        imagem: '',
        especialidade: '',
        bio: '',
        formacao: [], 
        atuacao: [],  
        sobre: ''    
    });

    const carregarDados = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/usuarios/staff/me/perfil');
            
            const sobreText = Array.isArray(data.sobre) ? data.sobre.join('\n') : (data.sobre || '');

            setFormData({
                nome_completo: data.nome_completo || '',
                email: data.email || '',
                imagem: data.imagem || '',
                especialidade: data.especialidade || '',
                bio: data.bio || '',
                formacao: Array.isArray(data.formacao) ? data.formacao : [],
                atuacao: Array.isArray(data.atuacao) ? data.atuacao : [],
                sobre: sobreText
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao carregar dados do perfil.");
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

    // ==========================================
    // 🟢 FUNÇÕES PARA LISTAS DINÂMICAS
    // ==========================================
    const handleAddListItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const handleRemoveListItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleListItemChange = (field, index, value) => {
        setFormData(prev => {
            const newList = [...prev[field]];
            newList[index] = value;
            return { ...prev, [field]: newList };
        });
    };
    // ==========================================

    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            const dataToUpdate = {
                nome_completo: formData.nome_completo,
                imagem: formData.imagem,
                especialidade: formData.especialidade,
                bio: formData.bio,
                formacao: formData.formacao.filter(item => item.trim() !== ''),
                atuacao: formData.atuacao.filter(item => item.trim() !== ''),
                sobre: formData.sobre.split('\n').filter(item => item.trim() !== '')
            };

            await api.put('/usuarios/staff/me/perfil', dataToUpdate);
            
            localStorage.setItem('userName', formData.nome_completo);

            toast.success("Perfil profissional atualizado com sucesso!");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar informações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="perfil-wrapper">
            <Container fluid="lg" className="pb-5 px-lg-3 px-0 pt-lg-4 pt-3">
                
                {/* CABEÇALHO DESKTOP (Invisível no Mobile) */}
                <div className="d-none d-lg-flex justify-content-between align-items-center mb-4 px-3 px-lg-0">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                            <User className="me-2 text-primary" size={24} /> Meu Perfil Profissional
                        </h4>
                        <small style={{ color: 'var(--text-secondary)' }}>Gerencie suas informações de exibição pública na loja.</small>
                    </div>
                    <Button variant="primary" className="fw-bold rounded-pill px-4 shadow-sm" onClick={handleSalvar} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-2" /> : <Save size={18} className="me-2" />} Salvar Perfil
                    </Button>
                </div>

                {/* CABEÇALHO MOBILE (Invisível no Desktop) */}
                <div className="d-block d-lg-none px-3 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                            <User className="me-2 text-primary" size={22} /> Perfil
                        </h4>
                    </div>
                    <Button variant="dark" className="w-100 fw-bold rounded-4 shadow-sm py-3" onClick={handleSalvar} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-2" /> : <Save size={18} className="me-2" />} Salvar Perfil
                    </Button>
                </div>

                <div className="px-3 px-lg-0">
                    <Row className="g-4">
                        <Col md={4} lg={3}>
                            <Card className="border-0 shadow-sm rounded-4 mb-4 text-center mobile-gray-card">
                                <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center">
                                    <ImageUploader 
                                        label="Foto de Perfil"
                                        imageUrl={formData.imagem}
                                        onImageUpload={(url) => setFormData(prev => ({ ...prev, imagem: url }))}
                                        isSubImage={false}
                                        maxSizeMB={2}
                                    />
                                    <small className="text-muted d-block mt-3 px-2" style={{fontSize: '11px'}}>
                                        Sua foto fica visível no agendamento e PDV.
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={8} lg={9}>
                            <Card className="border-0 shadow-sm rounded-4 mb-4 mobile-gray-card">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0 text-dark" style={{ fontSize: '13px', letterSpacing: '1px' }}>Informações Clínicas / Profissionais</h6>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Nome Completo</Form.Label>
                                                <InputGroupWithIcon icon={<User size={18}/>}>
                                                    <Form.Control type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} className="bg-white border-0 shadow-sm" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Especialidade / Títulos</Form.Label>
                                                <InputGroupWithIcon icon={<Briefcase size={18}/>}>
                                                    <Form.Control type="text" name="especialidade" value={formData.especialidade} onChange={handleChange} placeholder="Ex: Vendedor, Caixa, Psicólogo..." className="bg-white border-0 shadow-sm" />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold small text-dark">Minibiografia</Form.Label>
                                                <InputGroupWithIcon icon={<FileText size={18}/>} isTextArea>
                                                    <Form.Control as="textarea" rows={3} name="bio" value={formData.bio} onChange={handleChange} placeholder="Resumo breve sobre sua atuação..." className="bg-white border-0 shadow-sm" style={{resize: 'none'}} />
                                                </InputGroupWithIcon>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* 🟢 SEÇÃO DE CURRÍCULO DINÂMICO */}
                            <Card className="border-0 shadow-sm rounded-4 mobile-gray-card">
                                <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                                    <h6 className="fw-bold text-uppercase mb-0 text-dark" style={{ fontSize: '13px', letterSpacing: '1px' }}>Currículo Vitae</h6>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-4">
                                        {/* Formação Acadêmica */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-primary d-flex align-items-center mb-3">
                                                    <GraduationCap size={16} className="me-2"/> Formação Acadêmica
                                                </Form.Label>
                                                
                                                {formData.formacao.map((item, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-2 input-group-mobile">
                                                        <Form.Control 
                                                            type="text" 
                                                            value={item} 
                                                            onChange={(e) => handleListItemChange('formacao', index, e.target.value)} 
                                                            placeholder="Ex: Curso - Univercidade (2015 - 2019)" 
                                                            className="bg-white border-0 shadow-sm me-2 py-2" 
                                                        />
                                                        <Button variant="light" className="text-danger border-0 bg-white shadow-sm p-2 rounded-3 d-flex" onClick={() => handleRemoveListItem('formacao', index)} title="Remover item">
                                                            <X size={20} />
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button 
                                                    variant="outline-primary" 
                                                    className="w-100 mt-2 fw-bold d-flex justify-content-center align-items-center py-2 rounded-pill border-dashed bg-transparent"
                                                    onClick={() => handleAddListItem('formacao')}
                                                >
                                                    <Plus size={16} className="me-1" /> Nova Formação
                                                </Button>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12} className="px-5"><hr className="text-muted opacity-25 my-1 m-0" /></Col>

                                        {/* Experiência e Atuação */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-success d-flex align-items-center mb-3">
                                                    <Target size={16} className="me-2"/> Experiências Profissionais
                                                </Form.Label>
                                                
                                                {formData.atuacao.map((item, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-2 input-group-mobile">
                                                        <Form.Control 
                                                            type="text" 
                                                            value={item} 
                                                            onChange={(e) => handleListItemChange('atuacao', index, e.target.value)} 
                                                            placeholder="Ex: Cargo - Empresa (Jun. 2024 - Set. 2025)" 
                                                            className="bg-white border-0 shadow-sm me-2 py-2" 
                                                        />
                                                        <Button variant="light" className="text-danger border-0 bg-white shadow-sm p-2 rounded-3 d-flex" onClick={() => handleRemoveListItem('atuacao', index)} title="Remover item">
                                                            <X size={20} />
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button 
                                                    variant="outline-success" 
                                                    className="w-100 mt-2 fw-bold d-flex justify-content-center align-items-center py-2 rounded-pill border-dashed bg-transparent text-success"
                                                    onClick={() => handleAddListItem('atuacao')}
                                                >
                                                    <Plus size={16} className="me-1" /> Nova Experiência
                                                </Button>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12} className="px-5"><hr className="text-muted opacity-25 my-1 m-0" /></Col>

                                        {/* Detalhes / Sobre */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-info d-flex align-items-center">
                                                    <FileText size={16} className="me-2"/> Detalhes Sobre Você (Parágrafos)
                                                </Form.Label>
                                                <Form.Control 
                                                    as="textarea" 
                                                    rows={5} 
                                                    name="sobre" 
                                                    value={formData.sobre} 
                                                    onChange={handleChange} 
                                                    placeholder="Escreva sobre sua história profissional em formato de parágrafos..." 
                                                    className="bg-white border-0 shadow-sm mt-2" 
                                                    style={{resize: 'none', padding: '15px'}}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .border-dashed {
                    border-style: dashed !important;
                    border-width: 2px !important;
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
                        border-radius: 12px !important;
                    }
                    .input-group-mobile .form-control {
                        border-radius: 12px !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
                    }
                }
            `}</style>
        </div>
    );
}

const InputGroupWithIcon = ({ icon, children, isTextArea }) => (
    <div className="position-relative d-flex align-items-center w-100">
        <div className="position-absolute ms-3 text-secondary opacity-75" style={{ zIndex: 5, pointerEvents: 'none', top: isTextArea ? '12px' : 'auto' }}>
            {icon}
        </div>
        {React.cloneElement(children, { 
            className: `${children.props.className || ''} ps-5 w-100`,
            style: { 
                ...children.props.style, 
                height: isTextArea ? 'auto' : '48px', // Maior no celular
                paddingTop: isTextArea ? '10px' : 'auto'
            }
        })}
    </div>
);