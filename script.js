/* filepath: /Users/laurentiubalasa/Documents/Goal/script.js */
const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ===== HAMBURGER MENU =====
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const closeBtn = document.getElementById('mobile-menu-close');

const closeMenu = () => {
  hamburgerBtn.classList.remove('active');
  mobileMenu.classList.remove('is-active');
  
  // Reset all dropdowns
  document.querySelectorAll('.mobile-submenu.active').forEach(menu => {
    menu.classList.remove('active');
  });
  document.querySelectorAll('.mobile-menu-toggle').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
};

if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', function() {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('is-active');
  });

  // Close button handler
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Handle dropdown toggles
  const toggleButtons = mobileMenu.querySelectorAll('.mobile-menu-toggle');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const submenu = this.nextElementSibling;
      const isActive = submenu.classList.contains('active');
      
      // Close all other submenus
      document.querySelectorAll('.mobile-submenu.active').forEach(menu => {
        if (menu !== submenu) {
          menu.classList.remove('active');
          menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle current submenu
      submenu.classList.toggle('active');
      this.setAttribute('aria-expanded', !isActive);
    });
  });

  // Close menu when a link is clicked
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', function() {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!mobileMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
      closeMenu();
    }
  });
}

// ===== BEFORE & AFTER REVEAL =====
(function() {
  const card = document.getElementById('ba-card');
  const btn = document.getElementById('ba-btn');
  const tag = document.getElementById('ba-tag');
  const btnText = document.getElementById('ba-btn-text');
  const tapHint = document.getElementById('ba-tap-hint');
  if (!card || !btn) return;

  let isAfter = false;
  let animating = false;

  function toggle() {
    if (animating) return;
    animating = true;

    if (tapHint) tapHint.style.opacity = '0';

    if (!isAfter) {
      card.classList.remove('unrevealing');
      card.classList.add('revealed');
      tag.textContent = 'Efter';
      btnText.textContent = 'Visa före';
    } else {
      card.classList.remove('revealed');
      card.classList.add('unrevealing');
      tag.textContent = 'Före';
      btnText.textContent = 'Visa efter';
    }

    isAfter = !isAfter;
    setTimeout(function() { animating = false; }, 800);
  }

  btn.addEventListener('click', toggle);
  card.addEventListener('click', toggle);
})();

// ===== COMPARISON TABLE INTERACTIVE =====
(function() {
  const table = document.getElementById('compare-table');
  if (!table) return;

  const rows = table.querySelectorAll('.compare-row[data-edge]');
  const verdict = document.getElementById('compare-verdict');
  const verdictText = verdict ? verdict.querySelector('.compare-verdict-text') : null;
  const tip = document.getElementById('compare-tip');

  let revealedCount = 0;
  const totalRows = rows.length;

  function updateVerdict() {
    if (revealedCount === 0) return;

    if (revealedCount < totalRows) {
      const remaining = totalRows - revealedCount;
      verdictText.textContent = `${revealedCount} av ${totalRows} jämförda – klicka vidare för att se alla`;
    } else {
      // All revealed – show gentle conclusion
      verdict.classList.add('complete');
      verdictText.innerHTML = `Tack för att du utforskade! Båda är bra lösningar – men med längre livslängd, mindre underhåll och lägre totalkostnad är bandtäckning ofta det tryggaste valet.`;

      // Show the CTA tip
      if (tip) {
        setTimeout(function() { tip.classList.add('visible'); }, 600);
      }
    }
  }

  rows.forEach(row => {
    row.addEventListener('click', function() {
      if (this.classList.contains('revealed')) return;

      this.classList.add('revealed');
      revealedCount++;

      const edge = this.getAttribute('data-edge');
      if (edge === 'band') {
        this.classList.add('edge-band');
      } else if (edge === 'pann') {
        this.classList.add('edge-pann');
      }

      updateVerdict();
    });
  });
})();

// ===== HERO NOTE CTA BUTTON =====
const heroNote = document.querySelector('.hero-note');
if (heroNote) {
  heroNote.style.cursor = 'pointer';
  heroNote.addEventListener('click', function() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ===== CONTACT NAVIGATION =====
// Handle navigation to contact form with centered positioning
document.addEventListener('DOMContentLoaded', function() {
  // Always scroll to top first
  window.scrollTo(0, 0);
  
  // Then, if navigating to contact, scroll there after a delay
  if (window.location.hash === '#contact') {
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const contactTop = contactSection.offsetTop;
        const contactHeight = contactSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate position to center the contact section
        const targetScroll = contactTop + (contactHeight / 2) - (viewportHeight / 2);
        
        window.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }, 100);
  }
});

