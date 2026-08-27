import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Form, Modal, Row, Col, InputGroup, Spinner, Card, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import api from '../../services/api';
import { toast } from 'react-toastify';

// 🟢 MÁGICA DO DESIGN: Estilos para o efeito de "Pulso" no mapa igual ao iFood/Uber
const mapStyles = `
  .custom-marker-shadow {
    position: absolute;
    width: 36px;
    height: 36px;
    background-color: rgba(37, 99, 235, 0.25);
    border-radius: 50%;
    border: 2px solid rgba(37, 99, 235, 0.5);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulseMap 2s infinite;
  }
  .custom-marker-shadow-2 {
    position: absolute;
    width: 56px;
    height: 56px;
    background-color: rgba(37, 99, 235, 0.15);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulseMap 2s infinite;
    animation-delay: 0.5s;
  }
  @keyframes pulseMap {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }
`;

// Injeta os estilos do mapa no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = mapStyles;
  document.head.appendChild(styleSheet);
}

// 🟢 CRIANDO O PINO (MARKER) PREMIUM CUSTOMIZADO
const customMarkerIcon = new L.DivIcon({
  html: `
    <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
      <div class="custom-marker-shadow-2"></div>
      <div class="custom-marker-shadow"></div>
      <svg viewBox="0 0 24 24" width="40" height="40" fill="#111827" style="position: relative; z-index: 10; margin-bottom: 20px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
      </svg>
    </div>
  `,
  className: '', // Remove classes padrão do Leaflet para não dar conflito
  iconSize: [60, 60],
  iconAnchor: [30, 46], // Alinha perfeitamente a ponta da gota
});

// 🟢 COMPONENTE 1: Move a câmera do mapa suavemente
const MapController = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
        }
    }, [lat, lng, map]);
    return null;
};

// 🟢 COMPONENTE 2: Interação Nível 99 (Clique e Arraste integrados com Autopreenchimento)
const MapInteraction = ({ lat, lng, setCoordinates, onLocationFound }) => {
    const map = useMapEvents({
        click(e) {
            const newLat = e.latlng.lat;
            const newLng = e.latlng.lng;
            setCoordinates(newLat, newLng);
            onLocationFound(newLat, newLng);
            map.flyTo(e.latlng, map.getZoom());
        }
    });

    const markerRef = useRef(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const position = marker.getLatLng();
                    setCoordinates(position.lat, position.lng);
                    onLocationFound(position.lat, position.lng);
                    map.flyTo(position, map.getZoom());
                }
            },
        }),
        [setCoordinates, onLocationFound, map],
    );

    return lat && lng ? (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            ref={markerRef}
            icon={customMarkerIcon} // 🟢 Aplicando o nosso pino aqui!
        ></Marker>
    ) : null;
};

