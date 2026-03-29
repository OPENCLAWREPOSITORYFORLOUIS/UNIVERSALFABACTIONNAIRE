function exportToPDF() {
    console.log("Exporting PDF...");
    const title = document.querySelector('h1')?.innerText || 'Devis Universal Fab';
    
    // Robust image grab - try multiple selectors
    const mainImg = document.querySelector('.img img')?.src 
                 || document.querySelector('.page-wrap img')?.src 
                 || '';
    
    const configSection = document.getElementById('rx-config');
    if (!configSection) {
        console.error("RX Config section not found");
        return;
    }

    // Clone the section for PDF manipulation
    const clone = configSection.cloneNode(true);
    
    // 1. Remove interractive elements
    clone.querySelectorAll('button, script').forEach(el => el.remove());

    // 2. Map Choices (OUI/NON)
    const realInputs = configSection.querySelectorAll('input[type="checkbox"]');
    const cloneInputs = clone.querySelectorAll('input[type="checkbox"]');
    
    realInputs.forEach((input, i) => {
        const cloneInput = cloneInputs[i];
        if (!cloneInput) return;
        
        const parentCell = cloneInput.closest('td');
        if (parentCell) {
            parentCell.innerHTML = input.checked ? 
                '<span style="color:#2ecc71; font-weight:bold;">OUI</span>' : 
                '<span style="color:#999;">NON</span>';
        }
    });

    // 3. Map Base items to "INCLUS"
    clone.querySelectorAll('.rx-base').forEach(el => {
        el.innerText = 'INCLUS';
        el.style.color = '#3D8BFF';
        el.style.fontWeight = 'bold';
    });

    // 4. Generate PDF Document
    const win = window.open('', '_blank');
    if (!win) return alert("Veuillez autoriser les pop-ups pour voir le devis.");

    const styles = `
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .pdf-header { border-bottom: 2px solid #3D8BFF; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .pdf-header h1 { font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .hero-img { width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 40px; }
            h2, h3 { color: #3D8BFF; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px; font-size: 18px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; background: #f4f4f4; padding: 12px; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
            .pdf-footer { margin-top: 60px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } }
        </style>
    `;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Devis - ${title}</title>
            ${styles}
        </head>
        <body>
            <div class="pdf-header">
                <div>
                    <h1>UNIVERSAL FAB</h1>
                    <p style="margin: 5px 0 0 0;">Spécifications techniques du modèle ${title}</p>
                </div>
            </div>
            ${mainImg ? `<img src="${mainImg}" class="hero-img">` : ''}
            <div>
                ${clone.innerHTML}
            </div>
            <div class="pdf-footer">
                Ce document est un récapitulatif technique. Universal Fab - Design & Technologie.
            </div>
        </body>
        </html>
    `;

    win.document.write(htmlContent);
    win.document.close();

    // Small delay to ensure images load
    setTimeout(() => {
        win.focus();
        win.print();
    }, 800);
}
