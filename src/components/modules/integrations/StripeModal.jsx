import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Badge, Card } from 'react-bootstrap';
import api from '../../../services/api';

const StripeModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 🚀 FUNÇÃO: Botão de Integração Automática (OAuth Stripe Connect)
  const handleConnectStripe = () => {
    const clientId = process.env.REACT_APP_STRIPE_CLIENT_ID;
    
    if (!clientId) {
      setError('⚠️ O Client ID do Stripe não está configurado no arquivo .env do Admin (REACT_APP_STRIPE_CLIENT_ID).');
      return;
    }

    const tenantId = localStorage.getItem('tenantId') || '1';
    
    // Constrói a URL de callback (Ajuste a rota final de acordo com o seu backend)
    const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : window.location.origin;
    const redirectUri = `${baseUrl}/api/webhooks/stripe/callback`; 

    // URL oficial de autorização do Stripe (Stripe Connect)
    const authUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${tenantId}&redirect_uri=${redirectUri}`;

    // Redireciona o lojista
    window.location.href = authUrl;
  };

  // 🚀 FUNÇÃO: Desconectar / Limpar Chaves
  const handleDisconnectStripe = async () => {
    setSaving(true);
    setError('');

    try {
      // Envia campos vazios para o backend limpar do banco de dados
      await api.post('/apikeys/stripe', {
        publicKey: '',
        secretKey: '',
      });
      onUpdateSuccess?.('Stripe desconectado com sucesso!');
      onHide?.();
    } catch (err) {
      setError('Erro ao desconectar o Stripe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={!saving}
      contentClassName="border-0 bg-transparent"
    >
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{ width: 40, height: 40, background: 'rgba(99,91,255,0.10)' }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                alt="Stripe"
                height="18"
              />
            </div>

            <div className="lh-sm">
              <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                Stripe
              </div>
              <div className="text-muted small">Pagamentos no Brasil e Exterior</div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Badge bg={isConfigured ? 'success' : 'secondary'} className="rounded-pill px-3 py-2">
              {isConfigured ? 'Conectado' : 'Não configurado'}
            </Badge>

            <Button
              variant="link"
              className="text-secondary text-decoration-none p-0"
              onClick={onHide}
              disabled={saving}
              aria-label="Fechar"
              title="Fechar"
            >
              <i className="bi bi-x-lg"></i>
            </Button>
          </div>
        </div>

        <Card.Body className="p-4">
          
          {error && (
            <Alert variant="danger" className="rounded-3 border-0 shadow-sm small mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}

          <div className="text-center py-3">
            {isConfigured ? (
              // TELA DE CONTA JÁ CONECTADA
              <>
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                  <h5 className="fw-bold text-dark mt-3">Conta Vinculada!</h5>
                  <p className="text-muted small px-3">
                    Sua loja está pronta para receber pagamentos de forma segura através da infraestrutura global do Stripe.
                  </p>
                </div>

                <Button 
                  onClick={handleDisconnectStripe}
                  disabled={saving}
                  variant="outline-danger"
                  className="rounded-pill fw-bold px-4 py-2 w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  {saving ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    <>
                      <i className="bi bi-x-circle fs-5"></i>
                      Desconectar Conta
                    </>
                  )}
                </Button>
              </>
            ) : (
              // TELA DE CONTA NÃO CONECTADA
              <>
                <div className="mb-4">
                  <h5 className="fw-bold text-dark">Integração Oficial</h5>
                  <p className="text-muted small px-3">
                    Conecte sua conta do Stripe de forma segura com apenas um clique. Não é necessário copiar e colar chaves secretas.
                  </p>
                </div>

                <Button 
                  onClick={handleConnectStripe}
                  className="rounded-pill fw-bold shadow-sm px-4 py-2 w-100 d-flex align-items-center justify-content-center gap-2 text-white"
                  style={{ backgroundColor: '#635BFF', border: 'none' }}
                >
                  <i className="bi bi-link-45deg fs-5 text-white"></i>
                  Vincular Conta Stripe
                </Button>
              </>
            )}
          </div>

          <div className="d-flex justify-content-center mt-3">
            <Button
              type="button"
              variant="light"
              onClick={onHide}
              className="rounded-pill px-4 fw-bold text-muted border-0 bg-transparent small"
              disabled={saving}
            >
              Voltar
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Modal>
  );
};

export default StripeModal;