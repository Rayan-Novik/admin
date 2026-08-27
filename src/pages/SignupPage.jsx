import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import "../styles/login.css";

import { SignupStep1 } from '../components/SignupComponents/SignupStep1';
import { SignupStep2 } from '../components/SignupComponents/SignupStep2';
import { SignupStep3 } from '../components/SignupComponents/SignupStep3';
import { SignupStep4 } from '../components/SignupComponents/SignupStep4';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    documento: '',
    telefone: '',
    email: '',
    senha: '',
    planoSelecionado: '',
    layoutStyle: 'ECOMMERCE',
    primaryColor: '#0A84FF', // Alterado padrão para combinar com o tema
    logoUrl: '',

    // CAMPOS DA LOJA FÍSICA / RETIRADA
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    horaAbertura: '',
    horaFechamento: '',
    diasFuncionamento: [0, 1, 2, 3, 4, 5, 6],

    // CAMPOS DO GATEWAY
    gatewayProvider: 'MERCADOPAGO',
    gatewayPublicKey: '',
    gatewayAccessToken: '',
    gatewayAuthCode: ''
  });

  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadPlanos = async () => {
      try {
        const { data } = await api.get('/tenants/planos-publicos');
        const planosAtivos = data.filter(p => p.ativo);
        setPlanos(planosAtivos);
        if (planosAtivos.length > 0) {
          setFormData(prev => ({ ...prev, planoSelecionado: planosAtivos[0].nome }));
        }
      } catch (err) {
        setPlanos([
          { id: 'TRIAL', nome: 'Teste Grátis', preco_mensal: 0, dias_teste: 7 },
          { id: 'BASICO', nome: 'Básico', preco_mensal: 49.90, dias_teste: 0 }
        ]);
        setFormData(prev => ({ ...prev, planoSelecionado: 'Teste Grátis' }));
      } finally {
        setLoadingPlanos(false);
      }
    };
    loadPlanos();
  }, []);

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.nomeFantasia || !formData.documento || !formData.email || !formData.senha) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e) => { e.preventDefault(); setStep(3); };
  const handleNextStep3 = (e) => { e.preventDefault(); setStep(4); };

  const handlePrevStep = () => setStep(step - 1);

  const submitHandler = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { data } = await api.post('/tenants/register', {
        nome_fantasia: formData.nomeFantasia,
        razao_social: formData.razaoSocial,
        documento: formData.documento,
        telefone_contato: formData.telefone,
        email: formData.email,
        senha: formData.senha,
        plano: formData.planoSelecionado,
        appearance: {
          SITE_TITLE: formData.nomeFantasia,
          STORE_LAYOUT_STYLE: formData.layoutStyle,
          BTN_PRIMARY_BG: formData.primaryColor,
          HEADER_PRIMARY_COLOR: formData.layoutStyle === 'CARDAPIO' ? formData.primaryColor : '#ffffff',
          LOGO_URL: formData.logoUrl
        },
        gateway: {
          provider: formData.gatewayProvider,
          public_key: formData.gatewayPublicKey,
          access_token: formData.gatewayAccessToken,
          auth_code: formData.gatewayAuthCode
        },
        loja_dados: {
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          hora_abertura: formData.horaAbertura,
          hora_fechamento: formData.horaFechamento,
          dias_funcionamento: formData.diasFuncionamento.join(',')
        }
      });

      if (data.slug) {
        localStorage.setItem('tenantSlug', data.slug);
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msgBackend = err.response?.data?.message || err.response?.data?.error || 'Erro interno no servidor.';
      setError(`Falha: ${msgBackend}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((step - 1) / 3) * 100;

  /* ---------- ESTILOS INLINE (Mesmo padrão do Login) ---------- */
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
    brandText: {
      fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: palette.ink,
    },
    card: {
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${palette.line}`,
      borderRadius: 24,
      boxShadow: '0 20px 50px -20px rgba(10,132,255,0.18), 0 2px 6px rgba(15,23,42,0.04)',
    }
  };

  return (
    <div style={styles.page} className="d-flex align-items-center py-5">
      <div style={styles.blobA} aria-hidden="true" />
      <div style={styles.blobB} aria-hidden="true" />

      <Container className="position-relative py-4" style={{ zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={7} xl={6}>

            {/* Brand Header */}
            <div className="text-center mb-4">
              <div className="d-inline-flex justify-content-center mb-3 w-100">
                <img
                  src="/logologin2.png"
                  alt="ArarinhaCloud"
                  style={{
                    width: 220, // Ajustado para dar destaque
                    height: 'auto', // Permite que a altura se ajuste na proporção correta
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>

            <Card style={styles.card} className="border-0 overflow-hidden">
              <Card.Body className="p-4 p-md-5">

                {/* Barra de Progresso */}
                <div className="d-flex justify-content-between mb-5 position-relative">
                  <div className="progress position-absolute w-100" style={{ top: '50%', transform: 'translateY(-50%)', height: '4px', zIndex: 0, backgroundColor: palette.line }}>
                    <div className="progress-bar transition-all" role="progressbar" style={{ width: `${progressPercentage}%`, backgroundColor: formData.primaryColor }}></div>
                  </div>
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className={`rounded-circle d-flex align-items-center justify-content-center position-relative shadow-sm transition-all text-white`}
                      style={{
                        width: '32px', height: '32px', zIndex: 1, border: '2px solid white',
                        backgroundColor: step >= num ? formData.primaryColor : '#e9ecef',
                        color: step >= num ? '#fff' : '#adb5bd'
                      }}>
                      {step > num ? <i className="bi bi-check"></i> : num}
                    </div>
                  ))}
                </div>

                {/* Alertas */}
                {success && (
                  <Alert variant="success" className="rounded-3 border-0 small text-center mb-4" style={{ background: '#ECFDF5', color: '#047857' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>Loja criada! Preparando seu painel...
                  </Alert>
                )}
                {error && (
                  <Alert variant="danger" className="rounded-3 border-0 small text-center mb-4" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                  </Alert>
                )}

                {/* Passos do Formulário */}
                {step === 1 && !success && (
                  <>
                    <div className="text-center mb-4">
                      <h5 className="fw-bold mb-1" style={{ color: palette.ink }}>Crie sua Conta</h5>
                      <p style={{ color: palette.sub }} className="small">Rápido, fácil e feito para crescer.</p>
                    </div>
                    <SignupStep1 formData={formData} setFormData={setFormData} planos={planos} loadingPlanos={loadingPlanos} showPassword={showPassword} setShowPassword={setShowPassword} handleNextStep={handleNextStep1} />
                  </>
                )}

                {step === 2 && !success && <SignupStep2 formData={formData} setFormData={setFormData} handlePrevStep={handlePrevStep} handleNextStep={handleNextStep2} />}
                {step === 3 && !success && <SignupStep3 formData={formData} setFormData={setFormData} handlePrevStep={handlePrevStep} handleNextStep={handleNextStep3} loading={loading} />}
                {step === 4 && !success && <SignupStep4 formData={formData} setFormData={setFormData} handlePrevStep={handlePrevStep} submitHandler={submitHandler} loading={loading} />}

                {/* Rodapé de redirecionamento */}
                <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: palette.line }}>
                  <span style={{ color: palette.sub }} className="small">Já tem uma conta? </span>
                  <Link to="/login" className="fw-bold small text-decoration-none" style={{ color: formData.primaryColor }}>
                    Acessar Painel
                  </Link>
                </div>

              </Card.Body>
            </Card>

            {/* Créditos Ararinha */}
            <div className="text-center mt-4">
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

export default SignupPage;