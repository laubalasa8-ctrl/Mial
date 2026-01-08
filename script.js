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
  // Scroll to top on page load
  window.scrollTo(0, 0);
  
  // Initialize cookie banner
  initCookieBanner();
});

// ===== FORM SUBMISSION =====
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Tack för din förfrågan! Vi återkommer inom 1 arbetsdag.');
    form.reset();
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