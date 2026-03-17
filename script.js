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
  document.querySelectorAll('.mobile-submenu-btn').forEach(btn => {
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

  // Handle dropdown toggles (chevron button only)
  const toggleButtons = mobileMenu.querySelectorAll('.mobile-submenu-btn');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = this.parentElement;
      const submenu = wrapper.nextElementSibling;
      const isActive = submenu.classList.contains('active');
      
      // Close all other submenus
      document.querySelectorAll('.mobile-submenu.active').forEach(menu => {
        if (menu !== submenu) {
          menu.classList.remove('active');
          const btn = menu.previousElementSibling.querySelector('.mobile-submenu-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
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

// ===== INTERACTIVE STEPPER =====
(function() {
  const stepper = document.getElementById('process-stepper');
  if (!stepper) return;

  const dots = stepper.querySelectorAll('.stepper-dot');
  const panels = stepper.querySelectorAll('.stepper-panel');
  const slider = stepper.querySelector('.stepper-slider');
  const trackFill = stepper.querySelector('.stepper-track-fill');
  const prevBtn = stepper.querySelector('.stepper-prev');
  const nextBtn = stepper.querySelector('.stepper-next');
  const counter = document.getElementById('stepper-current');
  const total = panels.length;
  let current = 0;
  let autoTimer = null;

  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    current = idx;
    slider.style.transform = 'translateX(-' + (current * 100) + '%)';
    trackFill.style.width = (current / (total - 1) * 100) + '%';

    dots.forEach(function(d, i) {
      d.classList.remove('is-active', 'is-done');
      if (i < current) d.classList.add('is-done');
      if (i === current) d.classList.add('is-active');
    });

    panels.forEach(function(p, i) {
      p.classList.toggle('is-visible', i === current);
    });

    if (counter) counter.textContent = current + 1;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      goTo(parseInt(this.dataset.step));
      resetAuto();
    });
  });

  prevBtn.addEventListener('click', function() { goTo(current - 1); resetAuto(); });
  nextBtn.addEventListener('click', function() { goTo(current + 1); resetAuto(); });

  function startAuto() {
    autoTimer = setInterval(function() {
      goTo(current < total - 1 ? current + 1 : 0);
    }, 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  stepper.addEventListener('mouseenter', function() { clearInterval(autoTimer); });
  stepper.addEventListener('mouseleave', function() { startAuto(); });

  goTo(0);
  startAuto();
})();

// ===== SKÅNE MAP SECTION =====
(function() {
  var mapSection = document.querySelector('.skane-map-section');
  if (!mapSection) return;

  /* ---- tooltip ---- */
  var tooltip = mapSection.querySelector('.skane-tooltip');
  var ttBg    = tooltip && tooltip.querySelector('.skane-tooltip-bg');
  var ttCity  = tooltip && tooltip.querySelector('.skane-tooltip-city');
  var ttType  = tooltip && tooltip.querySelector('.skane-tooltip-type');
  var pins    = mapSection.querySelectorAll('.skane-pin');

  pins.forEach(function(pin) {
    function show(e) {
      if (!tooltip) return;
      var city = pin.getAttribute('data-city');
      var type = pin.getAttribute('data-type');
      ttCity.textContent = city;
      ttType.textContent = type;
      var dot = pin.querySelector('.skane-pin-dot');
      var cx = parseFloat(dot.getAttribute('cx'));
      var cy = parseFloat(dot.getAttribute('cy'));
      var bw = parseFloat(ttBg.getAttribute('width'));
      tooltip.setAttribute('transform', 'translate(' + (cx - bw / 2) + ',' + (cy - 68) + ')');
      tooltip.style.display = '';
    }
    function hide() { if (tooltip) tooltip.style.display = 'none'; }
    pin.addEventListener('mouseenter', show);
    pin.addEventListener('mouseleave', hide);
    pin.addEventListener('touchstart', function(e) { e.preventDefault(); show(); }, { passive: false });
  });

  /* ---- scroll-reveal animations ---- */
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;

      /* outline draw */
      mapSection.querySelectorAll('.skane-outline').forEach(function(path) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 2s ease';
        path.style.strokeDashoffset = '0';
      });

      /* city labels */
      mapSection.querySelectorAll('.skane-city-labels').forEach(function(g) {
        g.style.transition = 'opacity 1.2s ease 1.4s';
        g.style.opacity = '0.55';
      });

      /* pins stagger */
      pins.forEach(function(pin, i) {
        pin.style.transition = 'opacity .5s ease ' + (1.6 + i * 0.08) + 's, transform .5s ease ' + (1.6 + i * 0.08) + 's';
        pin.style.opacity = '1';
        pin.style.transform = 'scale(1)';
      });

      /* counter */
      mapSection.querySelectorAll('.skane-map-info-number').forEach(function(el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        var duration = 1500;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        setTimeout(function() { requestAnimationFrame(step); }, 2000);
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  observer.observe(mapSection);

  /* ---- fade-in children ---- */
  var fadeEls = mapSection.querySelectorAll('.fade-in');
  var fadeObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeEls.forEach(function(el) { fadeObs.observe(el); });

  /* initial hidden states for pins */
  pins.forEach(function(pin) { pin.style.opacity = '0'; pin.style.transform = 'scale(0)'; });
  mapSection.querySelectorAll('.skane-city-labels').forEach(function(g) { g.style.opacity = '0'; });
})();

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

/* ============================================================
   KORRUGERAD: INTERACTIVE ROOF LAYERS (Light Theme)
   ============================================================ */
(function() {
  var section = document.querySelector('.kor-layers-section');
  if (!section) return;

  var layers      = section.querySelectorAll('.kor-layer');
  var infoCards   = section.querySelectorAll('.kor-info-card');
  var dots        = section.querySelectorAll('.kor-dot');
  var visual      = document.getElementById('korLayersVisual');
  var toggleBtn   = document.getElementById('korToggleExplode');
  var toggleText  = document.getElementById('korToggleText');
  var progressBar = document.getElementById('korProgressFill');

  var layerNames  = [];
  layers.forEach(function(l) { layerNames.push(l.getAttribute('data-layer')); });
  // layerNames order (bottom→top): takstolar, raspont, underlag, lakt, plat

  var currentIdx = layerNames.indexOf('plat'); // start at top layer

  /* ---- Set Active Layer ---- */
  function setActive(name) {
    currentIdx = layerNames.indexOf(name);

    layers.forEach(function(l) {
      l.classList.toggle('active', l.getAttribute('data-layer') === name);
    });
    infoCards.forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-info') === name);
    });
    dots.forEach(function(d) {
      d.classList.toggle('active', d.getAttribute('data-dot') === name);
    });

    // Progress bar: 0% at bottom layer, 100% at top
    var pct = ((currentIdx + 1) / layerNames.length) * 100;
    if (progressBar) progressBar.style.height = pct + '%';
  }

  /* ---- Layer click ---- */
  layers.forEach(function(layer) {
    layer.addEventListener('click', function() {
      userClicked = true;
      if (autoInterval) clearInterval(autoInterval);
      setActive(layer.getAttribute('data-layer'));
    });
    layer.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userClicked = true;
        if (autoInterval) clearInterval(autoInterval);
        setActive(layer.getAttribute('data-layer'));
      }
    });
  });

  /* ---- Dot click ---- */
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      userClicked = true;
      if (autoInterval) clearInterval(autoInterval);
      setActive(dot.getAttribute('data-dot'));
    });
  });

  /* ---- Keyboard nav (arrows) ---- */
  section.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      userClicked = true;
      if (autoInterval) clearInterval(autoInterval);
      currentIdx = (currentIdx + 1) % layerNames.length;
      setActive(layerNames[currentIdx]);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      userClicked = true;
      if (autoInterval) clearInterval(autoInterval);
      currentIdx = (currentIdx - 1 + layerNames.length) % layerNames.length;
      setActive(layerNames[currentIdx]);
    }
  });

  /* ---- Explode / Collapse toggle ---- */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      visual.classList.toggle('exploded');
      if (visual.classList.contains('exploded')) {
        toggleText.textContent = 'Komprimera vy';
      } else {
        toggleText.textContent = 'Explodera vy';
      }
    });
  }

  /* ---- No auto-cycle — manual interaction only ---- */
  var autoInterval = null;
  var userClicked = false;

  /* ---- Scroll-triggered entrance animation ---- */
  var layerEls = Array.from(layers);
  var entranceObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      layerEls.forEach(function(el, i) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) scale(0.95)';
        setTimeout(function() {
          el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
          el.style.opacity = '1';
          el.style.transform = '';
        }, i * 150);
      });
      entranceObserver.unobserve(section);
    }
  }, { threshold: 0.15 });
  entranceObserver.observe(section);

  // Initialize progress
  setActive('plat');
})();


