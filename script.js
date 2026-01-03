// ================= STATE MANAGEMENT =================
class EcommerceApp {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    this.filters = {
      size: [],
      color: [],
      price: [0, 200],
      category: []
    };
    
    this.init();
  }

  init() {
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
      this.bindEvents();
      this.updateCartCount();
      this.initializeAnimations();
      this.setupAccessibility();
    }, 0);
  }

  // ================= CART MANAGEMENT =================
  addToCart(product) {
    const existingItem = this.cart.find(item => 
      item.id === product.id && 
      item.size === product.size && 
      item.color === product.color
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        ...product,
        quantity: 1,
        addedAt: Date.now()
      });
    }

    this.saveCart();
    this.updateCartCount();
    this.showCartNotification(product);
    this.trackEvent('add_to_cart', product);
  }

  removeFromCart(productId, size, color) {
    this.cart = this.cart.filter(item => 
      !(item.id === productId && item.size === size && item.color === color)
    );
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
  }

  updateQuantity(productId, size, color, quantity) {
    const item = this.cart.find(item => 
      item.id === productId && item.size === size && item.color === color
    );
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId, size, color);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
      }
    }
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  updateCartCount() {
    const count = this.cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // ================= WISHLIST MANAGEMENT =================
  toggleWishlist(product) {
    const index = this.wishlist.findIndex(item => item.id === product.id);
    
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(product);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistUI(product.id);
    this.trackEvent('toggle_wishlist', product);
  }

  updateWishlistUI(productId) {
    const wishlistBtns = document.querySelectorAll(`[data-product-id="${productId}"] .wishlist-btn`);
    const isInWishlist = this.wishlist.some(item => item.id === productId);
    
    wishlistBtns.forEach(btn => {
      btn.classList.toggle('active', isInWishlist);
      btn.innerHTML = isInWishlist ? '♥' : '♡';
      btn.setAttribute('aria-pressed', isInWishlist);
    });
  }

  // ================= UI INTERACTIONS =================
  bindEvents() {
    // Promo bar close
    document.querySelector('.promo-bar button')?.addEventListener('click', (e) => {
      e.target.closest('.promo-bar').style.display = 'none';
    });

    // Hero content close button - use event delegation for reliability
    document.addEventListener('click', (e) => {
      if (e.target.closest('.hero-close')) {
        e.preventDefault();
        e.stopPropagation();
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.style.display = 'none';
          this.announceToScreenReader('Hero popup closed');
        }
      }
    });

    // Mobile menu toggle
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Mega menu
    document.querySelectorAll('.has-mega').forEach(btn => {
      btn.addEventListener('mouseenter', () => this.showMegaMenu());
      btn.addEventListener('mouseleave', () => this.hideMegaMenu());
    });

    document.querySelector('.mega-menu')?.addEventListener('mouseenter', () => {
      clearTimeout(this.megaMenuTimeout);
    });

    document.querySelector('.mega-menu')?.addEventListener('mouseleave', () => {
      this.hideMegaMenu();
    });

    // Search functionality
    document.querySelector('[aria-label="Search"]')?.addEventListener('click', () => {
      this.toggleSearch();
    });

    // Cart toggle
    document.querySelector('[aria-label="Cart"]')?.addEventListener('click', () => {
      this.toggleCart();
    });

    // Product interactions
    this.bindProductEvents();
    
    // Filter interactions
    this.bindFilterEvents();

    // Scroll effects
    window.addEventListener('scroll', () => this.handleScroll());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  bindProductEvents() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart, .product-card button')) {
        e.preventDefault();
        const productCard = e.target.closest('.product-card, #pdp');
        if (productCard) {
          const product = this.extractProductData(productCard);
          this.addToCart(product);
        }
      }

      // Wishlist buttons
      if (e.target.matches('.wishlist-btn')) {
        e.preventDefault();
        const productCard = e.target.closest('.product-card, #pdp');
        if (productCard) {
          const product = this.extractProductData(productCard);
          this.toggleWishlist(product);
        }
      }

      // Size selection
      if (e.target.matches('.sizes button')) {
        e.target.closest('.sizes').querySelectorAll('button').forEach(btn => 
          btn.classList.remove('active')
        );
        e.target.classList.add('active');
      }

      // Color selection
      if (e.target.matches('.colors button')) {
        e.target.closest('.colors').querySelectorAll('button').forEach(btn => 
          btn.classList.remove('active')
        );
        e.target.classList.add('active');
      }
    });
  }

  bindFilterEvents() {
    // Filter buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.filters button')) {
        e.target.classList.toggle('active');
        this.updateFilters();
        this.filterProducts();
      }
    });

    // Price range
    document.querySelector('.filters input[type="range"]')?.addEventListener('input', (e) => {
      this.filters.price[1] = parseInt(e.target.value);
      this.filterProducts();
    });
  }

  extractProductData(element) {
    return {
      id: element.dataset.productId || Math.random().toString(36).substr(2, 9),
      name: element.querySelector('h3, h1')?.textContent || 'Product',
      price: parseFloat(element.querySelector('.price, p:last-of-type')?.textContent.replace(/[^0-9.]/g, '') || '0'),
      image: element.querySelector('img')?.src || '',
      size: element.querySelector('.sizes .active')?.textContent || 'M',
      color: element.querySelector('.colors .active')?.getAttribute('aria-label') || 'Default'
    };
  }

  // ================= MEGA MENU =================
  showMegaMenu() {
    clearTimeout(this.megaMenuTimeout);
    const megaMenu = document.querySelector('.mega-menu');
    if (megaMenu) {
      megaMenu.classList.add('active');
      megaMenu.setAttribute('aria-hidden', 'false');
    }
  }

  hideMegaMenu() {
    this.megaMenuTimeout = setTimeout(() => {
      const megaMenu = document.querySelector('.mega-menu');
      if (megaMenu) {
        megaMenu.classList.remove('active');
        megaMenu.setAttribute('aria-hidden', 'true');
      }
    }, 300);
  }

  // ================= MOBILE MENU =================
  toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    
    if (nav && btn) {
      const isOpen = nav.classList.toggle('mobile-open');
      btn.setAttribute('aria-expanded', isOpen);
      btn.innerHTML = isOpen ? '✕' : '☰';
      
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  // ================= SEARCH =================
  toggleSearch() {
    let searchOverlay = document.querySelector('.search-overlay');
    
    if (!searchOverlay) {
      searchOverlay = this.createSearchOverlay();
      document.body.appendChild(searchOverlay);
    }
    
    searchOverlay.classList.toggle('active');
    
    if (searchOverlay.classList.contains('active')) {
      searchOverlay.querySelector('input').focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  createSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-content">
        <button class="search-close" aria-label="Close search">✕</button>
        <input type="search" placeholder="Search for products..." aria-label="Search products">
        <div class="search-results"></div>
      </div>
    `;
    
    overlay.querySelector('.search-close').addEventListener('click', () => {
      this.toggleSearch();
    });
    
    overlay.querySelector('input').addEventListener('input', (e) => {
      this.performSearch(e.target.value);
    });
    
    return overlay;
  }

  performSearch(query) {
    // Simulate search functionality
    const results = document.querySelector('.search-results');
    if (query.length > 2) {
      results.innerHTML = `
        <div class="search-result">
          <img src="#" alt="Product">
          <div>
            <h4>French Riviera Mini Dress</h4>
            <p>₹3,200</p>
          </div>
        </div>
      `;
    } else {
      results.innerHTML = '';
    }
  }

  // ================= CART UI =================
  toggleCart() {
    const cart = document.querySelector('#cart');
    if (cart) {
      cart.classList.toggle('active');
      this.renderCart();
      
      if (cart.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  renderCart() {
    const cartContainer = document.querySelector('#cart');
    if (!cartContainer) return;

    const cartItems = this.cart.map(item => `
      <article class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>Size: ${item.size} | Color: ${item.color}</p>
          <div class="quantity-controls">
            <button onclick="app.updateQuantity('${item.id}', '${item.size}', '${item.color}', ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="app.updateQuantity('${item.id}', '${item.size}', '${item.color}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <p>₹${(item.price * item.quantity).toFixed(2)}</p>
          <button onclick="app.removeFromCart('${item.id}', '${item.size}', '${item.color}')" aria-label="Remove item">✕</button>
        </div>
      </article>
    `).join('');

    const total = this.getCartTotal();
    
    cartContainer.innerHTML = `
      <div class="cart-header">
        <h2>Your Bag (${this.cart.length})</h2>
        <button onclick="app.toggleCart()" aria-label="Close cart">✕</button>
      </div>
      <div class="cart-items">
        ${cartItems || '<p class="empty-cart">Your bag is empty</p>'}
      </div>
      ${this.cart.length > 0 ? `
        <div class="cart-footer">
          <div class="cart-total">
            <h3>Total: ₹${total.toFixed(2)}</h3>
          </div>
          <button class="btn primary" onclick="app.goToCheckout()">Checkout</button>
        </div>
      ` : ''}
    `;
  }

  showCartNotification(product) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>✓</span>
        <p>Added ${product.name} to bag</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // ================= FILTERING =================
  updateFilters() {
    const activeFilters = {
      size: Array.from(document.querySelectorAll('.filters section:nth-child(2) button.active')).map(btn => btn.textContent),
      color: Array.from(document.querySelectorAll('.filters section:nth-child(3) button.active')).map(btn => btn.getAttribute('aria-label')),
      price: [0, parseInt(document.querySelector('.filters input[type="range"]')?.value || 200)]
    };
    
    this.filters = activeFilters;
  }

  filterProducts() {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
      const shouldShow = this.shouldShowProduct(product);
      product.style.display = shouldShow ? 'block' : 'none';
    });
    
    this.updateFilterCount();
  }

  shouldShowProduct(product) {
    // Simulate filtering logic
    return true; // In real implementation, check against product attributes
  }

  updateFilterCount() {
    const visibleProducts = document.querySelectorAll('.product-card:not([style*="display: none"])').length;
    const countEl = document.querySelector('.filter-count');
    if (countEl) {
      countEl.textContent = `${visibleProducts} products`;
    }
  }

  // ================= ANIMATIONS =================
  initializeAnimations() {
    // Animation disabled - all sections remain static to prevent overlap
    // Elements are visible by default, no scroll-triggered animations
  }

  handleScroll() {
    const header = document.querySelector('.site-header');
    const scrolled = window.scrollY > 100;
    
    if (header) {
      header.classList.toggle('scrolled', scrolled);
    }
    
    // Removed parallax effect to prevent overlap with social proof section
  }

  // ================= ACCESSIBILITY =================
  setupAccessibility() {
    // Skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link sr-only';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Focus management
    this.setupFocusManagement();
    
    // ARIA live regions
    this.setupLiveRegions();
  }

  setupFocusManagement() {
    // Trap focus in modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('.search-overlay.active, #cart.active');
        if (activeModal) {
          this.trapFocus(e, activeModal);
        }
      }
    });
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  setupLiveRegions() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  handleKeyboard(e) {
    // Escape key handling
    if (e.key === 'Escape') {
      const activeOverlay = document.querySelector('.search-overlay.active');
      const activeCart = document.querySelector('#cart.active');
      
      if (activeOverlay) {
        this.toggleSearch();
      } else if (activeCart) {
        this.toggleCart();
      }
    }
    
    // Enter key for buttons
    if (e.key === 'Enter' && e.target.matches('button')) {
      e.target.click();
    }
  }

  // ================= CHECKOUT =================
  goToCheckout() {
    if (this.cart.length === 0) {
      this.announceToScreenReader('Your cart is empty');
      return;
    }
    
    // Hide cart
    this.toggleCart();
    
    // Show checkout
    document.querySelector('#checkout')?.scrollIntoView({ behavior: 'smooth' });
    
    this.trackEvent('begin_checkout', { value: this.getCartTotal() });
  }

  // ================= ANALYTICS =================
  trackEvent(eventName, data = {}) {
    // Simulate analytics tracking
    console.log('Analytics Event:', eventName, data);
    
    // In real implementation, integrate with Google Analytics, Facebook Pixel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, data);
    }
  }

  // ================= PERFORMANCE =================
  lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// ================= ADDITIONAL CSS FOR JS FEATURES =================
const additionalStyles = `
<style>
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.search-overlay.active {
  opacity: 1;
  visibility: visible;
}

.search-content {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 600px;
  position: relative;
}

.search-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  font-size: var(--text-xl);
}

.search-content input {
  width: 100%;
  padding: var(--space-4);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-lg);
  margin-bottom: var(--space-4);
}

.search-result {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.search-result:hover {
  background: var(--neutral-50);
}

.search-result img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.cart-notification {
  position: fixed;
  top: 100px;
  right: var(--space-4);
  background: var(--neutral-900);
  color: var(--white);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  z-index: 400;
  transform: translateX(100%);
  transition: transform var(--transition-base);
}

.cart-notification.show {
  transform: translateX(0);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--neutral-200);
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--neutral-200);
}

.cart-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.cart-item-details h4 {
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.cart-item-details p {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  margin-bottom: var(--space-2);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.quantity-controls button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item-price {
  text-align: right;
}

.cart-item-price p {
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.cart-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--neutral-200);
}

.cart-total {
  margin-bottom: var(--space-4);
  text-align: center;
}

.empty-cart {
  text-align: center;
  color: var(--neutral-600);
  padding: var(--space-8);
}

.main-nav.mobile-open {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--white);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.skip-link:focus {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--gold-primary);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 0 0 4px 0;
  z-index: 1000;
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

.animate-in {
  opacity: 1;
  /* Animation disabled to prevent overlap - all sections remain static */
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.site-header.scrolled {
  box-shadow: var(--shadow-md);
}

.wishlist-btn.active {
  color: var(--primary);
}

@media (max-width: 768px) {
  .cart-notification {
    right: var(--space-2);
    left: var(--space-2);
    transform: translateY(-100%);
  }
  
  .cart-notification.show {
    transform: translateY(0);
  }
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// ================= INITIALIZE APP =================
const app = new EcommerceApp();

// ================= SERVICE WORKER FOR PWA =================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}