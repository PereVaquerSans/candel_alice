/* ============================================================
   CANDEL_ALICE — Main JavaScript
   Shared functionality: navigation, animations, cart system
   ============================================================ */

'use strict';

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initSmoothScroll();
  initCart();
  initMobileMenu();
  document.body.classList.add('page-transition');
});

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  const hamburger = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================================
   SCROLL ANIMATIONS (IntersectionObserver)
   ============================================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   CART SYSTEM (localStorage-based)
   ============================================================ */
const CART_KEY = 'candel_alice_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  renderCartDrawer();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  showToast(`${product.name} añadido al carrito`);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
}

function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

/* ---------- Cart Badge ---------- */
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = count;

  if (count > 0) {
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

/* ---------- Cart Drawer ---------- */
function initCart() {
  updateCartBadge();
  renderCartDrawer();

  // Open cart
  const cartBtn = document.querySelector('.navbar__cart');
  const cartOverlay = document.querySelector('.cart-overlay');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartClose = document.querySelector('.cart-drawer__close');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => openCartDrawer());
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => closeCartDrawer());
  }

  if (cartClose) {
    cartClose.addEventListener('click', () => closeCartDrawer());
  }

  // Escape key closes cart
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartDrawer();
  });
}

function openCartDrawer() {
  const overlay = document.querySelector('.cart-overlay');
  const drawer = document.querySelector('.cart-drawer');
  if (overlay) overlay.classList.add('open');
  if (drawer) drawer.classList.add('open');
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = scrollbarWidth + 'px';
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.style.paddingRight = scrollbarWidth + 'px';
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const overlay = document.querySelector('.cart-overlay');
  const drawer = document.querySelector('.cart-drawer');
  if (overlay) overlay.classList.remove('open');
  if (drawer) drawer.classList.remove('open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.style.paddingRight = '';
}

function renderCartDrawer() {
  const itemsContainer = document.querySelector('.cart-drawer__items');
  const totalEl = document.querySelector('.cart-total-amount');
  const checkoutBtn = document.querySelector('.cart-drawer__checkout');

  if (!itemsContainer) return;

  const cart = getCart();

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-drawer__empty">
        <div class="cart-drawer__empty-icon">🕯️</div>
        <p>Tu carrito está vacío</p>
        <p class="mt-sm" style="font-size: var(--fs-xs);">Explora nuestra colección y encuentra tu aroma perfecto.</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = '€0.00';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (checkoutBtn) checkoutBtn.style.display = '';

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item__image">
        <img src="${item.image}" alt="${item.name}" width="70" height="70" loading="lazy">
      </div>
      <div>
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">€${item.price.toFixed(2)}</div>
        <div class="cart-item__qty">
          <button onclick="updateQty('${item.id}', -1)" aria-label="Reducir cantidad">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty('${item.id}', 1)" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
      <div>
        <button class="cart-item__remove" onclick="removeFromCart('${item.id}')" aria-label="Eliminar producto">✕</button>
        <div class="cart-item__subtotal mt-lg">€${(item.price * item.qty).toFixed(2)}</div>
      </div>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = `€${getCartTotal().toFixed(2)}`;
}

/* ---------- Stripe Checkout ---------- */
function checkoutWithStripe() {
  const cart = getCart();
  if (cart.length === 0) return;

  /*
   * STRIPE PAYMENT LINKS
   * =====================
   * Each product has a Stripe Payment Link URL.
   * Since this is a frontend-only app, we link directly
   * to Stripe's hosted checkout page.
   *
   * For multiple items, Stripe Payment Links don't natively
   * support a combined cart. There are two approaches:
   *
   * 1. CREATE a single Payment Link per product and redirect
   *    the user once per item (not ideal).
   *
   * 2. USE Stripe's "Buy Button" embed or a single Payment Link
   *    with adjustable quantities.
   *
   * For this demo, we provide a single checkout link.
   * Replace the URL below with your real Stripe Payment Link.
   */

  showToast('Redirigiendo a la pasarela de pago segura…');

  /* ⚠️ REPLACE THIS URL with your real Stripe Payment Link */
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/PLACEHOLDER';

  /* In production, you would configure the link on Stripe Dashboard */
  window.open(STRIPE_PAYMENT_LINK, '_blank');
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(message) {
  let toast = document.querySelector('.toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="toast__icon">✓</span> ${message}`;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/* ============================================================
   PRODUCT MODAL (Quick View)
   ============================================================ */
function openProductModal(productData) {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  const data = typeof productData === 'string' ? JSON.parse(productData) : productData;

  overlay.querySelector('.modal__image img').src = data.image;
  overlay.querySelector('.modal__image img').alt = data.name;
  overlay.querySelector('.modal__category').textContent = data.category || 'Signature Collection';
  overlay.querySelector('.modal__name').textContent = data.name;
  overlay.querySelector('.modal__description').textContent = data.description || '';
  overlay.querySelector('.modal__price').textContent = `€${parseFloat(data.price).toFixed(2)}`;

  // Fill details
  const burnTime = overlay.querySelector('[data-detail="burn-time"]');
  const waxBase = overlay.querySelector('[data-detail="wax-base"]');
  if (burnTime) burnTime.textContent = data.burnTime || '55–65 Hours';
  if (waxBase) waxBase.textContent = data.waxBase || '100% Soy Wax';

  // Fill scent notes
  const scentContainer = overlay.querySelector('.modal__scent-profile');
  if (scentContainer && data.scent) {
    const scent = data.scent;
    scentContainer.innerHTML = `
      <div class="modal__scent-title">Perfil de Aroma</div>
      <div class="modal__scent-note"><span>Notas de Salida</span><span>${scent.top || '—'}</span></div>
      <div class="modal__scent-note"><span>Notas de Corazón</span><span>${scent.heart || '—'}</span></div>
      <div class="modal__scent-note"><span>Notas de Fondo</span><span>${scent.base || '—'}</span></div>
    `;
  }

  // Set modal add-to-cart button
  const addBtn = overlay.querySelector('.modal__add-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      addToCart({
        id: data.id,
        name: data.name,
        price: parseFloat(data.price),
        image: data.image,
      });
      closeProductModal();
    };
  }

  overlay.classList.add('open');
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = scrollbarWidth + 'px';
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.style.paddingRight = scrollbarWidth + 'px';
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.paddingRight = '';
  }
}

/* ============================================================
   SHOP PAGE — FILTERS
   ============================================================ */
function filterProducts(category) {
  const cards = document.querySelectorAll('.product-card');
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === category);
  });

  cards.forEach(card => {
    const cardCategory = card.dataset.category;
    const show = category === 'all' || cardCategory === category;

    if (show) {
      card.style.display = '';
      card.style.animation = 'fadeInUp 0.4s ease-out forwards';
    } else {
      card.style.display = 'none';
    }
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function handleContactForm(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  /* 
   * In production, replace this with an actual form service
   * like Formspree, Getform, or a mailto: redirect.
   * Example with Formspree: set the form action to 
   * https://formspree.io/f/YOUR_FORM_ID
   */

  showToast('¡Mensaje enviado con éxito! Te responderemos pronto.');
  form.reset();
}
