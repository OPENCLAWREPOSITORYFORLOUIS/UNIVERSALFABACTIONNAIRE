/**
 * dashboard.js - Universal Fab Dashboard Logic
 * Handles authentication, project rendering, investments, and payouts.
 */

var db;
const SUPABASE_URL  = 'https://exkofskxjvcuclyozlho.supabase.co';
const SUPABASE_ANON = 'sb_publishable_zWiaMU_WeuAbLjr1cHcgDg_wr79HXzE';

let currentUser   = null;
let currentProfile = { total_shares_count: 0, total_invested: 0, dividends_balance: 0 };
let selectedOperator = 'WAVE';

// Projects data
const PROJECTS = [
  {
    id: 'universal-fab',
    name: 'Universal Fab (Entreprise globale)',
    description: 'Investissement et achat d\'actions dans l\'entreprise Universal Fab (maison mère).',
    emoji: '🏭',
    price_per_share: 10000,
    min_shares: 0.01,
    target_shares: 5000,
    sold_shares: 0,
    status: 'Ouvert',
    roi: '',
  },
  {
    id: 'restaurant-50',
    name: 'Restaurants Mobiles',
    description: 'Déploiement stratégique de restaurants mobiles solaires au Sénégal.',
    emoji: '🍽️',
    price_per_share: 10000,
    min_shares: 0.01,
    target_shares: 500,
    sold_shares: 0,
    status: 'Ouvert',
    roi: '',
  }
];

// ─── INIT ───
window.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof supabase !== 'undefined') {
      db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    } else {
      console.error("Supabase library not loaded yet!");
      return;
    }
  } catch (e) {
    console.error("Supabase init failed:", e);
    return;
  }

  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await enterDashboard();
  }

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      await enterDashboard();
    }
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      document.getElementById('auth-screen').style.display = 'flex';
      document.getElementById('dashboard').style.display = 'none';
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    toast('Paiement reçu ! Vos actions seront attribuées dans quelques instants.', 'success');
    window.history.replaceState({}, '', window.location.pathname);
  }
  if (params.get('payment') === 'error') {
    toast('Le paiement a été annulé ou a échoué.', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }
});

