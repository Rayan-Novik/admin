// src/components/ifood/IfoodProductActions.js
import React from 'react';
import { Button, Dropdown, Spinner, ButtonGroup } from 'react-bootstrap';

const IfoodProductActions = ({ 
    produto, 
    syncingId, 
    onSync, 
    onToggleStatus, 
    onSyncFoto, 
    onOpenPromo, 
    onOpenCombo,
    onOpenEdit
}) => {
    const isSyncing = syncingId === produto.id_produto;
    const isPromo = produto.preco_ifood && Number(produto.preco_ifood) < Number(produto.preco);
    const precoDisplay = isPromo ? parseFloat(produto.preco_ifood).toFixed(2) : parseFloat(produto.preco).toFixed(2);

    return (
        <div className="d-flex align-items-center gap-2">
            
            {/* Botão de Publicar (Se não estiver no iFood) */}
            {!produto.ifood_id && (
                <Button 
                    variant="danger" 
                    size="sm" 
                    className="rounded-3 px-3 fw-medium shadow-sm"
                    disabled={isSyncing} 
                    onClick={() => onSync(produto.id_produto)}
                >
                    {isSyncing ? <Spinner size="sm" /> : <><i className="bi bi-upload me-1"></i> Publicar</>}
                </Button>
            )}

            {/* BOTÕES DE COMBO E OFERTA VISÍVEIS */}
            {produto.ifood_id && (
                <>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="bg-white rounded-3 px-3 fw-medium border-light-subtle ifood-btn-white"
                        onClick={() => onOpenCombo(produto)}
                    >
                        Criar combo
                    </Button>

                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="bg-white rounded-3 px-3 fw-medium border-light-subtle ifood-btn-white"
                        onClick={() => onOpenPromo(produto)}
                    >
                        Criar oferta
                    </Button>
                </>
            )}

            <Button 
                variant="outline-secondary" 
                size="sm" 
                className="bg-white rounded-3 px-3 fw-medium border-light-subtle text-secondary" 
                disabled
            >
                Estoque: {produto.estoque !== undefined ? produto.estoque : 0}
            </Button>

            {/* Grupo de Preço e Tag de Promoção */}
            <ButtonGroup size="sm" className="bg-white rounded-3 border border-light-subtle">
                <div className="px-3 py-1 d-flex align-items-center fw-medium border-end border-light-subtle text-dark">
                    R$ {precoDisplay.replace('.', ',')}
                </div>
                <Button variant="light" className="bg-white border-0 text-secondary" onClick={() => onOpenPromo(produto)}>
                    <i className={`bi bi-tag${isPromo ? '-fill text-success' : ''}`}></i>
                </Button>
            </ButtonGroup>

            {/* Botão de Pausar/Retomar */}
            <Button 
                variant="outline-secondary" 
                size="sm" 
                className="bg-white rounded-3 px-2 border-light-subtle"
                disabled={isSyncing || !produto.ifood_id}
                onClick={() => onToggleStatus(produto.id_produto, produto.ifood_status)}
                title={produto.ifood_status === 'AVAILABLE' ? 'Pausar item' : 'Retomar item'}
            >
                {isSyncing ? <Spinner size="sm" /> : <i className={`bi bi-${produto.ifood_status === 'AVAILABLE' ? 'pause' : 'play'}-fill text-dark`}></i>}
            </Button>

            {/* Dropdown de Ações (3 pontinhos) */}
            <Dropdown align="end">
                <Dropdown.Toggle 
                    variant="outline-secondary" 
                    size="sm" 
                    className="bg-white rounded-3 px-2 border-light-subtle d-flex align-items-center justify-content-center"
                    style={{ aspectRatio: '1/1' }}
                >
                    <i className="bi bi-three-dots-vertical text-dark"></i>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 rounded-4 mt-2">
                    <Dropdown.Item className="py-2" onClick={() => onOpenEdit(produto)}>
                        <i className="bi bi-pencil text-secondary me-2"></i> Editar detalhes (iFood)
                    </Dropdown.Item>

                    {produto.ifood_id && (
                        <Dropdown.Item onClick={() => onSyncFoto(produto.id_produto)} className="py-2">
                            <i className="bi bi-camera text-secondary me-2"></i> Atualizar Foto no iFood
                        </Dropdown.Item>
                    )}

                    <Dropdown.Divider />

                    <Dropdown.Item className="py-2 text-danger" onClick={() => alert('Função de deletar produto a ser desenvolvida')}>
                        <i className="bi bi-trash text-danger me-2"></i> Remover produto
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default IfoodProductActions;