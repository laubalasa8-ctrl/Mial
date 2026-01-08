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
const stepChevrons = document.querySelectorAll('.step-chevron');
stepChevrons.forEach(chevron => {
  chevron.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleStepItem(chevron.closest('.step-item'));
  });
});

const stepItems = document.querySelectorAll('.step-item, .step-item-final');
stepItems.forEach(item => {
  item.addEventListener('click', function(e) {
    if (!e.target.closest('.step-chevron')) {
      toggleStepItem(item);
    }
  });
});

function toggleStepItem(stepItem) {
  const chevron = stepItem.querySelector('.step-chevron');
  const details = stepItem.querySelector('.step-details');
  
  // Stäng alla andra items
  document.querySelectorAll('.step-item, .step-item-final').forEach(item => {
    if (item !== stepItem) {
      const otherChevron = item.querySelector('.step-chevron');
      const otherDetails = item.querySelector('.step-details');
      otherChevron.setAttribute('aria-expanded', 'false');
      otherDetails.setAttribute('hidden', '');
    }
  });
  
  // Växla aktuell item
  if (details.hasAttribute('hidden')) {
    details.removeAttribute('hidden');
    chevron.setAttribute('aria-expanded', 'true');
  } else {
    details.setAttribute('hidden', '');
    chevron.setAttribute('aria-expanded', 'false');
  }
}

// ===== COOKIE BANNER =====
function initCookieBanner() {
  const cookieBanner = document.getElementById('cookieBanner');
  if (!cookieBanner) return;

  // Check if user has already made a cookie choice
  const cookieConsent = localStorage.getItem('cookieConsent');
  if (cookieConsent) {
    cookieBanner.style.display = 'none';
    cookieBanner.classList.add('hidden');
    return;
  }

  const cookieAccept = document.getElementById('cookieAccept');
  const cookieReject = document.getElementById('cookieReject');
  const cookieDetails = document.getElementById('cookieDetails');
  const cookieSelected = document.getElementById('cookieSelected');

  if (cookieAccept) {
    cookieAccept.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem('cookieConsent', 'accepted');
      cookieBanner.style.display = 'none';
      cookieBanner.classList.add('hidden');
    });
  }

  if (cookieReject) {
    cookieReject.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem('cookieConsent', 'rejected');
      cookieBanner.style.display = 'none';
      cookieBanner.classList.add('hidden');
    });
  }

  if (cookieDetails) {
    cookieDetails.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Detaljerad information om cookies och hur vi använder dem.');
    });
  }

  if (cookieSelected) {
    cookieSelected.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem('cookieConsent', 'selected');
      cookieBanner.style.display = 'none';
      cookieBanner.classList.add('hidden');
    });
  }
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