/* ═══════════════════════════════════════════════════════
   VENTILATION & KONDENS SECTION
   ═══════════════════════════════════════════════════════ */
(function ventilationSection() {
  const section = document.querySelector('.vent-section');
  if (!section) return;

  // ── Play / Pause ──
  const playBtn = section.querySelector('.vent-play-btn');
  const iconPause = section.querySelector('.vent-icon-pause');
  const iconPlay  = section.querySelector('.vent-icon-play');
  let isPaused = false;

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      section.classList.toggle('vent-paused', isPaused);
      iconPause.style.display = isPaused ? 'none' : '';
      iconPlay.style.display  = isPaused ? ''     : 'none';
    });
  }

  // ── Layer highlight on click / hover ──
  const layers   = section.querySelectorAll('.vent-layer');
  const labels   = section.querySelectorAll('.vent-label-clickable');
  let focusedTimer = null;

  function highlightLayer(name) {
    clearTimeout(focusedTimer);
    section.classList.add('vent-highlight');
    layers.forEach(l => {
      l.classList.toggle('vent-layer-focused', l.dataset.ventLayer === name || name === 'airgap' && l.classList.contains('vent-airgap'));
    });
    labels.forEach(l => l.classList.toggle('vent-label-active', l.dataset.ventTarget === name));
  }
  function clearHighlight() {
    focusedTimer = setTimeout(() => {
      section.classList.remove('vent-highlight');
      layers.forEach(l => l.classList.remove('vent-layer-focused'));
      labels.forEach(l => l.classList.remove('vent-label-active'));
      // Reset airgap as default active
      const defaultLabel = section.querySelector('[data-vent-target="airgap"]');
      if (defaultLabel) defaultLabel.classList.add('vent-label-active');
    }, 250);
  }

  layers.forEach(layer => {
    layer.addEventListener('mouseenter', () => highlightLayer(layer.dataset.ventLayer));
    layer.addEventListener('mouseleave', clearHighlight);
    layer.addEventListener('click', () => highlightLayer(layer.dataset.ventLayer));
  });
  labels.forEach(label => {
    label.addEventListener('mouseenter', () => highlightLayer(label.dataset.ventTarget));
    label.addEventListener('mouseleave', clearHighlight);
    label.addEventListener('click', () => highlightLayer(label.dataset.ventTarget));
  });

  // ── Cards interactivity ──
  const cards = section.querySelectorAll('.vent-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      cards.forEach(c => c.classList.remove('vent-card-active'));
      card.classList.add('vent-card-active');
    });
  });

  // ── Intersection Observer — trigger entrance & start animations on scroll ──
  const ventObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        section.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  ventObserver.observe(section);
})();

