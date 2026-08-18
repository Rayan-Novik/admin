import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const RAMOS_PREDEFINIDOS = [
    "Restaurante / Lanches",
    "Informática / Eletrônicos",
    "Material de Construção",
    "Moda / Vestuário",
    "Serviços Gerais",
    "Outro"
];

const AiConfigModal = ({ show, onHide, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // 🟢 ESTADO ATUALIZADO: Incluindo modo_apenas_agendamento
    const [config, setConfig] = useState({
        ia_ativada: true,
        ia_auto_atendimento: false,
        nome_agente: 'Chico',
        personalidade: 'Simpático e Amigável',
        ramo_loja: 'Restaurante / Lanches',
        tempo_resposta: 2,
        provedor_ia: 'GROQ', 
        groq_api_key: '', 
        gemini_api_key: '',
        modo_apenas_agendamento: false // 🟢 NOVO CAMPO
    });

    const [isRamoCustom, setIsRamoCustom] = useState(false);
    const [ramoCustomizado, setRamoCustomizado] = useState('');

    useEffect(() => {
        if (show) fetchConfig();
    }, [show]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/whatsapp/ai-config');
            
            // Mescla os dados que vieram do banco com as chaves padrão
            setConfig(prev => ({ 
                ...prev, 
                ...data,
                provedor_ia: data.provedor_ia || 'GROQ',
                groq_api_key: data.groq_api_key || '',
                gemini_api_key: data.gemini_api_key || '',
                modo_apenas_agendamento: data.modo_apenas_agendamento || false // 🟢 PUXA DO BANCO
            }));
            
            if (data.ramo_loja && !RAMOS_PREDEFINIDOS.includes(data.ramo_loja)) {
                setConfig(prev => ({ ...prev, ramo_loja: 'Outro' }));
                setIsRamoCustom(true);
                setRamoCustomizado(data.ramo_loja);
            } else {
                setIsRamoCustom(data.ramo_loja === 'Outro');
                setRamoCustomizado('');
            }
        } catch (err) {
            toast.error("Erro ao carregar configurações da IA.");
        } finally {
            setLoading(false);
        }
    };

    const handleRamoChange = (e) => {
        const value = e.target.value;
        setConfig({ ...config, ramo_loja: value });
        setIsRamoCustom(value === 'Outro');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { 
                ...config, 
                ramo_loja: isRamoCustom ? ramoCustomizado : config.ramo_loja 
            };

            await api.put('/whatsapp/ai-config', payload);
            toast.success("Configurações da IA salvas com sucesso!");
            if (onUpdateSuccess) onUpdateSuccess();
            onHide();
        } catch (err) {
            toast.error("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-light border-bottom-0">
                <Modal.Title className="fs-5 fw-bold d-flex align-items-center text-primary">
                    <i className="bi bi-robot fs-4 me-2"></i> Configurar Inteligência Artificial(BETA)
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="p-4">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted mt-3 small">Carregando cérebro da IA...</p>
                    </div>
                ) : (
                    <Form>
                        {/* SEÇÃO 1: STATUS DA IA */}
                        <div className="p-3 bg-light rounded-3 mb-4 border">
                            <h6 className="fw-bold mb-3 text-secondary"><i className="bi bi-power me-2"></i>Status Operacional</h6>
                            <Row>
                                <Col md={6}>
                                    <Form.Check 
                                        type="switch" id="ia_ativada"
                                        label={<span className="fw-medium">Assistente Ativado</span>}
                                        checked={config.ia_ativada}
                                        onChange={(e) => setConfig({...config, ia_ativada: e.target.checked})}
                                    />
                                    <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        Se desligado, a IA não responde nada.
                                    </Form.Text>
                                </Col>
                                <Col md={6}>
                                    <Form.Check 
                                        type="switch" id="ia_auto_atendimento"
                                        label={<span className="fw-medium">Atender Novos Clientes</span>}
                                        checked={config.ia_auto_atendimento}
                                        onChange={(e) => setConfig({...config, ia_auto_atendimento: e.target.checked})}
                                    />
                                    <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        Novos contatos falam direto com a IA.
                                    </Form.Text>
                                </Col>
                            </Row>
                        </div>

                        {/* SEÇÃO 2: IDENTIDADE DO AGENTE */}
                        <h6 className="fw-bold mb-3 text-secondary mt-2"><i className="bi bi-person-badge me-2"></i>Identidade do Agente</h6>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Nome do Agente</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-person-fill"></i></InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Ex: Chico, Maria, IA..."
                                            value={config.nome_agente}
                                            onChange={(e) => setConfig({...config, nome_agente: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Personalidade</Form.Label>
                                    <Form.Select 
                                        value={config.personalidade}
                                        onChange={(e) => setConfig({...config, personalidade: e.target.value})}
                                    >
                                        <option value="Simpático e Amigável">Simpático e Amigável 😄</option>
                                        <option value="Neutro e Direto">Neutro e Direto 😐</option>
                                        <option value="Formal e Profissional">Formal e Profissional 👔</option>
                                        <option value="Descontraído e Engraçado">Descontraído e Engraçado 🤪</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* SEÇÃO 3: PROVEDOR DE IA E CHAVE DE ACESSO */}
                        <h6 className="fw-bold mb-3 text-secondary mt-2"><i className="bi bi-key me-2"></i>Motor da Inteligência Artificial</h6>
                        <Row className="mb-4 g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Provedor de IA</Form.Label>
                                    <Form.Select 
                                        value={config.provedor_ia}
                                        onChange={(e) => setConfig({...config, provedor_ia: e.target.value})}
                                        className="fw-bold"
                                        style={{ color: config.provedor_ia === 'GEMINI' ? '#0ea5e9' : '#f97316' }}
                                    >
                                        <option value="GROQ">Groq (Llama 3)</option>
                                        <option value="GEMINI">Google Gemini</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            <Col md={8}>
                                {config.provedor_ia === 'GROQ' ? (
                                    <Form.Group>
                                        <Form.Label className="small fw-bold">API Key (Groq)</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text><i className="bi bi-key-fill text-warning"></i></InputGroup.Text>
                                            <Form.Control 
                                                type="password" 
                                                placeholder="gsk_..."
                                                value={config.groq_api_key || ''}
                                                onChange={(e) => setConfig({...config, groq_api_key: e.target.value})}
                                            />
                                        </InputGroup>
                                        <Form.Text className="text-muted small">
                                            Deixe em branco para usar a chave padrão do sistema.
                                        </Form.Text>
                                    </Form.Group>
                                ) : (
                                    <Form.Group>
                                        <Form.Label className="small fw-bold">API Key (Gemini)</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text><i className="bi bi-google text-info"></i></InputGroup.Text>
                                            <Form.Control 
                                                type="password" 
                                                placeholder="AIza..."
                                                value={config.gemini_api_key || ''}
                                                onChange={(e) => setConfig({...config, gemini_api_key: e.target.value})}
                                            />
                                        </InputGroup>
                                        <Form.Text className="text-muted small">
                                            Crie a sua chave gratuita no Google AI Studio.
                                        </Form.Text>
                                    </Form.Group>
                                )}
                            </Col>
                        </Row>

                        {/* SEÇÃO 4: NEGÓCIO E COMPORTAMENTO */}
                        <h6 className="fw-bold mb-3 text-secondary"><i className="bi bi-shop me-2"></i>Negócio e Comportamento</h6>
                        <Row className="g-3">
                            {/* 🟢 MODO AGENDAMENTO ADICIONADO AQUI */}
                            <Col md={12}>
                                <div className="p-3 border rounded border-primary bg-primary bg-opacity-10 mb-2">
                                    <Form.Check 
                                        type="switch" 
                                        id="modo_apenas_agendamento"
                                        label={<span className="fw-bold text-primary">Modo Exclusivo de Agendamentos</span>}
                                        checked={config.modo_apenas_agendamento}
                                        onChange={(e) => setConfig({...config, modo_apenas_agendamento: e.target.checked})}
                                    />
                                    <Form.Text className="text-dark small d-block mt-1">
                                        Se ativado, a IA ignorará o catálogo de produtos físicos de Delivery e focará 100% em marcar horários baseados nos seus <strong>Serviços</strong> cadastrados.
                                    </Form.Text>
                                </div>
                            </Col>

                            <Col md={isRamoCustom ? 4 : 6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Ramo da Loja</Form.Label>
                                    <Form.Select value={config.ramo_loja} onChange={handleRamoChange}>
                                        {RAMOS_PREDEFINIDOS.map(ramo => (
                                            <option key={ramo} value={ramo}>{ramo}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {isRamoCustom && (
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-primary">Qual o ramo?</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Ex: Petshop..."
                                            value={ramoCustomizado}
                                            onChange={(e) => setRamoCustomizado(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            )}

                            <Col md={isRamoCustom ? 4 : 6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Tempo de Digitação</Form.Label>
                                    <Form.Select 
                                        value={config.tempo_resposta}
                                        onChange={(e) => setConfig({...config, tempo_resposta: Number(e.target.value)})}
                                    >
                                        <option value={0}>Imediato (0 segundos)</option>
                                        <option value={2}>Rápido (2 segundos)</option>
                                        <option value={5}>Humano Normal (5 segundos)</option>
                                        <option value={10}>Demorado (10 segundos)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                )}
            </Modal.Body>
            
            <Modal.Footer className="border-top-0 bg-light">
                <Button variant="outline-secondary" className="rounded-pill px-4" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleSave} disabled={saving || (isRamoCustom && !ramoCustomizado.trim())}>
                    {saving ? <><Spinner size="sm" animation="border" className="me-2"/> Salvando...</> : 'Salvar Configurações'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AiConfigModal;