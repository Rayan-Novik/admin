import React, { useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

const BarcodeScannerModal = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);
    // 🟢 TRAVA ANTI-DUPLICIDADE DA CÂMERA
    const lockRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            lockRef.current = false; // Abre a trava toda vez que o modal abre

            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true 
                    },
                    false
                );

                scanner.render(
                    (decodedText) => {
                        // 🟢 SE A TRAVA TIVER FECHADA, IGNORA O RESTO DOS FRAMES!
                        if (lockRef.current) return;
                        lockRef.current = true; // Fecha a trava

                        scanner.clear();
                        onScan(decodedText);
                    },
                    (error) => {} // Ignora erros de frame vazio
                );

                scannerRef.current = scanner;
            }, 300);

            return () => clearTimeout(timer);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Erro ao limpar scanner:", e));
                scannerRef.current = null;
            }
        };
    }, [isOpen, onScan]);

    const handleClose = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error("Erro ao fechar scanner:", e));
            scannerRef.current = null;
        }
        onClose();
    };

    return (
        <Modal show={isOpen} onHide={handleClose} centered backdrop="static" className="scanner-modal">
            <Modal.Header className="border-0 pb-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center">
                    <Camera size={20} className="me-2 text-primary" />
                    Escanear Código
                </Modal.Title>
                <Button variant="light" className="rounded-circle p-2 d-flex border-0 text-muted" onClick={handleClose}>
                    <X size={20} />
                </Button>
            </Modal.Header>
            
            <Modal.Body className="text-center px-4 pb-4">
                <p className="text-muted small mb-3">Enquadre o código de barras ou QR Code na área abaixo.</p>
                
                <div 
                    id="reader" 
                    className="mx-auto shadow-sm"
                    style={{ 
                        width: "100%", maxWidth: "400px", minHeight: "300px", 
                        borderRadius: "16px", overflow: "hidden", border: "2px solid var(--bs-primary)", backgroundColor: "#000" 
                    }}
                ></div>

            </Modal.Body>

            <style>{`
                #reader a { display: none !important; }
                #reader button { background-color: var(--bs-primary); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin-top: 10px; margin-bottom: 10px; cursor: pointer; }
                #reader select { padding: 8px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px; width: 90%; max-width: 300px; }
                .scanner-modal .modal-content { border-radius: 20px; border: none; }
            `}</style>
        </Modal>
    );
};

export default BarcodeScannerModal;