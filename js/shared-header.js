function updateHeader() {
    const headerMenu = document.querySelector('.header__menu');
    if (!headerMenu) return;

    const path = window.location.pathname.toLowerCase();
    const isHome = path === '' || path === '/' || path.includes('index.html') || path.endsWith('/ontooriginal/') || path.endsWith('.com/');
    const isSelect = path.includes('select.html') || path.includes('vault.html') || path.includes('microsoft.html');
    const isDevisSection = path.includes('devis-automatique.html');
    const isDevisRX = path.includes('devis-rx');

    // Build buttons using ONLY classes. The style overrides are now in dist/index.css
    const actionnaireBtn = `
        <a href="espace-actionnaire.html" class="ufab-nav-btn ufab-btn-blue" data-barba-prevent="self">
            <span>ESPACE ACTIONNAIRE</span>
        </a>
    `;

    const devisBtn = isSelect ? `
        <a href="devis-automatique.html" class="ufab-nav-btn ufab-btn-dark">
            <span>CRÉEZ VOTRE DEVIS</span>
        </a>
    ` : '';

    let returnLabel = isHome ? 'Nos produits' : 'RETOUR';
    let returnHref = isHome ? 'devis-automatique.html' : (isDevisRX ? 'devis-automatique.html' : (isSelect ? 'work.html' : (isDevisSection ? 'select.html' : 'index.html')));

    const returnBtn = `
        <a href="${returnHref}" class="ufab-nav-btn ufab-btn-light" id="section-toggle">
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

// Barba SPA support
if (typeof barba !== 'undefined') {
    barba.hooks.after(() => {
        updateHeader();
    });
}