/* ═══════════════════════════════════════════════════════
   TAKFALL & AVRINNING — Dual-slope gable interactive (v5)
   ═══════════════════════════════════════════════════════ */
(function() {
  var section = document.querySelector('.slope-section');
  if (!section) return;

  var slider = section.querySelector('.slope-slider');
  var valueDisplay = section.querySelector('.slope-slider-value');
  var presets = section.querySelectorAll('.slope-preset');
  var angleText = section.querySelector('.slope-angle-text');
  var arcPath = section.querySelector('.slope-arc');
  var speedLabel = section.querySelector('.slope-speed-label');
  var speedDot = section.querySelector('.slope-speed-dot');
  var riskLabel = section.querySelector('.slope-risk-label');
  var insights = section.querySelectorAll('.slope-insight');

  // Explanation panel
  var explainAngleNum = section.querySelector('.slope-explain-angle-num');
  var explainStatus = section.querySelector('.slope-explain-status');
  var explainRange = section.querySelector('.slope-explain-range');
  var explainText = section.querySelector('.slope-explain-text');
  var fillSpeed = section.querySelector('.slope-fill-speed');
  var fillRisk = section.querySelector('.slope-fill-risk');
  var fillWind = section.querySelector('.slope-fill-wind');
  var indicatorVals = section.querySelectorAll('.slope-indicator-value');
  var valSpeed = indicatorVals[0];
  var valRisk = indicatorVals[1];
  var valWind = indicatorVals[2];

  // Pools
  var poolL = section.querySelector('.slope-pool-l');
  var poolR = section.querySelector('.slope-pool-r');

  // Dual-slope geometry — ridge at center
  var RIDGE_X = 280;
  var LEFT_EAVE_X = 85;
  var RIGHT_EAVE_X = 475;
  var EAVE_Y = 220;       // wall-top / eave baseline
  var HALF_SPAN_L = RIDGE_X - LEFT_EAVE_X;   // 195
  var HALF_SPAN_R = RIGHT_EAVE_X - RIDGE_X;  // 195
  var ROOF_THICK = 10;

  // 3D side-wall offsets
  var SIDE_DX = 30;
  var SIDE_DY = -10;

  // Roof elements
  var roofsL = section.querySelectorAll('.slope-roof-left');
  var roofsR = section.querySelectorAll('.slope-roof-right');
  var corrLs = section.querySelectorAll('.slope-corr-l');
  var corrRs = section.querySelectorAll('.slope-corr-r');
  var roofSide = section.querySelector('.slope-roof-side');
  var ridge = section.querySelector('.slope-ridge');
  var fasciaL = section.querySelector('.slope-fascia-l');
  var fasciaR = section.querySelector('.slope-fascia-r');
  var eaveShadowL = section.querySelector('.slope-eave-shadow-l');
  var eaveShadowR = section.querySelector('.slope-eave-shadow-r');

  // Gutter elements
  var gutterL = section.querySelector('.slope-gutter-l');
  var gutterR = section.querySelector('.slope-gutter-r');
  var downpipeL = section.querySelector('.slope-downpipe-l');
  var downpipeR = section.querySelector('.slope-downpipe-r');
  var elbowL = section.querySelector('.slope-elbow-l');
  var elbowR = section.querySelector('.slope-elbow-r');

  // Drops — left and right
  var dropsL = section.querySelectorAll('[class*="sd-l"]');
  var dropsR = section.querySelectorAll('[class*="sd-r"]');

  // Gutter drips (multiple per side for vivid stream)
  var gutterDripsL = section.querySelectorAll('[class*="sgd-l"]');
  var gutterDripsR = section.querySelectorAll('[class*="sgd-r"]');
  var splashL = section.querySelector('.slope-splash-l');
  var splashR = section.querySelector('.slope-splash-r');

  var rainLines = section.querySelectorAll('.slope-rain');

  var animFrames = [];
  var gutterFrames = [];

  function degToRad(d) { return d * Math.PI / 180; }

  // Explanation data
  var explanations = {
    low: { status: 'Låg lutning', statusClass: 'slope-status-low', range: '6–14° — kräver extra tätning',
      text: 'Vid låg lutning rinner vatten av långsamt. Det kan samlas vatten på takytan vilket leder till läckage och fuktskador. Kräver noggrant tätskikt under plåten.' },
    mid: { status: 'Optimal lutning', statusClass: 'slope-status-mid', range: '14–22° — rekommenderat',
      text: 'Taket har utmärkt balans — vatten rinner av i lagom takt utan att vinden får för mycket grepp. Det idealiska intervallet för korrugerad plåt i Skåne.' },
    high: { status: 'Brant lutning', statusClass: 'slope-status-high', range: '22–45° — stark dränering',
      text: 'Vatten och snö lämnar taket direkt. Utmärkt dränering men vinden får mer grepp — kräver starkare infästning med fler skruvar per m².' }
  };

  function getRange(a) { return a < 15 ? 'low' : a < 23 ? 'mid' : 'high'; }

  function lerpVal(a, lo, mi, hi) {
    if(a <= 6) return lo;
    if(a <= 14) return lo + (mi - lo) * ((a - 6) / 8);
    if(a <= 22) return mi + (hi - mi) * ((a - 14) / 8);
    return hi;
  }

  function updateExplanation(angle) {
    var range = getRange(angle);
    var d = explanations[range];
    if(explainAngleNum) explainAngleNum.textContent = angle;
    if(explainStatus) { explainStatus.textContent = d.status; explainStatus.className = 'slope-explain-status ' + d.statusClass; }
    if(explainRange) explainRange.textContent = d.range;
    if(explainText) explainText.textContent = d.text;

    var sp = Math.round(lerpVal(angle, 15, 45, 95));
    var ri = Math.round(lerpVal(angle, 85, 30, 8));
    var wi = Math.round(lerpVal(angle, 10, 25, 80));
    if(fillSpeed) fillSpeed.style.width = sp + '%';
    if(fillRisk) fillRisk.style.width = ri + '%';
    if(fillWind) fillWind.style.width = wi + '%';

    var sL = ['Mkt långsam','Långsam','Normal','Snabb','Mkt snabb'];
    var rL = ['Mkt låg','Låg','Medel','Hög','Mkt hög'];
    var wL = ['Minimal','Låg','Medel','Hög','Mkt hög'];
    function pick(p, l) { return l[Math.min(4, Math.floor(p / 20))]; }
    if(valSpeed) valSpeed.textContent = pick(sp, sL);
    if(valRisk) valRisk.textContent = pick(ri, rL);
    if(valWind) valWind.textContent = pick(wi, wL);

    insights.forEach(function(c) { c.classList.toggle('slope-insight-active', c.dataset.slopeRange === range); });
  }

  function updateRoof(angle) {
    var rad = degToRad(angle);
    var riseL = Math.tan(rad) * HALF_SPAN_L;
    var riseR = Math.tan(rad) * HALF_SPAN_R;
    var ridgeY = Math.max(EAVE_Y - riseL, 30);

    // Left roof plane: eave-left-bottom → eave-left-top → ridge-top → ridge-bottom
    var ptsL = LEFT_EAVE_X+','+EAVE_Y+' '+LEFT_EAVE_X+','+(EAVE_Y+ROOF_THICK)+' '+RIDGE_X+','+(ridgeY+ROOF_THICK)+' '+RIDGE_X+','+ridgeY;
    roofsL.forEach(function(el){ el.setAttribute('points', ptsL); });

    // Right roof plane: ridge-top → ridge-bottom → eave-right-bottom → eave-right-top
    var ptsR = RIDGE_X+','+ridgeY+' '+RIDGE_X+','+(ridgeY+ROOF_THICK)+' '+RIGHT_EAVE_X+','+(EAVE_Y+ROOF_THICK)+' '+RIGHT_EAVE_X+','+EAVE_Y;
    roofsR.forEach(function(el){ el.setAttribute('points', ptsR); });

    // 3D roof side panel (right gable)
    if(roofSide) {
      var sp = RIGHT_EAVE_X+','+EAVE_Y+' '+RIGHT_EAVE_X+','+(EAVE_Y+ROOF_THICK)+' '+(RIGHT_EAVE_X+SIDE_DX)+','+(EAVE_Y+SIDE_DY+ROOF_THICK)+' '+(RIGHT_EAVE_X+SIDE_DX)+','+(EAVE_Y+SIDE_DY);
      roofSide.setAttribute('points', sp);
    }

    // Ridge cap
    if(ridge) { ridge.setAttribute('y', ridgeY - 2); }

    // Corrugation lines — LEFT (run from near-ridge toward eave)
    var corrOffsetsL = [0.2, 0.4, 0.6, 0.8];
    corrLs.forEach(function(l, i) {
      var t = corrOffsetsL[i] || 0.5;
      var x1 = RIDGE_X - t * HALF_SPAN_L * 0.3;
      var y1 = ridgeY + t * (EAVE_Y - ridgeY) * 0.3 + 3;
      var x2 = LEFT_EAVE_X + 3;
      var y2 = EAVE_Y + 3;
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    });

    // Corrugation lines — RIGHT
    var corrOffsetsR = [0.2, 0.4, 0.6, 0.8];
    corrRs.forEach(function(l, i) {
      var t = corrOffsetsR[i] || 0.5;
      var x1 = RIDGE_X + t * HALF_SPAN_R * 0.3;
      var y1 = ridgeY + t * (EAVE_Y - ridgeY) * 0.3 + 3;
      var x2 = RIGHT_EAVE_X - 3;
      var y2 = EAVE_Y + 3;
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    });

    // Fascia boards
    if(fasciaL) { fasciaL.setAttribute('y', EAVE_Y - 3); fasciaL.setAttribute('height', 14); }
    if(fasciaR) { fasciaR.setAttribute('y', EAVE_Y - 3); fasciaR.setAttribute('height', 14); }

    // Eave shadow lines
    if(eaveShadowL) { eaveShadowL.setAttribute('y1', EAVE_Y + ROOF_THICK); eaveShadowL.setAttribute('y2', EAVE_Y + ROOF_THICK); }
    if(eaveShadowR) { eaveShadowR.setAttribute('y1', EAVE_Y + ROOF_THICK); eaveShadowR.setAttribute('y2', EAVE_Y + ROOF_THICK); }

    // Gutters — track eave level
    var gy = EAVE_Y + ROOF_THICK + 1;
    if(gutterL) {
      gutterL.setAttribute('d', 'M'+(LEFT_EAVE_X-7)+' '+gy+' Q'+(LEFT_EAVE_X-7)+' '+(gy+9)+' '+(LEFT_EAVE_X-1)+' '+(gy+9)+' L'+(LEFT_EAVE_X+9)+' '+(gy+9)+' Q'+(LEFT_EAVE_X+15)+' '+(gy+9)+' '+(LEFT_EAVE_X+15)+' '+gy);
    }
    if(gutterR) {
      gutterR.setAttribute('d', 'M'+(RIGHT_EAVE_X-15)+' '+gy+' Q'+(RIGHT_EAVE_X-15)+' '+(gy+9)+' '+(RIGHT_EAVE_X-9)+' '+(gy+9)+' L'+(RIGHT_EAVE_X+1)+' '+(gy+9)+' Q'+(RIGHT_EAVE_X+7)+' '+(gy+9)+' '+(RIGHT_EAVE_X+7)+' '+gy);
    }
    if(downpipeL) {
      downpipeL.setAttribute('y', gy + 9);
      downpipeL.setAttribute('height', Math.max(340 - gy - 9, 50));
    }
    if(downpipeR) {
      downpipeR.setAttribute('y', gy + 9);
      downpipeR.setAttribute('height', Math.max(340 - gy - 9, 50));
    }
    // Elbows
    if(elbowL) {
      var elbY = Math.min(gy + 9 + Math.max(340 - gy - 9, 50), 340);
      elbowL.setAttribute('d', 'M78 '+elbY+' Q78 '+(elbY+10)+' 68 '+(elbY+10)+' L62 '+(elbY+10));
    }
    if(elbowR) {
      var elbYr = Math.min(gy + 9 + Math.max(340 - gy - 9, 50), 340);
      elbowR.setAttribute('d', 'M482 '+elbYr+' Q482 '+(elbYr+10)+' 490 '+(elbYr+10)+' L496 '+(elbYr+10));
    }

    // Angle arc (at right eave)
    if(arcPath) {
      var arcR = 35;
      var arcStartX = RIGHT_EAVE_X - arcR;
      arcPath.setAttribute('d', 'M'+arcStartX+','+EAVE_Y+' A'+arcR+','+arcR+' 0 0,0 '+(RIGHT_EAVE_X - arcR*Math.cos(rad))+','+(EAVE_Y - arcR*Math.sin(rad)));
    }
    if(angleText) {
      angleText.textContent = angle + '°';
      var lr = degToRad(angle / 2);
      angleText.setAttribute('x', RIGHT_EAVE_X - 50 * Math.cos(lr));
      angleText.setAttribute('y', EAVE_Y - 50 * Math.sin(lr) + 4);
    }

    // Speed badge
    var st = 'Avrinning: ', dc = 'var(--blue)';
    if(angle<10){st+='Mkt låg';dc='rgba(200,120,20,0.7)';}
    else if(angle<15){st+='Låg';dc='rgba(200,150,40,0.7)';}
    else if(angle<23){st+='Normal';}
    else if(angle<35){st+='Snabb';dc='#2eaa5c';}
    else{st+='Mkt snabb';dc='#1a8a4a';}
    if(speedLabel) speedLabel.textContent = st;
    if(speedDot) speedDot.setAttribute('fill', dc);

    // Risk badge
    if(riskLabel) {
      if(angle<10){riskLabel.textContent='⚠ Hög risk';riskLabel.setAttribute('fill','rgba(200,60,30,0.85)');}
      else if(angle<15){riskLabel.textContent='⚠ Kräver tätning';riskLabel.setAttribute('fill','rgba(200,120,20,0.85)');}
      else if(angle<23){riskLabel.textContent='✓ Optimal';riskLabel.setAttribute('fill','var(--blue)');}
      else if(angle<35){riskLabel.textContent='✓ Utmärkt';riskLabel.setAttribute('fill','#2eaa5c');}
      else{riskLabel.textContent='✓✓ Max dränering';riskLabel.setAttribute('fill','#1a8a4a');}
    }

    // Rain opacity
    var rainOp = 0.15 + (1 - (angle-6)/39)*0.2;
    rainLines.forEach(function(r){r.style.opacity=rainOp;});

    // Pool on roof surface (low angles, near eaves)
    var poolOp = angle < 12 ? (12 - angle) / 6 * 0.4 : 0;
    if(poolL) { poolL.setAttribute('opacity', poolOp); poolL.setAttribute('cy', EAVE_Y + 3); }
    if(poolR) { poolR.setAttribute('opacity', poolOp); poolR.setAttribute('cy', EAVE_Y + 3); }

    updateDrops(angle, ridgeY);
    updateGutterDrip(angle);
    updateExplanation(angle);
  }

  /* ── Roof-surface water drops ── */
  function updateDrops(angle, ridgeY) {
    animFrames.forEach(function(id){cancelAnimationFrame(id);});
    animFrames = [];
    var speed = 0.6 + (angle-6)/39*4;
    var dur = 2000/speed;
    // Left drops: flow from ridge toward left eave
    dropsL.forEach(function(d,i){ animDropSide(d, i, dropsL.length, dur, ridgeY, 'left'); });
    // Right drops: flow from ridge toward right eave
    dropsR.forEach(function(d,i){ animDropSide(d, i, dropsR.length, dur, ridgeY, 'right'); });
  }

  function animDropSide(drop, idx, total, dur, ridgeY, side) {
    var delay = idx * (dur * 0.18);
    var off = 0.1 + idx * (0.8 / total);
    var sx, sy, ex, ey;
    if(side === 'left') {
      sx = RIDGE_X - off * HALF_SPAN_L * 0.3;
      sy = ridgeY + off * (EAVE_Y - ridgeY) * 0.3;
      ex = LEFT_EAVE_X - 5;
      ey = EAVE_Y + 10;
    } else {
      sx = RIDGE_X + off * HALF_SPAN_R * 0.3;
      sy = ridgeY + off * (EAVE_Y - ridgeY) * 0.3;
      ex = RIGHT_EAVE_X + 5;
      ey = EAVE_Y + 10;
    }
    var st = null;
    function step(ts) {
      if(!st) st = ts;
      var el = ts - st - delay;
      if(el < 0) { drop.setAttribute('opacity','0'); animFrames.push(requestAnimationFrame(step)); return; }
      var t = el / dur;
      if(t > 1) { st = ts; t = 0; }
      var cx = sx + (ex - sx) * t;
      var cy = sy + (ey - sy) * t;
      if(t > 0.88) cy += (t - 0.88) * 70;
      var op = t < 0.05 ? t/0.05*0.85 : (t > 0.88 ? (1-t)/0.12*0.85 : 0.85);
      drop.setAttribute('cx', cx);
      drop.setAttribute('cy', cy);
      drop.setAttribute('opacity', op);
      animFrames.push(requestAnimationFrame(step));
    }
    animFrames.push(requestAnimationFrame(step));
  }

  /* ── Downpipe drip animation (vivid, multiple drips per pipe) ── */
  function updateGutterDrip(angle) {
    gutterFrames.forEach(function(id){cancelAnimationFrame(id);});
    gutterFrames = [];
    var sp = 0.5 + (angle-6)/39*3;
    var dd = 1000/sp;
    // Left pipe drips (staggered)
    gutterDripsL.forEach(function(drip, i) {
      animGutterDrip(drip, i === 0 ? splashL : null, 62, dd, i * dd * 0.33);
    });
    // Right pipe drips (staggered)
    gutterDripsR.forEach(function(drip, i) {
      animGutterDrip(drip, i === 0 ? splashR : null, 496, dd, i * dd * 0.33);
    });
  }

  function animGutterDrip(drip, splash, cx, dur, delay) {
    var sY = 348, eY = 362, st = null;
    function step(ts) {
      if(!st) st = ts;
      var el = ts - st - delay;
      if(el < 0) { drip.setAttribute('opacity','0'); if(splash) splash.setAttribute('opacity','0'); gutterFrames.push(requestAnimationFrame(step)); return; }
      var t = (el % (dur + 500)) / dur;
      if(t > 1) {
        drip.setAttribute('opacity','0');
        if(splash) { var p = (t-1)*dur/500; splash.setAttribute('opacity', Math.max(0, 0.5 - p*0.5)); splash.setAttribute('rx', 10 + p*12); }
        gutterFrames.push(requestAnimationFrame(step)); return;
      }
      // Gravity-accelerated fall
      var cy = sY + (eY - sY) * t * t;
      var op = t < 0.08 ? t/0.08*0.9 : (t > 0.82 ? (1-t)/0.18*0.9 : 0.9);
      // Elongation as it falls
      var ry = 2.5 + t * 2;
      drip.setAttribute('cx', cx); drip.setAttribute('cy', cy);
      drip.setAttribute('opacity', op); drip.setAttribute('ry', ry);
      if(splash && t > 0.82) {
        splash.setAttribute('opacity', (t-0.82)/0.18*0.5);
        splash.setAttribute('rx', 10 + (t-0.82)/0.18*14);
      } else if(splash) { splash.setAttribute('opacity','0'); }
      gutterFrames.push(requestAnimationFrame(step));
    }
    gutterFrames.push(requestAnimationFrame(step));
  }

  slider.addEventListener('input', function() {
    var v = parseInt(this.value, 10);
    valueDisplay.textContent = v + '°';
    presets.forEach(function(p){ p.classList.toggle('slope-preset-active', parseInt(p.dataset.angle,10) === v); });
    updateRoof(v);
  });

  presets.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var v = parseInt(this.dataset.angle, 10);
      slider.value = v; valueDisplay.textContent = v + '°';
      presets.forEach(function(p){ p.classList.toggle('slope-preset-active', parseInt(p.dataset.angle,10) === v); });
      updateRoof(v);
    });
  });

  updateRoof(14);

  var slopeObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){ if(entry.isIntersecting) section.classList.add('visible'); });
  }, {threshold:0.15});
  slopeObs.observe(section);
})();


