import React, { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';

const MPCallback = () => {
  useEffect(() => {
    // Pega o código que o Mercado Pago mandou na URL (ex: ?code=TG-xxxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Se tiver um código e essa janela foi aberta por outra (popup)
    if (code && window.opener) {
      // 1. Avisa a tela principal (Signup) enviando o código
      window.opener.postMessage({ type: 'MP_AUTH_SUCCESS', code: code }, window.location.origin);
      
      // 2. Fecha a janelinha de popup sozinha
      window.close();
    }
  }, []);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <Spinner animation="border" variant="primary" />
      <h5 className="mt-3 text-muted">Vinculando conta...</h5>
      <p className="small text-muted">Esta janela se fechará automaticamente.</p>
    </div>
  );
};

export default MPCallback;