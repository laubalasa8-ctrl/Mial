/* filepath: /Users/laurentiubalasa/Documents/Goal/script.js */
const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ===== HAMBURGER MENU =====
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', function() {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('is-active');
  });

  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', function() {
      hamburgerBtn.classList.remove('active');
      mobileMenu.classList.remove('is-active');
    });
  });

  document.addEventListener('click', function(event) {
    if (!mobileMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
      hamburgerBtn.classList.remove('active');
      mobileMenu.classList.remove('is-active');
    }
  });
}

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

// ===== COOKIE BANNER (MOBILE ONLY) =====
function initCookieBanner() {
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieOverlay = document.getElementById('cookie-overlay');
  const acceptBtn = document.getElementById('cookie-accept');
  const rejectBtn = document.getElementById('cookie-reject');
  const closeBtn = document.getElementById('cookie-close');
  const infoToggle = document.getElementById('cookie-info-toggle');
  const infoContent = document.getElementById('cookie-info-content');

  if (!cookieBanner) return;

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 600;
  
  // Check if user has already interacted with banner (within 30 days)
  const cookieConsent = localStorage.getItem('cookieConsent');
  const cookieTimestamp = localStorage.getItem('cookieTimestamp');
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Only show banner on mobile and if consent NOT already given
  const hasConsent = cookieConsent && cookieTimestamp && (now - parseInt(cookieTimestamp)) < thirtyDaysMs;
  
  if (!isMobile || hasConsent) {
    // Hide banner completely - don't show
    cookieBanner.classList.remove('show');
    cookieOverlay.style.display = 'none';
    return;
  }

  // Show banner with animation ONLY if no consent recorded
  setTimeout(() => {
    cookieBanner.classList.add('show');
    cookieOverlay.style.display = 'block';
  }, 500);

  // Handle info toggle
  if (infoToggle && infoContent) {
    infoToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = infoToggle.getAttribute('aria-expanded') === 'true';
      infoToggle.setAttribute('aria-expanded', !isExpanded);
      infoContent.classList.toggle('show');
    });
  }

  // Handle accept
  acceptBtn.addEventListener('click', () => {
    saveBannerChoice('all');
  });

  // Handle reject (only necessary cookies)
  rejectBtn.addEventListener('click', () => {
    saveBannerChoice('necessary');
  });

  // Handle close button
  closeBtn.addEventListener('click', () => {
    saveBannerChoice('necessary');
  });

  // Close overlay click - closes banner
  cookieOverlay.addEventListener('click', () => {
    saveBannerChoice('necessary');
  });

  function saveBannerChoice(choice) {
    // Save choice and timestamp
    localStorage.setItem('cookieConsent', choice);
    localStorage.setItem('cookieTimestamp', Date.now().toString());
    
    // Hide banner immediately
    closeBanner();
  }

  function closeBanner() {
    cookieBanner.classList.remove('show');
    cookieOverlay.style.display = 'none';
    cookieBanner.style.display = 'none';
  }

  // Re-check on resize in case user goes from desktop to mobile
  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth <= 600;
    const stillHasConsent = localStorage.getItem('cookieConsent') !== null;
    
    if (!nowMobile || stillHasConsent) {
      cookieBanner.classList.remove('show');
      cookieOverlay.style.display = 'none';
    }
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