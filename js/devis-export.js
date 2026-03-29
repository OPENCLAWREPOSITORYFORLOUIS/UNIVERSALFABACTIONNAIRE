function exportToPDF() {
    // 1. Identification du modèle
    const title = document.querySelector('h1')?.innerText || 'Devis Universal Fab';
    const mainImgSrc = document.querySelector('.img img')?.src || ''; // Capture de l'image du produit
    
    // 2. Préparation de la section config
    const configSection = document.getElementById('rx-config');
    if (!configSection) return alert("Erreur: Section de configuration non trouvée.");

    // Cloner la section pour manipulations PDF
    const clone = configSection.cloneNode(true);
    
    // Nettoyage : retirer les boutons et éléments inutiles
    clone.querySelectorAll('button').forEach(b => b.remove());

    // Transformation des sélections (OUI / NON) et des types "Base"
    const realRows = configSection.querySelectorAll('tr');
    const cloneRows = clone.querySelectorAll('tr');
    
    realRows.forEach((row, i) => {
        const input = row.querySelector('input[type="checkbox"]');
        const cloneTd = cloneRows[i]?.querySelector('td:last-child');
        
        if (cloneTd) {
            if (input) {
                // Remplacer checkbox par texte propre sans crochets
                cloneTd.innerHTML = input.checked 
                    ? '<span style="color:#2ecc71; font-weight:bold;">OUI</span>' 
                    : '<span style="color:#e74c3c;">NON</span>';
            } else {
                // Remplacer "Base" par "INCLUS" si c'est un équipement de série
                const baseSpan = row.querySelector('.rx-base');
                if (baseSpan) {
                    cloneTd.innerHTML = '<span style="color:#111; font-weight:bold;">INCLUS</span>';
                }
            }
        }
    });

    // 3. Fenêtre d'impression
    const win = window.open('', '_blank');
    if (!win) return alert("Veuillez autoriser les pop-ups pour générer le devis.");

    const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Devis - ${title}</title>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 50px; color: #111; background:#fff; line-height: 1.5; }
                .header { border-bottom: 3px solid #3D8BFF; padding-bottom: 25px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: flex-end; }
                .header-left h1 { font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                .header-left p { margin: 8px 0 0 0; color: #3D8BFF; font-weight: bold; font-size: 16px; }
                .hero-img { width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 40px; border: 1px solid #eee; }
                
                h2 { color: #3D8BFF; margin-top: 40px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; background: #fafafa; padding: 12px 15px; font-size: 11px; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; }
                td { padding: 18px 15px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
                
                .footer { margin-top: 80px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 30px; letter-spacing: 0.5px; }
                
                @media print { 
                    body { padding: 20px; } 
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-left">
                    <h1>UNIVERSAL FAB</h1>
                    <p>DEVIS TECHNIQUE - ${title}</p>
                </div>
                <div style="text-align:right; font-size: 12px; color: #999;">
                    Document généré le ${new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>

            ${mainImgSrc ? `<img src="${mainImgSrc}" class="hero-img" alt="Aperçu modèle">` : ''}

            <p style="font-size: 14px; max-width: 600px; margin-bottom: 30px;">
                Ce document récapitule la configuration et les équipements sélectionnés pour votre restaurant mobile Universal Fab.
            </p>

            <div class="pdf-content">
                ${clone.innerHTML}
            </div>

            <div class="footer">
                © ${new Date().getFullYear()} UNIVERSAL FAB. Ce devis est fourni à titre indicatif et ne vaut pas bon de commande final. <br>
                Contactez notre département commercial pour une offre ferme et définitive.
            </div>
        </body>
        </html>
    `;

    win.document.write(pdfHtml);
    win.document.close();
    
    // Fix du freeze barbalogo/gsap : Focus sur la nouvelle fenêtre avant print
    setTimeout(() => {
        win.focus();
        win.print();
        // Optionnel : fermer automatiquement après impression (certains navigateurs bloquent)
        // win.close(); 
    }, 800);
}

// Global scope
window.exportToPDF = exportToPDF;
