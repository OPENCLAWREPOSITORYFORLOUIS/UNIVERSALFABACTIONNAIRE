/**
 * devis-export.js - Universal Fab
 * Ultra-light PDF generation with live checkbox state detection.
 */

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', generatePDF);
    }
});

async function generatePDF() {
    console.log("PDF Generation Started...");
    
    let jsPDF;
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else {
        alert("Erreur: Bibliothèque PDF non chargée.");
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    const modelImg = document.getElementById('rx-model-img');
    
    if (loadingOverlay) loadingOverlay.classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 15;

        // 1. Header with Logo & Model Image
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(61, 139, 255);
        doc.text("UNIVERSAL FAB", margin, currentY + 5);
        
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Document Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, currentY + 5, { align: 'right' });
        
        currentY += 15;

        // Add Model Image to Header
        if (modelImg && modelImg.src) {
            try {
                const imgData = await getBase64Image(modelImg);
                const imgW = 40;
                const imgH = (modelImg.naturalHeight * imgW) / modelImg.naturalWidth;
                doc.addImage(imgData, 'JPEG', margin, currentY, imgW, imgH);
                
                // Model Title next to image
                const modelName = document.querySelector('.rx-config__title')?.innerText || 'Devis RX';
                doc.setFontSize(18);
                doc.setTextColor(33, 33, 33);
                doc.text(modelName, margin + 45, currentY + 10);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 100, 100);
                const series = document.querySelector('.rx-base')?.innerText || 'Configuration Industrielle';
                doc.text(series, margin + 45, currentY + 18);

                currentY += Math.max(imgH, 20) + 15;
            } catch (e) {
                console.warn("Header image skip", e);
                currentY += 10;
            }
        }

        // 2. Process Tables with LIVE checkbox states
        const tables = document.querySelectorAll('.rx-table');
        const titles = document.querySelectorAll('.rx-table-group__title');

        tables.forEach((table, index) => {
            const tableTitle = titles[index]?.innerText || 'Spécifications';
            
            // Check for page break
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text(tableTitle.toUpperCase(), margin, currentY);

            // Extract rows and manual check for inputs
            const rows = [];
            const trs = table.querySelectorAll('tr');
            trs.forEach(tr => {
                const rowData = [];
                const tds = tr.querySelectorAll('td, th');
                tds.forEach(td => {
                    // Check if cell contains a checkbox or radio
                    const input = td.querySelector('input[type="checkbox"], input[type="radio"]');
                    if (input) {
                        rowData.push(input.checked ? "[X] SÉLECTIONNÉ" : "[ ] NON INCLUS");
                    } else {
                        rowData.push(td.innerText.trim());
                    }
                });
                if (rowData.length > 0) rows.push(rowData);
            });

            doc.autoTable({
                head: [rows[0]], // Assume first row is header
                body: rows.slice(1),
                startY: currentY + 3,
                margin: { left: margin, right: margin },
                theme: 'striped',
                headStyles: { fillColor: [61, 139, 255], fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            currentY = doc.lastAutoTable.finalY + 12;
        });

        // 3. Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(170, 170, 170);
            doc.text(`UNIVERSAL FAB INDUSTRIAL CONCEPT — PAGE ${i} / ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
        }

        // 4. Robust Save for Chrome/Edge
        const modelName = document.querySelector('.rx-config__title')?.innerText || 'Devis';
        const safeName = modelName.trim().replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Universal_Fab_Devis_${safeName}.pdf`;
        
        doc.save(filename);
        console.log("PDF Saved successfully:", filename);

    } catch (error) {
        console.error('PDF Error:', error);
        alert('Erreur lors de la génération du PDF.');
    } finally {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
}

/**
 * Image helper with better error handling & quality
 */
function getBase64Image(img) {
    return new Promise((resolve, reject) => {
        if (!img.src) return reject("No src");
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = 0.6;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        tempImg.onload = () => {
            ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        tempImg.onerror = () => reject("Load fail");
        tempImg.src = img.src;
    });
}
