import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/login.css';

/* =========================================================
   AraraCloud · LoginPage (Global)
   Estilo: minimalista moderno · azul ararinha · vibe ML 2026
   ========================================================= */

const LoginPage = ({ onLogin }) => {
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const APP_VERSION = '20260619.1';

  useEffect(() => {
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenantSlug');
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log(`Enviando login global...`);
      let data;

      // TENTATIVA 1: Login como Proprietário (Dono da Loja)
      try {
        const responseAdmin = await api.post('/usuarios/admin-login', {
          email: loginInput,
          senha,
          tenant: 'default',
        });
        data = responseAdmin.data;
        console.log('Logado como Proprietário (DONO)');
      } catch (errAdmin) {
        if (errAdmin.response && errAdmin.response.status === 404) {
          console.log('Conta de proprietário não encontrada, tentando login como Staff...');
          const responseStaff = await api.post('/usuarios/staff-login', {
            email: loginInput,
            senha,
            tenant: 'default',
          });
          data = responseStaff.data;
          console.log(`Logado como Colaborador: ${data.role}`);
        } else {
          throw errAdmin;
        }
      }

      if (data && data.token) {
        localStorage.setItem('adminInfo', JSON.stringify(data));
        const discoveredSlug = data.tenantSlug || 'default';
        localStorage.setItem('tenantSlug', discoveredSlug);
        localStorage.setItem('tenantId', data.id_tenant);

        onLogin(data);

        // Acorda o WhatsApp em background
        try {
          api
            .post(
              '/whatsapp/connect',
              {},
              { headers: { Authorization: `Bearer ${data.token}` } },
            )
            .catch((err) =>
              console.log('WhatsApp startup background ignorado:', err?.response?.data?.message),
            );
        } catch (e) {
          console.log('Erro ao tentar acordar o WhatsApp no login.');
        }

        navigate(`/`);
      } else {
        setError('Acesso restrito a colaboradores e proprietários.');
      }
    } catch (err) {
      if (!err.response) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está online.');
      } else {
        setError(
          err.response?.data?.message ||
          'Credenciais inválidas. Verifique seu e-mail e senha.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ESTILOS INLINE (independem do login.css) ---------- */
  const palette = {
    brand: '#0A84FF',
    brandDeep: '#0066CC',
    brandSoft: '#3DA9FC',
    ink: '#0F172A',
    sub: '#64748B',
    line: '#E5EAF1',
    bg: '#F7F9FC',
    surface: '#FFFFFF',
  };

  const styles = {
    page: {
      position: 'relative',
      minHeight: '100vh',
      background: `radial-gradient(1200px 600px at 10% -10%, rgba(61,169,252,0.22), transparent 60%),
                   radial-gradient(900px 600px at 110% 110%, rgba(10,132,255,0.18), transparent 55%),
                   linear-gradient(180deg, #EAF3FF 0%, ${palette.bg} 100%)`,
      overflow: 'hidden',
    },
    blobA: {
      position: 'absolute', top: -140, left: -120, width: 420, height: 420,
      borderRadius: '50%', background: 'rgba(61,169,252,0.28)', filter: 'blur(80px)', zIndex: 0,
    },
    blobB: {
      position: 'absolute', bottom: -160, right: -120, width: 480, height: 480,
      borderRadius: '50%', background: 'rgba(10,132,255,0.22)', filter: 'blur(90px)', zIndex: 0,
    },
    logoMark: {
      width: 48, height: 48, borderRadius: 14,
      background: `linear-gradient(135deg, ${palette.brand}, ${palette.brandSoft})`,
      color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em',
      boxShadow: '0 10px 24px -8px rgba(10,132,255,0.55)',
    },
    title: {
      fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: palette.ink,
    },
    subtitle: { color: palette.sub, fontSize: 14, marginTop: 4 },
    card: {
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${palette.line}`,
      borderRadius: 24,
      boxShadow: '0 20px 50px -20px rgba(10,132,255,0.18), 0 2px 6px rgba(15,23,42,0.04)',
    },
    label: {
      fontSize: 12, fontWeight: 500, color: palette.sub,
      textTransform: 'none', marginBottom: 6, letterSpacing: 0,
    },
    inputWrap: {
      background: '#F4F6FA',
      border: `1px solid ${palette.line}`,
      borderRadius: 14,
      transition: 'all .2s ease',
      overflow: 'hidden',
    },
    inputText: {
      background: 'transparent', border: 0, height: 48, fontSize: 15, color: palette.ink,
    },
    iconBox: { color: palette.brand, background: 'transparent', border: 0 },
    eye: { color: palette.sub, background: 'transparent', border: 0 },
    cta: {
      height: 50,
      borderRadius: 14,
      border: 0,
      background: `linear-gradient(180deg, ${palette.brand}, ${palette.brandDeep})`,
      color: '#fff',
      fontWeight: 600,
      fontSize: 15,
      letterSpacing: '-0.01em',
      boxShadow: '0 10px 24px -8px rgba(10,132,255,0.6)',
      transition: 'transform .15s ease, box-shadow .2s ease, filter .2s ease',
    },
    footerBar: {
      background: 'rgba(247,249,252,0.7)',
      borderTop: `1px solid ${palette.line}`,
    },
    link: { color: palette.brand, textDecoration: 'none', fontWeight: 600 },
    brandText: {
      fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: palette.ink,
    },
  };

  return (
    <div style={styles.page} className="d-flex align-items-center">
      <div style={styles.blobA} aria-hidden="true" />
      <div style={styles.blobB} aria-hidden="true" />

      <Container className="position-relative" style={{ zIndex: 1, paddingTop: 32, paddingBottom: 32 }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>
            {/* Brand */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center gap-2 mb-3">
                <img
                  src="/logologin.png"
                  alt="ArarinhaCloud"
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: 'contain',
                  }}
                />
                <span style={styles.brandText}>
                  ararinha<span style={{ color: palette.brand }}>cloud</span>
                </span>
              </div>
              <h3 style={styles.title} className="mb-1">Acesse seu painel</h3>
              <p style={styles.subtitle} className="mb-0">
                Gestão completa da sua loja em um só lugar
              </p>
            </div>

            <Card style={styles.card} className="border-0 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                {error && (
                  <Alert
                    variant="danger"
                    className="rounded-3 border-0 small mb-4"
                    style={{ background: '#FEF2F2', color: '#B91C1C' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={submitHandler}>
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.label}>E-mail</Form.Label>
                    <InputGroup
                      style={styles.inputWrap}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = palette.brand;
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(10,132,255,0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = palette.line;
                        e.currentTarget.style.background = '#F4F6FA';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <InputGroup.Text style={styles.iconBox} className="ps-3">
                        <i className="bi bi-envelope fs-5"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="voce@empresa.com"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        className="shadow-none"
                        style={styles.inputText}
                        autoComplete="username"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label style={styles.label}>Senha</Form.Label>
                    <InputGroup style={styles.inputWrap}>
                      <InputGroup.Text style={styles.iconBox} className="ps-3">
                        <i className="bi bi-lock fs-5"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        className="shadow-none"
                        style={styles.inputText}
                        autoComplete="current-password"
                      />
                      <Button
                        variant="link"
                        className="text-decoration-none pe-3"
                        style={styles.eye}
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-5`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex justify-content-end mb-4">
                    <Link to="/esqueci-senha" style={{ ...styles.link, fontSize: 13 }}>
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <div className="d-grid mb-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      style={styles.cta}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.filter = 'brightness(1.06)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Entrar na minha conta
                          <i className="bi bi-arrow-right ms-2 align-middle"></i>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center">
                    <span style={{ color: palette.sub, fontSize: 14 }}>
                      Ainda não possui uma loja?{' '}
                    </span>
                    <Link to="/register" style={styles.link}>
                      Criar conta grátis
                    </Link>
                  </div>
                </Form>
              </Card.Body>

              <div style={styles.footerBar} className="p-3 text-center">
                <small style={{ color: palette.sub, fontSize: '0.78rem', fontWeight: 500 }}>
                  Versão {APP_VERSION} • Global Login
                </small>
              </div>
            </Card>

            <div className="text-center mt-3">
              <small style={{ color: palette.sub }}>
                © {new Date().getFullYear()} ararinhacloud · Tecnologia que voa com você
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