// ─── AUTH ───
function toggleAuth() {
  const l = document.getElementById('login-form');
  const r = document.getElementById('register-form');
  l.style.display = l.style.display === 'none' ? 'block' : 'none';
  r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

async function doLogin() {
  const identifier = document.getElementById('login-id').value.trim();
  const pass = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.textContent = '';
  
  if (!identifier || !pass) return err.textContent = 'Remplissez tous les champs.';

  let isEmail = identifier.includes('@');
  let phone = !isEmail ? identifier.replace(/\s/g, '') : null;
  if (phone && !phone.startsWith('+')) phone = '+221' + phone;

  try {
    let res;
    if (isEmail) {
      res = await db.auth.signInWithPassword({ email: identifier, password: pass });
    } else {
      res = await db.auth.signInWithPassword({ phone, password: pass });
    }
    
    if (res.error) throw res.error;
    toast('Connexion réussie !', 'success');
  } catch (e) {
    err.textContent = "Identifiants incorrects. " + e.message;
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  let phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-password').value;
  const err = document.getElementById('reg-error');
  err.textContent = '';

  if (!email && !phone) return err.textContent = 'Veuillez renseigner au moins un E-mail ou un Téléphone.';
  if (!pass || pass.length < 8) return err.textContent = 'Le mot de passe doit faire au moins 8 caractères.';
  if (phone && !phone.startsWith('+')) phone = '+221' + phone.replace(/\s/g, '');

  try {
    let res;
    if (email) {
      res = await db.auth.signUp({ email, password: pass, options: { data: { full_name: name, phone: phone || null } } });
    } else {
      res = await db.auth.signUp({ phone, password: pass, options: { data: { full_name: name, email: null } } });
    }
    
    if (res.error) throw res.error;

    if (res.data && res.data.user) {
      await db.from('profiles').upsert({
        id: res.data.user.id,
        email: email || null,
        full_name: name,
        phone: phone || null,
        total_shares_count: 0, total_invested: 0, dividends_balance: 0
      });
    }

    toast('Compte créé avec succès ! Connectez-vous.', 'success');
    toggleAuth();
  } catch (e) {
    err.textContent = e.message;
  }
}

async function doLogout() {
  await db.auth.signOut();
  window.location.reload();
}

// ─── DASHBOARD ───
async function enterDashboard() {
  // 1. Show UI immediately
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  
  // 2. Render local projects immediately
  renderProjects();

  try {
    const identifier = currentUser.phone ? currentUser.phone : currentUser.email;
    const navEmail = document.getElementById('nav-email');
    if (navEmail) navEmail.textContent = identifier || 'Actionnaire';

    await loadProfile().catch(e => console.error("Profile load failed:", e));
    
    if (currentProfile) {
      const pName = document.getElementById('prof-name');
      const pEmail = document.getElementById('prof-email');
      const pPhone = document.getElementById('prof-phone');
      if (pName) pName.value = currentProfile.full_name || currentUser.user_metadata?.full_name || '';
      if (pEmail) pEmail.value = currentUser.email || currentProfile.email || '';
      if (pPhone) pPhone.value = currentUser.phone || currentProfile.phone || '';
    }

    await loadMyInvestments().catch(e => console.error("Investments load failed:", e));
    await loadPayoutHistory().catch(e => console.error("Payout history load failed:", e));
  } catch (err) {
    console.error("Dashboard entry details failed:", err);
  }
}

async function loadProfile() {
  const { data } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) currentProfile = data;

  const dividends = formatCFA(currentProfile.dividends_balance ?? 0);
  document.getElementById('withdraw-balance').textContent   = dividends;

  const total = currentProfile.total_shares_count ?? 0;
  unlockPerk('perk-2', 'perk-2-badge', total > 0, '✓ Débloqué', '🔒 Dès que vous êtes actionnaire');
  unlockPerk('perk-3', 'perk-3-badge', total >= 100, '✓ Débloqué', '🔒 Dès 100 actions');
  unlockPerk('perk-4', 'perk-4-badge', total >= 500, '✓ Débloqué', '🔒 Dès 500 actions');
}

function unlockPerk(cardId, badgeId, condition, yes, no) {
  const card  = document.getElementById(cardId);
  const badge = document.getElementById(badgeId);
  if (condition) {
    card.classList.add('unlocked');
    badge.className = 'perk-badge badge-unlocked';
    badge.textContent = yes;
  } else {
    card.classList.remove('unlocked');
    badge.className = 'perk-badge badge-locked';
    badge.textContent = no;
  }
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  PROJECTS.forEach(p => {
    const pct = Math.min(100, ((p.sold_shares || 0) / p.target_shares) * 100).toFixed(0);
    grid.innerHTML += `
      <div class="project-card">
        <div class="project-img">${p.emoji}<span class="project-badge">${p.status}</span></div>
        <div class="project-body">
          <div class="project-name">${p.name}</div>
          <div class="project-desc">${p.description}</div>
          <div class="project-stats">
            <div><div class="project-stat-label">Prix/Action</div><div class="project-stat-val">${formatCFA(p.price_per_share)}</div></div>
            ${p.roi ? `<div><div class="project-stat-label">ROI Estimé</div><div class="project-stat-val" style="color:var(--success)">${p.roi}</div></div>` : ''}
            <div><div class="project-stat-label">Min. d'Achat</div><div class="project-stat-val">${p.min_shares} Actions</div></div>
            <div><div class="project-stat-label">Min. en FCFA</div><div class="project-stat-val">${formatCFA(p.price_per_share * p.min_shares)}</div></div>
          </div>
          <div class="project-stat-label" style="margin-bottom:8px">Progression — ${pct}%</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="invest-row">
            <div class="invest-input-wrap"><input type="number" class="invest-input" id="inv-${p.id}" placeholder="${formatNum(p.price_per_share * p.min_shares)} min." min="${p.price_per_share * p.min_shares}" step="${p.price_per_share}"><span class="invest-currency">FCFA</span></div>
            <button class="btn btn-primary btn-sm" style="white-space:nowrap; min-width:120px" onclick="doInvest('${p.id}', '${p.name}')">Investir →</button>
          </div>
        </div>
      </div>`;
  });
}

async function doInvest(projectId, projectName) {
  if (!currentUser) return;
  const amountInput = document.getElementById(`inv-${projectId}`);
  const amount = parseInt(amountInput.value);
  const project = PROJECTS.find(p => p.id === projectId);
  if (!amount || isNaN(amount)) { toast('Entrez un montant à investir.', 'error'); return; }
  
  try {
    const res = await fetch('/api/create-paytech-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ amount, projectId, projectName, userId: currentUser.id }),
    });
    const data = await res.json();
    if (data.redirect_url) {
      // Create pending investment record
      await db.from('investments').insert({
        user_id: currentUser.id,
        project_id: projectId,
        order_id: data.token, // Store token to match with IPN later
        amount_paid: amount,
        shares_count: amount / (project?.price_per_share || 10000),
        status: 'pending',
      });
      window.location.href = data.redirect_url;
    } else {
      toast('Erreur PayTech: ' + (data.error || 'Vérifiez vos clés API'), 'error');
    }
  } catch (e) {
    toast('Erreur Réseau: ' + e.message, 'error');
  }
}

