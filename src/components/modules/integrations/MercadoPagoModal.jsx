import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner, InputGroup, Badge, Card } from 'react-bootstrap';
import api from '../../../services/api';

const MercadoPagoModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
  const [keys, setKeys] = useState({
    MERCADOPAGO_PUBLIC_KEY: '',
    MERCADOPAGO_ACCESS_TOKEN: '',
  });

  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // URL do webhook
  useEffect(() => {
    if (show) {
      const baseUrl = api.defaults.baseURL || window.location.origin;
      const fullUrl = `${baseUrl.replace(/\/$/, '')}/webhooks/mercadopago`;
      setWebhookUrl(fullUrl);

      // limpa campos ao abrir
      setKeys({ MERCADOPAGO_PUBLIC_KEY: '', MERCADOPAGO_ACCESS_TOKEN: '' });
      setError('');
      setSaving(false);
      setCopied(false);
      setShowSecret(false);
    }
  }, [show]);

  const handleChange = (e) => setKeys((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError('Não consegui copiar. Copie manualmente a URL do webhook.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.put('/apikeys/mercadopago', keys);
      onUpdateSuccess?.('Chaves do Mercado Pago atualizadas!');
      onHide?.();
    } catch (err) {
      setError('Erro ao guardar as chaves do Mercado Pago.');
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
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{ width: 40, height: 40, background: 'rgba(0,158,227,0.12)' }}
            >
              <img src="/images/mercado-pago-logo.png" alt="Mercado Pago" height="22" />
            </div>

            <div className="lh-sm">
              <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                Configurar Mercado Pago
              </div>
              <div className="text-muted small">Checkout Transparente (PIX • Crédito • Débito)</div>
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

        <Card.Body className="px-4 pb-4 pt-0">
          {/* Explicação (por que usar MP) */}
          <div className="mb-3">
            <div className="fw-bold text-dark mb-2">Por que usar Mercado Pago?</div>

            <div className="text-muted small">
              O Mercado Pago é forte no Brasil porque facilita o recebimento no checkout e tende a ter um fluxo bem “pronto”:
              você gera a cobrança, recebe confirmação automática e o pedido atualiza sozinho.
              O destaque aqui é o <strong>PIX com liberação imediata</strong> (dependendo do seu plano).
            </div>

            <div className="mt-3 d-grid gap-2">
              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-lightning-charge text-primary mt-1"></i>
                <div className="small">
                  <span className="fw-bold">PIX rápido:</span> ideal pra venda no varejo e e-commerce que precisa confirmar pagamento rápido.
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-credit-card text-primary mt-1"></i>
                <div className="small">
                  <span className="fw-bold">Cartão e débito:</span> aceita pagamentos direto no checkout sem mandar o cliente pra fora.
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-bell text-primary mt-1"></i>
                <div className="small">
                  <span className="fw-bold">Webhook:</span> o Mercado Pago avisa seu sistema quando o status mudar (pago/pendente/estornado).
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                <i className="bi bi-receipt text-primary mt-1"></i>
                <div className="small">
                  <span className="fw-bold">Conciliação:</span> você rastreia cobranças por pedido e reduz conferência manual.
                </div>
              </div>
            </div>
          </div>

          {/* Taxas (mantendo suas infos) */}
          <div className="bg-light p-3 rounded-3 border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold text-dark mb-0 small text-uppercase">
                <i className="bi bi-wallet2 me-2 text-primary"></i>
                Taxas de Processamento (Checkout Transparente)
              </h6>
              <span className="badge bg-white text-muted border" style={{ fontSize: '0.7rem' }}>
                pode variar por plano
              </span>
            </div>

            <Row className="g-2 text-center">
              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100">
                  <div className="text-success fw-bold small">PIX</div>
                  <div className="fs-5 fw-bold text-dark">0.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                    Liberação Imediata
                  </small>
                </div>
              </Col>
              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100">
                  <div className="text-primary fw-bold small">Crédito</div>
                  <div className="fs-5 fw-bold text-dark">3.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                    Liberação na Hora*
                  </small>
                </div>
              </Col>
              <Col xs={4}>
                <div className="bg-white p-2 rounded border shadow-sm h-100">
                  <div className="text-info fw-bold small">Débito</div>
                  <div className="fs-5 fw-bold text-dark">1.99%</div>
                  <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>
                    Liberação na Hora
                  </small>
                </div>
              </Col>
            </Row>

            <div className="mt-2 text-end">
              <small className="text-muted fst-italic" style={{ fontSize: '0.7rem' }}>
                * Taxas podem variar conforme seu plano (D+0, D+14, D+30).{' '}
                <a
                  href="https://www.mercadopago.com.br/ajuda/custos-de-recebimento_222"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver tabela oficial
                </a>
                .
              </small>
            </div>
          </div>

          {/* Onde pegar credenciais */}
          <Alert variant="info" className="rounded-3 border-0 shadow-sm small mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle-fill fs-5 me-2"></i>
              <div>
                Pegue suas credenciais no{' '}
                <a
                  href="https://www.mercadopago.com.br/developers/panel/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-bold text-decoration-none"
                >
                  Painel de Desenvolvedor
                </a>
                .
                <div className="text-muted mt-1">
                  Cole aqui para o sistema conseguir <strong>gerar cobranças</strong> e <strong>validar notificações</strong>.
                </div>
              </div>
            </div>
          </Alert>

          {/* Webhook */}
          <div className="mb-4">
            <Form.Label className="small text-muted fw-bold text-uppercase ms-1">
              URL do Webhook (Notificações automáticas)
            </Form.Label>

            <InputGroup className="border rounded-3 bg-white">
              <InputGroup.Text className="border-0 bg-transparent ps-3 text-secondary">
                <i className="bi bi-link-45deg fs-5"></i>
              </InputGroup.Text>

              <Form.Control
                readOnly
                value={webhookUrl}
                className="border-0 bg-transparent py-2 shadow-none font-monospace small text-muted"
                style={{ height: 45 }}
              />

              <Button
                variant="link"
                className="text-secondary text-decoration-none pe-3"
                onClick={handleCopy}
                type="button"
                title="Copiar webhook"
              >
                {copied ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
              </Button>
            </InputGroup>

            <Form.Text className="text-muted small">
              Configure essa URL no Mercado Pago para o sistema receber <strong>atualizações de pagamento</strong>.
            </Form.Text>
          </div>

          <hr className="my-4 opacity-25" />

          {error && (
            <Alert variant="danger" className="rounded-3 border-0 shadow-sm small">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold text-uppercase ms-1">
                    Public Key (Chave Pública)
                  </Form.Label>

                  <InputGroup className="border rounded-3 bg-white">
                    <InputGroup.Text className="border-0 bg-transparent ps-3 text-secondary">
                      <i className="bi bi-key fs-5"></i>
                    </InputGroup.Text>

                    <Form.Control
                      name="MERCADOPAGO_PUBLIC_KEY"
                      value={keys.MERCADOPAGO_PUBLIC_KEY}
                      onChange={handleChange}
                      placeholder={isConfigured ? 'Chave já configurada (deixe em branco para manter)' : 'APP_USR-...'}
                      className="border-0 bg-transparent py-2 shadow-none fw-medium"
                      style={{ height: 45 }}
                      autoComplete="off"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold text-uppercase ms-1">
                    Access Token (Chave Secreta)
                  </Form.Label>

                  <InputGroup className="border rounded-3 bg-white">
                    <InputGroup.Text className="border-0 bg-transparent ps-3 text-secondary">
                      <i className="bi bi-shield-lock fs-5"></i>
                    </InputGroup.Text>

                    <Form.Control
                      type={showSecret ? 'text' : 'password'}
                      name="MERCADOPAGO_ACCESS_TOKEN"
                      value={keys.MERCADOPAGO_ACCESS_TOKEN}
                      onChange={handleChange}
                      placeholder="APP_USR-..."
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
                    Use sempre as <strong>Credenciais de Produção</strong> para vendas reais.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Footer dentro do body pra manter “card style” */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                type="button"
                variant="light"
                onClick={onHide}
                className="rounded-pill px-4 fw-bold text-muted"
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                className="rounded-pill px-4 fw-bold shadow-sm"
                style={{ backgroundColor: '#009EE3', borderColor: '#009EE3' }}
              >
                {saving ? (
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
          </Form>
        </Card.Body>
      </Card>
    </Modal>
  );
};

export default MercadoPagoModal;