/* =====================================================
   CORRFACTS — "Varför välja korrugerad plåt" section
   ===================================================== */
(function() {
  var section = document.querySelector('.corrfacts-section');
  if (!section) return;

  /* ── Animated stat counters ── */
  var statNumbers = section.querySelectorAll('.corrfacts-stat-number');
  var countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;
    statNumbers.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var duration = 1800;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        // ease-out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * target);
        el.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    });
  }

  /* ── Card accordion logic ── */
  var cards = section.querySelectorAll('.corrfacts-card');
  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var wasOpen = card.classList.contains('corrfacts-open');
      // Close all other cards
      cards.forEach(function(c) { c.classList.remove('corrfacts-open'); });
      // Toggle clicked card
      if (!wasOpen) card.classList.add('corrfacts-open');
    });
  });

  /* ── Cost comparison bar animation ── */
  var barsAnimated = false;
  function animateBars() {
    if (barsAnimated) return;
    barsAnimated = true;
    var fills = section.querySelectorAll('.corrfacts-bar-fill');
    fills.forEach(function(fill) {
      var targetWidth = fill.style.width;
      fill.style.width = '0%';
      // Stagger slightly
      setTimeout(function() {
        fill.style.width = targetWidth;
      }, 400);
    });
  }

  /* ── Main entrance observer ── */
  var corrObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        section.classList.add('visible');
        // Fire counters slightly after entrance animation begins
        setTimeout(animateCounters, 500);
        // Fire bar animations after cards have entered
        setTimeout(animateBars, 1200);
        corrObs.disconnect();
      }
    });
  }, { threshold: 0.12 });
  corrObs.observe(section);
})();

