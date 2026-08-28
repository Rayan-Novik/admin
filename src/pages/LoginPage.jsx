import React, { useState, useEffect } from 'react';
import { Form, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/login.css';
import { CtaButton } from '../components/ui/buttons/CtaButton';
// Importando o novo componente universal (lembre-se de usar o nome que você exportou)
import { CustomInput } from '../components/ui/SearchInput/SearchInput'; 

/* =========================================================
   AraraCloud · LoginPage (Global)
   Estilo: minimalista moderno · azul ararinha · vibe ML 2026
   ========================================================= */

const LoginPage = ({ onLogin }) => {
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Nota: Removemos o state 'showPassword' daqui, 
  // pois o CustomInput agora gerencia o olhinho da senha sozinho!

  const navigate = useNavigate();
  const APP_VERSION = '20260827.1';

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

  /* ---------- ESTILOS INLINE ---------- */
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
    footerBar: {
      background: 'rgba(247,249,252,0.7)',
      borderTop: `1px solid ${palette.line}`,
    },
    link: { color: palette.brand, textDecoration: 'none', fontWeight: 600 },
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
              <div className="d-inline-flex justify-content-center mb-3 w-100">
                <img
                  src="/logologin2.png"
                  alt="ArarinhaCloud"
                  style={{
                    width: 220,
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
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
                  
                  {/* --- CAMPO DE E-MAIL (NOVO) --- */}
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.label}>E-mail</Form.Label>
                    <CustomInput
                      icon="bi-envelope"
                      type="email"
                      placeholder="voce@empresa.com"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </Form.Group>

                  {/* --- CAMPO DE SENHA (NOVO) --- */}
                  <Form.Group className="mb-2">
                    <Form.Label style={styles.label}>Senha</Form.Label>
                    <CustomInput
                      icon="bi-lock"
                      type="password" // A mágica acontece aqui!
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end mb-4 mt-2">
                    <Link to="/esqueci-senha" style={{ ...styles.link, fontSize: 13 }}>
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <CtaButton
                    type="submit"
                    disabled={loading}
                    fullWidth={true}
                    className="mb-4"
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
                  </CtaButton>

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
                © {new Date().getFullYear()} azun.com.br · Tecnologia que voa com você
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;