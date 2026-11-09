import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Container,
    Badge,
    Button,
    Form,
    Modal,
    InputGroup,
    Spinner,
    Nav
} from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';

// =========================================================================
// 🟢 ÍCONES MINIMALISTAS (ESTILO UBER / 99 / IFOOD)
// =========================================================================

// 1. Motoboy: Azul Ararinha Elétrico, Pulso Suave e Placa de Identificação
const getDriverIcon = (pedidoId, hasRecentLocation = true) => L.divIcon({
    className: 'uber-driver-marker',
    html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(0, -10px);">
            <div style="
                background: #0084fb;
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 9999px;
                margin-bottom: 3px;
                box-shadow: 0 4px 12px rgba(0, 132, 251, 0.35);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 5px;
                letter-spacing: -0.2px;
                border: 1.5px solid #ffffff;
            ">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${hasRecentLocation ? '#4ade80' : '#facc15'}; display: inline-block;"></span>
                #${pedidoId || ''} Motoboy
            </div>
            <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                <div style="
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: ${hasRecentLocation ? 'rgba(0, 132, 251, 0.3)' : 'rgba(234, 179, 8, 0.25)'};
                    animation: uber-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
                <div style="
                    background: linear-gradient(135deg, #0084fb 0%, #0066d6 100%);
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 16px rgba(0, 132, 251, 0.45);
                    border: 2.5px solid #ffffff;
                    color: #ffffff;
                    position: relative;
                ">
                    <i class="bi bi-bicycle" style="font-size: 18px;"></i>
                </div>
            </div>
        </div>
    `,
    iconSize: [80, 60],
    iconAnchor: [40, 48],
    popupAnchor: [0, -50]
});

// 2. Destino do Cliente: Ícone Ararinha Oficial sem fundo branco
const getCustomerIcon = (pedidoId) => L.divIcon({
    className: 'ararinha-dest-marker',
    html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(0, -10px); cursor: pointer;">
            <div style="
                background: #0084fb;
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 9999px;
                margin-bottom: 2px;
                box-shadow: 0 4px 10px rgba(0, 132, 251, 0.35);
                white-space: nowrap;
                border: 1.5px solid #ffffff;
                letter-spacing: -0.2px;
            ">
                Destino #${pedidoId || ''}
            </div>
            <div style="
                position: relative;
                width: 44px;
                height: 44px;
                filter: drop-shadow(0 6px 10px rgba(0, 132, 251, 0.45));
                transition: transform 0.2s ease;
            ">
                <img 
                    src="/images/ararinha-pin.png" 
                    alt="Destino Cliente" 
                    style="width: 100%; height: 100%; object-fit: contain; display: block;" 
                />
            </div>
        </div>
    `,
    iconSize: [80, 62],
    iconAnchor: [40, 56],
    popupAnchor: [0, -54]
});

// 3. Loja / Restaurante: Ponto de Partida
const getStoreIcon = (lojaNome = 'Loja') => L.divIcon({
    className: 'uber-store-marker',
    html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(0, -6px);">
            <div style="
                background: #1e3a8a;
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 9999px;
                margin-bottom: 3px;
                box-shadow: 0 4px 10px rgba(30, 58, 138, 0.25);
                white-space: nowrap;
                border: 1.5px solid #ffffff;
            ">
                🏬 ${lojaNome}
            </div>
            <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #1e3a8a;
                border: 3px solid #ffffff;
                box-shadow: 0 4px 12px rgba(30, 58, 138, 0.35);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="width: 7px; height: 7px; border-radius: 50%; background: #0084fb;"></div>
            </div>
        </div>
    `,
    iconSize: [100, 48],
    iconAnchor: [50, 40],
    popupAnchor: [0, -42]
});

// Componente para animar/centralizar a visão do mapa dinamicamente
const MapController = ({ centerCoords, zoomLevel, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length > 0) {
            try {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
            } catch (err) { }
        } else if (centerCoords && centerCoords[0] && centerCoords[1]) {
            map.flyTo(centerCoords, zoomLevel || 15, { duration: 1.2 });
        }
    }, [centerCoords, zoomLevel, bounds, map]);

    return null;
};

const MapaEntregasPage = () => {
    const { can } = usePermission();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [loja, setLoja] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [activeTab, setActiveTab] = useState('em_rota');
    const [filtroTexto, setFiltroTexto] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Controle visual da Gaveta Lateral e Estilo
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mapStyle, setMapStyle] = useState('uber'); // 'uber' | 'padrao'

    // Foco do Mapa e Traçado pelas Ruas (OSRM)
    const [focusedCoords, setFocusedCoords] = useState(null);
    const [focusedBounds, setFocusedBounds] = useState(null);
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeRouteGeometry, setActiveRouteGeometry] = useState(null);
    const [routeStats, setRouteStats] = useState(null); // { distanceKm, durationMin }
    const [pickupRouteGeometry, setPickupRouteGeometry] = useState(null); // Rota Entregador ➔ Loja
    const [pickupStats, setPickupStats] = useState(null); // { distanceKm, durationMin }
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Modal de Despacho & Link do Entregador
    const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [dispatchedData, setDispatchedData] = useState(null);
    const [motoboyWhatsapp, setMotoboyWhatsapp] = useState('');
    const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
    const [entregadores, setEntregadores] = useState([]);
    const [selectedEntregadorId, setSelectedEntregadorId] = useState('');
    const [loadingEntregadores, setLoadingEntregadores] = useState(false);

    // Modal & Configurações de Logística e Pagamento dos Entregadores
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState({
        distribution_mode: 'MANUAL', // 'MANUAL' ou 'QUEUE'
        payment_type: 'FIXED',       // 'NONE', 'FIXED', 'DISTANCE', 'HYBRID'
        fixed_fee: 7.00,
        km_rate: 1.50,
        base_fee: 5.00,
        max_km: 15
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // Coletar URL base da loja
    const getStoreUrl = useCallback(() => {
        const slug = localStorage.getItem('tenantSlug');
        const domain = localStorage.getItem('tenantDomain');
        let baseDomain = 'ararinhacloud.shop';

        if (process.env.REACT_APP_ECOMMERCE_URL) {
            baseDomain = process.env.REACT_APP_ECOMMERCE_URL.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        }
        if (domain && domain !== 'null' && domain !== 'undefined') return `https://${domain}`;
        if (slug && slug !== 'null' && slug !== 'undefined') return `https://${slug}.${baseDomain}`;
        return `https://${baseDomain}`;
    }, []);

    const storeUrl = useMemo(() => getStoreUrl(), [getStoreUrl]);

    // Buscar dados do Radar
    const fetchRadar = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await api.get('/pedidos/entregas/radar');
            setLoja(res.data.loja);
            setPedidos(res.data.pedidos || []);
            if (res.data.entregadores) {
                setEntregadores(res.data.entregadores);
            }
            if (res.data.config_logistica) {
                setDeliverySettings(prev => ({ ...prev, ...res.data.config_logistica }));
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Erro ao carregar radar de entregas:', error);
            if (!isSilent) toast.error('Não foi possível carregar os dados de entrega.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    // Buscar configurações de logística e repasse
    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/pedidos/entregas/config');
            if (res.data) {
                setDeliverySettings(prev => ({
                    ...prev,
                    distribution_mode: res.data.distribution_mode || 'MANUAL',
                    payment_type: res.data.payment_type || 'FIXED',
                    fixed_fee: res.data.fixed_fee !== undefined ? res.data.fixed_fee : 7.00,
                    km_rate: res.data.km_rate !== undefined ? res.data.km_rate : 1.50,
                    base_fee: res.data.base_fee !== undefined ? res.data.base_fee : 5.00,
                    max_km: res.data.max_km !== undefined ? res.data.max_km : 15
                }));
            }
        } catch (error) {
            console.warn('Falha ao carregar configurações de entrega:', error);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Salvar configurações de logística
    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setSavingSettings(true);
        try {
            await api.put('/pedidos/entregas/config', {
                distribution_mode: deliverySettings.distribution_mode,
                payment_type: deliverySettings.payment_type,
                fixed_fee: parseFloat(deliverySettings.fixed_fee) || 0,
                km_rate: parseFloat(deliverySettings.km_rate) || 0,
                base_fee: parseFloat(deliverySettings.base_fee) || 0,
                max_km: parseFloat(deliverySettings.max_km) || 0
            });
            toast.success('Configurações de logística salvas com sucesso!');
            setSettingsModalOpen(false);
            fetchRadar(true);
        } catch (error) {
            console.error('Erro ao salvar configurações de entrega:', error);
            toast.error(error.response?.data?.message || 'Falha ao salvar configurações.');
        } finally {
            setSavingSettings(false);
        }
    };

    // Cálculo do Repasse ao Motoboy
    const calculateDriverPayout = useCallback((distanceKm) => {
        const km = parseFloat(distanceKm || 0);
        switch (deliverySettings.payment_type) {
            case 'NONE':
                return null;
            case 'FIXED':
                return parseFloat(deliverySettings.fixed_fee || 0);
            case 'DISTANCE':
                return parseFloat((km * (deliverySettings.km_rate || 0)).toFixed(2));
            case 'HYBRID':
                return parseFloat(((deliverySettings.base_fee || 0) + (km * (deliverySettings.km_rate || 0))).toFixed(2));
            default:
                return null;
        }
    }, [deliverySettings]);

    // Simulação do repasse no modal
    const getSimulationAmount = (km = 5.0) => {
        switch (deliverySettings.payment_type) {
            case 'NONE':
                return 0;
            case 'FIXED':
                return parseFloat(deliverySettings.fixed_fee || 0);
            case 'DISTANCE':
                return parseFloat(km * (deliverySettings.km_rate || 0));
            case 'HYBRID':
                return parseFloat(((deliverySettings.base_fee || 0) + (km * (deliverySettings.km_rate || 0))));
            default:
                return 0;
        }
    };

    useEffect(() => {
        fetchRadar(false);
    }, [fetchRadar]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchRadar(true);
        }, 8000); // Polling discreto a cada 8s

        return () => clearInterval(interval);
    }, [autoRefresh, fetchRadar]);

    // Separação dos Pedidos
    const pedidosEmRota = useMemo(() => {
        return pedidos.filter(p => p.status_entrega === 'Em Rota de Entrega');
    }, [pedidos]);

    const pedidosADespachar = useMemo(() => {
        return pedidos.filter(p => p.status_entrega !== 'Em Rota de Entrega');
    }, [pedidos]);

    // Filtragem por busca
    const pedidosFiltrados = useMemo(() => {
        const lista = activeTab === 'em_rota' ? pedidosEmRota : pedidosADespachar;
        if (!filtroTexto.trim()) return lista;

        const termo = filtroTexto.toLowerCase();
        return lista.filter(p =>
            p.id_pedido.toString().includes(termo) ||
            p.cliente?.nome?.toLowerCase().includes(termo) ||
            p.endereco?.logradouro?.toLowerCase().includes(termo) ||
            p.endereco?.bairro?.toLowerCase().includes(termo)
        );
    }, [activeTab, pedidosEmRota, pedidosADespachar, filtroTexto]);

    // Coordenadas Centrais Iniciais
    const defaultCenter = useMemo(() => {
        if (loja?.latitude && loja?.longitude) {
            return [parseFloat(loja.latitude), parseFloat(loja.longitude)];
        }
        const primeiroComCoord = pedidosEmRota.find(p => p.driver_lat && p.driver_lng);
        if (primeiroComCoord) {
            return [primeiroComCoord.driver_lat, primeiroComCoord.driver_lng];
        }
        return [-15.7801, -47.9292];
    }, [loja, pedidosEmRota]);

    // Focar no Pedido e Traçar Rota Real pelas Ruas (OSRM): Coleta (Motoboy ➔ Loja) e Entrega (Loja ➔ Cliente)
    const handleFocusOrder = async (pedido) => {
        setSelectedOrder(pedido);
        setPickupRouteGeometry(null);
        setPickupStats(null);
        setActiveRouteGeometry(null);
        setRouteStats(null);

        // 1. Ponto do Entregador (se estiver transmitindo coordenadas de GPS)
        let driverCoords = null;
        if (pedido.driver_lat && pedido.driver_lng) {
            driverCoords = [parseFloat(pedido.driver_lat), parseFloat(pedido.driver_lng)];
        }

        // 2. Ponto da Loja (onde o entregador vai buscar o pedido)
        let storeCoords = null;
        if (loja?.latitude && loja?.longitude) {
            storeCoords = [parseFloat(loja.latitude), parseFloat(loja.longitude)];
        }

        // 3. Ponto de Chegada: Destino do Cliente
        let endCoords = null;
        if (pedido.endereco?.latitude && pedido.endereco?.longitude) {
            endCoords = [parseFloat(pedido.endereco.latitude), parseFloat(pedido.endereco.longitude)];
        } else if (pedido.endereco?.logradouro || pedido.endereco?.cep) {
            // Se ainda não tem coordenadas no banco, geocodifica automaticamente com base no endereço cadastrado!
            try {
                toast.info('Localizando endereço do cliente nas ruas...');
                const geoRes = await api.post(`/pedidos/${pedido.id_pedido}/geocode`);
                if (geoRes.data?.latitude && geoRes.data?.longitude) {
                    endCoords = [parseFloat(geoRes.data.latitude), parseFloat(geoRes.data.longitude)];
                    pedido.endereco.latitude = geoRes.data.latitude;
                    pedido.endereco.longitude = geoRes.data.longitude;
                    setPedidos(prev => prev.map(item => item.id_pedido === pedido.id_pedido ? {
                        ...item,
                        endereco: { ...item.endereco, latitude: geoRes.data.latitude, longitude: geoRes.data.longitude }
                    } : item));
                    toast.success('Endereço localizado com sucesso!');
                }
            } catch (err) {
                console.warn('Falha na geocodificação automática:', err);
            }
        }

        // Helper para consultar trajetos reais nas ruas via OSRM
        const fetchStreetRoute = async (start, end) => {
            if (!start || !end) return null;
            try {
                const [startLat, startLng] = start;
                const [endLat, endLng] = end;
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
                const res = await fetch(osrmUrl);
                const data = await res.json();
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                    return {
                        geometry: latLngs,
                        stats: {
                            distanceKm: (route.distance / 1000).toFixed(1),
                            durationMin: Math.max(1, Math.round(route.duration / 60))
                        }
                    };
                }
            } catch (err) {
                console.warn('Falha OSRM:', err);
            }
            return {
                geometry: [start, end],
                stats: null
            };
        };

        setLoadingRoute(true);
        const allBounds = [];

        try {
            // 🟢 ETAPA 1: ROTA DE COLETA (ENTREGADOR ➔ LOJA PARA BUSCAR O PEDIDO)
            if (driverCoords && storeCoords) {
                const pickup = await fetchStreetRoute(driverCoords, storeCoords);
                if (pickup) {
                    setPickupRouteGeometry(pickup.geometry);
                    setPickupStats(pickup.stats);
                    allBounds.push(...pickup.geometry);
                }
            }

            // 🟢 ETAPA 2: ROTA DE ENTREGA (LOJA ➔ CLIENTE, ou Entregador ➔ Cliente se não houver loja)
            const deliveryOrigin = storeCoords || driverCoords;
            if (deliveryOrigin && endCoords) {
                const delivery = await fetchStreetRoute(deliveryOrigin, endCoords);
                if (delivery) {
                    setActiveRouteGeometry(delivery.geometry);
                    setRouteStats(delivery.stats);
                    allBounds.push(...delivery.geometry);
                }
            }

            // Enquadramento no Mapa
            if (allBounds.length > 0) {
                setFocusedBounds(allBounds);
            } else if (driverCoords) {
                setFocusedCoords(driverCoords);
                setFocusedBounds(null);
                setMapZoom(16);
            } else if (endCoords) {
                setFocusedCoords(endCoords);
                setFocusedBounds(null);
                setMapZoom(16);
            } else if (storeCoords) {
                setFocusedCoords(storeCoords);
                setFocusedBounds(null);
                setMapZoom(16);
            }

            if (!endCoords && !driverCoords) {
                toast.info('Destino do cliente ainda não possui coordenadas no mapa.');
            }
        } catch (err) {
            console.error('Falha ao calcular trajetos pelas ruas:', err);
        } finally {
            setLoadingRoute(false);
        }
    };

    // Centralizar na Loja
    const handleCenterStore = () => {
        if (loja?.latitude && loja?.longitude) {
            setFocusedCoords([parseFloat(loja.latitude), parseFloat(loja.longitude)]);
            setMapZoom(15);
        }
    };

    // Ação: Iniciar Despacho
    const handleOpenDispatchModal = async (pedido) => {
        setSelectedOrder(pedido);
        setDispatchedData(null);
        setMotoboyWhatsapp('');

        // Sempre busca lista fresca de entregadores autorizados
        try {
            setLoadingEntregadores(true);
            const res = await api.get('/pedidos/entregas/entregadores');
            if (res.data?.entregadores && Array.isArray(res.data.entregadores)) {
                setEntregadores(res.data.entregadores);
                if (res.data.entregadores.length > 0) {
                    setSelectedEntregadorId(res.data.entregadores[0].id_funcionario);
                } else {
                    setSelectedEntregadorId('');
                }
            }
        } catch (err) {
            console.warn('Erro ao carregar lista de entregadores:', err);
            if (entregadores && entregadores.length > 0) {
                setSelectedEntregadorId(entregadores[0].id_funcionario);
            }
        } finally {
            setLoadingEntregadores(false);
        }

        setDispatchModalOpen(true);
    };

    const handleConfirmDispatch = async () => {
        if (!selectedOrder) return;
        setIsSubmittingDispatch(true);

        try {
            const payload = {};
            if (selectedEntregadorId) {
                payload.id_funcionario = selectedEntregadorId;
            }

            const res = await api.put(`/pedidos/${selectedOrder.id_pedido}/deliver`, payload);
            const driverToken = res.data.driver_token || (res.data.link_motorista ? res.data.link_motorista.split('/').pop() : '');
            const driverLink = `${storeUrl}/driver/delivery/${driverToken}`;

            const resultado = {
                id_pedido: selectedOrder.id_pedido,
                driverToken,
                driverLink,
                pin: res.data.pin_cliente || selectedOrder.delivery_pin,
                cliente: selectedOrder.cliente?.nome,
                entregadorNome: res.data.entregador_nome,
                endereco: `${selectedOrder.endereco?.logradouro || ''}, ${selectedOrder.endereco?.numero || ''} - ${selectedOrder.endereco?.bairro || ''}`
            };

            setDispatchedData(resultado);
            toast.success(res.data.message || `Pedido #${selectedOrder.id_pedido} despachado com sucesso!`);
            navigator.clipboard.writeText(driverLink).catch(() => { });

            fetchRadar(true);
            setActiveTab('em_rota');
        } catch (error) {
            console.error('Erro ao despachar pedido:', error);
            toast.error(error.response?.data?.message || 'Falha ao despachar pedido.');
        } finally {
            setIsSubmittingDispatch(false);
        }
    };

    const handleCopyLink = (token) => {
        if (!token) return;
        const link = `${storeUrl}/driver/delivery/${token}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.info('Link do Entregador copiado!'))
            .catch(() => toast.error('Erro ao copiar link.'));
    };

    const handleSendWhatsapp = (pedido, targetPhone = '') => {
        const token = pedido.driver_token || dispatchedData?.driverToken;
        if (!token) return;

        const link = `${storeUrl}/driver/delivery/${token}`;
        const pin = pedido.delivery_pin || dispatchedData?.pin || '';
        const clienteNome = pedido.cliente?.nome || dispatchedData?.cliente || 'Cliente';
        const enderecoCompleto = pedido.endereco ? `${pedido.endereco.logradouro}, ${pedido.endereco.numero} - ${pedido.endereco.bairro}` : (dispatchedData?.endereco || '');

        const msg = encodeURIComponent(
            `🏍️ *NOVA ENTREGA - PEDIDO #${pedido.id_pedido || dispatchedData?.id_pedido}*\n\n` +
            `👤 *Cliente:* ${clienteNome}\n` +
            `📍 *Endereço:* ${enderecoCompleto}\n\n` +
            `📲 *Abra o link abaixo para iniciar o GPS e ver a rota:*\n` +
            `${link}\n\n` +
            (pin ? `🔑 *PIN de Confirmação:* Peça ao cliente o código de 4 dígitos para concluir a entrega no local.` : '')
        );

        const phoneDigits = targetPhone.replace(/\D/g, '');
        const waUrl = phoneDigits ? `https://wa.me/55${phoneDigits}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(waUrl, '_blank');
    };

    return (
        <Container fluid className="p-2 p-md-3" style={{ height: 'calc(100vh - 85px)', minHeight: '650px', position: 'relative' }}>
            <style>{`
                @keyframes uber-pulse {
                    0% { transform: scale(0.9); opacity: 0.9; }
                    70% { transform: scale(1.7); opacity: 0; }
                    100% { transform: scale(1.7); opacity: 0; }
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 16px;
                    box-shadow: 0 16px 36px rgba(0,0,0,0.15);
                    padding: 4px;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .leaflet-container {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #f8fafc;
                }
                /* Scrollbar discreta Uber */
                .uber-scroll::-webkit-scrollbar {
                    width: 5px;
                }
                .uber-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                /* Efeito Minimalista Estilo Uber / 99 / iFood (Sem Marca d'água e 100% Livre de API Key) */
                .uber-minimal-tiles .leaflet-tile {
                    filter: grayscale(85%) contrast(92%) brightness(103%);
                }
            `}</style>

            {/* CONTAINER DO MAPA GLOBO TOTAL (ESTILO 99 / UBER / IFOOD) */}
            <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

                {/* 1. MAPA LEAFLET MINIMALISTA UBER (SEM MARCA D'ÁGUA) */}
                <MapContainer
                    center={defaultCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    scrollWheelZoom={true}
                    zoomControl={false} // Desabilita o controle feio padrão; botões flutuantes cuidam disso
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className={mapStyle === 'uber' ? 'uber-minimal-tiles' : ''}
                    />

                    <MapController centerCoords={focusedCoords || defaultCenter} zoomLevel={mapZoom} bounds={focusedBounds} />

                    {/* MARCADOR DA LOJA */}
                    {loja?.latitude && loja?.longitude && (
                        <Marker
                            position={[parseFloat(loja.latitude), parseFloat(loja.longitude)]}
                            icon={getStoreIcon(loja.nome || 'Origem')}
                        >
                            <Popup>
                                <div className="p-1">
                                    <span className="badge bg-dark mb-1">Ponto de Partida</span>
                                    <h6 className="fw-bold mb-1 text-dark">{loja.nome || 'Sua Loja'}</h6>
                                    <p className="text-muted small mb-0">
                                        {loja.logradouro}, {loja.numero} - {loja.bairro}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* MARCADORES DOS ENTREGADORES EM ROTA */}
                    {pedidosEmRota.map((p) => {
                        if (!p.driver_lat || !p.driver_lng) return null;

                        return (
                            <Marker
                                key={`driver-${p.id_pedido}`}
                                position={[p.driver_lat, p.driver_lng]}
                                icon={getDriverIcon(p.id_pedido, true)}
                                eventHandlers={{
                                    click: () => handleFocusOrder(p)
                                }}
                            >
                                <Popup>
                                    <div className="p-2" style={{ minWidth: '220px' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="badge" style={{ backgroundColor: '#0084fb' }}>Motoboy em Rota</span>
                                            <span className="fw-bold small text-muted">#{p.id_pedido}</span>
                                        </div>
                                        <h6 className="fw-bold mb-1 text-dark">Destino: {p.cliente?.nome}</h6>
                                        <p className="text-muted small mb-2">
                                            <i className="bi bi-geo-alt text-primary me-1"></i>
                                            {p.endereco?.logradouro}, {p.endereco?.numero}
                                        </p>
                                        {p.delivery_pin && (
                                            <div className="alert py-1 px-2 small fw-bold mb-2 text-center" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                                                PIN Cliente: <span className="text-danger fs-6">{p.delivery_pin}</span>
                                            </div>
                                        )}
                                        <button
                                            className="btn btn-sm w-100 rounded-pill py-1 small fw-bold text-white shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)', border: 'none' }}
                                            onClick={() => handleCopyLink(p.driver_token)}
                                        >
                                            <i className="bi bi-link-45deg me-1"></i> Copiar Link
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* MARCADORES DOS CLIENTES (DESTINO) */}
                    {pedidos.map((p) => {
                        if (!p.endereco?.latitude || !p.endereco?.longitude) return null;

                        return (
                            <Marker
                                key={`dest-${p.id_pedido}`}
                                position={[parseFloat(p.endereco.latitude), parseFloat(p.endereco.longitude)]}
                                icon={getCustomerIcon(p.id_pedido)}
                                eventHandlers={{
                                    click: () => handleFocusOrder(p)
                                }}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <span className="badge text-white mb-1" style={{ backgroundColor: '#0084fb' }}>Destino (Cliente)</span>
                                        <h6 className="fw-bold mb-1 text-dark">Pedido #{p.id_pedido}</h6>
                                        <p className="small mb-1 fw-semibold text-dark">{p.cliente?.nome}</p>
                                        <p className="text-muted small mb-1">
                                            {p.endereco.logradouro}, {p.endereco.numero} - {p.endereco.bairro}
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                            <span className="badge bg-light text-dark border">{p.status_entrega}</span>
                                            {p.delivery_pin && <span className="small text-danger fw-bold">PIN: {p.delivery_pin}</span>}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* 🟢 1. LINHA DE ROTA DE COLETA: ENTREGADOR ➔ LOJA (PARA BUSCAR O PEDIDO) */}
                    {pickupRouteGeometry && pickupRouteGeometry.length > 0 && (
                        <>
                            {/* Brilho Suave Ciano/Azul */}
                            <Polyline
                                positions={pickupRouteGeometry}
                                color="#38bdf8"
                                weight={8}
                                opacity={0.4}
                                lineCap="round"
                                lineJoin="round"
                            />
                            {/* Linha Tracejada Estilizada de Deslocamento até a Loja */}
                            <Polyline
                                positions={pickupRouteGeometry}
                                color="#0284c7"
                                weight={5}
                                dashArray="7, 9"
                                opacity={1}
                                lineCap="round"
                                lineJoin="round"
                            >
                                <Tooltip sticky>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                                        <i className="bi bi-bicycle me-1"></i> Rota de Coleta: Entregador ➔ Loja ({pickupStats?.distanceKm || '~'} km)
                                    </div>
                                </Tooltip>
                            </Polyline>
                        </>
                    )}

                    {/* 🟢 2. LINHA DE ROTA DE ENTREGA: LOJA ➔ CLIENTE */}
                    {activeRouteGeometry && activeRouteGeometry.length > 0 && (
                        <>
                            {/* Brilho da Rota (Aura Azul Claro Suave) */}
                            <Polyline
                                positions={activeRouteGeometry}
                                color="#60a5fa"
                                weight={8}
                                opacity={0.45}
                                lineCap="round"
                                lineJoin="round"
                            />
                            {/* Linha Central das Ruas (Azul Ararinha Vibrante) */}
                            <Polyline
                                positions={activeRouteGeometry}
                                color="#0084fb"
                                weight={5}
                                opacity={1}
                                lineCap="round"
                                lineJoin="round"
                            >
                                <Tooltip sticky>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0084fb' }}>
                                        <i className="bi bi-geo-alt-fill me-1"></i> Rota de Entrega: Loja ➔ Cliente ({routeStats?.distanceKm || '~'} km)
                                    </div>
                                </Tooltip>
                            </Polyline>
                        </>
                    )}
                </MapContainer>

                {/* 2. BARRA FLUTUANTE SUPERIOR DIREITA: RADAR & CONTROLES */}
                <div style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {/* Botão de Toggle da Barra Lateral */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn btn-white shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 6px 20px rgba(0, 132, 251, 0.12)',
                            color: '#0084fb',
                            border: '1px solid #e0f0fe'
                        }}
                        title={sidebarOpen ? "Ocultar Painel" : "Mostrar Painel"}
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-list'} fs-5`}></i>
                    </button>

                    {/* Botão Centralizar na Loja */}
                    <button
                        onClick={handleCenterStore}
                        className="btn btn-white shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 6px 20px rgba(0, 132, 251, 0.12)',
                            color: '#0084fb',
                            border: '1px solid #e0f0fe'
                        }}
                        title="Centralizar na Loja"
                    >
                        <i className="bi bi-shop fs-5"></i>
                    </button>

                    {/* Botão Alternar Estilo Uber / Cores Padrão */}
                    <button
                        onClick={() => setMapStyle(mapStyle === 'uber' ? 'padrao' : 'uber')}
                        className="btn btn-white shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 6px 20px rgba(0, 132, 251, 0.12)',
                            color: '#0084fb',
                            border: '1px solid #e0f0fe'
                        }}
                        title={mapStyle === 'uber' ? "Modo Minimalista (Clique para Cores Padrão)" : "Modo Cores Padrão (Clique para Modo Minimalista)"}
                    >
                        <i className={`bi ${mapStyle === 'uber' ? 'bi-palette' : 'bi-palette-fill'} fs-5`}></i>
                    </button>

                    {/* Botão de Configurações de Logística e Repasse */}
                    <button
                        onClick={() => setSettingsModalOpen(true)}
                        className="btn btn-white shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 6px 20px rgba(0, 132, 251, 0.12)',
                            color: '#0084fb',
                            border: '1px solid #e0f0fe'
                        }}
                        title="Configurações de Logística & Repasse"
                    >
                        <i className="bi bi-gear-fill fs-5"></i>
                    </button>

                    {/* Pill de Status Live Radar */}
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: autoRefresh ? '#10b981' : '#94a3b8',
                            display: 'inline-block'
                        }}></span>
                        <span className="small fw-bold text-dark" style={{ fontSize: '12px' }}>
                            {autoRefresh ? 'GPS Ao Vivo' : 'Pausado'}
                        </span>
                        <Form.Check
                            type="switch"
                            id="uber-radar-switch"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="ms-1 mb-0"
                        />
                    </div>
                </div>

                {/* 3. GAVETA FLUTUANTE LATERAL ESQUERDA (ESTILO UBER / 99 / IFOOD DISPATCH) */}
                {sidebarOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        bottom: '18px',
                        width: '380px',
                        maxWidth: 'calc(100% - 36px)',
                        zIndex: 1000,
                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(18px)',
                        borderRadius: '20px',
                        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* TOPO DA GAVETA: TÍTULO & ABAS PILS */}
                        <div className="p-3 pb-2 border-bottom border-light">
                            <div className="d-flex justify-content-between align-items-center mb-2.5">
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '10px',
                                        backgroundColor: '#0084fb',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 10px rgba(0, 132, 251, 0.3)'
                                    }}>
                                        <i className="bi bi-geo-alt-fill" style={{ fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px', letterSpacing: '-0.3px' }}>
                                            Radar de Entregas
                                        </h6>
                                        <span className="text-muted" style={{ fontSize: '11px' }}>
                                            {pedidosEmRota.length} na rua • {pedidosADespachar.length} a despachar
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => fetchRadar(false)}
                                    className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center text-muted"
                                    style={{ width: '32px', height: '32px' }}
                                    title="Atualizar dados"
                                >
                                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                                </button>
                            </div>

                            {/* BADGES INFORMATIVAS: MODO DE DISTRIBUIÇÃO & FORMA DE REPASSE */}
                            <div className="d-flex align-items-center gap-1.5 mb-2.5 flex-wrap">
                                <span
                                    onClick={() => setSettingsModalOpen(true)}
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: '8px',
                                        backgroundColor: deliverySettings.distribution_mode === 'QUEUE' ? '#eff6ff' : '#f0f7ff',
                                        color: deliverySettings.distribution_mode === 'QUEUE' ? '#0084fb' : '#0284c7',
                                        border: '1px solid #bae0fd',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        cursor: 'pointer'
                                    }}
                                    title="Modo de distribuição atual. Clique para alterar."
                                >
                                    <i className={`bi ${deliverySettings.distribution_mode === 'QUEUE' ? 'bi-broadcast' : 'bi-person-check'}`}></i>
                                    {deliverySettings.distribution_mode === 'QUEUE' ? 'Fila Aberta' : 'Despacho Manual'}
                                </span>

                                <span
                                    onClick={() => setSettingsModalOpen(true)}
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: '8px',
                                        backgroundColor: deliverySettings.payment_type === 'NONE' ? '#f8fafc' : '#fef3c7',
                                        color: deliverySettings.payment_type === 'NONE' ? '#64748b' : '#b45309',
                                        border: deliverySettings.payment_type === 'NONE' ? '1px solid #e2e8f0' : '1px solid #fde68a',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        cursor: 'pointer'
                                    }}
                                    title="Regra de repasse ao motoboy. Clique para alterar."
                                >
                                    <i className="bi bi-cash-coin"></i>
                                    {deliverySettings.payment_type === 'NONE' && 'Sem Repasse'}
                                    {deliverySettings.payment_type === 'FIXED' && `R$ ${parseFloat(deliverySettings.fixed_fee || 0).toFixed(2)}/entrega`}
                                    {deliverySettings.payment_type === 'DISTANCE' && `R$ ${parseFloat(deliverySettings.km_rate || 0).toFixed(2)}/km`}
                                    {deliverySettings.payment_type === 'HYBRID' && `R$ ${parseFloat(deliverySettings.base_fee || 0).toFixed(2)} + R$ ${parseFloat(deliverySettings.km_rate || 0).toFixed(2)}/km`}
                                </span>
                            </div>

                            {/* ABAS ESTILO UBER (PILL SWITCHER AZUL & BRANCO) */}
                            <div style={{
                                backgroundColor: '#f0f7ff',
                                padding: '3px',
                                borderRadius: '12px',
                                display: 'flex',
                                gap: '3px',
                                border: '1px solid #e0f0fe'
                            }}>
                                <button
                                    onClick={() => setActiveTab('em_rota')}
                                    style={{
                                        flex: 1,
                                        padding: '7px 0',
                                        border: 'none',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        backgroundColor: activeTab === 'em_rota' ? '#0084fb' : 'transparent',
                                        color: activeTab === 'em_rota' ? '#ffffff' : '#0284c7',
                                        boxShadow: activeTab === 'em_rota' ? '0 2px 8px rgba(0, 132, 251, 0.35)' : 'none',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <i className="bi bi-bicycle"></i> Em Rota
                                    <span style={{
                                        backgroundColor: activeTab === 'em_rota' ? '#ffffff' : '#bae0fd',
                                        color: activeTab === 'em_rota' ? '#0084fb' : '#0369a1',
                                        fontWeight: 800,
                                        borderRadius: '9999px',
                                        fontSize: '10px',
                                        padding: '1px 6px'
                                    }}>{pedidosEmRota.length}</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('a_despachar')}
                                    style={{
                                        flex: 1,
                                        padding: '7px 0',
                                        border: 'none',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        backgroundColor: activeTab === 'a_despachar' ? '#0084fb' : 'transparent',
                                        color: activeTab === 'a_despachar' ? '#ffffff' : '#0284c7',
                                        boxShadow: activeTab === 'a_despachar' ? '0 2px 8px rgba(0, 132, 251, 0.35)' : 'none',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <i className="bi bi-box-seam"></i> A Despachar
                                    <span style={{
                                        backgroundColor: activeTab === 'a_despachar' ? '#ffffff' : '#bae0fd',
                                        color: activeTab === 'a_despachar' ? '#0084fb' : '#0369a1',
                                        fontWeight: 800,
                                        borderRadius: '9999px',
                                        fontSize: '10px',
                                        padding: '1px 6px'
                                    }}>{pedidosADespachar.length}</span>
                                </button>
                            </div>

                            {/* BUSCADOR MINIMALISTA */}
                            <div className="mt-2.5">
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e0f0fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px 10px',
                                    boxShadow: '0 2px 6px rgba(0, 132, 251, 0.04)'
                                }}>
                                    <i className="bi bi-search text-primary me-2" style={{ fontSize: '13px' }}></i>
                                    <input
                                        type="text"
                                        placeholder="Buscar por Pedido # ou Cliente..."
                                        value={filtroTexto}
                                        onChange={(e) => setFiltroTexto(e.target.value)}
                                        style={{
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            outline: 'none',
                                            fontSize: '12px',
                                            width: '100%',
                                            color: '#0f172a'
                                        }}
                                    />
                                    {filtroTexto && (
                                        <button
                                            onClick={() => setFiltroTexto('')}
                                            style={{ border: 'none', background: 'none', color: '#94a3b8', padding: 0 }}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LISTAGEM SCROLLÁVEL DE CARDS UBER */}
                        <div className="uber-scroll flex-grow-1 p-2" style={{ overflowY: 'auto' }}>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="dark" size="sm" />
                                    <p className="text-muted small mt-2" style={{ fontSize: '11px' }}>Sincronizando radar...</p>
                                </div>
                            ) : pedidosFiltrados.length === 0 ? (
                                <div className="text-center py-5 px-3">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        backgroundColor: '#f1f5f9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 10px auto',
                                        color: '#94a3b8'
                                    }}>
                                        <i className={`bi ${activeTab === 'em_rota' ? 'bi-bicycle' : 'bi-check2'}`} style={{ fontSize: '20px' }}></i>
                                    </div>
                                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '13px' }}>
                                        {activeTab === 'em_rota' ? 'Sem entregadores em rota' : 'Nenhum pedido pendente'}
                                    </h6>
                                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                        {activeTab === 'em_rota' ? 'Novas entregas aparecerão aqui automaticamente.' : 'Tudo despachado!'}
                                    </p>
                                </div>
                            ) : (
                                pedidosFiltrados.map((p) => {
                                    const isSelected = selectedOrder?.id_pedido === p.id_pedido;
                                    const hasGps = !!(p.driver_lat && p.driver_lng);

                                    return (
                                        <div
                                            key={p.id_pedido}
                                            onClick={() => handleFocusOrder(p)}
                                            style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '14px',
                                                padding: '12px',
                                                marginBottom: '8px',
                                                border: isSelected ? '2px solid #0084fb' : '1px solid #f1f5f9',
                                                boxShadow: isSelected ? '0 8px 24px rgba(0, 132, 251, 0.16)' : '0 2px 6px rgba(0,0,0,0.02)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {/* TOPO DO ITEM */}
                                            <div className="d-flex justify-content-between align-items-center mb-1.5">
                                                <div className="d-flex align-items-center gap-1.5">
                                                    <span style={{
                                                        backgroundColor: '#0084fb',
                                                        color: '#ffffff',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        padding: '1px 7px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        #{p.id_pedido}
                                                    </span>
                                                    <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                                                        {p.cliente?.nome}
                                                    </span>
                                                </div>

                                                {p.is_out_for_delivery ? (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px',
                                                        backgroundColor: hasGps ? '#dcfce7' : '#fef9c3',
                                                        color: hasGps ? '#15803d' : '#a16207',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: hasGps ? '#16a34a' : '#ca8a04' }}></span>
                                                        {hasGps ? 'GPS Ativo' : 'Aguardando'}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px',
                                                        backgroundColor: '#f1f5f9',
                                                        color: '#475569'
                                                    }}>
                                                        {p.status_entrega}
                                                    </span>
                                                )}
                                            </div>

                                            {/* ENDEREÇO */}
                                            <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: '11px' }}>
                                                <i className="bi bi-geo-alt text-primary" style={{ fontSize: '11px' }}></i>
                                                <span className="text-truncate">
                                                    {p.endereco?.logradouro ? `${p.endereco.logradouro}, ${p.endereco.numero || 'S/N'} - ${p.endereco.bairro}` : 'Endereço não informado'}
                                                </span>
                                            </div>

                                            {/* DETALHES & PIN */}
                                            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light" style={{ fontSize: '11px' }}>
                                                <span className="text-muted">
                                                    Total: <strong className="text-dark">R$ {parseFloat(p.valor_total || 0).toFixed(2)}</strong>
                                                </span>

                                                {p.delivery_pin && (
                                                    <span style={{
                                                        backgroundColor: '#fee2e2',
                                                        color: '#b91c1c',
                                                        fontWeight: 800,
                                                        padding: '1px 6px',
                                                        borderRadius: '6px',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        PIN: {p.delivery_pin}
                                                    </span>
                                                )}
                                            </div>

                                            {/* BOTÕES DE AÇÃO UBER */}
                                            <div className="d-flex gap-1.5 mt-2 pt-2 border-top border-light">
                                                {p.is_out_for_delivery ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyLink(p.driver_token);
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px 0',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#f0f7ff',
                                                                border: '1px solid #bae0fd',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                color: '#0084fb',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <i className="bi bi-link-45deg"></i> Copiar Link
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendWhatsapp(p);
                                                            }}
                                                            style={{
                                                                width: '32px',
                                                                height: '28px',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#22c55e',
                                                                border: 'none',
                                                                color: '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            title="WhatsApp"
                                                        >
                                                            <i className="bi bi-whatsapp" style={{ fontSize: '13px' }}></i>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDispatchModal(p);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '7px 0',
                                                            borderRadius: '8px',
                                                            background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)',
                                                            border: 'none',
                                                            color: '#ffffff',
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            boxShadow: '0 4px 12px rgba(0, 132, 251, 0.3)'
                                                        }}
                                                    >
                                                        <i className="bi bi-bicycle"></i> Despachar Entregador
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* RODAPÉ DISCRETO DA GAVETA */}
                        <div className="p-2 text-center text-muted border-top border-light" style={{ fontSize: '10px' }}>
                            Atualizado às {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>
                )}

                {/* 4. CARD FLUTUANTE DA ROTA ATIVA PELAS RUAS (ESTILO UBER / WAZE) */}
                {selectedOrder && (activeRouteGeometry || pickupRouteGeometry) && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(16px)',
                        color: '#0f172a',
                        padding: '10px 18px',
                        borderRadius: '18px',
                        boxShadow: '0 16px 36px rgba(0, 132, 251, 0.22)',
                        border: '1.5px solid rgba(0, 132, 251, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        maxWidth: '94%',
                        flexWrap: 'wrap'
                    }}>
                        <div className="d-flex align-items-center gap-2">
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                flexShrink: 0,
                                boxShadow: '0 4px 10px rgba(0, 132, 251, 0.35)'
                            }}>
                                <i className="bi bi-cursor-fill" style={{ fontSize: '15px' }}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#0084fb', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>
                                    Trajeto #{selectedOrder.id_pedido}
                                </div>
                                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '13px', maxWidth: '170px' }}>
                                    {selectedOrder.cliente?.nome || 'Cliente'}
                                </div>
                            </div>
                        </div>

                        {/* ETAPA 1: Entregador ➔ Loja (Coleta/Buscar Pedido) */}
                        {pickupStats && (
                            <div className="d-flex align-items-center gap-2 border-start border-light ps-3">
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    backgroundColor: '#e0f2fe',
                                    color: '#0284c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px'
                                }}>
                                    <i className="bi bi-bicycle"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>
                                        1. Buscar na Loja
                                    </div>
                                    <div className="d-flex align-items-baseline gap-1">
                                        <span className="fw-bold" style={{ fontSize: '13px', color: '#0284c7' }}>
                                            {pickupStats.distanceKm} km
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '10px' }}>
                                            (~{pickupStats.durationMin} min)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ETAPA 2: Loja ➔ Cliente (Entrega do Pedido) */}
                        {routeStats && (
                            <div className="d-flex align-items-center gap-2 border-start border-light ps-3">
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    backgroundColor: '#eff6ff',
                                    color: '#0084fb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px'
                                }}>
                                    <i className="bi bi-geo-alt-fill"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', color: '#0084fb', fontWeight: 800, textTransform: 'uppercase' }}>
                                        2. Levar ao Cliente
                                    </div>
                                    <div className="d-flex align-items-baseline gap-1">
                                        <span className="fw-bold" style={{ fontSize: '13px', color: '#0084fb' }}>
                                            {routeStats.distanceKm} km
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '10px' }}>
                                            (~{routeStats.durationMin} min)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Circuito Total & Repasse Estimado */}
                        {routeStats && (
                            <div className="d-flex align-items-center gap-3 border-start border-light ps-3">
                                {pickupStats && (
                                    <div>
                                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>CIRCUITO TOTAL</div>
                                        <div className="fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>
                                            {(parseFloat(pickupStats.distanceKm) + parseFloat(routeStats.distanceKm)).toFixed(1)} km
                                        </div>
                                    </div>
                                )}
                                {calculateDriverPayout(routeStats.distanceKm) !== null && (
                                    <div>
                                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>REPASSE</div>
                                        <div className="fw-bold" style={{ fontSize: '14px', color: '#10b981' }}>
                                            R$ {calculateDriverPayout(routeStats.distanceKm).toFixed(2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {loadingRoute && (
                            <div className="d-flex align-items-center gap-2 border-start border-light ps-3">
                                <Spinner size="sm" animation="border" variant="primary" />
                                <span style={{ fontSize: '11px', color: '#0084fb' }}>Calculando ruas...</span>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setSelectedOrder(null);
                                setActiveRouteGeometry(null);
                                setRouteStats(null);
                                setPickupRouteGeometry(null);
                                setPickupStats(null);
                                setFocusedBounds(null);
                            }}
                            className="btn btn-sm btn-light rounded-circle p-0 ms-1 d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '26px', height: '26px' }}
                            title="Fechar trajeto"
                        >
                            <i className="bi bi-x-lg" style={{ fontSize: '12px' }}></i>
                        </button>
                    </div>
                )}

                {/* 5. LEGENDA FLUTUANTE INFERIOR DIREITA (DISCRETA E ELEGANTE) */}
                <div style={{
                    position: 'absolute',
                    bottom: '18px',
                    right: '18px',
                    zIndex: 1000,
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    boxShadow: '0 6px 20px rgba(0, 132, 251, 0.1)',
                    border: '1px solid #e0f0fe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#475569'
                }}>
                    <div className="d-flex align-items-center gap-1.5">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e3a8a' }}></span>
                        <span className="fw-semibold">Loja</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0084fb' }}></span>
                        <span className="fw-semibold">Motoboy</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                        <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #0284c7' }}></span>
                        <span className="fw-semibold text-info" style={{ color: '#0284c7' }}>Rota Buscar</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                        <span style={{ width: '12px', height: '2.5px', backgroundColor: '#0084fb', borderRadius: '1px' }}></span>
                        <span className="fw-semibold text-primary">Rota Entregar</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                        <img src="/images/ararinha-pin.png" alt="Destino" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                        <span className="fw-bold text-primary">Destino</span>
                    </div>
                </div>
            </div>

            {/* MODAL DE DESPACHO E LINK DO ENTREGADOR (ESTILO MINIMALISTA) */}
            <Modal
                show={dispatchModalOpen}
                onHide={() => setDispatchModalOpen(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-dark" style={{ fontSize: '16px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0, 132, 251, 0.35)'
                        }}>
                            <i className="bi bi-bicycle"></i>
                        </div>
                        Despachar Pedido #{selectedOrder?.id_pedido}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-3">
                    {!dispatchedData ? (
                        <div>
                            <p className="text-muted small mb-3">
                                Selecione quem realizará a entrega. O sistema enviará o trajeto para o aplicativo do entregador e gerará o PIN de segurança para o cliente.
                            </p>

                            {/* Resumo do Pedido */}
                            <div style={{ backgroundColor: '#f0f7ff', padding: '12px', borderRadius: '12px', border: '1px solid #bae0fd' }} className="mb-3">
                                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12px' }}>
                                    <span className="text-muted">Cliente:</span>
                                    <span className="fw-bold text-dark">{selectedOrder?.cliente?.nome}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12px' }}>
                                    <span className="text-muted">Endereço:</span>
                                    <span className="fw-bold text-dark text-end" style={{ maxWidth: '220px' }}>
                                        {selectedOrder?.endereco?.logradouro}, {selectedOrder?.endereco?.numero}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between pt-1 border-top" style={{ fontSize: '12px' }}>
                                    <span className="text-muted">Total:</span>
                                    <span className="fw-bold text-primary">R$ {parseFloat(selectedOrder?.valor_total || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* SELETOR DE ENTREGADOR (DESPACHO MANUAL / APP ANDROID) */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center justify-content-between mb-1.5">
                                    <Form.Label className="small fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                                        <i className="bi bi-person-badge-fill text-primary"></i>
                                        Quem vai realizar a entrega?
                                    </Form.Label>
                                    <span className="badge rounded-pill" style={{
                                        backgroundColor: deliverySettings.distribution_mode === 'MANUAL' ? '#e0f2fe' : '#f1f5f9',
                                        color: deliverySettings.distribution_mode === 'MANUAL' ? '#0284c7' : '#64748b',
                                        fontSize: '10px',
                                        fontWeight: '700'
                                    }}>
                                        {deliverySettings.distribution_mode === 'MANUAL' ? 'Despacho Manual Ativo' : 'Fila / Avulso'}
                                    </span>
                                </div>

                                <Form.Select
                                    value={selectedEntregadorId}
                                    onChange={(e) => setSelectedEntregadorId(e.target.value)}
                                    className="form-select shadow-none"
                                    style={{
                                        borderColor: '#0084fb',
                                        fontSize: '13px',
                                        borderRadius: '10px',
                                        padding: '9px 12px'
                                    }}
                                    disabled={loadingEntregadores}
                                >
                                    {entregadores && entregadores.length > 0 ? (
                                        <>
                                            {entregadores.map((ent) => (
                                                <option key={ent.id_funcionario} value={ent.id_funcionario}>
                                                    🛵 {ent.nome_completo} ({ent.cargo}) — App de Entrega
                                                </option>
                                            ))}
                                            <option value="">🌐 Motoboy Externo / Avulso (Sem atribuição ao App)</option>
                                        </>
                                    ) : (
                                        <option value="">
                                            {loadingEntregadores ? 'Carregando entregadores autorizados...' : '🌐 Motoboy Externo (Nenhum com app cadastrado)'}
                                        </option>
                                    )}
                                </Form.Select>

                                {selectedEntregadorId ? (
                                    <div style={{
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '10px',
                                        padding: '9px 12px',
                                        marginTop: '8px'
                                    }} className="d-flex align-items-center gap-2">
                                        <i className="bi bi-phone text-primary fs-5"></i>
                                        <div style={{ fontSize: '11.5px', color: '#1e40af', lineHeight: '1.3' }}>
                                            Este pedido será atribuído diretamente ao <strong>App Android do entregador</strong> na aba "Minhas Entregas".
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        padding: '9px 12px',
                                        marginTop: '8px'
                                    }} className="d-flex align-items-center gap-2">
                                        <i className="bi bi-link-45deg text-secondary fs-5"></i>
                                        <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.3' }}>
                                            Despacho avulso: você poderá <strong>copiar o link de GPS web</strong> ou enviar pelo WhatsApp.
                                        </div>
                                    </div>
                                )}

                                {(!entregadores || entregadores.length === 0) && !loadingEntregadores && (
                                    <div className="small text-muted mt-2 p-2 rounded" style={{ fontSize: '10.5px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                                        <i className="bi bi-info-circle text-warning me-1"></i>
                                        Para listar mais entregadores, certifique-se de que o funcionário esteja ativo e que seu <strong>Cargo</strong> tenha a permissão <code>Aplicativo do Entregador (DRIVER_APP_ACCESS)</code>.
                                    </div>
                                )}
                            </div>

                            <button
                                className="w-100 btn py-2.5 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 text-white shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)', border: 'none' }}
                                onClick={handleConfirmDispatch}
                                disabled={isSubmittingDispatch}
                            >
                                {isSubmittingDispatch ? (
                                    <>
                                        <Spinner size="sm" animation="border" />
                                        Gerando Link & Despachando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2-circle fs-5"></i>
                                        Confirmar Despacho
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="text-center mb-3">
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 8px auto'
                                }}>
                                    <i className="bi bi-check-lg fs-4"></i>
                                </div>
                                <h6 className="fw-bold text-dark mb-0">Pedido Despachado!</h6>
                                <p className="text-muted small">
                                    {dispatchedData.entregadorNome 
                                        ? `Atribuído para ${dispatchedData.entregadorNome}`
                                        : 'Envie o link para o motoboy iniciar o trajeto:'}
                                </p>
                            </div>

                            {/* BANNER DO ENTREGADOR ATRIBUÍDO */}
                            {dispatchedData.entregadorNome && (
                                <div style={{
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }} className="mb-3 d-flex align-items-center gap-2.5">
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#22c55e',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <i className="bi bi-bicycle fs-6"></i>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#166534' }}>
                                        <div>Entregador: <strong>{dispatchedData.entregadorNome}</strong></div>
                                        <div style={{ fontSize: '11px', color: '#15803d' }}>
                                            O pedido já está na aba <strong>"Minhas Entregas"</strong> do App Android!
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LINK DO ENTREGADOR */}
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-secondary">Link do Entregador (GPS):</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        readOnly
                                        value={dispatchedData.driverLink}
                                        className="bg-light font-monospace small"
                                    />
                                    <Button
                                        variant="primary"
                                        style={{ backgroundColor: '#0084fb', borderColor: '#0084fb' }}
                                        onClick={() => handleCopyLink(dispatchedData.driverToken)}
                                    >
                                        <i className="bi bi-clipboard me-1"></i> Copiar
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            {/* PIN DE SEGURANÇA */}
                            {dispatchedData.pin && (
                                <div style={{
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '12px',
                                    padding: '10px'
                                }} className="mb-3 text-center">
                                    <span className="text-muted d-block" style={{ fontSize: '11px' }}>PIN do Cliente:</span>
                                    <span className="fs-3 fw-bold text-danger letter-spacing-2">{dispatchedData.pin}</span>
                                    <span className="d-block text-muted" style={{ fontSize: '10px' }}>
                                        Solicite este código de 4 dígitos na entrega.
                                    </span>
                                </div>
                            )}

                            {/* DISPARO DIRETO WHATSAPP */}
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-secondary">Enviar direto no WhatsApp:</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Ex: (11) 99999-9999 (Opcional)"
                                        value={motoboyWhatsapp}
                                        onChange={(e) => setMotoboyWhatsapp(e.target.value)}
                                        className="small"
                                    />
                                    <Button
                                        variant="success"
                                        className="fw-bold d-flex align-items-center gap-1"
                                        onClick={() => handleSendWhatsapp(dispatchedData, motoboyWhatsapp)}
                                    >
                                        <i className="bi bi-whatsapp"></i> Enviar
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            <button
                                className="w-100 btn btn-light py-2 rounded-pill border text-secondary fw-semibold"
                                onClick={() => setDispatchModalOpen(false)}
                            >
                                Concluir e Fechar
                            </button>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* MODAL DE CONFIGURAÇÕES DE LOGÍSTICA & ENTREGADORES */}
            <Modal
                show={settingsModalOpen}
                onHide={() => setSettingsModalOpen(false)}
                size="lg"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-dark" style={{ fontSize: '18px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0, 132, 251, 0.35)'
                        }}>
                            <i className="bi bi-gear-fill" style={{ fontSize: '18px' }}></i>
                        </div>
                        Configurações de Logística & Entregas
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-3">
                    <p className="text-muted small mb-4">
                        Configure a dinâmica de despacho dos pedidos e as regras de remuneração / repasse aos entregadores parceiros ou próprios.
                    </p>

                    {/* SEÇÃO 1: MODO DE DISTRIBUIÇÃO */}
                    <div className="mb-4">
                        <label className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                            <i className="bi bi-diagram-3-fill text-primary"></i> 1. Modo de Distribuição das Entregas
                        </label>
                        <div className="row g-2">
                            {/* Opção A: Despacho Manual */}
                            <div className="col-12 col-md-6">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, distribution_mode: 'MANUAL' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '14px',
                                        padding: '14px',
                                        border: deliverySettings.distribution_mode === 'MANUAL' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.distribution_mode === 'MANUAL' ? '#f0f7ff' : '#ffffff',
                                        transition: 'all 0.2s ease',
                                        height: '100%'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                backgroundColor: deliverySettings.distribution_mode === 'MANUAL' ? '#0084fb' : '#f1f5f9',
                                                color: deliverySettings.distribution_mode === 'MANUAL' ? '#ffffff' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <i className="bi bi-person-check fs-6"></i>
                                            </div>
                                            <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Despacho Manual / Direcionado</span>
                                        </div>
                                        <input
                                            type="radio"
                                            name="distribution_mode"
                                            checked={deliverySettings.distribution_mode === 'MANUAL'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, distribution_mode: 'MANUAL' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                        A loja escolhe e direciona cada pedido individualmente para um entregador específico (via link direto ou WhatsApp).
                                    </p>
                                </div>
                            </div>

                            {/* Opção B: Fila Aberta */}
                            <div className="col-12 col-md-6">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, distribution_mode: 'QUEUE' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '14px',
                                        padding: '14px',
                                        border: deliverySettings.distribution_mode === 'QUEUE' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.distribution_mode === 'QUEUE' ? '#f0f7ff' : '#ffffff',
                                        transition: 'all 0.2s ease',
                                        height: '100%'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                backgroundColor: deliverySettings.distribution_mode === 'QUEUE' ? '#0084fb' : '#f1f5f9',
                                                color: deliverySettings.distribution_mode === 'QUEUE' ? '#ffffff' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <i className="bi bi-broadcast fs-6"></i>
                                            </div>
                                            <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Fila Aberta / Pegar Pedidos</span>
                                        </div>
                                        <input
                                            type="radio"
                                            name="distribution_mode"
                                            checked={deliverySettings.distribution_mode === 'QUEUE'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, distribution_mode: 'QUEUE' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                        Os pedidos prontos entram numa fila pública/aberta e os entregadores disponíveis pegam as entregas por demanda no app.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: FORMA DE PAGAMENTO / REPASSE */}
                    <div className="mb-4">
                        <label className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                            <i className="bi bi-cash-coin text-success"></i> 2. Remuneração & Pagamento dos Entregadores
                        </label>

                        <div className="row g-2 mb-3">
                            {/* Opção 1: Sem Pagamento */}
                            <div className="col-12 col-md-6 col-lg-3">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'NONE' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: deliverySettings.payment_type === 'NONE' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.payment_type === 'NONE' ? '#f0f7ff' : '#ffffff',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                        <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>Não Pagar (Fixo)</span>
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            checked={deliverySettings.payment_type === 'NONE'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'NONE' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                                        Entregadores assalariados ou próprios, sem repasse por corrida.
                                    </p>
                                </div>
                            </div>

                            {/* Opção 2: Taxa Fixa */}
                            <div className="col-12 col-md-6 col-lg-3">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'FIXED' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: deliverySettings.payment_type === 'FIXED' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.payment_type === 'FIXED' ? '#f0f7ff' : '#ffffff',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                        <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>Taxa Fixa</span>
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            checked={deliverySettings.payment_type === 'FIXED'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'FIXED' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                                        Valor fixo e padrão por cada entrega realizada com sucesso.
                                    </p>
                                </div>
                            </div>

                            {/* Opção 3: Por Distância (KM) */}
                            <div className="col-12 col-md-6 col-lg-3">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'DISTANCE' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: deliverySettings.payment_type === 'DISTANCE' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.payment_type === 'DISTANCE' ? '#f0f7ff' : '#ffffff',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                        <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>Por KM Rodado</span>
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            checked={deliverySettings.payment_type === 'DISTANCE'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'DISTANCE' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                                        Calculado automaticamente pela distância real até o cliente.
                                    </p>
                                </div>
                            </div>

                            {/* Opção 4: Híbrido */}
                            <div className="col-12 col-md-6 col-lg-3">
                                <div
                                    onClick={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'HYBRID' }))}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: deliverySettings.payment_type === 'HYBRID' ? '2px solid #0084fb' : '1px solid #e2e8f0',
                                        backgroundColor: deliverySettings.payment_type === 'HYBRID' ? '#f0f7ff' : '#ffffff',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                        <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>Híbrido (Base + KM)</span>
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            checked={deliverySettings.payment_type === 'HYBRID'}
                                            onChange={() => setDeliverySettings(prev => ({ ...prev, payment_type: 'HYBRID' }))}
                                        />
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                                        Taxa base de saída garantida mais acréscimo por cada KM rodado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* INPUTS DE VALORES DEPENDENDO DO TIPO ESCOLHIDO */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                            <div className="row g-3">
                                {deliverySettings.payment_type === 'FIXED' && (
                                    <div className="col-12 col-md-6">
                                        <Form.Label className="small fw-bold text-dark mb-1">Valor Fixo por Entrega (R$):</Form.Label>
                                        <InputGroup size="sm">
                                            <InputGroup.Text className="bg-white">R$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.50"
                                                min="0"
                                                value={deliverySettings.fixed_fee}
                                                onChange={(e) => setDeliverySettings(prev => ({ ...prev, fixed_fee: e.target.value }))}
                                                className="fw-bold"
                                            />
                                        </InputGroup>
                                        <Form.Text className="text-muted small">Ex: R$ 7,00 por entrega realizada</Form.Text>
                                    </div>
                                )}

                                {deliverySettings.payment_type === 'DISTANCE' && (
                                    <div className="col-12 col-md-6">
                                        <Form.Label className="small fw-bold text-dark mb-1">Valor por KM Rodado (R$/km):</Form.Label>
                                        <InputGroup size="sm">
                                            <InputGroup.Text className="bg-white">R$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.10"
                                                min="0"
                                                value={deliverySettings.km_rate}
                                                onChange={(e) => setDeliverySettings(prev => ({ ...prev, km_rate: e.target.value }))}
                                                className="fw-bold"
                                            />
                                            <InputGroup.Text className="bg-white">/ km</InputGroup.Text>
                                        </InputGroup>
                                        <Form.Text className="text-muted small">Ex: R$ 1,50 por cada KM do trajeto</Form.Text>
                                    </div>
                                )}

                                {deliverySettings.payment_type === 'HYBRID' && (
                                    <>
                                        <div className="col-12 col-md-6">
                                            <Form.Label className="small fw-bold text-dark mb-1">Taxa Base de Saída (R$):</Form.Label>
                                            <InputGroup size="sm">
                                                <InputGroup.Text className="bg-white">R$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    step="0.50"
                                                    min="0"
                                                    value={deliverySettings.base_fee}
                                                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, base_fee: e.target.value }))}
                                                    className="fw-bold"
                                                />
                                            </InputGroup>
                                            <Form.Text className="text-muted small">Taxa mínima de saída inicial</Form.Text>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <Form.Label className="small fw-bold text-dark mb-1">Valor por KM Adicional (R$/km):</Form.Label>
                                            <InputGroup size="sm">
                                                <InputGroup.Text className="bg-white">R$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    step="0.10"
                                                    min="0"
                                                    value={deliverySettings.km_rate}
                                                    onChange={(e) => setDeliverySettings(prev => ({ ...prev, km_rate: e.target.value }))}
                                                    className="fw-bold"
                                                />
                                                <InputGroup.Text className="bg-white">/ km</InputGroup.Text>
                                            </InputGroup>
                                            <Form.Text className="text-muted small">Multiplicado pelos KM da rota</Form.Text>
                                        </div>
                                    </>
                                )}

                                {deliverySettings.payment_type === 'NONE' && (
                                    <div className="col-12">
                                        <div className="text-muted small d-flex align-items-center gap-2">
                                            <i className="bi bi-info-circle text-primary fs-5"></i>
                                            <span>
                                                O valor de repasse exibido para o motoboy será zerado (R$ 0,00). Indicado quando sua loja possui entregadores próprios contratados.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="col-12 col-md-6 mt-3 pt-2 border-top">
                                    <Form.Label className="small fw-bold text-dark mb-1">Raio Máximo de Entrega (KM):</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={deliverySettings.max_km}
                                            onChange={(e) => setDeliverySettings(prev => ({ ...prev, max_km: e.target.value }))}
                                            className="fw-bold"
                                        />
                                        <InputGroup.Text className="bg-white">km</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted small">Limite de alcance operacional da loja</Form.Text>
                                </div>

                                {/* PREVIEW DA SIMULAÇÃO */}
                                {deliverySettings.payment_type !== 'NONE' && (
                                    <div className="col-12 col-md-6 mt-3 pt-2 border-top">
                                        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '10px', border: '1px solid #e0f0fe', boxShadow: '0 2px 8px rgba(0, 132, 251, 0.05)' }}>
                                            <span className="small text-muted d-block" style={{ fontSize: '10px', fontWeight: 700 }}>SIMULAÇÃO DE CORRIDA (5.0 KM):</span>
                                            <span className="fs-5 fw-bold text-primary">
                                                R$ {getSimulationAmount(5.0).toFixed(2)}
                                            </span>
                                            <span className="text-muted ms-2 small" style={{ fontSize: '10px' }}>
                                                {deliverySettings.payment_type === 'FIXED' && '(taxa fixa)'}
                                                {deliverySettings.payment_type === 'DISTANCE' && `(5 km × R$ ${parseFloat(deliverySettings.km_rate || 0).toFixed(2)})`}
                                                {deliverySettings.payment_type === 'HYBRID' && `(R$ ${parseFloat(deliverySettings.base_fee || 0).toFixed(2)} base + 5 km × R$ ${parseFloat(deliverySettings.km_rate || 0).toFixed(2)})`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0">
                    <button
                        className="btn btn-light rounded-pill px-4 text-secondary fw-semibold"
                        onClick={() => setSettingsModalOpen(false)}
                        disabled={savingSettings}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn rounded-pill px-4 fw-bold d-flex align-items-center gap-2 text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #0084fb 0%, #0066d6 100%)', border: 'none' }}
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                    >
                        {savingSettings ? (
                            <>
                                <Spinner size="sm" animation="border" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2"></i>
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MapaEntregasPage;
