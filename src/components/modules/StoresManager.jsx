import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Row, Col, Alert, InputGroup, Spinner, Card, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import api from '../../services/api';

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
    
    // Estado para saber se estamos editando (ID da loja) ou criando (null)
    const [currentStoreId, setCurrentStoreId] = useState(null);

    const [formData, setFormData] = useState({
        nome: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', latitude: '', longitude: '', ativo: true
    });

    const [loading, setLoading] = useState(true);
    const [loadingCep, setLoadingCep] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapPosition, setMapPosition] = useState(null); 

    useEffect(() => {
        fetchLojas();
    }, []);

    // ✅ ATUALIZADO: Busca na rota administrativa para trazer lojas inativas também
    const fetchLojas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/lojas/admin'); 
            setLojas(data);
        } catch (error) {
            console.error("Erro ao carregar lojas", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ NOVO: Alternar status Ativo/Inativo
    const handleToggleStatus = async (loja) => {
        try {
            await api.put(`/lojas/${loja.id_loja}`, {
                ...loja,
                ativo: !loja.ativo
            });
            fetchLojas(); // Recarrega a lista
        } catch (error) {
            alert("Erro ao alterar status da loja.");
        }
    };

    // ✅ NOVO: Prepara o formulário para edição
    const handleEdit = (loja) => {
        setFormData({
            nome: loja.nome,
            cep: loja.cep,
            logradouro: loja.logradouro,
            numero: loja.numero,
            bairro: loja.bairro,
            cidade: loja.cidade,
            estado: loja.estado,
            latitude: loja.latitude,
            longitude: loja.longitude,
            ativo: loja.ativo
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
                fetchLojas();
            } catch (error) {
                alert("Erro ao deletar a loja.");
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

    // ✅ ATUALIZADO: Lida com Criação (POST) ou Edição (PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        };

        try {
            if (currentStoreId) {
                // Edição
                await api.put(`/lojas/${currentStoreId}`, payload);
                alert("Loja atualizada com sucesso!");
            } else {
                // Criação
                await api.post('/lojas', payload);
                alert("Loja criada com sucesso!");
            }
            
            setShowModal(false);
            openNewStoreModal(); // Reseta o formulário
            fetchLojas();
        } catch (error) {
            const msgErro = error.response?.data?.message || "Erro ao salvar loja.";
            alert(msgErro);
        }
    };

    const openNewStoreModal = () => {
        setFormData({ nome: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', latitude: '', longitude: '', ativo: true });
        setMapPosition(null);
        setCurrentStoreId(null);
        setShowModal(true);
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-1 fw-bold">Lojas Físicas (Retirada)</h5>
                    <p className="text-muted small mb-0">Pontos de entrega disponíveis para os clientes.</p>
                </div>
                <Button variant="primary" onClick={openNewStoreModal} className="shadow-sm">
                    <i className="fas fa-plus me-2"></i> Nova Loja
                </Button>
            </div>

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
                                {/* Mapa Estático Visual */}
                                <div className="bg-light d-flex align-items-center justify-content-center position-relative" style={{ height: '140px', borderBottom: '1px solid #f0f0f0' }}>
                                    <i className={`bi bi-geo-alt fs-1 ${loja.ativo ? 'text-primary' : 'text-secondary'} opacity-50`}></i>
                                    
                                    {/* Badge de Status no Topo */}
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
                                        <p className="mb-1 ms-3">{loja.bairro} - {loja.cidade}/{loja.estado}</p>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="d-flex gap-2 mt-auto border-top pt-3">
                                        {/* Botão Ativar/Desativar */}
                                        <Button 
                                            variant={loja.ativo ? 'outline-warning' : 'outline-success'} 
                                            size="sm" 
                                            onClick={() => handleToggleStatus(loja)}
                                            title={loja.ativo ? "Desativar" : "Ativar"}
                                        >
                                            <i className={`bi ${loja.ativo ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                                        </Button>

                                        {/* Botão Editar */}
                                        <Button variant="outline-secondary" size="sm" className="flex-grow-1" onClick={() => handleEdit(loja)}>
                                            Editar
                                        </Button>
                                        
                                        {/* Botão Excluir */}
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

            {/* MODAL DE CADASTRO/EDIÇÃO */}
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
                                {/* Checkbox de Ativo dentro do modal também */}
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

                        <Alert variant="info" className="small py-2 mt-3 d-flex align-items-center">
                            <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                            <div>
                                <strong>Coordenadas (Lat/Lon):</strong> Preenchidas automaticamente pelo mapa ou endereço.
                                <div className="text-muted" style={{fontSize: '0.75rem'}}>
                                    {formData.latitude || '---'}, {formData.longitude || '---'}
                                </div>
                            </div>
                        </Alert>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" className="px-4">
                                {currentStoreId ? 'Salvar Alterações' : 'Criar Loja'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* MODAL DO MAPA */}
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