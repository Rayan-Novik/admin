import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, OverlayTrigger, Tooltip, Spinner, Alert, Modal, Badge, Row, Col } from 'react-bootstrap';
import { Calendar, ChevronLeft, ChevronRight, User, Phone, Mail, FileText, CreditCard, MapPin, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';

// ==============================================================
// COMPONENTE: ADMIN AGENDA SEMANAL
// ==============================================================
export const AdminAgendaSemanal = ({ onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🟢 ESTADOS DO MODAL DE INFORMAÇÕES
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // ==============================================================
    // LÓGICA DE DATAS E NAVEGAÇÃO
    // ==============================================================
    const nextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + 7);
        setCurrentDate(next);
    };

    const prevWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(currentDate.getDate() - 7);
        setCurrentDate(prev);
    };

    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    const getWeekDays = () => {
        const startOfWeek = getStartOfWeek(currentDate);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(startOfWeek);
            nextDay.setDate(startOfWeek.getDate() + i);
            days.push(nextDay);
        }
        return days;
    };

    const weekDays = getWeekDays();
    const startDay = weekDays[0].getDate();
    const endDay = weekDays[6].getDate();
    const monthName = weekDays[0].toLocaleString('pt-BR', { month: 'long' });
    const year = weekDays[0].getFullYear();
    const todayStr = new Date().toDateString();
    const diasDaSemanaNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // ==============================================================
    // BUSCA DE DADOS NA API
    // ==============================================================
    const fetchAgendamentos = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/agendamentos/admin');
            setAgendamentos(res.data || []);
        } catch (err) {
            console.error("Erro ao buscar agendamentos", err);
            setError("Não foi possível carregar a agenda.");
            toast.error("Erro ao conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgendamentos();
    }, []);

    // ==============================================================
    // AGRUPAMENTO DE AGENDAMENTOS POR DIA DA SEMANA E HORA
    // ==============================================================
    const agendaAgrupada = useMemo(() => {
        const agrupado = {};
        weekDays.forEach(day => {
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            agrupado[key] = [];
        });

        agendamentos.forEach(ag => {
            const dataInicio = new Date(ag.data_inicio);
            const dataFim = new Date(ag.data_fim);
            
            if (ag.status === 'CANCELADO') return;

            const key = `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, '0')}-${String(dataInicio.getDate()).padStart(2, '0')}`;
            
            if (agrupado[key]) {
                agrupado[key].push({
                    id: ag.id_agendamento,
                    inicio: `${String(dataInicio.getHours()).padStart(2, '0')}:${String(dataInicio.getMinutes()).padStart(2, '0')}`,
                    fim: `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}`,
                    status: ag.status,
                    cliente: ag.cliente?.nome || 'Cliente não informado',
                    profissional: ag.profissional || 'Sem atendente',
                    isConfirmed: ag.status === 'CONFIRMADO',
                    rawData: ag 
                });
            }
        });

        return agrupado;
    }, [agendamentos, weekDays]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    // ==============================================================
    // RENDERIZAÇÃO DOS CARDS
    // ==============================================================
    const renderSlotCard = (slot) => {
        const isConfirmed = slot.isConfirmed;
        const colorClass = isConfirmed ? 'slot-booked-green' : 'slot-booked-blue';
        
        return (
            <div key={slot.id} className={`agenda-slot ${colorClass}`}>
                <div className="d-flex justify-content-between mb-1">
                    <div className="slot-time text-white opacity-75">{slot.inicio} - {slot.fim}</div>
                    <div className="d-flex gap-1 opacity-75">
                        {isConfirmed && <i className="bi bi-check-circle-fill text-white" style={{fontSize: '10px'}}></i>}
                        <i className="bi bi-person-fill text-white" style={{fontSize: '10px'}}></i>
                    </div>
                </div>
                
                <div className="slot-client text-white fw-bold mb-1 text-truncate">
                    {slot.cliente}
                </div>
                <div className="slot-title text-white opacity-75 mb-2" style={{ fontSize: '10px' }}>
                     Atendente: {slot.profissional}
                </div>

                <div className="d-flex gap-2">
                    <OverlayTrigger overlay={<Tooltip>Ver Detalhes</Tooltip>}>
                        <button 
                            className="btn btn-sm slot-action-btn bg-white text-dark border-0 py-1 px-2 rounded-2 w-100 d-flex justify-content-center align-items-center gap-1" 
                            style={{fontSize: '10px', fontWeight: '800'}}
                            onClick={() => {
                                setSelectedSlot(slot);
                                setShowInfoModal(true);
                            }}
                        >
                            <Info size={12} /> Info
                        </button>
                    </OverlayTrigger>
                </div>
            </div>
        );
    };

    return (
        <div className="agenda-wrapper" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '2rem 0' }}>
            <Container fluid="xl" className="agenda-container px-3 px-lg-4">
                
                {/* CABEÇALHO */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <h3 className="fw-bold m-0 d-flex align-items-center text-dark agenda-page-title">
                        <Calendar className="me-2 text-primary" />
                        Agenda Semanal
                    </h3>
                    <div className="d-flex gap-2">
                        {onBack && (
                            <Button 
                                variant="outline-secondary" 
                                onClick={onBack} 
                                className="rounded-3 border fw-semibold d-flex align-items-center gap-2 bg-white"
                            >
                                <ChevronLeft size={16} /> Voltar para Pedidos
                            </Button>
                        )}
                        <Button variant="outline-secondary" onClick={fetchAgendamentos} disabled={loading} className="rounded-3 border bg-white">
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}
                        </Button>
                    </div>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {/* CONTROLE DE DATA CENTRAL */}
                <div className="text-center mb-5">
                    <h4 className="fw-bold mb-1 text-capitalize text-dark">
                        {monthName} de {year}
                    </h4>
                    <div className="d-flex justify-content-center align-items-center gap-3">
                        <button onClick={prevWeek} className="btn-nav rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-muted small fw-bold text-uppercase tracking-wider">Dias {startDay} a {endDay}</span>
                        <button onClick={nextWeek} className="btn-nav rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* GRID DE DIAS E SLOTS */}
                <Row className="m-0 p-0 position-relative">
                    {loading && (
                        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-50 z-index-1 rounded-3" style={{ zIndex: 10 }}>
                            <Spinner animation="border" variant="primary" />
                        </div>
                    )}

                    <div className="agenda-grid d-flex flex-nowrap overflow-auto w-100 pb-4 gap-3 px-1">
                        {weekDays.map((day, index) => {
                            const nomeDia = diasDaSemanaNomes[index];
                            const numeroDia = day.getDate();
                            const isToday = day.toDateString() === todayStr;
                            
                            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                            const slotsDoDia = agendaAgrupada[key] || [];

                            return (
                                <div key={index} className="agenda-col d-flex flex-column mobile-gray-col">
                                    {/* HEADER DO DIA */}
                                    <div className="text-center mb-4 pt-2">
                                        <div className={`dia-numero fw-bold ${isToday ? 'dia-hoje' : ''}`}>
                                            {numeroDia}
                                        </div>
                                        <div className={`dia-nome fw-bold mt-1 ${isToday ? 'text-primary' : 'text-muted'}`}>
                                            {nomeDia}
                                        </div>
                                    </div>

                                    {/* LISTA DE SLOTS DE HORÁRIOS */}
                                    <div className="agenda-slots-container">
                                        <AnimatePresence mode="popLayout">
                                            {slotsDoDia.map(slot => (
                                                <motion.div
                                                    key={slot.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {renderSlotCard(slot)}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        {slotsDoDia.length === 0 && !loading && (
                                            <div className="text-center text-muted small mt-4 opacity-50 py-3 border border-dashed rounded-3 fw-bold">
                                                Livre
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Row>

            </Container>

            {/* ==============================================================
                MODAL DE DETALHES DO AGENDAMENTO (POPUP)
                ============================================================== */}
            <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5 text-secondary d-flex align-items-center gap-2">
                        <Calendar size={20} className="text-primary"/> 
                        Detalhes do Agendamento #{selectedSlot?.id}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedSlot && selectedSlot.rawData && (
                        <div>
                            {/* LINHA 1: Status e Horário */}
                            <Row className="mb-4 g-3">
                                <Col md={6}>
                                    <div className="p-3 bg-light rounded-4 border">
                                        <div className="text-muted small mb-1 fw-bold text-uppercase tracking-wider">Status da Agenda</div>
                                        <Badge bg={selectedSlot.isConfirmed ? 'success' : 'warning'} text={selectedSlot.isConfirmed ? 'white' : 'dark'} className="px-3 py-2 fs-6 rounded-3">
                                            {selectedSlot.rawData.status}
                                        </Badge>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-3 bg-light rounded-4 border">
                                        <div className="text-muted small mb-1 fw-bold text-uppercase tracking-wider">Data e Horário</div>
                                        <div className="fw-bold fs-6 text-dark d-flex align-items-center gap-2">
                                            <Clock size={16} className="text-primary"/>
                                            {new Date(selectedSlot.rawData.data_inicio).toLocaleDateString('pt-BR')} 
                                            <span className="text-muted mx-1">|</span> 
                                            {selectedSlot.inicio} às {selectedSlot.fim}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* LINHA 2: Cliente e Local */}
                            <Row className="mb-4 g-3">
                                <Col md={6}>
                                    <div className="border rounded-4 p-3 h-100 position-relative overflow-hidden">
                                        <div className="position-absolute top-0 start-0 w-100 h-1 bg-primary opacity-25"></div>
                                        <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                                            <User size={18} className="text-primary"/> Dados do Cliente
                                        </h6>
                                        <div className="d-flex flex-column gap-2">
                                            <div className="d-flex align-items-center gap-2 text-secondary">
                                                <i className="bi bi-person-badge"></i> <span className="fw-medium text-dark">{selectedSlot.rawData.cliente?.nome || 'Não informado'}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 text-secondary">
                                                <Phone size={14}/> <span>{selectedSlot.rawData.cliente?.telefone || 'Telefone não informado'}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 text-secondary text-truncate">
                                                <Mail size={14}/> <span>{selectedSlot.rawData.cliente?.email || 'Email não informado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <div className="border rounded-4 p-3 h-100 position-relative overflow-hidden">
                                        <div className="position-absolute top-0 start-0 w-100 h-1 bg-info opacity-25"></div>
                                        <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                                            <MapPin size={18} className="text-info"/> Serviço & Local
                                        </h6>
                                        <div className="d-flex flex-column gap-2">
                                            <div className="d-flex align-items-center gap-2 text-secondary">
                                                <User size={14}/> <strong>Atendente:</strong> {selectedSlot.rawData.profissional}
                                            </div>
                                            <div className="d-flex align-items-center gap-2 text-secondary">
                                                <i className="bi bi-shop"></i> <strong>Loja:</strong> {selectedSlot.rawData.loja}
                                            </div>
                                            {selectedSlot.rawData.observacoes && (
                                                <div className="d-flex align-items-start gap-2 text-secondary mt-2 p-2 bg-light rounded-3">
                                                    <FileText size={14} className="mt-1 flex-shrink-0"/> 
                                                    <span className="small fst-italic">"{selectedSlot.rawData.observacoes}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* LINHA 3: Pagamento (Se existir) */}
                            {selectedSlot.rawData.pagamento !== "Não vinculado" ? (
                                <div className="bg-light border rounded-4 p-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white p-2 rounded-circle shadow-sm">
                                            <CreditCard size={24} className="text-success" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark">Pagamento {selectedSlot.rawData.pagamento.status}</h6>
                                            <small className="text-muted text-uppercase tracking-wider">{selectedSlot.rawData.pagamento.metodo}</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-black text-success fs-5">{formatCurrency(selectedSlot.rawData.pagamento.total)}</div>
                                    </div>
                                </div>
                            ) : (
                                <Alert variant="secondary" className="border-0 rounded-4 d-flex align-items-center gap-2 m-0">
                                    <Info size={16} /> <span>Nenhum pagamento ou pedido vinculado a este agendamento.</span>
                                </Alert>
                            )}

                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" className="border rounded-3 fw-medium px-4" onClick={() => setShowInfoModal(false)}>
                        Fechar
                    </Button>
                    <Button variant="primary" className="rounded-3 fw-medium px-4">
                        Editar Agendamento
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ESTILOS CSS PADRONIZADOS */}
            <style>{`
                .agenda-container {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .btn-nav {
                    width: 36px;
                    height: 36px;
                    background-color: #ffffff;
                    color: #64748b;
                    transition: all 0.2s;
                }
                .btn-nav:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }

                .agenda-grid {
                    min-height: 400px;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }
                .agenda-grid::-webkit-scrollbar { height: 8px; }
                .agenda-grid::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

                .agenda-col {
                    min-width: 170px;
                    flex: 1 1 0;
                    background-color: transparent;
                }

                .dia-numero {
                    font-size: 20px;
                    color: #475569;
                    width: 40px;
                    height: 40px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                .dia-nome { font-size: 13px; }
                
                .dia-hoje {
                    background-color: #6366f1;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    transform: scale(1.1);
                }

                .agenda-slots-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 4px;
                }

                .agenda-slot {
                    padding: 14px;
                    border-radius: 14px;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .agenda-slot:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
                }

                .slot-time { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

                .slot-booked-blue { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); }
                .slot-booked-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }

                .slot-client { font-size: 13px; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                .slot-action-btn { transition: all 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .slot-action-btn:active { transform: scale(0.95); }
                
                .border-dashed { border-style: dashed !important; border-color: #cbd5e1 !important; }

                /* ====== CSS PADRONIZADOR MOBILE ====== */
                @media (max-width: 991px) {
                    .agenda-wrapper {
                        background-color: transparent !important;
                        padding-top: 1rem !important;
                    }
                    .agenda-page-title {
                        font-size: 18px !important;
                    }
                    .mobile-gray-col {
                        background-color: #e6e6e6 !important;
                        border-radius: 20px !important;
                        padding: 15px !important;
                    }
                    .dia-numero { color: #000 !important; }
                    .dia-nome { color: #555 !important; }
                    .agenda-grid { gap: 1rem !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
};