/* ============================================================
   FILOSOFI — Interactive SVG Animations & Panel Comparison
   ============================================================ */
(function() {
  var ipSection = document.querySelector('.ip-section');
  if (!ipSection) return;

  // --- Reveal header via IntersectionObserver ---
  var reveals = ipSection.querySelectorAll('[data-ip-reveal]');
  if (reveals.length) {
    var revealObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ip-reveal-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    reveals.forEach(function(el) { revealObs.observe(el); });
  }

  // --- Pillar stagger reveal ---
  var pillars = ipSection.querySelectorAll('[data-ip-pillar]');
  if (pillars.length) {
    var pillarObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var all = ipSection.querySelectorAll('[data-ip-pillar]');
          all.forEach(function(p, i) {
            setTimeout(function() { p.classList.add('ip-pillar-visible'); }, i * 220);
          });
          pillarObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    pillarObs.observe(pillars[0]);
  }

  // --- Expand/collapse buttons ---
  var expandBtns = ipSection.querySelectorAll('.ip-expand-btn');
  expandBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var content = btn.parentElement.querySelector('.ip-expand-content');
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      btn.textContent = '';
      btn.appendChild(document.createTextNode(isOpen ? 'Läs mer' : 'Stäng'));
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M6 9l6 6 6-6');
      svg.appendChild(path);
      btn.appendChild(svg);
      content.classList.toggle('ip-expanded', !isOpen);
    });
  });
})();

