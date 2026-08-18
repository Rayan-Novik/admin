import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Row, Col, Alert, InputGroup, Spinner, Card, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import api from '../../services/api';
import { toast } from 'react-toastify';

// --- Configuração dos Ícones do Mapa (Leaflet Fix) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para capturar o clique no mapa
const LocationMarker = ({ position, setPosition, onLocationFound }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationFound(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });
    return position === null ? null : <Marker position={position}></Marker>;
};

const StoresManager = () => {
    const [lojas, setLojas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentStoreId, setCurrentStoreId] = useState(null);

    // 🟢 ESTADOS DE CONFIGURAÇÃO (Retirada e Consumo Local)
    const [configuracoes, setConfiguracoes] = useState({
        RETIRADA_ATIVA: false,
        CONSUMO_LOCAL_ATIVO: false
    });
    const [savingConfig, setSavingConfig] = useState(false);

    const [formData, setFormData] = useState({
        nome: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', 
        latitude: '', longitude: '', ativo: true,
        hora_abertura: '', hora_fechamento: '', abre_feriados: false,
        dias_funcionamento: [0, 1, 2, 3, 4, 5, 6] 
    });

    const [loading, setLoading] = useState(true);
    const [loadingCep, setLoadingCep] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapPosition, setMapPosition] = useState(null); 

    const diasSemana = [
        { id: 0, label: 'Dom' }, { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' },
        { id: 3, label: 'Qua' }, { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }
    ];

    const toggleDia = (id) => {
        setFormData(prev => {
            const dias = prev.dias_funcionamento.includes(id)
                ? prev.dias_funcionamento.filter(d => d !== id)
                : [...prev.dias_funcionamento, id].sort();
            return { ...prev, dias_funcionamento: dias };
        });
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Busca as lojas
            const lojasRes = await api.get('/lojas/admin'); 
            setLojas(lojasRes.data);

            // Busca as configurações globais de Entrega (Retirada/Local)
            const configRes = await api.get('/configuracoes/gerais');
            const configsServidor = configRes.data || [];
            
            setConfiguracoes({
                RETIRADA_ATIVA: configsServidor.find(c => c.chave === 'RETIRADA_ATIVA')?.valor === 'true',
                CONSUMO_LOCAL_ATIVO: configsServidor.find(c => c.chave === 'CONSUMO_LOCAL_ATIVO')?.valor === 'true'
            });

        } catch (error) {
            console.error("Erro ao carregar dados", error);
            toast.error("Erro ao carregar lista de lojas e configurações.");
        } finally {
            setLoading(false);
        }
    };

    // 🟢 Função para salvar a ativação/desativação das opções de entrega
    const handleToggleConfig = async (chave, novoValor) => {
        const estadoAnterior = configuracoes[chave];
        setConfiguracoes(prev => ({ ...prev, [chave]: novoValor }));
        setSavingConfig(true);

        try {
            // O endpoint /configuracoes/gerais aceita um objeto ou array de configurações
            await api.put('/configuracoes/gerais', {
                [chave]: String(novoValor)
            });
            toast.success(`Configuração de entrega atualizada com sucesso!`);
        } catch (error) {
            setConfiguracoes(prev => ({ ...prev, [chave]: estadoAnterior })); // Reverte se der erro
            toast.error('Erro ao salvar configuração.');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleToggleStatus = async (loja) => {
        try {
            await api.put(`/lojas/${loja.id_loja}`, {
                ...loja,
                ativo: !loja.ativo
            });
            fetchData(); 
            toast.success(`Loja ${!loja.ativo ? 'ativada' : 'desativada'}!`);
        } catch (error) {
            toast.error("Erro ao alterar status da loja.");
        }
    };

    const handleEdit = (loja) => {
        setFormData({
            nome: loja.nome || '',
            cep: loja.cep || '',
            logradouro: loja.logradouro || '',
            numero: loja.numero || '',
            bairro: loja.bairro || '',
            cidade: loja.cidade || '',
            estado: loja.estado || '',
            latitude: loja.latitude || '',
            longitude: loja.longitude || '',
            ativo: loja.ativo,
            hora_abertura: loja.hora_abertura || '',
            hora_fechamento: loja.hora_fechamento || '',
            abre_feriados: loja.abre_feriados || false,
            dias_funcionamento: loja.dias_funcionamento ? loja.dias_funcionamento.split(',').map(Number) : [0, 1, 2, 3, 4, 5, 6]
        });
        
        if (loja.latitude && loja.longitude) {
            setMapPosition({ lat: parseFloat(loja.latitude), lng: parseFloat(loja.longitude) });
        } else {
            setMapPosition(null);
        }

        setCurrentStoreId(loja.id_loja);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja remover esta loja permanentemente?")) {
            try {
                await api.delete(`/lojas/${id}`);
                fetchData();
                toast.success("Loja removida!");
            } catch (error) {
                toast.error("Erro ao deletar a loja.");
            }
        }
    };

    const handleCepBlur = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length === 8) {
            setLoadingCep(true);
            try {
                const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                    fetchCoordinatesFromAddress(`${data.logradouro}, ${data.localidade}, ${data.uf}`);
                }
            } catch (error) { console.error("Erro CEP", error); } finally { setLoadingCep(false); }
        }
    };

    const fetchCoordinatesFromAddress = async (addressQuery) => {
        try {
            const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${addressQuery}&limit=1`);
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                setMapPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
            }
        } catch (error) { console.log("Erro ao obter coordenadas."); }
    };

    const handleLocationFound = async (lat, lng) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        try {
            const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (data && data.address) {
                setFormData(prev => ({
                    ...prev,
                    cep: data.address.postcode?.replace('-', '') || prev.cep,
                    logradouro: data.address.road || '',
                    bairro: data.address.suburb || data.address.neighbourhood || '',
                    cidade: data.address.city || data.address.town || data.address.village || '',
                    estado: data.address.state || '',
                    numero: data.address.house_number || ''
                }));
            }
        } catch (error) { console.error("Erro ao converter coordenadas.", error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            dias_funcionamento: formData.dias_funcionamento.join(',') 
        };

        try {
            if (currentStoreId) {
                await api.put(`/lojas/${currentStoreId}`, payload);
                toast.success("Loja atualizada com sucesso!");
            } else {
                await api.post('/lojas', payload);
                toast.success("Loja criada com sucesso!");
            }
            
            setShowModal(false);
            openNewStoreModal(); 
            fetchData();
        } catch (error) {
            const msgErro = error.response?.data?.message || "Erro ao salvar loja.";
            toast.error(msgErro);
        }
    };

    const openNewStoreModal = () => {
        setFormData({ 
            nome: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', 
            latitude: '', longitude: '', ativo: true,
            hora_abertura: '', hora_fechamento: '', abre_feriados: false,
            dias_funcionamento: [0, 1, 2, 3, 4, 5, 6]
        });
        setMapPosition(null);
        setCurrentStoreId(null);
        setShowModal(true);
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-1 fw-bold">Lojas Físicas & Entregas</h5>
                    <p className="text-muted small mb-0">Gerencie seus pontos de venda e métodos de entrega alternativos.</p>
                </div>
                <Button variant="primary" onClick={openNewStoreModal} className="shadow-sm">
                    <i className="fas fa-plus me-2"></i> Nova Loja
                </Button>
            </div>

            {/* 🟢 CARD DE CONFIGURAÇÕES DE ENTREGA */}
            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Opções Disponíveis no Checkout</h6>
                    <Row className="g-4">
                        <Col md={6}>
                            <div className="d-flex justify-content-between align-items-center p-3 border rounded-3" style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <div className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}><i className="bi bi-shop text-primary me-2"></i>Retirada na Loja</div>
                                    <div className="small text-muted" style={{ fontSize: '12px' }}>Permite que o cliente retire o pedido presencialmente.</div>
                                </div>
                                <div>
                                    <Form.Check 
                                        type="switch"
                                        id="switch-retirada"
                                        checked={configuracoes.RETIRADA_ATIVA}
                                        disabled={savingConfig}
                                        onChange={(e) => handleToggleConfig('RETIRADA_ATIVA', e.target.checked)}
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="d-flex justify-content-between align-items-center p-3 border rounded-3" style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <div className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}><i className="bi bi-cup-hot text-orange-500 me-2" style={{ color: '#f97316' }}></i>Consumir no Local</div>
                                    <div className="small text-muted" style={{ fontSize: '12px' }}>Ideal para restaurantes e lanchonetes. Pede mesa/nome.</div>
                                </div>
                                <div>
                                    <Form.Check 
                                        type="switch"
                                        id="switch-consumo"
                                        checked={configuracoes.CONSUMO_LOCAL_ATIVO}
                                        disabled={savingConfig}
                                        onChange={(e) => handleToggleConfig('CONSUMO_LOCAL_ATIVO', e.target.checked)}
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* LISTA DE LOJAS CADASTRADAS */}
            {lojas.length === 0 ? (
                <div className="text-center p-5 border rounded-3 bg-light text-muted">
                    <i className="bi bi-shop fs-1 mb-3 d-block opacity-25"></i>
                    <p>Nenhuma loja cadastrada.</p>
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {lojas.map(loja => (
                        <Col key={loja.id_loja}>
                            <Card className={`h-100 shadow-sm border-0 position-relative ${!loja.ativo ? 'opacity-75' : ''}`}>
                                <div className="bg-light d-flex align-items-center justify-content-center position-relative" style={{ height: '140px', borderBottom: '1px solid #f0f0f0' }}>
                                    <i className={`bi bi-geo-alt fs-1 ${loja.ativo ? 'text-primary' : 'text-secondary'} opacity-50`}></i>
                                    
                                    <div className="position-absolute top-0 end-0 p-2">
                                        <Badge bg={loja.ativo ? 'success' : 'secondary'} className="shadow-sm">
                                            {loja.ativo ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <Card.Body className="p-3 d-flex flex-column">
                                    <h6 className="fw-bold text-dark mb-2">{loja.nome}</h6>
                                    
                                    <div className="text-muted small mb-3 flex-grow-1">
                                        <p className="mb-1"><i className="bi bi-signpost-2 me-1"></i> {loja.logradouro}, {loja.numero}</p>
                                        <p className="mb-2 ms-3">{loja.bairro} - {loja.cidade}/{loja.estado}</p>
                                        
                                        <div className="p-2 bg-light rounded-2 border">
                                            <p className="mb-1 fw-semibold text-dark"><i className="bi bi-clock me-1"></i> Horário:</p>
                                            {loja.hora_abertura && loja.hora_fechamento ? (
                                                <p className="mb-0 ms-3">{loja.hora_abertura} às {loja.hora_fechamento}</p>
                                            ) : (
                                                <p className="mb-0 ms-3 fst-italic">Não configurado</p>
                                            )}
                                            
                                            {/* Exibição resumida dos dias no card */}
                                            {loja.dias_funcionamento && (
                                                <p className="mb-0 ms-3 text-[10px] mt-1 text-primary">
                                                    Dias: {loja.dias_funcionamento.split(',').map(d => diasSemana[Number(d)]?.label).join(', ')}
                                                </p>
                                            )}

                                            {loja.abre_feriados && (
                                                <Badge bg="info" text="dark" className="ms-3 mt-1" style={{ fontSize: '0.65rem' }}>Abre em feriados</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-auto border-top pt-3">
                                        <Button 
                                            variant={loja.ativo ? 'outline-warning' : 'outline-success'} 
                                            size="sm" 
                                            onClick={() => handleToggleStatus(loja)}
                                            title={loja.ativo ? "Desativar" : "Ativar"}
                                        >
                                            <i className={`bi ${loja.ativo ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                                        </Button>
                                        <Button variant="outline-secondary" size="sm" className="flex-grow-1" onClick={() => handleEdit(loja)}>
                                            Editar
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(loja.id_loja)}>
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* MODAL DE ADICIONAR/EDITAR LOJA MANTIDO INTACTO */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentStoreId ? 'Editar Loja' : 'Nova Loja'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="d-flex justify-content-end mb-3">
                        <Button variant="outline-primary" size="sm" onClick={() => setShowMapModal(true)} className="rounded-pill">
                            <i className="bi bi-map-fill me-2"></i> Abrir Mapa
                        </Button>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={9}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Nome da Loja</Form.Label>
                                    <Form.Control type="text" placeholder="Ex: Matriz - Centro" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-medium d-block">Status</Form.Label>
                                    <Form.Check 
                                        type="switch"
                                        id="modal-switch-ativo"
                                        label={formData.ativo ? "Ativa" : "Inativa"}
                                        checked={formData.ativo}
                                        onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}><hr className="my-2 opacity-25" /></Col>
                            <Col md={12}>
                                <h6 className="fw-bold text-secondary mb-2"><i className="bi bi-clock-history me-2"></i>Horário de Funcionamento</h6>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium text-muted small">Abre às</Form.Label>
                                    <Form.Control 
                                        type="time" 
                                        value={formData.hora_abertura} 
                                        onChange={e => setFormData({ ...formData, hora_abertura: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium text-muted small">Fecha às</Form.Label>
                                    <Form.Control 
                                        type="time" 
                                        value={formData.hora_fechamento} 
                                        onChange={e => setFormData({ ...formData, hora_fechamento: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium text-muted small">Regras</Form.Label>
                                    <div className="mt-2">
                                        <Form.Check 
                                            type="switch"
                                            id="feriado-switch"
                                            label="Abre em Feriados"
                                            checked={formData.abre_feriados}
                                            onChange={e => setFormData({ ...formData, abre_feriados: e.target.checked })}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-medium text-muted small mt-2">Dias que a loja abre</Form.Label>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {diasSemana.map(dia => (
                                            <Button 
                                                key={dia.id}
                                                variant={formData.dias_funcionamento.includes(dia.id) ? "primary" : "outline-secondary"}
                                                size="sm"
                                                className="rounded-pill px-3"
                                                onClick={() => toggleDia(dia.id)}
                                            >
                                                {dia.label}
                                            </Button>
                                        ))}
                                    </div>
                                </Form.Group>
                            </Col>

                            <Col md={12}><hr className="my-2 opacity-25" /></Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">CEP</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="text" required value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} onBlur={handleCepBlur} />
                                        {loadingCep && <InputGroup.Text><Spinner size="sm" /></InputGroup.Text>}
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Logradouro</Form.Label>
                                    <Form.Control type="text" required value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Número</Form.Label>
                                    <Form.Control type="text" required value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Bairro</Form.Label>
                                    <Form.Control type="text" required value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Cidade/UF</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control type="text" placeholder="Cidade" required value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                                        <Form.Control type="text" placeholder="UF" maxLength="2" style={{width: '60px'}} required value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" className="px-4">
                                {currentStoreId ? 'Salvar Alterações' : 'Criar Loja'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Selecionar Localização</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ height: '500px', padding: 0 }}>
                    <MapContainer center={mapPosition || { lat: -23.5505, lng: -46.6333 }} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} onLocationFound={handleLocationFound} />
                    </MapContainer>
                </Modal.Body>
                <Modal.Footer>
                    <small className="text-muted me-auto">Toque no mapa para marcar o local exato.</small>
                    <Button variant="primary" onClick={() => setShowMapModal(false)}>Confirmar Local</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default StoresManager;