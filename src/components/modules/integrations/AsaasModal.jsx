import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Badge, InputGroup, Card, Nav, Tooltip, OverlayTrigger } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AsaasModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('api'); // 'api' ou 'webhook'

  // Gera a URL do Webhook baseada na URL da API
  const webhookUrl = `${process.env.REACT_APP_API_URL || 'https://api.seusite.com.br'}/webhooks/asaas`;

  useEffect(() => {
    if (show && isConfigured) {
      const fetchKey = async () => {
        setFetching(true);
        try {
          const { data } = await api.get('/configuracoes/ASAAS_API_KEY');
          setApiKey(data.valor || '');
        } catch (err) {
          console.error('Erro ao buscar chave Asaas:', err);
          toast.error('Não consegui carregar a chave do Asaas.');
        } finally {
          setFetching(false);
        }
      };
      fetchKey();
    } else if (!show) {
      setApiKey('');
      setShowKey(false);
      setLoading(false);
      setFetching(false);
      setActiveTab('api');
    }
  }, [show, isConfigured]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/configuracoes', {
        chave: 'ASAAS_API_KEY',
        valor: apiKey,
      });

      toast.success('Configuração do Asaas salva com sucesso!');
      onUpdateSuccess?.('Asaas configurado.');
      onHide?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar configuração do Asaas.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.info('URL do Webhook copiada!', { autoClose: 2000 });
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={!loading && !fetching}
      contentClassName="border-0 bg-transparent"
      size="lg" // Modal um pouco mais largo para o tutorial
    >
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-4 pt-4 pb-0">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: 40, height: 40, background: 'rgba(0,48,185,0.08)' }}
              >
                <img src="/images/asaas-logo.png" alt="Asaas" height="22" onError={(e) => e.target.style.display='none'} /> 
                {/* Fallback visual se a imagem não existir */}
                <i className="bi bi-wallet2 text-primary" style={{display: 'none'}}></i> 
              </div>

              <div className="lh-sm">
                <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                  Configurar Asaas
                </div>
                <div className="text-muted small">Gateway de Pagamento</div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Badge bg={isConfigured ? 'success' : 'secondary'} className="rounded-pill px-3 py-2">
                {isConfigured ? 'Conectado' : 'Não configurado'}
              </Badge>
              <Button variant="link" className="text-secondary p-0" onClick={onHide}>
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
          </div>

          {/* Abas de Navegação */}
          <Nav variant="tabs" className="border-bottom-0" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="api" className="px-4 text-dark fw-medium">
                1. Chave API
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="webhook" className="px-4 text-dark fw-medium">
                2. Configurar Webhook (Tutorial)
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        <Card.Body className="bg-light px-4 py-4">
          
          {/* --- ABA 1: CHAVE API --- */}
          {activeTab === 'api' && (
            <Form onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
              <div className="bg-white p-4 rounded-3 shadow-sm border mb-3">
                <h6 className="fw-bold mb-3">Conexão com a Conta</h6>
                
                <Alert variant="info" className="small border-0 bg-info bg-opacity-10 text-info-emphasis">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Vá em <strong>Minha Conta {'>'} Integrações</strong> no painel do Asaas para gerar sua chave.
                </Alert>

                {fetching ? (
                  <div className="text-center py-3"><Spinner size="sm" /></div>
                ) : (
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">API Access Token</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white border-end-0">
                        <i className="bi bi-key-fill text-muted"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type={showKey ? 'text' : 'password'}
                        placeholder="$aact_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="border-start-0 border-end-0 shadow-none"
                        required
                        autoComplete="off"
                      />
                      <Button variant="outline-secondary" className="border-start-0" onClick={() => setShowKey(!showKey)}>
                        <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted small">
                      A chave começa com <code>$aact_</code>. Copie a chave completa.
                    </Form.Text>
                  </Form.Group>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="primary" type="submit" disabled={loading || !apiKey} className="px-4 rounded-pill">
                  {loading ? <Spinner size="sm" /> : 'Salvar e Continuar'}
                </Button>
              </div>
            </Form>
          )}

          {/* --- ABA 2: TUTORIAL WEBHOOK --- */}
          {activeTab === 'webhook' && (
            <div className="animate__animated animate__fadeIn">
              <div className="bg-white p-4 rounded-3 shadow-sm border mb-3">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="bi bi-robot text-primary me-2"></i>
                  Configurando o Retorno Automático
                </h6>
                <p className="small text-muted mb-4">
                  O Webhook serve para o Asaas avisar seu sistema automaticamente quando um pagamento for confirmado (PIX ou Boleto).
                </p>

                <div className="d-flex flex-column gap-3">
                  {/* Passo 1 */}
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0" style={{width: 28, height: 28, fontSize: 14}}>1</div>
                    <div className="w-100">
                      <div className="fw-bold text-dark small mb-1">Copie a URL do seu Webhook</div>
                      <InputGroup size="sm">
                        <Form.Control readOnly value={webhookUrl} className="bg-light text-muted" />
                        <OverlayTrigger placement="top" overlay={<Tooltip>Copiar URL</Tooltip>}>
                          <Button variant="outline-primary" onClick={copyToClipboard}>
                            <i className="bi bi-clipboard"></i> Copiar
                          </Button>
                        </OverlayTrigger>
                      </InputGroup>
                    </div>
                  </div>

                  {/* Passo 2 */}
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0" style={{width: 28, height: 28, fontSize: 14}}>2</div>
                    <div>
                      <div className="fw-bold text-dark small">Acesse o Painel Asaas</div>
                      <div className="small text-muted">
                        Vá em <strong>Configurações</strong> <i className="bi bi-chevron-right" /> <strong>Integrações</strong> <i className="bi bi-chevron-right" /> Aba <strong>Webhooks</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0" style={{width: 28, height: 28, fontSize: 14}}>3</div>
                    <div>
                      <div className="fw-bold text-dark small">Preencha os dados</div>
                      <ul className="small text-muted list-unstyled mt-1 mb-0 border-start border-2 ps-3 border-primary bg-primary bg-opacity-10 py-2 pe-2 rounded-end">
                        <li className="mb-1"><i className="bi bi-link-45deg me-2"></i><strong>URL:</strong> Cole a URL que você copiou no passo 1.</li>
                        <li className="mb-1"><i className="bi bi-envelope me-2"></i><strong>Email:</strong> Seu email de alerta.</li>
                        <li className="mb-1"><i className="bi bi-hdd-network me-2"></i><strong>Versão API:</strong> V3.</li>
                        <li className="mb-1"><i className="bi bi-arrow-down-up me-2"></i><strong>Fila de envio:</strong> Sequencial.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 4 */}
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0" style={{width: 28, height: 28, fontSize: 14}}>4</div>
                    <div>
                      <div className="fw-bold text-dark small">Marque os Eventos (Importante)</div>
                      <div className="d-flex gap-2 flex-wrap mt-1">
                        <Badge bg="success" className="fw-normal"><i className="bi bi-check-lg"></i> Pagamento confirmado</Badge>
                        <Badge bg="success" className="fw-normal"><i className="bi bi-check-lg"></i> Pagamento recebido</Badge>
                        <Badge bg="secondary" className="fw-normal bg-opacity-50 text-dark">Pagamento estornado (Opcional)</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-shield-check text-success"></i> Salve no Asaas para finalizar.
                </small>
                <Button variant="outline-secondary" size="sm" onClick={onHide}>
                  Entendi, fechar
                </Button>
              </div>
            </div>
          )}

        </Card.Body>
      </Card>
    </Modal>
  );
};

export default AsaasModal;