/* ============================================================
   PANEL COMPARISON — Tab switching with animation
   ============================================================ */
(function() {
  var section = document.querySelector('.panel-compare');
  if (!section) return;

  // Reveal header
  var header = section.querySelector('[data-ip-reveal]');
  if (header) {
    var hObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ip-reveal-visible');
          hObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    hObs.observe(header);
  }

  var tabs = section.querySelectorAll('.panel-tab');
  var details = section.querySelectorAll('[data-panel-detail]');
  var imgs = section.querySelectorAll('[data-panel-img]');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var key = tab.getAttribute('data-panel');
      tabs.forEach(function(t) { t.classList.remove('panel-tab-active'); });
      tab.classList.add('panel-tab-active');
      details.forEach(function(d) { d.classList.remove('panel-detail-active'); });
      var activeDetail = section.querySelector('[data-panel-detail="' + key + '"]');
      if (activeDetail) activeDetail.classList.add('panel-detail-active');
      imgs.forEach(function(img) { img.classList.remove('panel-img-active'); });
      var activeImg = section.querySelector('[data-panel-img="' + key + '"]');
      if (activeImg) activeImg.classList.add('panel-img-active');
    });
  });
})();

/* ============================================================
   SOLAR JOURNEY — Step stagger reveal, connector draw, count-up
   ============================================================ */
