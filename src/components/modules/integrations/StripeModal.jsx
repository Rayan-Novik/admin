import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Badge, InputGroup, Card, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const StripeModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
  const [keys, setKeys] = useState({ publicKey: '', secretKey: '' });
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (show) {
      setKeys({ publicKey: '', secretKey: '' });
      setShowSecret(false);
      setLoading(false);
    }
  }, [show]);

  const handleChange = (e) => {
    setKeys((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!keys.publicKey?.trim() || !keys.secretKey?.trim()) {
      toast.warning('Por favor, preencha ambas as chaves.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/apikeys/stripe', {
        publicKey: keys.publicKey.trim(),
        secretKey: keys.secretKey.trim(),
      });

      toast.success('Configurações do Stripe salvas com sucesso!');
      onUpdateSuccess?.();
      onHide?.();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao salvar chaves do Stripe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={!loading}
      contentClassName="border-0 bg-transparent"
    >
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3">
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
                Configurar Stripe
              </div>
              <div className="text-muted small">Pagamentos no Brasil (PIX • Cartão)</div>
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
              disabled={loading}
              aria-label="Fechar"
              title="Fechar"
            >
              <i className="bi bi-x-lg"></i>
            </Button>
          </div>
        </div>

        <Card.Body className="px-4 pb-4 pt-0">
          {/* Explicação (motivo de usar Stripe) */}
          <div className="mb-3">
            <div className="fw-bold text-dark mb-2">Por que usar o Stripe?</div>

            <div className="text-muted small">
              O Stripe é um gateway forte quando você quer <strong>cartão bem redondo</strong>, suporte a
              <strong> pagamentos internacionais</strong> e uma integração que escala com o sistema
              (webhooks, status, reembolsos e conciliação).
            </div>

            <div className="mt-3 d-grid gap-2">
              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-globe2 mt-1" style={{ color: '#635BFF' }}></i>
                <div className="small">
                  <span className="fw-bold">Venda internacional:</span> cartão internacional e estrutura global.
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-shield-check mt-1" style={{ color: '#635BFF' }}></i>
                <div className="small">
                  <span className="fw-bold">Segurança e compliance:</span> você não armazena dados sensíveis de cartão no seu sistema.
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-arrow-repeat mt-1" style={{ color: '#635BFF' }}></i>
                <div className="small">
                  <span className="fw-bold">Automação:</span> cobrança, confirmação e atualização de pedido via webhooks.
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-gear mt-1" style={{ color: '#635BFF' }}></i>
                <div className="small">
                  <span className="fw-bold">Integração flexível:</span> funciona bem em checkout próprio e em cenários mais complexos.
                </div>
              </div>
            </div>
          </div>

          {/* Taxas e prazos (seu bloco, só re-embalado no estilo novo) */}
          <div className="bg-light p-3 rounded-3 border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold text-dark mb-0 small text-uppercase">
                <i className="bi bi-wallet2 me-2" style={{ color: '#635BFF' }}></i>
                Taxas e Prazos (Stripe Brasil)
              </h6>
              <span className="badge bg-white text-muted border" style={{ fontSize: '0.7rem' }}>
                pode variar por contrato
              </span>
            </div>

            <Row className="g-2 text-center">
              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100 position-relative overflow-hidden">
                  <div className="text-success fw-bold small">PIX</div>
                  <div className="fs-5 fw-bold text-dark">0.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>Custo baixo</small>
                  <div className="mt-1 badge bg-warning text-dark border" style={{ fontSize: '0.6rem' }}>
                    Recebe em D+2
                  </div>
                </div>
              </Col>

              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100">
                  <div className="text-primary fw-bold small">Cartão BR</div>
                  <div className="fs-5 fw-bold text-dark">3.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>+ R$ 0,39 fixo</small>
                  <div className="mt-1 badge bg-light text-muted border" style={{ fontSize: '0.6rem' }}>
                    Recebe em D+30*
                  </div>
                </div>
              </Col>

              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100">
                  <div className="text-info fw-bold small">Cartão Intl.</div>
                  <div className="fs-5 fw-bold text-dark">4.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>+ R$ 0,39 fixo</small>
                  <div className="mt-1 badge bg-light text-muted border" style={{ fontSize: '0.6rem' }}>
                    Recebe em D+30*
                  </div>
                </div>
              </Col>
            </Row>

            <div className="mt-3 text-end lh-1">
              <small className="text-muted fst-italic" style={{ fontSize: '0.7rem' }}>
                * O recebimento padrão do Stripe é <strong>D+30</strong>, podendo baixar para <strong>D+2</strong> após histórico de vendas.
                <br />
                Diferente do Mercado Pago, o PIX no Stripe <strong>não cai na hora</strong> (D+2).
              </small>

              <div className="mt-2">
                <a
                  href="https://stripe.com/br/pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="fw-bold text-decoration-none"
                  style={{ fontSize: '0.8rem', color: '#635BFF' }}
                >
                  Ver tabela oficial completa →
                </a>
              </div>
            </div>
          </div>

          {/* Aviso de status configurado */}
          {isConfigured && (
            <Alert variant="success" className="d-flex align-items-center py-2 mb-4 rounded-3 small border-0 shadow-sm">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>
                <strong>Conectado!</strong> As chaves já estão configuradas.
                <br />
                <span className="opacity-75">Preencha abaixo apenas se desejar substituí-las.</span>
              </div>
            </Alert>
          )}

          {/* Onde pegar as chaves */}
          <Alert variant="info" className="rounded-3 border-0 shadow-sm small mb-4">
            <i className="bi bi-info-circle-fill me-2"></i>
            Pegue as chaves no{' '}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
              className="fw-bold text-decoration-none"
              style={{ color: '#635BFF' }}
            >
              Dashboard do Stripe
            </a>
            .
            <div className="text-muted mt-1">
              Cole aqui para o sistema conseguir <strong>processar pagamentos</strong> e <strong>validar eventos</strong>.
            </div>
          </Alert>

          {/* Form */}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold text-uppercase ms-1">
                Chave Pública (Publishable Key)
              </Form.Label>

              <InputGroup className="border rounded-3 bg-white">
                <InputGroup.Text className="border-0 bg-transparent ps-3 text-secondary">
                  <i className="bi bi-key fs-5"></i>
                </InputGroup.Text>

                <Form.Control
                  type="text"
                  name="publicKey"
                  value={keys.publicKey}
                  onChange={handleChange}
                  placeholder="pk_test_..."
                  className="border-0 bg-transparent py-2 shadow-none fw-medium"
                  style={{ height: 45 }}
                  autoComplete="off"
                />
              </InputGroup>

              <Form.Text className="text-muted small">
                Geralmente começa com <code>pk_live_</code> ou <code>pk_test_</code>.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small text-muted fw-bold text-uppercase ms-1">
                Chave Secreta (Secret Key)
              </Form.Label>

              <InputGroup className="border rounded-3 bg-white">
                <InputGroup.Text className="border-0 bg-transparent ps-3 text-secondary">
                  <i className="bi bi-shield-lock fs-5"></i>
                </InputGroup.Text>

                <Form.Control
                  type={showSecret ? 'text' : 'password'}
                  name="secretKey"
                  value={keys.secretKey}
                  onChange={handleChange}
                  placeholder="sk_test_..."
                  className="border-0 bg-transparent py-2 shadow-none fw-medium"
                  style={{ height: 45 }}
                  autoComplete="off"
                />

                <Button
                  variant="link"
                  className="text-secondary text-decoration-none pe-3"
                  onClick={() => setShowSecret((v) => !v)}
                  type="button"
                  title={showSecret ? 'Ocultar' : 'Mostrar'}
                >
                  <i className={`bi ${showSecret ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </Button>
              </InputGroup>

              <Form.Text className="text-muted small">
                Geralmente começa com <code>sk_live_</code> ou <code>sk_test_</code>. Nunca compartilhe esta chave.
              </Form.Text>
            </Form.Group>
          </Form>
        </Card.Body>

        {/* Footer */}
        <div className="bg-light px-4 py-3 border-top d-flex gap-2 justify-content-end">
          <Button
            variant="light"
            onClick={onHide}
            className="rounded-pill px-4 fw-bold text-muted"
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || !keys.publicKey?.trim() || !keys.secretKey?.trim()}
            className="rounded-pill px-4 fw-bold shadow-sm"
            style={{ backgroundColor: '#635BFF', borderColor: '#635BFF' }}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                Salvar <i className="bi bi-arrow-right-short fs-5 ms-1 align-middle"></i>
              </>
            )}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};

export default StripeModal;
