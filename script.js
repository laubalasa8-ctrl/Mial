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

// ===== COOKIE CONSENT – PREMIUM =====
function initCookieBanner() {
  // Check if consent already stored (within 180 days)
  const consent = localStorage.getItem('fc_consent');
  const timestamp = localStorage.getItem('fc_timestamp');
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const hasConsent = consent && timestamp && (now - parseInt(timestamp)) < maxAge;

  // Inject banner HTML into every page
  const bannerHTML = `
    <div class="fc-overlay" id="fc-overlay"></div>
    <div class="fc-banner" id="fc-banner" role="dialog" aria-label="Cookie-inställningar">
      <div class="fc-card">
        <div class="fc-body">
          <div class="fc-header">
            <div class="fc-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h3 class="fc-title">Cookie-inställningar</h3>
              <p class="fc-subtitle">Ferotect värnar om din integritet</p>
            </div>
          </div>
          <p class="fc-desc">Vi använder cookies för att förbättra din upplevelse, analysera trafik och visa relevant innehåll. Välj vilka cookies du vill tillåta. <a href="anvandarvillkor.html">Läs mer</a></p>
          <div class="fc-categories">
            <div class="fc-cat">
              <div class="fc-cat-info">
                <div class="fc-cat-icon fc-icon-necessary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div class="fc-cat-label">Nödvändiga</div>
                  <div class="fc-cat-detail">Krävs för grundläggande funktionalitet</div>
                </div>
              </div>
              <label class="fc-toggle">
                <input type="checkbox" checked disabled data-fc="necessary">
                <span class="fc-toggle-track"></span>
              </label>
            </div>
            <div class="fc-cat">
              <div class="fc-cat-info">
                <div class="fc-cat-icon fc-icon-analytics">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                </div>
                <div>
                  <div class="fc-cat-label">Analys</div>
                  <div class="fc-cat-detail">Hjälper oss förstå besöksbeteenden</div>
                </div>
              </div>
              <label class="fc-toggle">
                <input type="checkbox" data-fc="analytics">
                <span class="fc-toggle-track"></span>
              </label>
            </div>
            <div class="fc-cat">
              <div class="fc-cat-info">
                <div class="fc-cat-icon fc-icon-marketing">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                </div>
                <div>
                  <div class="fc-cat-label">Marknadsföring</div>
                  <div class="fc-cat-detail">Personaliserat innehåll & annonser</div>
                </div>
              </div>
              <label class="fc-toggle">
                <input type="checkbox" data-fc="marketing">
                <span class="fc-toggle-track"></span>
              </label>
            </div>
          </div>
          <div class="fc-actions">
            <button class="fc-btn fc-btn-accept" id="fc-accept">Godkänn alla</button>
            <button class="fc-btn fc-btn-reject" id="fc-reject">Spara val</button>
          </div>
        </div>
        <div class="fc-footer">
          <a href="anvandarvillkor.html">Användarvillkor & Integritetspolicy</a>
        </div>
      </div>
    </div>
    <button class="fc-reopen" id="fc-reopen" aria-label="Cookie-inställningar" title="Cookie-inställningar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none"/>
        <circle cx="16" cy="13" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="10" cy="15" r="1" fill="currentColor" stroke="none"/>
        <circle cx="13" cy="11" r="0.8" fill="currentColor" stroke="none"/>
      </svg>
    </button>
  `;
  document.body.insertAdjacentHTML('beforeend', bannerHTML);

  const banner = document.getElementById('fc-banner');
  const overlay = document.getElementById('fc-overlay');
  const acceptBtn = document.getElementById('fc-accept');
  const rejectBtn = document.getElementById('fc-reject');
  const reopenBtn = document.getElementById('fc-reopen');

  // Restore previous choices to toggles
  if (hasConsent) {
    try {
      const prefs = JSON.parse(consent);
      document.querySelectorAll('[data-fc]').forEach(cb => {
        const key = cb.getAttribute('data-fc');
        if (key !== 'necessary' && prefs[key] !== undefined) {
          cb.checked = prefs[key];
        }
      });
    } catch(e) {}
    // Show reopen button, hide banner
    reopenBtn.classList.add('fc-show');
    return;
  }

  // Show banner after short delay
  setTimeout(() => {
    banner.classList.add('fc-show');
    overlay.classList.add('fc-show');
  }, 800);

  function saveAndClose(acceptAll) {
    const prefs = { necessary: true };
    if (acceptAll) {
      prefs.analytics = true;
      prefs.marketing = true;
      // Check all toggles visually
      document.querySelectorAll('[data-fc]').forEach(cb => {
        if (!cb.disabled) cb.checked = true;
      });
    } else {
      document.querySelectorAll('[data-fc]').forEach(cb => {
        const key = cb.getAttribute('data-fc');
        prefs[key] = cb.checked;
      });
    }

    localStorage.setItem('fc_consent', JSON.stringify(prefs));
    localStorage.setItem('fc_timestamp', Date.now().toString());

    // Closing animation
    banner.classList.add('fc-closing');
    overlay.classList.remove('fc-show');

    setTimeout(() => {
      banner.classList.remove('fc-show', 'fc-closing');
      reopenBtn.classList.add('fc-show');
    }, 400);
  }

  acceptBtn.addEventListener('click', () => saveAndClose(true));
  rejectBtn.addEventListener('click', () => saveAndClose(false));

  // Overlay click = save current selection
  overlay.addEventListener('click', () => saveAndClose(false));

  // Reopen banner
  reopenBtn.addEventListener('click', () => {
    reopenBtn.classList.remove('fc-show');
    banner.classList.remove('fc-closing');
    banner.classList.add('fc-show');
    overlay.classList.add('fc-show');
  });

  // Track mouse position for accept button ripple
  acceptBtn.addEventListener('mousemove', (e) => {
    const rect = acceptBtn.getBoundingClientRect();
    acceptBtn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    acceptBtn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  });
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