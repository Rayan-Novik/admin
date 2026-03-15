import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const PageLayoutManager = (props) => {
    const [layout, setLayout] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Blocos fixos base
    const baseBlocks = [
        { id: 'carousel', label: 'Carrossel Principal', icon: 'bi-images', desc: 'Slides grandes do topo.' },
        { id: 'features', label: 'Categorias em Destaque', icon: 'bi-grid-fill', desc: 'Ícones de categorias.' },
        { id: 'marketing', label: 'Campanhas de Marketing', icon: 'bi-megaphone-fill', desc: 'Banners de promoções.' },
        { id: 'hero_banner', label: 'Banner Único (Fixo)', icon: 'bi-card-image', desc: 'Banner estático de largura total.' },
        { id: 'products', label: 'Vitrine de Produtos', icon: 'bi-cart-check-fill', desc: 'Lista de produtos por categoria.' }
    ];

    useEffect(() => {
        const fetchLayoutAndBanners = async () => {
            try {
                // 🟢 CORREÇÃO: Pegando o tenant e enviando na URL igual a Home da loja faz
                const tenantId = localStorage.getItem('tenantId') || '1';

                const [layoutRes, bannersRes] = await Promise.all([
                    api.get('/configuracoes/homepage-layout').catch(() => ({ data: [] })),
                    api.get(`/banners/active/${tenantId}`).catch(() => ({ data: [] })) 
                ]);

                // Garante que é um Array
                const fetchedBanners = Array.isArray(bannersRes.data) ? bannersRes.data : [];
                console.log("Banners encontrados no banco:", fetchedBanners);

                // Mapeia banners ativos reais como blocos arrastáveis individuais
                const activeSideBanners = fetchedBanners.map(banner => ({
                    // Previne bugs caso a coluna chame id_banner, id_campanha ou só id
                    id: `side_banner_${banner.id_banner || banner.id_campanha || banner.id}`,
                    label: `Banner: ${banner.titulo || banner.nome || 'Lateral'}`,
                    icon: 'bi-layout-sidebar-inset',
                    desc: 'Banner lateral',
                    isDynamic: true
                }));

                const savedData = layoutRes.data || [];
                let mergedLayout = [];

                if (savedData.length > 0) {
                    // Mescla o que veio do banco (Layout salvo)
                    savedData.forEach(item => {
                        if (!item || !item.id) return;

                        if (item.id === 'side_banners') {
                            // Ignora o bloco velho genérico
                        } else if (item.id.startsWith('side_banner_')) {
                            // Banner individual salvo
                            const exists = activeSideBanners.find(b => b.id === item.id);
                            if (exists) mergedLayout.push(exists);
                        } else {
                            // Bloco fixo salvo
                            const blockInfo = baseBlocks.find(b => b.id === item.id);
                            if (blockInfo) mergedLayout.push(blockInfo);
                        }
                    });

                    // Injeta banners novos que ainda não estavam no layout salvo
                    activeSideBanners.forEach(banner => {
                        if (!mergedLayout.find(m => m.id === banner.id)) {
                            // Tenta colocar logo acima dos produtos, ou no final
                            const productIndex = mergedLayout.findIndex(m => m.id === 'products');
                            if(productIndex !== -1) {
                                mergedLayout.splice(productIndex, 0, banner);
                            } else {
                                mergedLayout.push(banner);
                            }
                        }
                    });

                    // Garante que os blocos base também não sumam
                    baseBlocks.forEach(block => {
                        if (!mergedLayout.find(m => m.id === block.id)) {
                            mergedLayout.push(block);
                        }
                    });
                } else {
                    // Layout Padrão
                    mergedLayout = [...baseBlocks.slice(0, 3), ...activeSideBanners, baseBlocks.find(b => b.id === 'products')];
                }

                // Limpa falhas
                mergedLayout = mergedLayout.filter(Boolean);

                setLayout(mergedLayout);

                if (props.onUpdate) {
                    props.onUpdate(mergedLayout);
                }

            } catch (err) {
                console.error("Erro ao sincronizar layout:", err);
                setLayout(baseBlocks);
            } finally {
                setLoading(false);
            }
        };
        fetchLayoutAndBanners();
    }, []);

    const onDragStart = () => {
        const iframe = document.getElementById('site-preview');
        if (iframe) iframe.style.pointerEvents = 'none';
    };

    const onDragEnd = (result) => {
        const iframe = document.getElementById('site-preview');
        if (iframe) iframe.style.pointerEvents = 'auto';

        if (!result.destination) return;

        const items = Array.from(layout);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setLayout(items);

        if (props.onUpdate) {
            props.onUpdate(items);
        }
    };

    const handleSave = async () => {
        try {
            const layoutToSave = layout.map(item => ({ id: item.id }));
            await api.post('/configuracoes/homepage-layout', { layout: layoutToSave });
            toast.success("🚀 Layout publicado com sucesso!");
        } catch (err) {
            toast.error("Erro ao salvar ordem das seções.");
        }
    };

    // Função de emergência para limpar o layout se bugar
    const handleReset = async () => {
        if(window.confirm("Isso vai resetar a ordem do site para o padrão. Continuar?")) {
            await api.post('/configuracoes/homepage-layout', { layout: [] });
            window.location.reload();
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="text-muted mt-2 small">Sincronizando componentes...</p>
        </div>
    );

    return (
        <Card className={`border-0 rounded-4 p-3 ${props.isLive ? 'bg-transparent shadow-none' : 'bg-light shadow-sm'}`}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="fw-bold mb-0">Arquiteto de Página</h6>
                    <small className="text-muted" style={{fontSize:'10px'}}>Arraste para organizar seu site</small>
                </div>
                {!props.isLive && (
                    <Button variant="primary" size="sm" className="rounded-pill" onClick={() => navigate('/admin/customizer')}>
                        <i className="bi bi-eye-fill"></i>
                    </Button>
                )}
            </div>

            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <Droppable droppableId="homepage-blocks">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {layout.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`d-flex align-items-center justify-content-between p-2 mb-2 rounded-3 border bg-white ${snapshot.isDragging ? 'shadow-lg border-primary' : 'shadow-sm border-light'}`}
                                            style={{ ...provided.draggableProps.style, cursor: 'grab', userSelect: 'none' }}
                                        >
                                            <div className="d-flex align-items-center overflow-hidden">
                                                <i className="bi bi-grip-vertical text-muted me-2"></i>
                                                <div className={`me-2 d-flex align-items-center justify-content-center rounded text-white ${item.id.startsWith('side_banner') ? 'bg-warning shadow-sm' : 'bg-primary'}`} style={{ minWidth: '32px', height: '32px' }}>
                                                    <i className={`bi ${item.icon} fs-6`}></i>
                                                </div>
                                                <div className="text-truncate">
                                                    <div className="fw-bold text-dark" style={{fontSize: '11px'}}>{item.label}</div>
                                                </div>
                                            </div>
                                            <Badge bg="light" text="dark" className="border" style={{fontSize: '9px'}}>#{index + 1}</Badge>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {!props.isLive && (
                <div className="d-grid mt-2">
                    <Button id="btn-save-layout" variant="dark" size="sm" className="rounded-pill fw-bold" onClick={handleSave}>
                        Salvar Ordem
                    </Button>
                </div>
            )}
            
            {props.isLive && <button id="btn-save-layout-hidden" onClick={handleSave} style={{display:'none'}}></button>}

            <div className="text-center mt-3">
                <Button variant="link" size="sm" className="text-danger text-decoration-none" style={{fontSize: '10px'}} onClick={handleReset}>
                    Resetar Layout
                </Button>
            </div>
        </Card>
    );
};

export default PageLayoutManager;