import React, { useState, useEffect } from 'react';
import { Row, Col, Badge, Form } from 'react-bootstrap';
import { ScanLine, Plus, Trash2 } from 'lucide-react';

// Nossos componentes universais maravilhosos
import { CustomInput } from '../../ui/SearchInput/SearchInput';
import { LightButton } from '../../ui/buttons/CtaButton';
import { GreenSquareButton, RedSquareButton } from '../../ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../../ui/listagem/FlatList';

import BarcodeScannerModal from '../../modules/pdvManager/BarcodeScannerModal';

const ProductPricing = ({ formData, handleChange, setFormData, estoqueOriginal, isCrafting }) => {
    const [localCusto, setLocalCusto] = useState('');
    const [localVenda, setLocalVenda] = useState('');
    const [localMargem, setLocalMargem] = useState('');
    const [modalScannerOpen, setModalScannerOpen] = useState(false);

    const [novaVariacao, setNovaVariacao] = useState({
        tamanho: '',
        cor: '',
        estoque: '',
        preco_adicional: '',
        sku: ''
    });

    useEffect(() => {
        setLocalCusto(formData.preco_custo || '');
        setLocalVenda(formData.preco || '');

        const c = parseFloat(formData.preco_custo) || 0;
        const v = parseFloat(formData.preco) || 0;
        if (c > 0 && v > 0) {
            setLocalMargem(((v - c) / c * 100).toFixed(2));
        } else {
            setLocalMargem('');
        }
    }, [isCrafting, formData.preco_custo, formData.preco]);

    useEffect(() => {
        if (isCrafting && formData.preco_custo !== localCusto) {
            setLocalCusto(formData.preco_custo || '');
            const c = parseFloat(formData.preco_custo) || 0;
            const m = parseFloat(localMargem) || 0;
            if (c > 0 && m > 0) {
                const nv = c * (1 + (m / 100));
                setLocalVenda(nv.toFixed(2));
                handleChange({ target: { name: 'preco', value: nv.toFixed(2) } });
            }
        }
    }, [formData.preco_custo, isCrafting]);

    const handleCameraScan = (codigoLido) => {
        setModalScannerOpen(false);
        const codigo = codigoLido?.replace(/\D/g, '');
        if (codigo) {
            handleChange({ target: { name: 'id_externo', value: codigo } });
            if (setFormData) {
                setFormData(prev => ({ ...prev, id_externo: codigo }));
            }
        }
    };

    const handleCustoChange = (e) => {
        const strCusto = e.target.value;
        setLocalCusto(strCusto);
        handleChange({ target: { name: 'preco_custo', value: strCusto } });

        const c = parseFloat(strCusto) || 0;
        const m = parseFloat(localMargem) || 0;

        if (c > 0 && m > 0) {
            const nv = c * (1 + (m / 100));
            setLocalVenda(nv.toFixed(2));
            handleChange({ target: { name: 'preco', value: nv.toFixed(2) } });
        }
    };

    const handleMargemChange = (e) => {
        const strMargem = e.target.value;
        setLocalMargem(strMargem);

        const c = parseFloat(localCusto) || 0;
        const m = parseFloat(strMargem) || 0;

        if (c > 0 && strMargem !== '') {
            const nv = c * (1 + (m / 100));
            setLocalVenda(nv.toFixed(2));
            handleChange({ target: { name: 'preco', value: nv.toFixed(2) } });
        }
    };

    const handleVendaChange = (e) => {
        const strVenda = e.target.value;
        setLocalVenda(strVenda);
        handleChange({ target: { name: 'preco', value: strVenda } });

        const c = parseFloat(localCusto) || 0;
        const v = parseFloat(strVenda) || 0;

        if (c > 0 && v > 0) {
            const nm = ((v - c) / c) * 100;
            setLocalMargem(nm.toFixed(2));
        } else {
            setLocalMargem('');
        }
    };

    const handleAddVariacao = () => {
        if (!novaVariacao.tamanho && !novaVariacao.cor) return;
        const listaAtualizada = [...(formData.variacoes || []), { ...novaVariacao }];

        setFormData(prev => ({
            ...prev,
            variacoes: listaAtualizada
        }));

        setNovaVariacao({ tamanho: '', cor: '', estoque: '', preco_adicional: '', sku: '' });
    };

    const handleRemoveVariacao = (index) => {
        const listaAtualizada = [...(formData.variacoes || [])];
        listaAtualizada.splice(index, 1);
        setFormData(prev => ({ ...prev, variacoes: listaAtualizada }));
    };

    const variacoes = formData.variacoes || [];
    const hasVariacoes = variacoes.length > 0;
    const estoqueTotalVariacoes = variacoes.reduce((acc, v) => acc + (parseFloat(v.estoque) || 0), 0);

    const custoVisor = parseFloat(localCusto) || 0;
    const vendaVisor = parseFloat(localVenda) || 0;
    const lucroReais = vendaVisor - custoVisor;

    const estoqueAtual = hasVariacoes ? estoqueTotalVariacoes : (parseFloat(formData.estoque) || 0);
    const estoqueOrig = parseFloat(estoqueOriginal) || 0;
    const estoqueAlterado = estoqueAtual !== estoqueOrig;

    const isServico = formData.tipo_produto === 'SERVICO';

    // Estilo comum para Selects nativos acompanharem o visual do CustomInput
    const flatSelectStyle = {
        height: '50px',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)',
        color: 'var(--text-secondary, #64748B)',
        fontSize: '14px',
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    };

    return (
        <div>
            {/* 🟢 TIPO DE PRODUTO */}
            <div>
                <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-sliders me-2"></i>Natureza do Produto
                </h6>
                <Row className="g-3 mb-4">
                    <Col md={isServico ? 6 : 12}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small text-dark mb-1">O que você está cadastrando?</Form.Label>
                            <Form.Select
                                name="tipo_produto"
                                value={formData.tipo_produto}
                                onChange={handleChange}
                                disabled={isCrafting}
                                style={flatSelectStyle}
                            >
                                <option value="FINAL">Produto Físico (Venda Comum)</option>
                                <option value="SERVICO">Serviço (Agendamento / Mão de Obra)</option>
                                <option value="INSUMO">Matéria Prima (Só p/ Gastos Internos)</option>
                                <option value="MISTO">Misto (Produzido na Loja)</option>
                                <option value="CONSUMO_INTERNO">Despesa / Consumo Interno</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    {isServico && (
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">Duração Estimada (Minutos)</Form.Label>
                                <CustomInput
                                    icon="bi-clock-history"
                                    type="number"
                                    name="duracao_minutos"
                                    value={formData.duracao_minutos || ''}
                                    onChange={handleChange}
                                    placeholder="Ex: 45"
                                />
                                <Form.Text className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                    Tempo médio de realização.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    )}
                </Row>
            </div>

            <h6 className="text-uppercase fw-bold mb-3 ls-1 mt-4" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-upc-scan me-2"></i>Identificação & Precificação
            </h6>

            {!isServico && (
                <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold small text-dark mb-1">Código de Barras Principal (EAN / SKU)</Form.Label>
                    <div className="d-flex gap-2">
                        <CustomInput
                            icon="bi-upc-scan"
                            name="id_externo"
                            placeholder="Clique aqui e bipe a embalagem..."
                            value={formData.id_externo || ''}
                            onChange={handleChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        />
                        <LightButton 
                            onClick={() => setModalScannerOpen(true)} 
                            className="flex-shrink-0 px-3"
                            title="Ler com a Câmera"
                        >
                            <ScanLine size={18} className="me-sm-2" />
                            <span className="d-none d-sm-inline">Câmera</span>
                        </LightButton>
                    </div>
                </Form.Group>
            )}

            <Row className="g-3 mb-3">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">
                            {isServico ? "Custo do Serviço (Opcional)" : "Preço de Custo"}
                        </Form.Label>
                        <CustomInput
                            icon="bi-cash"
                            type="number"
                            name="preco_custo"
                            step="0.01"
                            placeholder="0,00"
                            value={localCusto}
                            onChange={isCrafting ? () => { } : handleCustoChange}
                            readOnly={isCrafting}
                        />
                        {isCrafting && (
                            <Form.Text className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                Calculado automaticamente pela composição.
                            </Form.Text>
                        )}
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">Margem de Lucro (%)</Form.Label>
                        <CustomInput
                            icon="bi-percent"
                            type="number"
                            name="margem_percentual"
                            step="0.1"
                            placeholder="0,0"
                            value={localMargem}
                            onChange={handleMargemChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">
                            {isServico ? "Preço do Serviço" : "Preço de Venda"}
                        </Form.Label>
                        <CustomInput
                            icon="bi-tag-fill"
                            type="number"
                            name="preco"
                            step="0.01"
                            placeholder="0,00"
                            value={localVenda}
                            onChange={handleVendaChange}
                        />
                    </Form.Group>
                </Col>
            </Row>

            {vendaVisor > 0 && (
                <div 
                    className="p-3 rounded-4 mb-4 d-flex justify-content-between align-items-center" 
                    style={{ 
                        backgroundColor: lucroReais > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                        border: `1px solid ${lucroReais > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` 
                    }}
                >
                    <div>
                        <small className="d-block fw-bold text-uppercase" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Lucro Líquido Previsto</small>
                        <span className={`fw-black fs-5 ${lucroReais > 0 ? 'text-success' : 'text-danger'}`}>
                            R$ {lucroReais.toFixed(2)}
                        </span>
                    </div>
                    <Badge bg={lucroReais > 0 ? 'success' : 'danger'} className="bg-opacity-10 border px-3 py-2 rounded-pill fw-bold" style={{ color: lucroReais > 0 ? '#10B981' : '#EF4444', borderColor: lucroReais > 0 ? '#10B981' : '#EF4444', letterSpacing: '0.5px' }}>
                        {lucroReais > 0 ? 'LUCRATIVO' : 'PREJUÍZO'}
                    </Badge>
                </div>
            )}

            {/* 🟢 CONTROLE DE ESTOQUE E VARIAÇÕES */}
            {!isServico && (
                <>
                    <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />

                    <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-box-seam me-2"></i>Controle de Estoque & Grade
                    </h6>

                    <Row className="g-3 mb-4">
                        <Col xs={5}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">Unidade</Form.Label>
                                <Form.Select
                                    name="unidade"
                                    value={formData.unidade || 'UN'}
                                    onChange={handleChange}
                                    style={flatSelectStyle}
                                >
                                    <option value="UN">UN - Unid</option>
                                    <option value="KG">KG - Quilo</option>
                                    <option value="G">G - Grama</option>
                                    <option value="M">M - Metro</option>
                                    <option value="CM">CM - Cent.</option>
                                    <option value="L">L - Litro</option>
                                    <option value="ML">ML - Mililitro</option>
                                    <option value="CX">CX - Caixa</option>
                                    <option value="FD">FD - Fardo</option>
                                    <option value="RL">RL - Rolo</option>
                                    <option value="PCT">PCT - Pacote</option>
                                    <option value="M2">M² - Metro Q.</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={7}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">
                                    {hasVariacoes ? "Estoque (Soma da Grade)" : "Em Estoque"}
                                </Form.Label>
                                <CustomInput
                                    icon="bi-boxes"
                                    type="number"
                                    name="estoque"
                                    step="0.001"
                                    placeholder="0"
                                    value={hasVariacoes ? estoqueTotalVariacoes : formData.estoque}
                                    onChange={handleChange}
                                    readOnly={isCrafting || hasVariacoes}
                                />
                                {(hasVariacoes || isCrafting) && (
                                    <Form.Text className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                        {hasVariacoes ? "Bloqueado (Calculado via grade)" : "Calculado via produção"}
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    <div>
                        <Form.Label className="fw-bold small text-primary mb-3">
                            <i className="bi bi-tags me-2"></i>Variações Opcionais (Cores, Tamanhos...)
                        </Form.Label>

                        {/* Nova Variação (Formulário Limpo) */}
                        <Row className="g-2 align-items-end mb-3">
                            <Col xs={6} md={2}>
                                <CustomInput placeholder="Tam. (P, M)" value={novaVariacao.tamanho} onChange={e => setNovaVariacao({ ...novaVariacao, tamanho: e.target.value })} />
                            </Col>
                            <Col xs={6} md={3}>
                                <CustomInput placeholder="Cor (Azul)" value={novaVariacao.cor} onChange={e => setNovaVariacao({ ...novaVariacao, cor: e.target.value })} />
                            </Col>
                            <Col xs={4} md={2}>
                                <CustomInput type="number" step="0.001" placeholder="Estoque" value={novaVariacao.estoque} onChange={e => setNovaVariacao({ ...novaVariacao, estoque: e.target.value })} />
                            </Col>
                            <Col xs={4} md={2}>
                                <CustomInput type="number" step="0.01" placeholder="+ R$ Valor" value={novaVariacao.preco_adicional} onChange={e => setNovaVariacao({ ...novaVariacao, preco_adicional: e.target.value })} />
                            </Col>
                            <Col xs={4} md={2}>
                                <CustomInput placeholder="Cód/SKU" value={novaVariacao.sku} onChange={e => setNovaVariacao({ ...novaVariacao, sku: e.target.value })} />
                            </Col>
                            <Col xs={12} md={1}>
                                <GreenSquareButton className="w-100" onClick={handleAddVariacao} disabled={!novaVariacao.tamanho && !novaVariacao.cor}>
                                    <Plus size={20} />
                                </GreenSquareButton>
                            </Col>
                        </Row>

                        {/* 👇 AQUI USAMOS A NOSSA FLAT LIST PARA AS VARIAÇÕES 👇 */}
                        {hasVariacoes && (
                            <div className="mt-3">
                                <FlatListContainer loading={false} empty={false}>
                                    <FlatListHeader>
                                        <div style={{ width: '20%' }}>Tamanho</div>
                                        <div style={{ width: '25%' }}>Cor</div>
                                        <div style={{ width: '15%' }}>Estoque</div>
                                        <div style={{ width: '15%' }}>+ Valor</div>
                                        <div style={{ width: '15%' }}>SKU</div>
                                        <div style={{ width: '10%' }} className="text-end"></div>
                                    </FlatListHeader>

                                    {variacoes.map((v, idx) => (
                                        <FlatListItem key={idx} className="py-2"> {/* py-2 deixa as linhas menores */}
                                            <div style={{ width: '20%' }} className="fw-bold mb-1 mb-md-0">
                                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Tamanho:</span>
                                                {v.tamanho || '-'}
                                            </div>
                                            <div style={{ width: '25%' }} className="mb-1 mb-md-0">
                                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Cor:</span>
                                                {v.cor || '-'}
                                            </div>
                                            <div style={{ width: '15%' }} className="text-warning fw-bold mb-1 mb-md-0">
                                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Estoque:</span>
                                                {v.estoque || 0}
                                            </div>
                                            <div style={{ width: '15%' }} className="text-success fw-medium mb-1 mb-md-0">
                                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Acréscimo:</span>
                                                {v.preco_adicional ? `+R$ ${v.preco_adicional}` : '-'}
                                            </div>
                                            <div style={{ width: '15%' }} className="text-muted small mb-2 mb-md-0">
                                                {v.sku || 'Sem SKU'}
                                            </div>
                                            <div style={{ width: '10%' }} className="text-end">
                                                <RedSquareButton size={36} radius={10} onClick={() => handleRemoveVariacao(idx)}>
                                                    <Trash2 size={16} />
                                                </RedSquareButton>
                                            </div>
                                        </FlatListItem>
                                    ))}
                                </FlatListContainer>
                            </div>
                        )}
                    </div>
                </>
            )}

            <BarcodeScannerModal
                isOpen={modalScannerOpen}
                onClose={() => setModalScannerOpen(false)}
                onScan={handleCameraScan}
            />
        </div>
    );
};

export default ProductPricing;