(function() {
  var section = document.querySelector('.solar-journey');
  if (!section) return;

  // --- Header + stats reveal ---
  var reveals = section.querySelectorAll('[data-sj-reveal]');
  if (reveals.length) {
    var revObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sj-visible');
          // If it's the stats row, trigger count-up
          if (entry.target.classList.contains('sj-stats')) {
            triggerCountUp(entry.target);
          }
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    reveals.forEach(function(el) { revObs.observe(el); });
  }

  // --- Steps stagger ---
  var steps = section.querySelectorAll('[data-sj-step]');
  var connectors = section.querySelectorAll('[data-sj-connector]');
  if (steps.length) {
    var stepObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var allSteps = section.querySelectorAll('[data-sj-step]');
          var allConns = section.querySelectorAll('[data-sj-connector]');
          var delay = 0;
          allSteps.forEach(function(s, i) {
            setTimeout(function() { s.classList.add('sj-step-visible'); }, delay);
            delay += 300;
            if (allConns[i]) {
              (function(conn, d) {
                setTimeout(function() { conn.classList.add('sj-conn-visible'); }, d);
              })(allConns[i], delay);
              delay += 200;
            }
          });
          stepObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    stepObs.observe(steps[0]);
  }

  // --- Count-up animation ---
  function triggerCountUp(container) {
    var counters = container.querySelectorAll('.sj-count');
    counters.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var duration = 1800;
      var start = 0;
      var startTime = null;
      function animate(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    });
  }
})();

