import React, { useState, useEffect } from 'react';
import { Form, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Nossos componentes universais maravilhosos
import { GreenButton, CtaButton, LightButton } from '../../components/ui/buttons/CtaButton';
import { RedSquareButton, SquareButton } from '../../components/ui/buttons/SquareButton';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../../components/ui/listagem/FlatList';
import { AppModal } from '../../components/ui/modal/AppModal';

const GerenciarMesas = () => {
    const [mesas, setMesas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados do Modal de Criação/Edição
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ id_mesa: null, nome: '', status: 'LIVRE' });

    // 🟢 NOVOS: Estados do Modal de QR Code
    const [showQrModal, setShowQrModal] = useState(false);
    const [loadingQr, setLoadingQr] = useState(false);
    const [selectedQr, setSelectedQr] = useState({ base64: '', mesaNome: '', url: '' });

    useEffect(() => { carregarMesas(); }, []);

    const carregarMesas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/mesas');
            setMesas(data);
        } catch (error) { toast.error("Erro ao carregar mesas."); } 
        finally { setLoading(false); }
    };

    const handleClose = () => {
        setShowModal(false);
        setFormData({ id_mesa: null, nome: '', status: 'LIVRE' });
        setIsEditing(false);
    };

    const handleShowCreate = () => {
        handleClose(); // Limpa e fecha
        setShowModal(true);
    };

    const handleShowEdit = (mesa) => {
        setFormData(mesa);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/mesas/${formData.id_mesa}`, formData);
                toast.success("Mesa atualizada!");
            } else {
                await api.post('/mesas', formData);
                toast.success("Mesa criada com sucesso!");
            }
            carregarMesas();
            handleClose();
        } catch (error) { toast.error(error.response?.data?.message || "Erro ao salvar mesa."); }
    };

    const handleDelete = async (id_mesa) => {
        if (!window.confirm("Deseja excluir esta mesa?")) return;
        try {
            await api.delete(`/mesas/${id_mesa}`);
            toast.success("Mesa excluída!");
            carregarMesas();
        } catch (error) { toast.error("Erro ao excluir mesa."); }
    };

    // 🟢 FUNÇÕES DO QR CODE
    const handleShowQr = async (mesa) => {
        setSelectedQr({ base64: '', mesaNome: mesa.nome, url: '' });
        setShowQrModal(true);
        setLoadingQr(true);
        try {
            // Busca o QR Code em Base64 na rota que você criou
            const { data } = await api.get(`/mesas/${mesa.id_mesa}/qrcode`);
            setSelectedQr({
                base64: data.qr_code_base64,
                mesaNome: mesa.nome,
                url: data.url_acesso || ''
            });
        } catch (error) {
            toast.error("Erro ao gerar QR Code. Verifique se o backend está retornando corretamente.");
            setShowQrModal(false);
        } finally {
            setLoadingQr(false);
        }
    };

    const handleDownloadQr = () => {
        if (!selectedQr.base64) return;
        
        // Cria um link temporário para forçar o download no navegador
        const link = document.createElement('a');
        link.href = selectedQr.base64;
        link.download = `QRCode_${selectedQr.mesaNome.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download iniciado!");
    };

    const getStatusBadge = (status) => {
        const styles = {
            'LIVRE': 'bg-success text-success',
            'OCUPADA': 'bg-danger text-danger',
            'RESERVADA': 'bg-warning text-warning',
            'FECHANDO': 'bg-info text-info'
        };
        const styleClass = styles[status] || 'bg-secondary text-secondary';
        return (
            <Badge className={`${styleClass} bg-opacity-10 border border-opacity-25 px-3 py-2 rounded-pill fw-semibold`}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh' }}>
            
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div className="mb-3 mb-md-0">
                    <h3 className="fw-bold mb-1">Gestão de Mesas</h3>
                    <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>Cadastre as mesas e acesse o QR Code de Autoatendimento</p>
                </div>
                <GreenButton onClick={handleShowCreate} className="px-4">
                    <i className="bi bi-plus-lg me-2"></i> Nova Mesa
                </GreenButton>
            </div>

            {/* 👇 LISTA PADRONIZADA 👇 */}
            <FlatListContainer loading={loading} empty={mesas.length === 0} emptyMessage="Clique no botão acima para adicionar a primeira mesa.">
                
                <FlatListHeader>
                    <div style={{ width: '15%' }}>ID</div>
                    <div style={{ width: '40%' }}>Identificação</div>
                    <div style={{ width: '20%' }}>Status</div>
                    <div style={{ width: '25%' }} className="text-end">Ações</div>
                </FlatListHeader>

                {mesas.map((mesa) => (
                    <FlatListItem key={mesa.id_mesa}>
                        <div className="text-muted fw-medium mb-2 mb-md-0" style={{ width: '15%', fontSize: '14px' }}>
                            <span className="d-inline d-md-none me-1">ID:</span> #{mesa.id_mesa}
                        </div>
                        <div className="fw-bold mb-2 mb-md-0" style={{ width: '40%', fontSize: '15px' }}>
                            {mesa.nome}
                        </div>
                        <div className="mb-3 mb-md-0" style={{ width: '20%' }}>
                            {getStatusBadge(mesa.status)}
                        </div>
                        <div className="d-flex justify-content-end w-100" style={{ width: '25%' }}>
                            
                            {/* 🟢 BOTAO DO QR CODE ADICIONADO */}
                            <SquareButton onClick={() => handleShowQr(mesa)} className="me-2" title="Visualizar QR Code">
                                <i className="bi bi-qr-code"></i>
                            </SquareButton>

                            <SquareButton onClick={() => handleShowEdit(mesa)} className="me-2" title="Editar Mesa">
                                <i className="bi bi-pencil"></i>
                            </SquareButton>

                            <RedSquareButton onClick={() => handleDelete(mesa.id_mesa)} title="Excluir Mesa">
                                <i className="bi bi-trash"></i>
                            </RedSquareButton>

                        </div>
                    </FlatListItem>
                ))}
            </FlatListContainer>

            {/* 👇 MODAL DE CRIAÇÃO/EDIÇÃO PADRONIZADO 👇 */}
            <AppModal 
                show={showModal} 
                onHide={handleClose}
                onSubmit={handleSubmit}
                title={isEditing ? 'Editar Mesa' : 'Nova Mesa'}
                subtitle="Preencha os dados da mesa para controle do salão."
                footer={
                    <>
                        <LightButton onClick={handleClose} className="flex-grow-1">Cancelar</LightButton>
                        <CtaButton type="submit" color="#0A84FF" className="flex-grow-1">Salvar Mesa</CtaButton>
                    </>
                }
            >
                <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold small text-muted">Identificação (Nome ou Número)</Form.Label>
                    <CustomInput
                        icon="bi-hash"
                        placeholder="Ex: Mesa 01, Camarote VIP"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold small text-muted">Status Inicial</Form.Label>
                    <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ height: '50px', borderRadius: '14px', border: '1px solid rgba(100, 116, 139, 0.2)', backgroundColor: '#F4F6FA' }}
                        className="shadow-none"
                    >
                        <option value="LIVRE">Livre</option>
                        <option value="OCUPADA">Ocupada</option>
                        <option value="RESERVADA">Reservada</option>
                    </Form.Select>
                </Form.Group>
            </AppModal>

            {/* 🟢 NOVO MODAL PARA VISUALIZAR E BAIXAR O QR CODE */}
            <AppModal 
                show={showQrModal} 
                onHide={() => setShowQrModal(false)}
                title={`QR Code - ${selectedQr.mesaNome}`}
                subtitle="Imprima e deixe este QR Code na mesa para autoatendimento."
                footer={
                    <>
                        <LightButton onClick={() => setShowQrModal(false)} className="flex-grow-1">Fechar</LightButton>
                        <CtaButton 
                            onClick={handleDownloadQr} 
                            color="#10B981" 
                            className="flex-grow-1"
                            disabled={loadingQr || !selectedQr.base64}
                        >
                            <i className="bi bi-download me-2"></i> Baixar QR Code
                        </CtaButton>
                    </>
                }
            >
                <div className="d-flex flex-column align-items-center justify-content-center p-4">
                    {loadingQr ? (
                        <div className="text-center py-5 text-muted">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <p>Gerando QR Code...</p>
                        </div>
                    ) : (
                        <>
                            {/* QR Code Frame */}
                            <div 
                                style={{ 
                                    padding: '16px', 
                                    backgroundColor: '#FFFFFF', 
                                    borderRadius: '24px', 
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }} 
                                className="mb-4 d-flex align-items-center justify-content-center"
                            >
                                <img
                                    src={selectedQr.base64}
                                    alt={`QR Code ${selectedQr.mesaNome}`}
                                    style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                                />
                            </div>

                            {/* Mostrar a URL ajuda caso queiram testar ou copiar */}
                            {selectedQr.url && (
                                <div className="text-center mt-2 w-100">
                                    <span 
                                        className="d-block w-100 text-truncate px-3 py-2 rounded-3 text-muted" 
                                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '12px' }}
                                    >
                                        {selectedQr.url}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AppModal>
        </div>
    );
};

export default GerenciarMesas;