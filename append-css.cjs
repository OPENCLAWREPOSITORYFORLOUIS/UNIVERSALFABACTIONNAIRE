const fs = require('fs');
const path = require('path');

const cssPath = path.join('c:\\Mes Sites Web\\onto universal\\ontooriginal', 'dist', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newCSS = `

/* --- UNIVERSAL FAB HEADER BUTTONS --- */
.ufab-nav-btn {
    margin-right: 12px;
    border-radius: 50px !important;
    padding: 12px 24px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    font-size: 13px !important;
    font-weight: bold !important;
    border: none !important;
    text-transform: uppercase;
    text-decoration: none !important;
    transition: all 0.3s ease;
    cursor: pointer;
}

.ufab-nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.ufab-btn-blue {
    background-color: #3D8BFF !important;
    color: #fff !important;
}
.ufab-btn-blue:hover {
    background-color: #2a75e6 !important;
    box-shadow: 0 6px 20px rgba(61,139,255,0.3);
}

.ufab-btn-dark {
    background-color: #111 !important;
    color: #fff !important;
}
.ufab-btn-dark:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.ufab-btn-light {
    background-color: #f1f1f1 !important;
    color: #111 !important;
    border: 1px solid #ddd !important;
}
.ufab-btn-light:hover {
    background-color: #e5e5e5 !important;
}

@media screen and (max-width: 768px) {
    .ufab-nav-btn {
        padding: 8px 16px !important;
        font-size: 11px !important;
        margin-right: 6px;
    }
}
`;

if (!cssContent.includes('.ufab-nav-btn')) {
    fs.appendFileSync(cssPath, newCSS, 'utf8');
    console.log('Appended UFAB button CSS to dist/index.css');
} else {
    console.log('UFAB button CSS already exists.');
}