// ===== ACCORDION =====
const accordionItems = document.querySelectorAll('.accordion-item');
accordionItems.forEach(item => {
  item.addEventListener('click', function() {
    accordionItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });
    item.classList.toggle('active');
  });
});

// ===== STEP DETAILS =====
// Removed - step section is now static without expandable details

// ===== FEROTECT COOKIE CONSENT =====
function initCookieBanner() {
  // If old cookie banner HTML exists, remove it
  const oldBanner = document.getElementById('cookie-banner');
  if (oldBanner) oldBanner.remove();
  const oldOverlay = document.getElementById('cookie-overlay');
  if (oldOverlay) oldOverlay.remove();

  const STORAGE_KEY = 'fc_consent';
  const EXPIRY_DAYS = 180;

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > EXPIRY_DAYS * 86400000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch(e) { return null; }
  }

  function saveConsent(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      necessary: true,
      analytics: prefs.analytics || false,
      marketing: prefs.marketing || false,
      functional: prefs.functional || false,
      timestamp: Date.now()
    }));
  }

  // Already consented? Just show reopen button
  if (getConsent()) {
    injectReopenButton();
    return;
  }

  // Build + inject banner HTML
  const wrapper = document.createElement('div');
  wrapper.id = 'fc-cookie-root';
  wrapper.innerHTML = `
    <div class="fc-overlay" id="fc-overlay"></div>
    <div class="fc-banner" id="fc-banner">
      <div class="fc-banner-inner">
        <div class="fc-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
            <circle cx="8.5" cy="8.5" r="1"/><circle cx="10.5" cy="15.5" r="1"/><circle cx="15.5" cy="12.5" r="1"/>
            <circle cx="7" cy="12" r="0.5" fill="currentColor"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="fc-text">
          <h3>Vi värnar om din integritet</h3>
          <p>Vi använder cookies för att optimera din upplevelse, analysera trafik och anpassa innehåll. Du väljer själv vilka du vill tillåta. <a href="anvandarvillkor.html">Läs mer</a></p>
        </div>
        <div class="fc-actions">
          <button class="fc-btn fc-btn-accept" id="fc-accept">Godkänn alla</button>
          <button class="fc-btn fc-btn-settings" id="fc-open-settings">Anpassa</button>
          <button class="fc-btn fc-btn-reject" id="fc-reject">Avvisa</button>
        </div>
      </div>
    </div>

    <div class="fc-panel" id="fc-panel">
      <div class="fc-panel-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Cookie-inställningar
        </h2>
        <button class="fc-panel-close" id="fc-panel-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="fc-panel-body">
        <p class="fc-panel-intro">Här kan du styra exakt vilka cookies som används. Nödvändiga cookies krävs för att sidan ska fungera och kan inte stängas av.</p>

        <div class="fc-category">
          <div class="fc-category-top">
            <div class="fc-category-info">
              <p class="fc-category-name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Nödvändiga
                <span class="fc-badge fc-badge-required">Alltid aktiva</span>
              </p>
              <p class="fc-category-desc">Krävs för grundläggande funktionalitet som sidnavigering, formulär och säkerhet. Utan dessa fungerar inte webbplatsen.</p>
            </div>
            <label class="fc-toggle">
              <input type="checkbox" checked disabled data-category="necessary">
              <span class="fc-toggle-track"></span>
            </label>
          </div>
        </div>

        <div class="fc-category">
          <div class="fc-category-top">
            <div class="fc-category-info">
              <p class="fc-category-name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                Analys &amp; statistik
              </p>
              <p class="fc-category-desc">Hjälper oss förstå hur besökare använder sidan så vi kan förbättra upplevelsen. Data är anonymiserad.</p>
            </div>
            <label class="fc-toggle">
              <input type="checkbox" id="fc-toggle-analytics" data-category="analytics">
              <span class="fc-toggle-track"></span>
            </label>
          </div>
        </div>

        <div class="fc-category">
          <div class="fc-category-top">
            <div class="fc-category-info">
              <p class="fc-category-name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                Funktionella
              </p>
              <p class="fc-category-desc">Möjliggör förbättrad funktionalitet som livechatt, videoklipp och personliga inställningar.</p>
            </div>
            <label class="fc-toggle">
              <input type="checkbox" id="fc-toggle-functional" data-category="functional">
              <span class="fc-toggle-track"></span>
            </label>
          </div>
        </div>

        <div class="fc-category">
          <div class="fc-category-top">
            <div class="fc-category-info">
              <p class="fc-category-name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Marknadsföring
              </p>
              <p class="fc-category-desc">Används för att visa relevanta annonser och mäta kampanjresultat. Delas med utvalda annonseringspartners.</p>
            </div>
            <label class="fc-toggle">
              <input type="checkbox" id="fc-toggle-marketing" data-category="marketing">
              <span class="fc-toggle-track"></span>
            </label>
          </div>
        </div>
      </div>
      <div class="fc-panel-footer">
        <button class="fc-btn fc-btn-deny-all" id="fc-deny-all">Avvisa alla</button>
        <button class="fc-btn fc-btn-save" id="fc-save">Spara mina val</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // Elements
  const overlay = document.getElementById('fc-overlay');
  const banner = document.getElementById('fc-banner');
  const panel = document.getElementById('fc-panel');
  const btnAccept = document.getElementById('fc-accept');
  const btnReject = document.getElementById('fc-reject');
  const btnSettings = document.getElementById('fc-open-settings');
  const btnPanelClose = document.getElementById('fc-panel-close');
  const btnSave = document.getElementById('fc-save');
  const btnDenyAll = document.getElementById('fc-deny-all');

  // Show banner after short delay
  setTimeout(() => {
    banner.classList.add('fc-visible');
    overlay.classList.add('fc-visible');
  }, 800);

  function hideBanner() {
    banner.classList.remove('fc-visible');
    overlay.classList.remove('fc-visible');
    panel.classList.remove('fc-visible');
    setTimeout(() => injectReopenButton(), 600);
  }

  function openPanel() {
    panel.classList.add('fc-visible');
    banner.classList.remove('fc-visible');
  }

  function closePanel() {
    panel.classList.remove('fc-visible');
    banner.classList.add('fc-visible');
  }

  function getToggles() {
    return {
      analytics: document.getElementById('fc-toggle-analytics').checked,
      functional: document.getElementById('fc-toggle-functional').checked,
      marketing: document.getElementById('fc-toggle-marketing').checked
    };
  }

  // Accept all
  btnAccept.addEventListener('click', () => {
    saveConsent({ analytics: true, functional: true, marketing: true });
    hideBanner();
  });

  // Reject
  btnReject.addEventListener('click', () => {
    saveConsent({ analytics: false, functional: false, marketing: false });
    hideBanner();
  });

  // Settings
  btnSettings.addEventListener('click', openPanel);

  // Panel close
  btnPanelClose.addEventListener('click', closePanel);

  // Save preferences
  btnSave.addEventListener('click', () => {
    saveConsent(getToggles());
    hideBanner();
  });

  // Deny all from panel
  btnDenyAll.addEventListener('click', () => {
    saveConsent({ analytics: false, functional: false, marketing: false });
    hideBanner();
  });

  // Overlay click closes panel back to banner
  overlay.addEventListener('click', () => {
    if (panel.classList.contains('fc-visible')) {
      closePanel();
    }
  });

  function injectReopenButton() {
    if (document.getElementById('fc-reopen')) return;
    const btn = document.createElement('button');
    btn.id = 'fc-reopen';
    btn.className = 'fc-reopen';
    btn.setAttribute('aria-label', 'Cookie-inställningar');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="10.5" cy="15.5" r="1"/><circle cx="15.5" cy="12.5" r="1"/></svg>';
    document.body.appendChild(btn);
    setTimeout(() => btn.classList.add('fc-visible'), 100);
    btn.addEventListener('click', () => {
      btn.classList.remove('fc-visible');
      setTimeout(() => { btn.remove(); }, 400);
      // Re-show banner
      let root = document.getElementById('fc-cookie-root');
      if (!root) {
        // Re-init if root was removed
        localStorage.removeItem(STORAGE_KEY);
        initCookieBanner();
        return;
      }
      const b = document.getElementById('fc-banner');
      const o = document.getElementById('fc-overlay');
      if (b && o) {
        b.classList.add('fc-visible');
        o.classList.add('fc-visible');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Always scroll to top first
  window.scrollTo(0, 0);
  
  // Then, if navigating to contact, scroll there after a delay
  if (window.location.hash === '#contact') {
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const contactTop = contactSection.offsetTop;
        const contactHeight = contactSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate position to center the contact section
        const targetScroll = contactTop + (contactHeight / 2) - (viewportHeight / 2);
        
        window.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }, 100);
  }
  
  // Initialize cookie banner
  initCookieBanner();
});

// ===== FORM SUBMISSION =====
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      service: formData.get('service'),
      message: formData.get('message'),
      timestamp: new Date().toLocaleString('sv-SE')
    };
    
    // Send via fetch to FormSubmit
    fetch('https://formsubmit.co/ajax/laubalasa8@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(json => {
      alert('Tack för din förfrågan! Vi återkommer inom 1 arbetsdag.');
      form.reset();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Tack för din förfrågan! Vi återkommer inom 1 arbetsdag.');
      form.reset();
    });
  });
}

// ===== FADE IN OBSERVER =====
const fadeElems = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
fadeElems.forEach(el => fadeObserver.observe(el));

// ===== STATS COUNTER =====
const statsSection = document.getElementById('stats');
const statNumbers = document.querySelectorAll('.stat-number');
let statsStarted = false;

function startCounters() {
  statNumbers.forEach(numEl => {
    const target = parseInt(numEl.getAttribute('data-target'), 10);
    let current = 0;
    const duration = 1500;
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(progress * target);
      numEl.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        numEl.textContent = target;
      }
    }
    requestAnimationFrame(update);
  });
}

const statsObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsStarted) {
      statsStarted = true;
      startCounters();
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('animate-fill');
        }, index * 150);
      });
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
if (statsSection) {
  statsObserver.observe(statsSection);
}

// ===== HEADER SCROLL =====
const header = document.querySelector('header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===== PANNMODELLER & FÄRGER INTERACTIVE SELECTOR =====
const pannmodellerData = {
  spansk: {
    name: 'Dubbelkupig Takpanna',
    description: 'Ett säkert val som håller över tid. Den dubbelkupiga betongpannan kombinerar klassisk form med modern funktion. De mjuka kuporna ger taket ett levande uttryck samtidigt som konstruktionen leder bort regn och smältvatten effektivt. Ett pålitligt och stilrent val som passar lika bra på traditionella villor som på moderna bostäder.',
    image: 'clara1.png',
    färger: [
      { name: 'Svart Granit', color: '#2a2a2a', ral: 'RAL 9005', desc: 'Elegant svart med granit-finish. Modernt och tidlöst val som passar många husstil.' },
      { name: 'Brun', color: '#6d4c3d', ral: 'RAL 8003', desc: 'Varm jordnära brun ton som skapar en klassisk och naturlig känsla.' },
      { name: 'Grön', color: '#3d6b2d', ral: 'RAL 6035', desc: 'Naturnära mörkgrön som harmoniserar perfekt med omgivningen.' },
      { name: 'Tegelröd', color: '#a44536', ral: 'RAL 3012', desc: 'Klassisk tegelröd som passar traditionella svenska villor utmärkt.' },
      { name: 'Röd', color: '#c84c2a', ral: 'RAL 3020', desc: 'Levande röd färg som ger ett klassiskt och varmt intryck.' },
      { name: 'Mellangrå', color: '#7a8285', ral: 'RAL 7030', desc: 'Neutral mellangrå som passar moderna och klassiska hus lika väl.' },
      { name: 'Vinröd', color: '#7d2f47', ral: 'RAL 3005', desc: 'Djup vinröd som skapar elegans och klassisk skönhet.' },
      { name: 'Ljusgrå', color: '#a8b0b5', ral: 'RAL 7035', desc: 'Ljus silvergrå som ger ett luftigt och modernt uttryck.' },
      { name: 'Mörkgrå', color: '#4a5360', ral: 'RAL 7016', desc: 'Mörkgrå med elegant kantslip för ett sofistikerat utseende.' }
    ]
  },
  nederländsk: {
    name: 'Enkupig Takpanna',
    description: 'Enkupig takpanna – modernt och stilrent. Den enkupiga takpannan har en rak och enkel form som ger huset ett modernt utseende. Den passar dig som vill ha ett stilrent tak med tydliga linjer och ett lugnt helhetsintryck. Ett populärt val vid nybyggen och moderna hus.',
    image: 'clara2.png',
    färger: [
      { name: 'Svart Granit', color: '#2a2a2a', ral: 'RAL 9005', desc: 'Rent och modernt med granit-finish. Perfekt för moderna byggen.' },
      { name: 'Brun', color: '#6d4c3d', ral: 'RAL 8003', desc: 'Varm brun ton som ger en naturlig och inviterande känsla.' },
      { name: 'Grön', color: '#3d6b2d', ral: 'RAL 6035', desc: 'Mörkgrön för ekodesign och naturharmoni.' },
      { name: 'Tegelröd', color: '#a44536', ral: 'RAL 3012', desc: 'Klassisk tegelröd i modern pannform.' },
      { name: 'Röd', color: '#c84c2a', ral: 'RAL 3020', desc: 'Kraftfull röd som skapar stark visuell effekt.' },
      { name: 'Mellangrå', color: '#7a8285', ral: 'RAL 7030', desc: 'Balanserad grå ton som passar modernt och klassiskt.' },
      { name: 'Vinröd', color: '#7d2f47', ral: 'RAL 3005', desc: 'Sofistikerad vinröd för exklusiv design.' },
      { name: 'Ljusgrå', color: '#a8b0b5', ral: 'RAL 7035', desc: 'Ljus grå som skapar ett luftigt nordiskt intryck.' },
      { name: 'Mörkgrå', color: '#4a5360', ral: 'RAL 7016', desc: 'Mörkgrå för ett modern och diskret uttryck.' }
    ]
  },
  fransk: {
    name: 'Lertegel Takpanna',
    description: 'Lertegelpanna – klassiskt och levande tak. Lertegelpannor ger huset ett tidlöst och naturligt utseende. Den varma färgen och de mjuka formerna gör att taket får liv och karaktär som bara blir finare med åren. Ett självklart val för dig som vill ha ett klassiskt, gediget och mer exklusivt tak.',
    image: 'clara3.jpg',
    färger: [
      { name: 'Svart Granit', color: '#2a2a2a', ral: 'RAL 9005', desc: 'Klassisk svart granit för ultimate elegans.' },
      { name: 'Brun', color: '#6d4c3d', ral: 'RAL 8003', desc: 'Varm brun för klassiska gamla villor.' },
      { name: 'Grön', color: '#3d6b2d', ral: 'RAL 6035', desc: 'Naturnära grön för klassisk harmoni.' },
      { name: 'Tegelröd', color: '#a44536', ral: 'RAL 3012', desc: 'Varm tegelröd för gamla svenska gårdar.' },
      { name: 'Röd', color: '#c84c2a', ral: 'RAL 3020', desc: 'Klassisk röd som passar perfekt på franska pannor.' },
      { name: 'Mellangrå', color: '#7a8285', ral: 'RAL 7030', desc: 'Elegant mellangrå för klassisk elegans.' },
      { name: 'Vinröd', color: '#7d2f47', ral: 'RAL 3005', desc: 'Djup vinröd för ultimate klassisk skönhet.' },
      { name: 'Ljusgrå', color: '#a8b0b5', ral: 'RAL 7035', desc: 'Ljus silvergrå för sofistikerat uttryck.' },
      { name: 'Mörkgrå', color: '#4a5360', ral: 'RAL 7016', desc: 'Mörkgrå för raffinerad klassisk design.' }
    ]
  }
};

// Initialize pannmodeller selector
document.addEventListener('DOMContentLoaded', function() {
  initPannmodellerSelector();
});

function initPannmodellerSelector() {
  const pannmodellBtns = document.querySelectorAll('.pannmodell-btn');
  
  if (!pannmodellBtns.length) return;

  // Set initial model
  updatePannmodell('spansk');

  // Add click handlers to pannmodell buttons
  pannmodellBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      pannmodellBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const model = this.dataset.model;
      updatePannmodell(model);
    });
  });
}

function updatePannmodell(model) {
  const data = pannmodellerData[model];
  if (!data) return;

  // Update model name and description
  const nameElement = document.getElementById('selectedModelName');
  const descElement = document.getElementById('selectedModelDescription');
  const imageElement = document.getElementById('previewHouseImage');
  
  if (nameElement) nameElement.textContent = data.name;
  if (descElement) descElement.textContent = data.description;

  // Update preview image
  if (imageElement) imageElement.src = data.image;
}


// ===== CALL FORM =====
const callForm = document.getElementById('call-phone');
const callSubmit = document.querySelector('.call-form-submit');
const callConsent = document.getElementById('call-consent');

if (callSubmit) {
  callSubmit.addEventListener('click', function() {
    const phone = callForm.value.trim();
    if (!phone) {
      alert('Vänligen fyll i ditt telefonnummer.');
      callForm.focus();
      return;
    }
    if (!callConsent.checked) {
      alert('Vänligen acceptera integritetspolicyn.');
      return;
    }
    alert(`Tack! Vi ringer dig på ${phone} inom 24 timmar.`);
    callForm.value = '';
    callConsent.checked = false;
  });

  callForm.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      callSubmit.click();
    }
  });
}

// ===== TAKPANNOR SHOWCASE BEFORE/AFTER =====
document.addEventListener('DOMContentLoaded', function() {
  const showcaseImage = document.getElementById('showcaseImage');
  const showcaseLabel = document.getElementById('showcaseLabel');

  if (showcaseImage) {
    const showcaseData = [
      {
        image: 'before.png',
        label: 'FÖRE'
      },
      {
        image: 'after.png',
        label: 'EFTER'
      }
    ];

    let currentIndex = 0;
    
    function updateShowcase() {
      const data = showcaseData[currentIndex];
      showcaseImage.style.opacity = '0';
      
      setTimeout(() => {
        showcaseImage.src = data.image;
        showcaseLabel.textContent = data.label;
        showcaseImage.style.opacity = '1';
      }, 300);
    }

    // Change image every 4 seconds automatically
    setInterval(() => {
      currentIndex = (currentIndex + 1) % showcaseData.length;
      updateShowcase();
    }, 4000);
  }
});

// ===== MATERIALS SELECTOR =====
document.addEventListener('DOMContentLoaded', function() {
  const materialButtons = document.querySelectorAll('.material-btn');
  const materialItems = document.querySelectorAll('.material-item');

  if (materialButtons.length > 0 && materialItems.length > 0) {
    materialButtons.forEach(button => {
      button.addEventListener('click', function() {
        const materialType = this.getAttribute('data-material');
        
        // Remove active class from all buttons and items
        materialButtons.forEach(btn => btn.classList.remove('active'));
        materialItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked button and corresponding item
        this.classList.add('active');
        const activeItem = document.querySelector(`.material-item[data-material="${materialType}"]`);
        if (activeItem) {
          activeItem.classList.add('active');
        }
      });
    });
  }
});

// ===== TAKPANNEPLÅT COMPARISON SLIDER =====
(function() {
  const slider = document.getElementById('tpp-slider');
  const handle = document.getElementById('tpp-slider-handle');
  const afterEl = document.getElementById('tpp-slider-after');
  const hint = document.getElementById('tpp-drag-hint');

  if (!slider || !handle || !afterEl) return;

  let isDragging = false;
  let hasInteracted = false;

  function getPosition(e) {
    const rect = slider.getBoundingClientRect();
    let x;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
    } else {
      x = e.clientX - rect.left;
    }
    // Clamp between 5% and 95%
    const pct = Math.min(0.95, Math.max(0.05, x / rect.width));
    return pct;
  }

  function updateSlider(pct) {
    const percent = pct * 100;
    handle.style.left = percent + '%';
    afterEl.style.clipPath = 'inset(0 0 0 ' + percent + '%)';
  }

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    slider.classList.add('dragging');

    if (!hasInteracted && hint) {
      hint.classList.add('hidden');
      hasInteracted = true;
    }

    updateSlider(getPosition(e));
  }

  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    updateSlider(getPosition(e));
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove('dragging');
  }

  // Mouse events
  slider.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);

  // Touch events
  slider.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);

  // Click anywhere on slider to jump
  slider.addEventListener('click', function(e) {
    if (!hasInteracted && hint) {
      hint.classList.add('hidden');
      hasInteracted = true;
    }
    updateSlider(getPosition(e));
  });
})();

/* ============================================================
   TPP FACTS COMPARISON – Material Switcher + Count-up
   ============================================================ */
(function() {
  var section = document.querySelector('.tpp-compare-table-section');
  if (!section) return;

  /* ---- Material selector ---- */
  var matBtns = section.querySelectorAll('.tpp-ct-mat-btn');
  var factItems = section.querySelectorAll('.tpp-ct-fact-item');

  matBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var mat = btn.getAttribute('data-material');
      matBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      factItems.forEach(function(item) {
        item.classList.remove('active');
      });

      setTimeout(function() {
        factItems.forEach(function(item) {
          if (item.getAttribute('data-mat') === mat) {
            item.classList.add('active');
          }
        });
        // Re-run count animation after items are active
        countUpNumbers(true);
      }, 60);
    });
  });

  /* ---- Scroll-based card animations ---- */
  function animateVisible() {
    var items = section.querySelectorAll('[data-anim="card"]');
    items.forEach(function(item, i) {
      var rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        setTimeout(function() {
          item.classList.add('tpp-ct-visible');
        }, i * 100);
      }
    });
  }

  /* ---- Count-up for numbers ---- */
  var counted = false;
  function countUpNumbers(force) {
    var nums = section.querySelectorAll('.tpp-ct-fact-item.active .tpp-ct-fact-num');
    if (!nums.length) return;
    if (!force) {
      if (counted) return;
      var firstRect = nums[0].getBoundingClientRect();
      if (firstRect.top > window.innerHeight - 80) return;
    }
    counted = true;

    nums.forEach(function(numEl) {
      var target = parseInt(numEl.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var current = 0;
      var duration = 1200;
      var step = Math.max(1, Math.ceil(target / (duration / 16)));
      numEl.textContent = '0';
      var counter = setInterval(function() {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(counter);
        }
        numEl.textContent = current;
      }, 16);
    });
  }

  /* ---- Combined scroll handler ---- */
  function onScroll() {
    animateVisible();
    countUpNumbers(false);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(onScroll, 300);
})();

/* ============================================================
   TPP INTERACTIVE ROOF EXPLORER
   ============================================================ */
(function() {
  var section = document.querySelector('.tpp-explorer-section');
  if (!section) return;

  var layers = section.querySelectorAll('.tpp-roof-layer');
  var infoCards = section.querySelectorAll('.tpp-explorer-info-card');
  var dots = section.querySelectorAll('.tpp-dot');

  function setActive(layerName) {
    layers.forEach(function(l) {
      l.classList.toggle('active', l.getAttribute('data-layer') === layerName);
    });
    infoCards.forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-info') === layerName);
    });
    dots.forEach(function(d) {
      d.classList.toggle('active', d.getAttribute('data-dot') === layerName);
    });
  }

  // Layer click
  layers.forEach(function(layer) {
    layer.addEventListener('click', function() {
      setActive(layer.getAttribute('data-layer'));
    });
    layer.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(layer.getAttribute('data-layer'));
      }
    });
  });

  // Dot click
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      setActive(dot.getAttribute('data-dot'));
    });
  });

  // Keyboard navigation (arrow keys)
  var layerNames = [];
  layers.forEach(function(l) { layerNames.push(l.getAttribute('data-layer')); });

  section.addEventListener('keydown', function(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    var currentIdx = -1;
    layers.forEach(function(l, i) {
      if (l.classList.contains('active')) currentIdx = i;
    });
    if (e.key === 'ArrowDown') currentIdx = Math.min(currentIdx + 1, layerNames.length - 1);
    if (e.key === 'ArrowUp') currentIdx = Math.max(currentIdx - 1, 0);
    setActive(layerNames[currentIdx]);
    layers[currentIdx].focus();
  });

  /* ---- Generate floating particles ---- */
  var particleContainer = section.querySelector('.tpp-explorer-particles');
  if (particleContainer) {
    for (var i = 0; i < 20; i++) {
      var p = document.createElement('div');
      p.className = 'tpp-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = (2 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;
      p.style.opacity = (0.15 + Math.random() * 0.25);
      particleContainer.appendChild(p);
    }
  }

  /* ---- Auto-cycle layers (stops on interaction) ---- */
  var autoInterval;
  var userInteracted = false;
  var currentAutoIdx = 0;

  function startAuto() {
    autoInterval = setInterval(function() {
      if (userInteracted) { clearInterval(autoInterval); return; }
      currentAutoIdx = (currentAutoIdx + 1) % layerNames.length;
      setActive(layerNames[currentAutoIdx]);
    }, 4000);
  }

  // Only start auto-cycle when section is visible
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !userInteracted) {
      startAuto();
    }
  }, { threshold: 0.3 });
  observer.observe(section);

  // Stop auto on any user click in section
  section.addEventListener('click', function() {
    userInteracted = true;
    if (autoInterval) clearInterval(autoInterval);
  });
})();