const StoresManager = () => {
    const [lojas, setLojas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentStoreId, setCurrentStoreId] = useState(null);

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
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const defaultCenter = { lat: -15.7801, lng: -47.9292 }; 

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
            const lojasRes = await api.get('/lojas/admin'); 
            setLojas(lojasRes.data);

            const configRes = await api.get('/configuracoes/gerais');
            const configsServidor = configRes.data || [];
            
            setConfiguracoes({
                RETIRADA_ATIVA: configsServidor.find(c => c.chave === 'RETIRADA_ATIVA')?.valor === 'true',
                CONSUMO_LOCAL_ATIVO: configsServidor.find(c => c.chave === 'CONSUMO_LOCAL_ATIVO')?.valor === 'true'
            });
        } catch (error) {
            toast.error("Erro ao carregar lista de lojas e configurações.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleConfig = async (chave, novoValor) => {
        const estadoAnterior = configuracoes[chave];
        setConfiguracoes(prev => ({ ...prev, [chave]: novoValor }));
        setSavingConfig(true);

        try {
            await api.put('/configuracoes/gerais', { [chave]: String(novoValor) });
            toast.success(`Configuração de entrega atualizada com sucesso!`);
        } catch (error) {
            setConfiguracoes(prev => ({ ...prev, [chave]: estadoAnterior }));
            toast.error('Erro ao salvar configuração.');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleToggleStatus = async (loja) => {
        try {
            await api.put(`/lojas/${loja.id_loja}`, { ...loja, ativo: !loja.ativo });
            fetchData(); 
            toast.success(`Loja ${!loja.ativo ? 'ativada' : 'desativada'}!`);
        } catch (error) {
            toast.error("Erro ao alterar status da loja.");
        }
    };

    const handleEdit = (loja) => {
        setFormData({
            nome: loja.nome || '', cep: loja.cep || '', logradouro: loja.logradouro || '',
            numero: loja.numero || '', bairro: loja.bairro || '', cidade: loja.cidade || '',
            estado: loja.estado || '', latitude: loja.latitude || '', longitude: loja.longitude || '',
            ativo: loja.ativo, hora_abertura: loja.hora_abertura || '', hora_fechamento: loja.hora_fechamento || '',
            abre_feriados: loja.abre_feriados || false,
            dias_funcionamento: loja.dias_funcionamento ? loja.dias_funcionamento.split(',').map(Number) : [0, 1, 2, 3, 4, 5, 6]
        });
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
                        ...prev, logradouro: data.logradouro, bairro: data.bairro,
                        cidade: data.localidade, estado: data.uf
                    }));
                    
                    const addressQuery = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
                    const coordRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
                    
                    if (coordRes.data.length > 0) {
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude: coordRes.data[0].lat, 
                            longitude: coordRes.data[0].lon 
                        }));
                    }
                }
            } catch (error) { console.error("Erro CEP", error); } finally { setLoadingCep(false); }
        }
    };

    const handleLocationFound = async (lat, lng) => {
        setIsFetchingLocation(true);
        try {
            const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            
            if (data && data.address) {
                setFormData(prev => ({
                    ...prev,
                    cep: data.address.postcode?.replace('-', '') || prev.cep,
                    logradouro: data.address.road || data.address.pedestrian || data.address.path || data.address.residential || prev.logradouro,
                    bairro: data.address.suburb || data.address.neighbourhood || data.address.residential || prev.bairro,
                    cidade: data.address.city || data.address.town || data.address.village || data.address.municipality || prev.cidade,
                    estado: data.address.state || prev.estado,
                    numero: data.address.house_number || prev.numero 
                }));
            }
        } catch (error) { 
            console.error("Erro ao converter coordenadas.", error); 
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const handleGetMyLocation = () => {
        if (!navigator.geolocation) return toast.error("Seu navegador não suporta GPS.");
        
        toast.info("Buscando sua localização exata...", { autoClose: 2000 });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setFormData(prev => ({ ...prev, latitude, longitude }));
                handleLocationFound(latitude, longitude); 
            },
            () => toast.error("Permissão de GPS negada. Ative no seu navegador.")
        );
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
                                        <Button variant={loja.ativo ? 'outline-warning' : 'outline-success'} size="sm" onClick={() => handleToggleStatus(loja)} title={loja.ativo ? "Desativar" : "Ativar"}>
                                            <i className={`bi ${loja.ativo ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                                        </Button>
                                        <Button variant="outline-secondary" size="sm" className="flex-grow-1" onClick={() => handleEdit(loja)}>Editar</Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(loja.id_loja)}><i className="bi bi-trash"></i></Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentStoreId ? 'Editar Loja' : 'Nova Loja'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-4">
                            {/* COLUNA ESQUERDA: DADOS DA LOJA */}
                            <Col lg={6}>
                                <div className="pe-lg-3">
                                    <Row className="g-3">
                                        <Col md={9}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Nome da Loja</Form.Label>
                                                <Form.Control type="text" placeholder="Ex: Matriz - Centro" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small d-block">Status</Form.Label>
                                                <Form.Check type="switch" id="modal-switch-ativo" label={formData.ativo ? "Ativa" : "Inativa"} checked={formData.ativo} onChange={e => setFormData({ ...formData, ativo: e.target.checked })} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}><hr className="my-1 opacity-10" /></Col>

                                        {isFetchingLocation && (
                                            <Col md={12}>
                                                <div className="alert alert-info py-2 small mb-0 fw-medium d-flex align-items-center">
                                                    <Spinner size="sm" className="me-2" /> Decodificando endereço do satélite...
                                                </div>
                                            </Col>
                                        )}

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">CEP</Form.Label>
                                                <InputGroup>
                                                    <Form.Control type="text" placeholder="00000-000" required value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} onBlur={handleCepBlur} />
                                                    {loadingCep && <InputGroup.Text><Spinner size="sm" /></InputGroup.Text>}
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Logradouro / Rua</Form.Label>
                                                <Form.Control type="text" required value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Número</Form.Label>
                                                <Form.Control type="text" required value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Bairro</Form.Label>
                                                <Form.Control type="text" required value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Cidade</Form.Label>
                                                <Form.Control type="text" required value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">UF</Form.Label>
                                                <Form.Control type="text" maxLength="2" required value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} />
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}><hr className="my-1 opacity-10" /></Col>

                                        <Col md={12}>
                                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-clock-history me-2 text-primary"></i>Horários de Funcionamento</h6>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Abre às</Form.Label>
                                                <Form.Control type="time" value={formData.hora_abertura} onChange={e => setFormData({ ...formData, hora_abertura: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small">Fecha às</Form.Label>
                                                <Form.Control type="time" value={formData.hora_fechamento} onChange={e => setFormData({ ...formData, hora_fechamento: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                        
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium text-muted small mt-1">Dias que a loja abre</Form.Label>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    {diasSemana.map(dia => (
                                                        <Button 
                                                            key={dia.id}
                                                            variant={formData.dias_funcionamento.includes(dia.id) ? "primary" : "outline-secondary"}
                                                            size="sm" className="rounded-pill px-3"
                                                            onClick={() => toggleDia(dia.id)}
                                                        >
                                                            {dia.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Check type="switch" id="feriado-switch" className="mt-2 text-muted fw-medium" label="Abre em Feriados Nacionais" checked={formData.abre_feriados} onChange={e => setFormData({ ...formData, abre_feriados: e.target.checked })} />
                                        </Col>
                                    </Row>
                                </div>
                            </Col>

                            {/* COLUNA DIREITA: MAPA INTERATIVO NÍVEL 99 */}
                            <Col lg={6}>
                                <div className="bg-light p-3 rounded-4 border h-100 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="fw-bold mb-0 text-dark">
                                            <i className="bi bi-geo-alt-fill text-primary me-2"></i>Local Exato no Mapa
                                        </h6>
                                        <Button variant="dark" size="sm" className="rounded-pill" onClick={handleGetMyLocation}>
                                            <i className="bi bi-crosshair me-1"></i> Usar meu GPS Atual
                                        </Button>
                                    </div>
                                    <p className="text-muted small mb-3">
                                        Clique no mapa ou arraste o pino para o local exato. Se o endereço não carregar 100% certo, você pode digitar por cima no formulário sem perder a marcação do GPS.
                                    </p>
                                    
                                    {/* 🟢 O MAPA PREMIUM ESTILO IFOOD/UBER */}
                                    <div className="flex-grow-1 w-100 rounded-3 overflow-hidden border shadow-sm position-relative" style={{ minHeight: '350px', zIndex: 1 }}>
                                        <MapContainer 
                                            center={formData.latitude ? [formData.latitude, formData.longitude] : [defaultCenter.lat, defaultCenter.lng]} 
                                            zoom={formData.latitude ? 17 : 4} 
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            {/* Mapa base clean da CartoDB */}
                                            <TileLayer 
                                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
                                                attribution='&copy; <a href="https://carto.com/">CartoDB</a>' 
                                            />
                                            <MapController lat={formData.latitude} lng={formData.longitude} />
                                            <MapInteraction 
                                                lat={formData.latitude} 
                                                lng={formData.longitude} 
                                                setCoordinates={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                                                onLocationFound={handleLocationFound}
                                            />
                                        </MapContainer>
                                    </div>

                                    {/* DADOS TÉCNICOS SÓ PARA LEITURA */}
                                    <div className="d-flex gap-2 mt-3 opacity-75">
                                        <InputGroup size="sm">
                                            <InputGroup.Text>Lat</InputGroup.Text>
                                            <Form.Control readOnly value={formData.latitude || ''} className="bg-white" />
                                        </InputGroup>
                                        <InputGroup size="sm">
                                            <InputGroup.Text>Lng</InputGroup.Text>
                                            <Form.Control readOnly value={formData.longitude || ''} className="bg-white" />
                                        </InputGroup>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                            <Button variant="light" className="px-4 fw-bold" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" className="px-5 fw-bold shadow-sm">
                                {currentStoreId ? 'Salvar Alterações' : 'Criar Loja'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default StoresManager;