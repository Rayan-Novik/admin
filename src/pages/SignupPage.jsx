import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

// 🚀 IMPORTAÇÃO ATUALIZADA: Pegando a instância centralizada da API
import api from '../services/api'; 
import "../styles/login.css"; 

const SignupPage = () => {
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  const [planoSelecionado, setPlanoSelecionado] = useState('TRIAL');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // --- CONFIGURAÇÃO DOS PLANOS DISPONÍVEIS ---
  const planos = [
    { id: 'TRIAL', nome: 'Teste Grátis', preco: 'R$ 0,00', detalhe: '7 dias sem compromisso' },
    { id: 'BASICO', nome: 'Básico', preco: 'R$ 49,90', detalhe: '/mês - Essencial' },
    { id: 'PRO', nome: 'Profissional', preco: 'R$ 89,90', detalhe: '/mês - Completo' }
  ];

  // --- FUNÇÕES DE FORMATAÇÃO (MÁSCARAS) ---
  const formatarDocumento = (value) => {
    const limpo = value.replace(/\D/g, ''); 
    if (limpo.length <= 11) {
      return limpo
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return limpo
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18); 
    }
  };

  const formatarTelefone = (value) => {
    const limpo = value.replace(/\D/g, '');
    if (limpo.length <= 10) {
      return limpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return limpo
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
    }
  };

  const handleDocumentoChange = (e) => setDocumento(formatarDocumento(e.target.value));
  const handleTelefoneChange = (e) => setTelefone(formatarTelefone(e.target.value));

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // 🚀 REQUISIÇÃO ATUALIZADA: Usando a rota base configurada no api.js
      const { data } = await api.post('/tenants/register', {
        nome_fantasia: nomeFantasia,
        razao_social: razaoSocial,
        documento: documento,
        telefone_contato: telefone,
        email: email,
        senha: senha,
        plano: planoSelecionado
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/login?store=${data.slug || 'default'}`);
      }, 3000);

    } catch (err) {
      // 🔴 NOVO: Joga o erro completo no console do navegador (Aperte F12 para ver)
      console.error("❌ Erro detalhado recebido do Backend:", err.response || err);
      
      // 🔴 NOVO: Tenta pescar a mensagem exata que o backend cuspiu
      const msgBackend = err.response?.data?.message || err.response?.data?.error || 'Erro interno no servidor ao criar a conta.';
      
      // Exibe na tela vermelha do alerta
      setError(`Falha: ${msgBackend}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ararinha-login min-vh-100 d-flex align-items-center py-5">
      <div className="ararinha-login__bg" aria-hidden="true" />

      <Container className="position-relative py-5">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={7} xl={6}>
            <div className="text-center mb-4">
              <div className="ararinha-login__logoWrap mx-auto mb-3">
                <img src="/logologin.png" alt="Ararinha" className="img-fluid" style={{ maxHeight: 72 }} />
              </div>
              <h3 className="fw-bold mb-1 ararinha-login__title">Crie sua Loja</h3>
              <p className="text-muted mb-0">Rápido, fácil e feito para crescer com você.</p>
            </div>

            <Card className="border-0 shadow ararinha-login__card rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                
                {success && (
                  <Alert variant="success" className="rounded-3 border-0 small text-center mb-4">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Loja criada! Redirecionando para o painel...
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger" className="rounded-3 border-0 small text-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={submitHandler} style={{ display: success ? 'none' : 'block' }}>
                  
                  {/* OPÇÕES DE PLANO */}
                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted fw-semibold">Escolha seu Plano</Form.Label>
                    <Row className="g-2">
                      {planos.map((p) => (
                        <Col xs={12} sm={4} key={p.id}>
                          <div 
                            onClick={() => setPlanoSelecionado(p.id)}
                            className={`p-3 h-100 rounded-3 border text-center position-relative`}
                            style={{ 
                              cursor: 'pointer', 
                              transition: '0.3s',
                              borderColor: planoSelecionado === p.id ? '#0d6efd' : '#e9ecef',
                              backgroundColor: planoSelecionado === p.id ? '#f0f7ff' : '#f8f9fa'
                            }}
                          >
                            {planoSelecionado === p.id && (
                              <div className="position-absolute text-primary" style={{ top: '5px', right: '10px' }}>
                                <i className="bi bi-check-circle-fill"></i>
                              </div>
                            )}
                            <h6 className={`fw-bold mb-1 ${planoSelecionado === p.id ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.85rem' }}>
                              {p.nome}
                            </h6>
                            <div className="fw-bold text-dark fs-6">{p.preco}</div>
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>{p.detalhe}</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Form.Group>

                  {/* DEMAIS DADOS DO FORMULÁRIO */}
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-semibold">Nome da Loja</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-shop fs-5"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Ex: Moda Express"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                        required
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-semibold">Razão Social / Titular</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-person-badge fs-5"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Nome da empresa ou do dono"
                        value={razaoSocial}
                        onChange={(e) => setRazaoSocial(e.target.value)}
                        required
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-semibold">CPF ou CNPJ</Form.Label>
                        <InputGroup className="ararinha-login__input">
                          <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-card-text fs-5"></i></InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="000.000.000-00"
                            value={documento}
                            onChange={handleDocumentoChange} 
                            required
                            className="border-0 bg-transparent shadow-none"
                            style={{ height: 46 }}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-semibold">WhatsApp</Form.Label>
                        <InputGroup className="ararinha-login__input">
                          <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-whatsapp fs-5"></i></InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={telefone}
                            onChange={handleTelefoneChange} 
                            required
                            className="border-0 bg-transparent shadow-none"
                            style={{ height: 46 }}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-semibold">E-mail de Acesso</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-envelope fs-5"></i></InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="admin@loja.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted fw-semibold">Senha</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary"><i className="bi bi-lock fs-5"></i></InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        minLength={6}
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                      />
                      <Button variant="link" className="text-decoration-none pe-3" onClick={() => setShowPassword(!showPassword)} type="button">
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-grid mb-3">
                    <Button type="submit" disabled={loading} className="ararinha-login__btn rounded-pill fw-bold py-2" size="lg">
                      {loading ? <Spinner as="span" animation="border" size="sm" /> : (
                         planoSelecionado === 'TRIAL' ? "Criar Minha Loja (7 Dias Grátis)" : `Assinar Plano e Criar Loja`
                      )}
                    </Button>
                  </div>

                  <div className="text-center mt-4">
                    <span className="text-muted small">Já tem uma conta? </span>
                    <Link to="/login" className="text-primary fw-bold small text-decoration-none">Acessar Painel</Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SignupPage;