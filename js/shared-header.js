/**
 * shared-header.js - Universal Fab
 * Handles dynamic header updates and navigation logic.
 */

function updateHeader() {
    const headerMenu = document.querySelector('.header__menu');
    if (!headerMenu) return;

    const path = window.location.pathname.toLowerCase();
    
    // Skip if on the dashboard (it has its own specialized header logic)
    if (path.includes('espace-actionnaire')) return;

    // Check current page type
    const isHome = path === '' || path === '/' || path.includes('index.html');
    const isProjectDetail = path.includes('devis-automatique.html') || path.includes('chambre-froide.html') || path.includes('mobile-home.html');
    const isDevisSection = path.includes('devis-automatique.html');
    const isDevisRX = path.includes('devis-rx');

    // Build buttons using premium ufab classes
    const actionnaireBtn = `
        <a href="espace-actionnaire.html" class="ufab-nav-btn ufab-btn-blue">
            <span>ESPACE ACTIONNAIRE</span>
        </a>
    `;

    // Logic for the return/toggle button
    let returnLabel = 'RETOUR';
    let returnHref = 'index.html';

    if (isHome) {
        returnLabel = 'MODÈLES';
        returnHref = 'devis-automatique.html';
    } else if (isDevisRX) {
        returnHref = 'devis-automatique.html';
    } else if (isDevisSection || isProjectDetail) {
        returnHref = 'index.html';
    }

    const returnBtn = `
        <a href="${returnHref}" class="ufab-nav-btn ufab-btn-light" id="section-toggle">
            <span id="section-toggle-text">${returnLabel}</span>
        </a>
    `;

    headerMenu.innerHTML = actionnaireBtn + returnBtn;
    
    // Core visibility safety
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '1';
        header.style.visibility = 'visible';
        header.style.pointerEvents = 'auto';
    }
}

// Global scope access
window.updateHeader = updateHeader;

// Initialization
document.addEventListener('DOMContentLoaded', updateHeader);
window.addEventListener('load', updateHeader);