/* ============================================================
   BATTERILAGRING — Varför-sektion animations & interaktivitet
   ============================================================ */
(function() {
  // Header reveal
  var battHeader = document.querySelector('[data-batt-reveal]');
  if (battHeader) {
    var headerObs = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('batt-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    headerObs.observe(battHeader);
  }

  // Card staggered reveal
  var battCards = document.querySelectorAll('[data-batt-card]');
  if (battCards.length > 0) {
    var cardObs = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var cards = document.querySelectorAll('[data-batt-card]');
          cards.forEach(function(card, i) {
            setTimeout(function() {
              card.classList.add('batt-card-visible');
            }, i * 120);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    cardObs.observe(battCards[0]);
  }

  // Expand/collapse buttons
  document.querySelectorAll('.batt-expand-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var content = this.nextElementSibling;
      var isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!isExpanded));
      content.classList.toggle('batt-expanded');
    });
  });

  // ── Dag-till-Natt Toggle ──
  var flowToggle = document.getElementById('flowToggle');
  var flowScene = document.getElementById('flowScene');
  if (flowToggle && flowScene) {
    flowToggle.addEventListener('click', function() {
      var isNight = flowScene.getAttribute('data-mode') === 'night';
      var newMode = isNight ? 'day' : 'night';
      flowScene.setAttribute('data-mode', newMode);
      flowToggle.setAttribute('data-mode', newMode);

      // Swap active label
      flowToggle.querySelector('.batt-toggle-day').classList.toggle('active', newMode === 'day');
      flowToggle.querySelector('.batt-toggle-night').classList.toggle('active', newMode === 'night');

      // Update flow labels text
      document.querySelectorAll('.batt-flow-label [data-day]').forEach(function(el) {
        el.textContent = el.getAttribute('data-' + newMode);
      });
    });
  }

  // ── Flow + Compare section scroll reveals ──
  var flowReveals = document.querySelectorAll('[data-flow-reveal]');
  if (flowReveals.length) {
    var flowObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('batt-visible');
          flowObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    flowReveals.forEach(function(el) { flowObs.observe(el); });
  }
})();

// ===== ARTICLES SLIDER =====
(function() {
  var wrap = document.querySelector('.articles-slider-wrap');
  if (!wrap) return;
  var slider = wrap.querySelector('.articles-slider');
  var prev = wrap.querySelector('.articles-arrow--prev');
  var next = wrap.querySelector('.articles-arrow--next');
  if (!slider || !prev || !next) return;

  function getScrollAmount() {
    var card = slider.querySelector('.article-card');
    if (!card) return 300;
    return card.offsetWidth + 24;
  }

  function updateArrows() {
    prev.disabled = slider.scrollLeft <= 5;
    next.disabled = slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth - 5;
  }

  prev.addEventListener('click', function() {
    slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });
  next.addEventListener('click', function() {
    slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  slider.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);
  updateArrows();
})();