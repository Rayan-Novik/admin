import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
// ✅ IMPORTANTE: Importando a sua instância configurada da API em vez do axios puro
// Ajuste o caminho '../services/api' se o seu arquivo api.js estiver em outra pasta!
import api from '../services/api'; 
import "../styles/login.css";

const LoginPage = ({ onLogin }) => {
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const APP_VERSION = '1.0.1-beta';

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`Enviando login global...`);

      // 🚀 MODO GLOBAL: Usando a sua configuração 'api' que já pega a URL do .env
      const { data } = await api.post('/usuarios/login', {
        email: loginInput,
        senha,
        tenant: 'default' 
      });

      const allowedRoles = ['ATENDENTE', 'CAIXA', 'ADMIN'];

      if (data && (data.isAdmin || (data.role && allowedRoles.includes(data.role)))) {
        
        // 1. Salva os dados do usuário
        localStorage.setItem('adminInfo', JSON.stringify(data));
        
        // 2. 🚀 SALVA A LOJA QUE O BACKEND DESCOBRIU!
        const discoveredSlug = data.tenantSlug || 'default';
        localStorage.setItem('tenantSlug', discoveredSlug);
        localStorage.setItem('tenantId', data.id_tenant);

        // 3. Atualiza o estado global no App.js
        onLogin(data);

        // 4. 🔒 Redireciona INJETANDO a loja correta na URL automaticamente!
        navigate(`/?store=${discoveredSlug}`);

      } else {
        setError('Acesso restrito a colaboradores.');
      }
    } catch (err) {
      // ✅ Tratamento inteligente de erros: separa erro de rede de erro de senha
      if (!err.response) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está online.');
      } else {
        setError(err.response?.data?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ararinha-login min-vh-100 d-flex align-items-center">
      <div className="ararinha-login__bg" aria-hidden="true" />

      <Container className="position-relative">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>
            <div className="text-center mb-4">
              <div className="ararinha-login__logoWrap mx-auto mb-3">
                <img
                  src="/logologin.png"
                  alt="Ararinha"
                  className="img-fluid"
                  style={{ maxHeight: 72 }}
                />
              </div>

              <h3 className="fw-bold mb-1 ararinha-login__title">Ararinha SaaS</h3>
              <p className="text-muted mb-0">Acesse o seu painel de gestão</p>
            </div>

            <Card className="border-0 shadow ararinha-login__card rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                
                {error && (
                  <Alert variant="danger" className="rounded-3 border-0 small text-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={submitHandler}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-semibold">Usuário</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary">
                        <i className="bi bi-person-badge fs-5"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="E-mail ou CPF"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                        autoComplete="username"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small text-muted fw-semibold">Senha</Form.Label>
                    <InputGroup className="ararinha-login__input">
                      <InputGroup.Text className="bg-transparent border-0 ps-3 text-primary">
                        <i className="bi bi-lock fs-5"></i>
                      </InputGroup.Text>

                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        className="border-0 bg-transparent shadow-none"
                        style={{ height: 46 }}
                        autoComplete="current-password"
                      />

                      <Button
                        variant="link"
                        className="text-decoration-none pe-3 ararinha-login__eye"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-grid mb-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="ararinha-login__btn rounded-pill fw-bold py-2"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Entrar <i className="bi bi-arrow-right-short fs-5 ms-1 align-middle"></i>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center">
                    <span className="text-muted small">Ainda não possui uma loja? </span>
                    <Link to="/register" className="text-primary fw-bold small text-decoration-none">
                      Criar conta grátis
                    </Link>
                  </div>

                </Form>
              </Card.Body>

              <div className="ararinha-login__footer p-3 text-center">
                <small className="text-muted fw-medium" style={{ fontSize: '0.78rem' }}>
                  Versão {APP_VERSION} • Global Login
                </small>
              </div>
            </Card>

            <div className="text-center mt-3">
              <small className="text-muted">
                © {new Date().getFullYear()} Ararinha Tecnologia
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;