async function loadMyInvestments() {
  const { data } = await db.from('investments').select('*, projects(name)').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (!data || data.length === 0) return;

  const grouped = {};
  data.forEach(inv => {
    const key = inv.project_id;
    if (!grouped[key]) grouped[key] = { name: inv.projects?.name || inv.project_id, shares: 0, invested: 0 };
    grouped[key].shares   += inv.shares_count || 0;
    grouped[key].invested += inv.amount_paid  || 0;
  });

  const section = document.getElementById('my-investments-section');
  const list    = document.getElementById('my-investments-list');
  section.style.display = 'block';
  list.innerHTML = Object.entries(grouped).map(([, g]) => `
    <div class="my-inv-row">
      <div><div class="my-inv-name">${g.name}</div><div class="my-inv-detail">Investi : ${formatCFA(g.invested)}</div></div>
      <div class="my-inv-shares">${formatNum(g.shares, 4)} Actions</div>
    </div>`).join('');
}

async function loadPayoutHistory() {
  const { data } = await db.from('payouts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  const wrap = document.getElementById('payout-history-wrap');
  if (!data || data.length === 0) return;
  wrap.innerHTML = `<table class="history-table">
    <thead><tr><th>Date</th><th>Montant</th><th>Operateur</th><th>Statut</th></tr></thead>
    <tbody>${data.map(p => `<tr><td>${new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td>${formatCFA(p.amount)}</td><td>${p.operator || '—'}</td><td><span class="status-pill ${p.status === 'paid' ? 'pill-paid' : 'pill-pending'}">${p.status === 'paid' ? 'Payé' : 'En cours'}</span></td></tr>`).join('')}</tbody>
  </table>`;
}

function selectOp(el) {
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  selectedOperator = el.dataset.op;
}

async function doWithdraw() {
  const rawPhone = document.getElementById('phone-number').value.trim();
  const amount = parseInt(document.getElementById('withdraw-amount').value);
  const errEl  = document.getElementById('withdraw-error');
  errEl.textContent = '';
  
  if (!rawPhone || !amount || amount < 1000) { errEl.textContent = 'Vérifiez les champs (Montant min. 1000).'; return; }

  // Auto-detect operator
  let phone = rawPhone.replace(/\s/g, '');
  if (!phone.startsWith('+')) phone = '+221' + phone;
  
  const prefix = phone.substring(4, 6); // Get 77, 78, 76, etc.
  let detectedOp = 'WAVE'; // Default
  if (['77', '78'].includes(prefix)) detectedOp = 'ORANGE_MONEY';
  else if (['76'].includes(prefix)) detectedOp = 'FREE_MONEY';
  else if (['72'].includes(prefix)) detectedOp = 'EXPRESSO';
  else detectedOp = 'WAVE'; 

  console.log('Detected Operator:', detectedOp, 'for prefix:', prefix);
  
  try {
    const res = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, amount, phoneNumber: phone, phoneOperator: detectedOp }),
    });
    const data = await res.json();
    if (data.success) {
      toast('Retrait en cours !', 'success');
      await loadProfile(); await loadPayoutHistory();
    } else {
      errEl.textContent = data.error || 'Erreur retrait.';
    }
  } catch (e) {
    errEl.textContent = 'Erreur réseau.';
  }
}

async function updateProfile() {
  const newEmail = document.getElementById('prof-email').value.trim();
  const newPhone = document.getElementById('prof-phone').value.trim();
  const newName = document.getElementById('prof-name').value.trim();
  
  let fPhone = newPhone;
  if (fPhone && !fPhone.startsWith('+')) fPhone = '+221' + fPhone.replace(/\s/g, '');

  try {
    const updates = {};
    if (newEmail && newEmail !== currentUser.email) updates.email = newEmail;
    if (fPhone && fPhone !== currentUser.phone) updates.phone = fPhone;
    if (Object.keys(updates).length > 0) await db.auth.updateUser(updates);

    await db.from('profiles').update({ full_name: newName, email: newEmail, phone: fPhone }).eq('id', currentUser.id);
    toast("Profil mis à jour !", "success");
  } catch (e) {
    toast(e.message, "error");
  }
}

function formatCFA(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n); }
function formatNum(n, dec = 0) { return parseFloat(n).toFixed(dec).replace(/\.?0+$/, ''); }
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`; el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// Map functions to window for Vite inline onclick handler compatibility
window.toggleAuth = toggleAuth;
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.doInvest = doInvest;
window.selectOp = selectOp;
window.doWithdraw = doWithdraw;
window.updateProfile = updateProfile;
