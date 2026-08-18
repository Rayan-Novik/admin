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

    // 🟢 Coloquei o Hero Banner como o primeiro item da lista base
    const baseBlocks = [
        { id: 'hero_banner', label: 'Banner Único (Fixo)', icon: 'bi-card-image', desc: 'Banner estático de largura total.' },
        { id: 'carousel', label: 'Carrossel Principal', icon: 'bi-images', desc: 'Slides grandes do topo.' },
        { id: 'features', label: 'Categorias em Destaque', icon: 'bi-grid-fill', desc: 'Ícones de categorias.' },
        { id: 'marketing', label: 'Campanhas de Marketing', icon: 'bi-megaphone-fill', desc: 'Banners de promoções.' },
        { id: 'products', label: 'Vitrine de Produtos', icon: 'bi-cart-check-fill', desc: 'Lista de produtos por categoria.' }
    ];

    useEffect(() => {
        const fetchLayoutAndBanners = async () => {
            try {
                const tenantId = localStorage.getItem('tenantId') || '1';

                const [layoutRes, bannersRes] = await Promise.all([
                    api.get('/configuracoes/homepage-layout').catch(() => ({ data: [] })),
                    api.get(`/banners/active/${tenantId}`).catch(() => ({ data: [] })) 
                ]);

                const fetchedBanners = Array.isArray(bannersRes.data) ? bannersRes.data : [];

                const activeSideBanners = fetchedBanners.map(banner => ({
                    id: `side_banner_${banner.id_banner || banner.id_campanha || banner.id}`,
                    label: `Banner: ${banner.titulo || banner.nome || 'Lateral'}`,
                    icon: 'bi-layout-sidebar-inset',
                    desc: 'Banner lateral',
                    isDynamic: true
                }));

                const savedData = layoutRes.data || [];
                let mergedLayout = [];

                if (savedData.length > 0) {
                    savedData.forEach(item => {
                        if (!item || !item.id) return;
                        if (item.id === 'side_banners') {
                            // Ignora o bloco velho genérico
                        } else if (item.id.startsWith('side_banner_')) {
                            const exists = activeSideBanners.find(b => b.id === item.id);
                            if (exists) mergedLayout.push(exists);
                        } else {
                            const blockInfo = baseBlocks.find(b => b.id === item.id);
                            if (blockInfo) mergedLayout.push(blockInfo);
                        }
                    });

                    activeSideBanners.forEach(banner => {
                        if (!mergedLayout.find(m => m.id === banner.id)) {
                            const productIndex = mergedLayout.findIndex(m => m.id === 'products');
                            if(productIndex !== -1) {
                                mergedLayout.splice(productIndex, 0, banner);
                            } else {
                                mergedLayout.push(banner);
                            }
                        }
                    });

                    // 🟢 Se o Hero Banner (ou outro bloco novo) não estiver no banco, injeta ele!
                    baseBlocks.forEach(block => {
                        if (!mergedLayout.find(m => m.id === block.id)) {
                            if (block.id === 'hero_banner') {
                                mergedLayout.unshift(block); // Força ele ir pro topo
                            } else {
                                mergedLayout.push(block);
                            }
                        }
                    });
                } else {
                    // 🟢 Seção Padrão explícita
                    mergedLayout = [
                        baseBlocks.find(b => b.id === 'hero_banner'),
                        baseBlocks.find(b => b.id === 'carousel'),
                        baseBlocks.find(b => b.id === 'features'),
                        baseBlocks.find(b => b.id === 'marketing'),
                        ...activeSideBanners,
                        baseBlocks.find(b => b.id === 'products')
                    ].filter(Boolean);
                }

                mergedLayout = mergedLayout.filter(Boolean);
                setLayout(mergedLayout);
                if (props.onUpdate) props.onUpdate(mergedLayout);

            } catch (err) {
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
        if (props.onUpdate) props.onUpdate(items);
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

    const handleReset = async () => {
        if(window.confirm("Isso vai resetar a ordem do site para o padrão. Continuar?")) {
            await api.post('/configuracoes/homepage-layout', { layout: [] });
            window.location.reload();
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="mt-2 small" style={{ color: 'var(--text-secondary)' }}>Sincronizando componentes...</p>
        </div>
    );

    return (
        <Card className={`border-0 rounded-4 p-4 ${props.isLive ? 'bg-transparent shadow-none' : 'clean-card'}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>Arquiteto de Página</h6>
                    <small style={{fontSize:'12px', color: 'var(--text-secondary)'}}>Arraste para organizar a ordem de exibição do seu site</small>
                </div>
                {!props.isLive && (
                    <Button variant="dark" size="sm" className="rounded-3 px-3 border-0 fw-medium" onClick={() => navigate('/admin/customizer')} style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                        <i className="bi bi-eye-fill me-2"></i> Ver Preview
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
                                            className={`d-flex align-items-center justify-content-between p-3 mb-3 rounded-3 border ${snapshot.isDragging ? 'shadow-sm' : ''}`}
                                            style={{ 
                                                ...provided.draggableProps.style, 
                                                cursor: 'grab', 
                                                userSelect: 'none',
                                                backgroundColor: snapshot.isDragging ? 'var(--bg-hover)' : 'var(--bg-main)',
                                                borderColor: snapshot.isDragging ? 'var(--text-active)' : 'var(--border-color)',
                                            }}
                                        >
                                            <div className="d-flex align-items-center overflow-hidden">
                                                <i className="bi bi-grip-vertical me-3" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}></i>
                                                <div className={`me-3 d-flex align-items-center justify-content-center rounded text-white ${item.id.startsWith('side_banner') ? 'bg-warning shadow-sm text-dark' : 'bg-primary shadow-sm'}`} style={{ minWidth: '40px', height: '40px' }}>
                                                    <i className={`bi ${item.icon} fs-5`}></i>
                                                </div>
                                                <div className="text-truncate">
                                                    <div className="fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</div>
                                                </div>
                                            </div>
                                            <Badge bg="secondary" className="bg-opacity-10 text-secondary border fw-medium px-2 py-1" style={{fontSize: '11px'}}>{index + 1}º</Badge>
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
                <div className="d-grid mt-4">
                    <Button id="btn-save-layout" variant="dark" className="rounded-3 py-3 fw-semibold border-0 shadow-sm" onClick={handleSave} style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                        Salvar Ordem do Site
                    </Button>
                </div>
            )}
            
            {props.isLive && <button id="btn-save-layout-hidden" onClick={handleSave} style={{display:'none'}}></button>}

            <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                <Button variant="link" size="sm" className="text-danger text-decoration-none fw-medium" style={{fontSize: '12px'}} onClick={handleReset}>
                    Resetar para o Layout Padrão
                </Button>
            </div>
            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                }
            `}</style>
        </Card>
    );
};

export default PageLayoutManager;