function updateHeader() {
    const headerMenu = document.querySelector('.header__menu');
    if (!headerMenu) return;

    const path = window.location.pathname.toLowerCase();
    const isHome = path === '' || path === '/' || path.includes('index.html') || path.endsWith('/ontooriginal/');
    const isSelect = path.includes('select.html') || path.includes('vault.html') || path.includes('microsoft.html');
    const isDevisSection = path.includes('devis-automatique.html');
    const isDevisRX = path.includes('devis-rx');

    // Build buttons
    const actionnaireBtn = `
        <a href="espace-actionnaire.html" class="nos-produits-bubble actionnaire-btn" 
           style="margin-right: 12px; background-color: #3D8BFF !important; border-radius: 50px !important; padding: 12px 24px !important; color: #fff !important; display: inline-flex !important; align-items: center; justify-content: center; font-size: 13px !important; font-weight: bold !important; border:none !important;" 
           data-barba-prevent="self">
            <span>ESPACE ACTIONNAIRE</span>
        </a>
    `;

    const devisBtn = isSelect ? `
        <a href="devis-automatique.html" class="nos-produits-bubble devis-btn" 
           style="margin-right: 12px; background-color: #111 !important; border-radius: 50px !important; padding: 12px 24px !important; color: #fff !important; display: inline-flex !important; align-items: center; justify-content: center; font-size: 13px !important; font-weight: bold !important; border:none !important;">
            <span>CRÉEZ VOTRE DEVIS</span>
        </a>
    ` : '';

    let returnLabel = isHome ? 'Nos produits' : 'RETOUR';
    let returnHref = isHome ? 'devis-automatique.html' : (isDevisRX ? 'devis-automatique.html' : (isSelect ? 'work.html' : (isDevisSection ? 'select.html' : 'index.html')));

    const returnBtn = `
        <a href="${returnHref}" class="nos-produits-bubble return-btn" id="section-toggle"
           style="background-color: #f1f1f1 !important; color: #111 !important; border: 1px solid #ddd !important; border-radius: 50px !important; padding: 12px 24px !important; display: inline-flex !important; align-items: center; justify-content: center; font-size: 13px !important; font-weight: bold !important;">
            <span id="section-toggle-text">${returnLabel}</span>
        </a>
    `;

    headerMenu.innerHTML = actionnaireBtn + devisBtn + returnBtn;
    
    // Safety visibility
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '1';
        header.style.visibility = 'visible';
        header.style.pointerEvents = 'auto';
    }
}

// Global scope for immediate access
window.updateHeader = updateHeader;

// Initialization
document.addEventListener('DOMContentLoaded', updateHeader);
window.addEventListener('load', updateHeader);

// Barba support
if (typeof barba !== 'undefined') {
    barba.hooks.after(() => {
        updateHeader();
    });
}

// Remove the interval loop which causes freezes
// Instead, just run it once more after a short delay to catch late renders
setTimeout(updateHeader, 500);
