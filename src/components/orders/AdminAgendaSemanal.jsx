import React, { useState, useEffect, useMemo } from 'react';
import { Container, Spinner, Alert, Modal, Row, Col, Badge } from 'react-bootstrap';
import { Calendar, ChevronLeft, ChevronRight, User, Phone, Mail, FileText, CreditCard, MapPin, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';

// 🟢 Importação dos Nossos Botões Universais
import { SquareButton } from '../ui/buttons/SquareButton';
import { CtaButton, LightButton } from '../ui/buttons/CtaButton';

// ==============================================================
// COMPONENTE: ADMIN AGENDA SEMANAL
// ==============================================================
export const AdminAgendaSemanal = ({ onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ESTADOS DO MODAL DE INFORMAÇÕES
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
    // RENDERIZAÇÃO DOS CARDS DE HORÁRIO
    // ==============================================================
    const renderSlotCard = (slot) => {
        const isConfirmed = slot.isConfirmed;
        const bgClass = isConfirmed ? 'bg-success' : 'bg-primary';
        
        return (
            <div 
                key={slot.id} 
                className={`p-3 rounded-4 shadow-sm text-white ${bgClass}`}
                style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-bold opacity-75" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>{slot.inicio} - {slot.fim}</div>
                    <div className="d-flex gap-1 opacity-75">
                        {isConfirmed && <i className="bi bi-check-circle-fill text-white" style={{fontSize: '10px'}}></i>}
                        <i className="bi bi-person-fill text-white" style={{fontSize: '10px'}}></i>
                    </div>
                </div>
                
                <div className="fw-bold mb-1 text-truncate" style={{ fontSize: '14px' }}>
                    {slot.cliente}
                </div>
                <div className="opacity-75 mb-3" style={{ fontSize: '11px' }}>
                     Atendente: {slot.profissional}
                </div>

                <CtaButton 
                    className="btn btn-light btn-sm w-100 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-1 shadow-sm" 
                    style={{ fontSize: '11px', height: '32px' }}
                    onClick={() => {
                        setSelectedSlot(slot);
                        setShowInfoModal(true);
                    }}
                >
                    <Info size={14} /> Mais Detalhes
                </CtaButton>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Container fluid="xl" className="pt-4 px-3 px-lg-4">
                
                {/* 🟢 CABEÇALHO */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <h3 className="fw-bold m-0 d-flex align-items-center text-dark">
                        Agenda Semanal
                    </h3>
                    <div className="d-flex gap-2">
                        {onBack && (
                            <CtaButton onClick={onBack}>
                                <ChevronLeft size={18} className="me-1" /> Voltar
                            </CtaButton>
                        )}
                        <SquareButton onClick={fetchAgendamentos} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise fs-5"></i>}
                        </SquareButton>
                    </div>
                </div>

                {error && <Alert variant="danger" className="border-0 rounded-4 shadow-sm">{error}</Alert>}

                {/* 🟢 CONTROLE DE DATA CENTRAL */}
                <div className="text-center mb-4 mt-2">
                    <h4 className="fw-bold mb-2 text-capitalize text-dark" style={{ fontSize: '20px' }}>
                        {monthName} de {year}
                    </h4>
                    <div className="d-flex justify-content-center align-items-center gap-3">
                        <SquareButton onClick={prevWeek}>
                            <ChevronLeft size={20} />
                        </SquareButton>
                        <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Dias {startDay} a {endDay}</span>
                        <SquareButton onClick={nextWeek}>
                            <ChevronRight size={20} />
                        </SquareButton>
                    </div>
                </div>

                {/* 🟢 GRID DE DIAS E SLOTS (Rolagem Horizontal Nativa) */}
                <div className="position-relative">
                    {loading && (
                        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center rounded-4" style={{ zIndex: 10, backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)' }}>
                            <Spinner animation="border" style={{ color: '#0A84FF' }} />
                        </div>
                    )}

                    <div 
                        className="d-flex flex-nowrap w-100 pb-4 gap-3 px-1" 
                        style={{ overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                        {weekDays.map((day, index) => {
                            const nomeDia = diasDaSemanaNomes[index];
                            const numeroDia = day.getDate();
                            const isToday = day.toDateString() === todayStr;
                            
                            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                            const slotsDoDia = agendaAgrupada[key] || [];

                            return (
                                <div 
                                    key={index} 
                                    className="d-flex flex-column rounded-4 p-3 flex-shrink-0" 
                                    style={{ minWidth: '190px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '1px solid rgba(100, 116, 139, 0.1)' }}
                                >
                                    {/* HEADER DO DIA */}
                                    <div className="text-center mb-4 pt-2">
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center mx-auto fw-bold fs-5 mb-2"
                                            style={{ 
                                                width: '45px', height: '45px', transition: 'all 0.2s ease',
                                                backgroundColor: isToday ? '#0A84FF' : 'transparent',
                                                color: isToday ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
                                                boxShadow: isToday ? '0 8px 20px -6px rgba(10, 132, 255, 0.6)' : 'none'
                                            }}
                                        >
                                            {numeroDia}
                                        </div>
                                        <div className={`fw-bold text-uppercase ${isToday ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                                            {nomeDia}
                                        </div>
                                    </div>

                                    {/* LISTA DE SLOTS DE HORÁRIOS */}
                                    <div className="d-flex flex-column gap-2">
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
                                            <div className="text-center text-muted small mt-2 opacity-50 py-4 rounded-4 fw-bold" style={{ border: '2px dashed rgba(100, 116, 139, 0.3)' }}>
                                                Livre
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </Container>

            {/* ==============================================================
                🟢 MODAL DE DETALHES DO AGENDAMENTO (COM NOSSOS BOTÕES)
                ============================================================== */}
            <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
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
                                    <div className="p-3 rounded-4" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
                                        <div className="text-muted small mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Status da Agenda</div>
                                        <Badge bg={selectedSlot.isConfirmed ? 'success' : 'warning'} text={selectedSlot.isConfirmed ? 'white' : 'dark'} className="px-3 py-2 fs-6 rounded-pill border">
                                            {selectedSlot.rawData.status}
                                        </Badge>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-3 rounded-4" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
                                        <div className="text-muted small mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Data e Horário</div>
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
                                    <div className="rounded-4 p-3 h-100 position-relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main, #FFFFFF)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
                                        <div className="position-absolute top-0 start-0 w-100 bg-primary opacity-25" style={{ height: '4px' }}></div>
                                        <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-1">
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
                                    <div className="rounded-4 p-3 h-100 position-relative overflow-hidden" style={{ backgroundColor: 'var(--bg-main, #FFFFFF)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
                                        <div className="position-absolute top-0 start-0 w-100 bg-info opacity-25" style={{ height: '4px' }}></div>
                                        <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-1">
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
                                                <div className="d-flex align-items-start gap-2 text-secondary mt-2 p-2 rounded-3" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }}>
                                                    <FileText size={14} className="mt-1 flex-shrink-0"/> 
                                                    <span className="small fst-italic">"{selectedSlot.rawData.observacoes}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* LINHA 3: Pagamento */}
                            {selectedSlot.rawData.pagamento !== "Não vinculado" ? (
                                <div className="rounded-4 p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '1px solid rgba(100, 116, 139, 0.1)' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white p-2 rounded-circle shadow-sm">
                                            <CreditCard size={24} className="text-success" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark">Pagamento {selectedSlot.rawData.pagamento.status}</h6>
                                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{selectedSlot.rawData.pagamento.metodo}</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-black text-success fs-5">{formatCurrency(selectedSlot.rawData.pagamento.total)}</div>
                                    </div>
                                </div>
                            ) : (
                                <Alert variant="secondary" className="border-0 rounded-4 d-flex align-items-center gap-2 m-0 shadow-sm">
                                    <Info size={16} /> <span>Nenhum pagamento ou pedido vinculado a este agendamento.</span>
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                
                {/* 🟢 FOOTER DO MODAL COM NOSSOS BOTÕES */}
                <Modal.Footer className="border-0 pt-0 d-flex gap-2 p-4">
                    <LightButton className="flex-grow-1" onClick={() => setShowInfoModal(false)}>
                        Fechar
                    </LightButton>
                    <CtaButton className="flex-grow-1">
                        Editar Agendamento
                    </CtaButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};