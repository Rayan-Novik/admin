import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner, Badge, Card } from 'react-bootstrap';
import api from '../../../services/api';

const MercadoPagoModal = ({ show, onHide, isConfigured, onUpdateSuccess, isSignupMode, onSaveLocal }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 🚀 OUVINTE: Fica escutando a janelinha de popup avisar que terminou
  useEffect(() => {
    if (!isSignupMode) return;

    const handleMessage = (event) => {
      // Segurança: só aceita mensagens do seu próprio site
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'MP_AUTH_SUCCESS') {
        const authCode = event.data.code;
        setSuccessMsg('Conta vinculada com sucesso! Clique em Continuar.');
        
        // Devolve o "código" para a tela de Signup salvar no state
        if (onSaveLocal) {
          onSaveLocal({ authCode: authCode }); 
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isSignupMode, onSaveLocal]);


  // 🚀 AÇÃO: Abrir Mercado Pago (Popup no Cadastro, Redirect no Painel)
  const handleConnectMP = () => {
    const clientId = process.env.REACT_APP_MP_CLIENT_ID;
    if (!clientId) {
      setError('⚠️ Client ID do Mercado Pago não configurado.');
      return;
    }

    if (isSignupMode) {
      // === MODO CADASTRO: ABRE POPUP ===
      const baseUrl = window.location.origin;
      const redirectUri = `${baseUrl}/mp-callback`; // A rota que criamos no Passo 1!
      const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=signup&redirect_uri=${redirectUri}`;

      // Configurações da janelinha (tamanho e posição centralizada)
      const width = 500;
      const height = 700;
      const left = (window.screen.width / 2) - (width / 2);
      const top = (window.screen.height / 2) - (height / 2);
      
      window.open(authUrl, 'MercadoPagoAuth', `width=${width},height=${height},top=${top},left=${left}`);

    } else {
      // === MODO PAINEL: REDIRECIONA NORMALMENTE ===
      const tenantId = localStorage.getItem('tenantId') || '1';
      const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : window.location.origin;
      const redirectUri = `${baseUrl}/api/webhooks/mercadopago/callback`; 
      const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${redirectUri}`;
      
      window.location.href = authUrl;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" contentClassName="border-0 bg-transparent">
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 45, height: 45, background: 'rgba(0,158,227,0.12)' }}>
              <img src="/images/mercado-pago-logo.png" alt="Mercado Pago" height="26" />
            </div>
            <div className="lh-sm">
              <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>Mercado Pago</div>
            </div>
          </div>
          <Button variant="link" className="text-secondary p-0 fs-5" onClick={onHide}><i className="bi bi-x-lg"></i></Button>
        </div>

        <Card.Body className="p-4 text-center">
          {error && <Alert variant="danger" className="rounded-3 border-0 small mb-4">{error}</Alert>}
          {successMsg && <Alert variant="success" className="rounded-3 border-0 fw-bold mb-4"><i className="bi bi-check-circle-fill me-2"></i>{successMsg}</Alert>}

          {successMsg ? (
             <Button variant="light" onClick={onHide} className="rounded-pill fw-bold w-100 border">
                Voltar para o Cadastro
             </Button>
          ) : (
             <>
                <div className="mb-4">
                  <h5 className="fw-bold text-dark">Conexão em 1 Clique</h5>
                  <p className="text-muted small px-2">Faça login com sua conta do Mercado Pago na janela segura para conectar automaticamente. Nós não teremos acesso à sua senha.</p>
                </div>
                <Button 
                  onClick={handleConnectMP} 
                  className="rounded-pill fw-bold shadow-sm px-4 py-3 w-100 d-flex align-items-center justify-content-center gap-2" 
                  style={{ backgroundColor: '#009EE3', border: 'none' }}
                >
                  <i className="bi bi-box-arrow-up-right fs-5"></i> Abrir Janela de Conexão
                </Button>
             </>
          )}

        </Card.Body>
      </Card>
    </Modal>
  );
};

export default MercadoPagoModal;