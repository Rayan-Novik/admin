import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import jsPDF from 'jspdf';
// ✅ CORREÇÃO: A importação foi alterada para um método explícito que evita erros de compilação.
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportButtons = ({ data, columns, title }) => {
    // Função para formatar os dados para o corpo da tabela do PDF
    const getPdfBody = () => {
        if (!data) return [];
        return data.map(item => 
            columns.map(col => {
                const value = col.accessor.split('.').reduce((o, i) => o?.[i], item);
                // Formata os valores numéricos para duas casas decimais se necessário
                if (typeof value === 'number') {
                    return value.toFixed(2);
                }
                return value !== undefined && value !== null ? value : '';
            })
        );
    };

    const handlePdfExport = () => {
        const doc = new jsPDF();
        doc.text(title, 14, 16);
        
        // ✅ CORREÇÃO: A função 'autoTable' agora é chamada diretamente
        autoTable(doc, {
            head: [columns.map(col => col.Header)],
            body: getPdfBody(),
            startY: 20,
        });

        doc.save(`${title.toLowerCase().replace(/ /g, '_')}.pdf`);
    };

    const handleExcelExport = () => {
        const dataToExport = data.map(item => {
            let row = {};
            columns.forEach(col => {
                row[col.Header] = col.accessor.split('.').reduce((o, i) => o?.[i], item);
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
        XLSX.writeFile(workbook, `${title.toLowerCase().replace(/ /g, '_')}.xlsx`);
    };
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <ButtonGroup size="sm">
            <Button variant="outline-danger" onClick={handlePdfExport} title="Exportar para PDF">
                <i className="fas fa-file-pdf me-1"></i> PDF
            </Button>
            <Button variant="outline-success" onClick={handleExcelExport} title="Exportar para Excel">
                <i className="fas fa-file-excel me-1"></i> Excel
            </Button>
            <Button variant="outline-secondary" onClick={handlePrint} title="Imprimir">
                <i className="fas fa-print me-1"></i> Imprimir
            </Button>
        </ButtonGroup>
    );
};

export default ExportButtons;

