import React, { useState, useEffect } from 'react';
import { Row, Col, Badge, Form, InputGroup, Button, Table } from 'react-bootstrap';
import { ScanLine, Plus, Trash2 } from 'lucide-react';
import UiField from '../../ui/UiField';
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

    // 🟢 VERIFICADOR DE TIPO DE PRODUTO
    const isServico = formData.tipo_produto === 'SERVICO';

    return (
        <div>
            {/* 🟢 TIPO DE PRODUTO MOVIDO PARA CÁ (TOPO) */}
            <div>
                <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-sliders me-2"></i>Natureza do Produto
                </h6>
                <Row className="g-3">
                    <Col md={isServico ? 6 : 12}>
                        <UiField
                            label="O que você está cadastrando?"
                            type="select"
                            name="tipo_produto"
                            value={formData.tipo_produto}
                            onChange={handleChange}
                            disabled={isCrafting}
                            options={[
                                { value: 'FINAL', label: 'Produto Físico (Venda Comum)' },
                                { value: 'SERVICO', label: 'Serviço (Agendamento / Mão de Obra)' },
                                { value: 'INSUMO', label: 'Matéria Prima (Só p/ Gastos Internos)' },
                                { value: 'MISTO', label: 'Misto (Produzido na Loja)' },
                                { value: 'CONSUMO_INTERNO', label: 'Despesa / Consumo Interno' },
                            ]}
                        />
                    </Col>

                    {isServico && (
                        <Col md={6}>
                            <UiField
                                label="Duração Estimada (Minutos)"
                                type="number"
                                name="duracao_minutos"
                                value={formData.duracao_minutos || ''}
                                onChange={handleChange}
                                placeholder="Ex: 45"
                                hint="Tempo que o profissional leva para realizar."
                            />
                        </Col>
                    )}
                </Row>
            </div>

            <h6 className="text-uppercase fw-bold mb-4 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-upc-scan me-2"></i>Identificação & Precificação
            </h6>

            {!isServico && (
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small text-secondary">Código de Barras Principal (EAN / SKU)</Form.Label>
                    <InputGroup>
                        <Form.Control
                            name="id_externo"
                            placeholder="Clique aqui e bipe a embalagem..."
                            value={formData.id_externo || ''}
                            onChange={handleChange}
                            className="form-dark-input py-2 fw-bold"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.preventDefault();
                            }}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setModalScannerOpen(true)}
                            title="Ler com a Câmera"
                            className="d-flex align-items-center"
                        >
                            <ScanLine size={18} className="me-2" />
                            <span className="d-none d-sm-inline">Usar Câmera</span>
                        </Button>
                    </InputGroup>
                </Form.Group>
            )}

            <Row className="g-3 mb-3">
                <Col md={12}>
                    <UiField
                        label={isServico ? "Custo do Serviço (Opcional)" : "Preço de Custo"}
                        prefix="R$"
                        type="number"
                        name="preco_custo"
                        step="0.01"
                        value={localCusto}
                        onChange={isCrafting ? () => { } : handleCustoChange}
                        readOnly={isCrafting}
                        hint={isCrafting ? "Calculado via receita" : ""}
                    />
                </Col>

                <Col md={6}>
                    <UiField
                        label="Margem"
                        suffix="%"
                        type="number"
                        name="margem_percentual"
                        step="0.1"
                        value={localMargem}
                        onChange={handleMargemChange}
                        className="text-primary fw-bold"
                    />
                </Col>

                <Col md={6}>
                    <UiField
                        label={isServico ? "Preço do Serviço" : "Preço de Venda Base"}
                        prefix="R$"
                        type="number"
                        name="preco"
                        step="0.01"
                        value={localVenda}
                        onChange={handleVendaChange}
                        className="text-success fw-bold"
                    />
                </Col>
            </Row>

            {vendaVisor > 0 && (
                <div className="p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-main)', border: `1px solid ${lucroReais > 0 ? '#22c55e40' : '#ef444440'}` }}>
                    <div>
                        <small className="d-block" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Lucro Líquido</small>
                        <span className={`fw-bold fs-6 ${lucroReais > 0 ? 'text-success' : 'text-danger'}`}>R$ {lucroReais.toFixed(2)}</span>
                    </div>
                    <Badge bg={lucroReais > 0 ? 'success' : 'danger'} className="bg-opacity-10 border fw-medium" style={{ color: lucroReais > 0 ? '#16a34a' : '#dc2626', borderColor: lucroReais > 0 ? '#16a34a' : '#dc2626' }}>
                        {lucroReais > 0 ? 'Lucrativo' : 'Prejuízo'}
                    </Badge>
                </div>
            )}

            {/* 🟢 SE NÃO FOR SERVIÇO, MOSTRA CONTROLE DE ESTOQUE */}
            {!isServico && (
                <>
                    <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />

                    <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-box-seam me-2"></i>Controle de Estoque & Grade
                    </h6>

                    <Row className="g-3 mb-4">
                        <Col xs={5}>
                            <UiField
                                label="Unidade"
                                type="select"
                                name="unidade"
                                value={formData.unidade || 'UN'}
                                onChange={handleChange}
                                options={[
                                    { value: 'UN', label: 'UN - Unidade' },
                                    { value: 'KG', label: 'KG - Quilograma' },
                                    { value: 'G', label: 'G - Grama' },
                                    { value: 'M', label: 'M - Metro' },
                                    { value: 'CM', label: 'CM - Centímetro' },
                                    { value: 'L', label: 'L - Litro' },
                                    { value: 'ML', label: 'ML - Mililitro' },
                                    { value: 'CX', label: 'CX - Caixa' },
                                    { value: 'FD', label: 'FD - Fardo' }, // 🟢 NOVA UNIDADE
                                    { value: 'RL', label: 'RL - Rolo/Bobina' }, // 🟢 NOVA UNIDADE
                                    { value: 'PCT', label: 'PCT - Pacote' },
                                    { value: 'M2', label: 'M² - Metro Quadrado' }
                                ]}
                            />
                        </Col>
                        <Col xs={7}>
                            <UiField
                                label={hasVariacoes ? "Estoque Total (Soma da Grade)" : "Em Estoque"}
                                suffix={formData.unidade || 'UN'}
                                type="number"
                                name="estoque"
                                step="0.001" // 🟢 AQUI: Permite digitar estoque quebrado (Ex: 2.5) na hora do cadastro!
                                value={hasVariacoes ? estoqueTotalVariacoes : formData.estoque}
                                onChange={handleChange}
                                readOnly={isCrafting || hasVariacoes}
                                className={(estoqueAlterado || isCrafting || hasVariacoes) ? "text-warning fw-bold" : ""}
                                hint={hasVariacoes ? "Calculado via variações" : (isCrafting ? "Calculado via receita" : "")}
                            />
                        </Col>
                    </Row>

                    <div>
                        <Form.Label className="fw-bold small text-primary mb-3">Variações (Tamanhos e Cores)</Form.Label>

                        <Row className="g-2 align-items-end mb-3">
                            <Col md={2}>
                                <Form.Control size="sm" placeholder="Tam. (M, 38)" value={novaVariacao.tamanho} onChange={e => setNovaVariacao({ ...novaVariacao, tamanho: e.target.value })} className="form-dark-input" />
                            </Col>
                            <Col md={3}>
                                <Form.Control size="sm" placeholder="Cor (Verde)" value={novaVariacao.cor} onChange={e => setNovaVariacao({ ...novaVariacao, cor: e.target.value })} className="form-dark-input" />
                            </Col>
                            <Col md={2}>
                                {/* 🟢 AQUI: Permite variações fracionadas também */}
                                <Form.Control size="sm" type="number" step="0.001" placeholder="Estoque" value={novaVariacao.estoque} onChange={e => setNovaVariacao({ ...novaVariacao, estoque: e.target.value })} className="form-dark-input" />
                            </Col>
                            <Col md={2}>
                                <Form.Control size="sm" type="number" step="0.01" placeholder="+ Preço (R$)" value={novaVariacao.preco_adicional} onChange={e => setNovaVariacao({ ...novaVariacao, preco_adicional: e.target.value })} className="form-dark-input" />
                            </Col>
                            <Col md={2}>
                                <Form.Control size="sm" placeholder="SKU/Cód" value={novaVariacao.sku} onChange={e => setNovaVariacao({ ...novaVariacao, sku: e.target.value })} className="form-dark-input" />
                            </Col>
                            <Col md={1}>
                                <Button variant="primary" size="sm" className="w-100" onClick={handleAddVariacao} disabled={!novaVariacao.tamanho && !novaVariacao.cor}>
                                    <Plus size={16} />
                                </Button>
                            </Col>
                        </Row>

                        {hasVariacoes && (
                            <Table size="sm" variant="dark" responsive className="mt-3 mb-0 text-center" style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>Tamanho</th>
                                        <th>Cor</th>
                                        <th>Estoque</th>
                                        <th>+ Valor</th>
                                        <th>SKU</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variacoes.map((v, idx) => (
                                        <tr key={idx} className="align-middle">
                                            <td className="fw-bold">{v.tamanho || '-'}</td>
                                            <td>{v.cor || '-'}</td>
                                            <td className="text-warning fw-bold">{v.estoque || 0}</td>
                                            <td className="text-success">{v.preco_adicional ? `+R$ ${v.preco_adicional}` : '-'}</td>
                                            <td className="text-muted">{v.sku || '-'}</td>
                                            <td>
                                                <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => handleRemoveVariacao(idx)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
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