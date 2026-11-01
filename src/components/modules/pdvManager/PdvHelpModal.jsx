import React from 'react';
import { Modal, Row, Col, Badge } from 'react-bootstrap';
import { Keyboard, HelpCircle, ShieldCheck, Zap, X } from 'lucide-react';

export default function PdvHelpModal({ isOpen, onClose }) {
    const atalhos = [
        { tecla: 'F1', desc: 'Abrir esta tela de Ajuda & Mapa de Atalhos', cor: 'primary' },
        { tecla: 'F2', desc: 'Finalizar Venda / Abrir Tela de Pagamento', cor: 'success' },
        { tecla: 'F3', desc: 'Identificar Cliente / Inserir CPF ou CNPJ na Nota', cor: 'info' },
        { tecla: 'F4', desc: 'Focar na Barra de Pesquisa de Produtos / Leitor de Código de Barras', cor: 'secondary' },
        { tecla: 'F5', desc: 'Atualizar / Sincronizar dados do Caixa', cor: 'secondary' },
        { tecla: 'F6', desc: 'Histórico de Vendas / Reimpressão de DANFE (NFC-e / NF-e)', cor: 'warning' },
        { tecla: 'F7', desc: 'Registrar Entrada / Suprimento de Caixa (Permissão Financeira)', cor: 'secondary' },
        { tecla: 'F8', desc: 'Registrar Saída / Sangria de Caixa (Permissão Financeira)', cor: 'secondary' },
        { tecla: 'F9', desc: 'Alternar Modo Fiscal (NFC-e) ↔ Não Fiscal (Bloqueado para Operadores)', cor: 'danger' },
        { tecla: 'F10', desc: 'Configurações do PDV, Seleção de Caixas, Séries e Impressoras', cor: 'dark' },
        { tecla: '1 - 4', desc: 'No Pagamento: 1-Dinheiro, 2-PIX, 3-Crédito, 4-Débito', cor: 'info' },
        { tecla: 'Enter', desc: 'Confirmar Pagamento / Bipar Leitor / Nova Venda', cor: 'success' },
        { tecla: 'Esc', desc: 'Cancelar Ação / Fechar Janelas / Limpar Pesquisa', cor: 'secondary' }
    ];

    return (
        <Modal
            show={isOpen}
            onHide={onClose}
            centered
            size="lg"
            contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
        >
            <div
                className="p-3 px-4 d-flex justify-content-between align-items-center border-bottom"
                style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderColor: 'var(--border-color, #e2e8f0)' }}
            >
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary, #0f172a)' }}>
                            Ajuda & Atalhos do PDV
                        </h5>
                        <small style={{ color: 'var(--text-secondary, #64748b)', fontSize: '12px' }}>
                            Guia rápido de teclas de atalho e operação ágil do Caixa
                        </small>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-light border-0 rounded-circle p-1"
                    onClick={onClose}
                    style={{ color: 'var(--text-secondary, #64748b)' }}
                >
                    <X size={20} />
                </button>
            </div>

            <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)', maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Dica Rápida */}
                <div
                    className="p-3 rounded-4 border mb-4 d-flex align-items-start gap-3"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                >
                    <Zap size={22} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h6 className="fw-bold text-primary mb-1" style={{ fontSize: '13px' }}>
                            Operação sem Mouse
                        </h6>
                        <p className="small mb-0 text-muted" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            O PDV foi desenhado para operação contínua e rápida usando apenas o teclado ou leitor de código de barras. Bipar um produto o adiciona direto na cesta; pressione <strong>F2</strong> para ir ao pagamento, tecle <strong>1</strong> para Dinheiro e <strong>Enter</strong> para emitir a NFC-e.
                        </p>
                    </div>
                </div>

                {/* Grade de Atalhos */}
                <Row className="g-3">
                    {atalhos.map((at, idx) => (
                        <Col md={6} key={idx}>
                            <div
                                className="p-3 rounded-4 border h-100 d-flex align-items-center gap-3"
                                style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderColor: 'var(--border-color, #e2e8f0)' }}
                            >
                                <span
                                    className="badge px-3 py-2 rounded-3 fw-bold font-monospace shadow-sm"
                                    style={{
                                        fontSize: '13px',
                                        minWidth: '55px',
                                        textAlign: 'center',
                                        backgroundColor: at.cor === 'primary' ? '#2563eb' : at.cor === 'success' ? '#16a34a' : at.cor === 'danger' ? '#dc2626' : at.cor === 'warning' ? '#d97706' : at.cor === 'info' ? '#0891b2' : at.cor === 'dark' ? '#1e293b' : '#64748b',
                                        color: '#ffffff'
                                    }}
                                >
                                    {at.tecla}
                                </span>
                                <div className="small fw-semibold" style={{ color: 'var(--text-primary, #0f172a)', fontSize: '12.5px', lineHeight: '1.3' }}>
                                    {at.desc}
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Modal.Body>

            <div
                className="p-3 px-4 border-top d-flex justify-content-end align-items-center"
                style={{ backgroundColor: 'var(--bg-main, #f8fafc)', borderColor: 'var(--border-color, #e2e8f0)' }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm"
                    style={{ fontSize: '13px' }}
                >
                    Entendi (Esc)
                </button>
            </div>
        </Modal>
    );
}
