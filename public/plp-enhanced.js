// ================= ENHANCED PLP FUNCTIONALITY =================
class EnhancedPLP {
  constructor() {
    this.products = this.generateSampleProducts();
    this.filteredProducts = [...this.products];
    this.currentView = 'grid';
    this.currentSort = 'featured';
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.activeFilters = {
      category: [],
      size: [],
      color: [],
      price: [0, 200],
      features: []
    };
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderProducts();
    this.updateResultsCount();
  }

  generateSampleProducts() {
    const categories = ['dresses', 'tops', 'bottoms', 'outerwear'];
    const colors = ['black', 'white', 'red', 'blue', 'green', 'pink'];
    const sizes = ['xs', 's', 'm', 'l', 'xl', '2xl'];
    const features = ['sustainable', 'new', 'sale', 'exclusive'];
    
    const products = [];
    const productNames = [
      'Sunset Mini Dress', 'Vintage Denim Jacket', 'Silk Camisole', 'Wide Leg Jeans',
      'Cropped Blazer', 'Maxi Dress', 'Graphic Tee', 'Leather Jacket',
      'Pleated Skirt', 'Oversized Sweater', 'Bodysuit', 'Cargo Pants',
      'Slip Dress', 'Denim Shorts', 'Knit Cardigan', 'Mini Skirt',
      'Button-Up Shirt', 'Wrap Dress', 'High-Waist Jeans', 'Crop Top',
      'Trench Coat', 'Midi Dress', 'Tank Top', 'Palazzo Pants'
    ];

    for (let i = 0; i < 24; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const basePrice = Math.floor(Math.random() * 150) + 25;
      const isOnSale = Math.random() > 0.7;
      const salePrice = isOnSale ? Math.floor(basePrice * 0.8) : basePrice;
      
      products.push({
        id: i + 1,
        name: productNames[i],
        category: category,
        price: salePrice,
        originalPrice: isOnSale ? basePrice : null,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 200) + 10,
        colors: this.getRandomItems(colors, Math.floor(Math.random() * 3) + 1),
        sizes: this.getRandomItems(sizes, Math.floor(Math.random() * 4) + 2),
        features: this.getRandomItems(features, Math.floor(Math.random() * 2)),
        image: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=500&fit=crop`,
        inStock: Math.random() > 0.1
      });
    }
    
    return products;
  }

  getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  bindEvents() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentView = e.target.dataset.view;
        this.updateView();
      });
    });

    // Sort dropdown
    document.querySelector('.sort-dropdown select')?.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.sortProducts();
      this.renderProducts();
    });

    // Filter checkboxes
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateFilters();
        this.filterProducts();
        this.renderProducts();
      });
    });

    // Size filters
    document.querySelectorAll('.size-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.classList.toggle('active');
        this.updateFilters();
        this.filterProducts();
        this.renderProducts();
      });
    });

    // Color filters
    document.querySelectorAll('.color-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.classList.toggle('active');
        this.updateFilters();
        this.filterProducts();
        this.renderProducts();
      });
    });

    // Price range
    document.querySelector('.price-slider')?.addEventListener('input', (e) => {
      this.activeFilters.price[1] = parseInt(e.target.value);
      document.querySelector('.price-display span:last-child').textContent = `$${e.target.value}`;
      this.debounce(() => {
        this.filterProducts();
        this.renderProducts();
      }, 300)();
    });

    // Clear filters
    document.querySelector('.clear-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Quick view
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quick-view')) {
        const productId = parseInt(e.target.closest('.product-card').dataset.productId);
        this.showQuickView(productId);
      }
    });

    // Modal close
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.closeQuickView();
    });

    // Pagination
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!e.target.disabled && !e.target.classList.contains('active')) {
          const page = e.target.textContent;
          if (page === 'Previous') {
            this.currentPage = Math.max(1, this.currentPage - 1);
          } else if (page === 'Next') {
            this.currentPage = Math.min(this.getTotalPages(), this.currentPage + 1);
          } else {
            this.currentPage = parseInt(page);
          }
          this.renderProducts();
          this.updatePagination();
        }
      });
    });

    // Mobile filter toggle
    document.querySelector('.filter-toggle')?.addEventListener('click', () => {
      document.querySelector('.filters-sidebar').classList.toggle('mobile-open');
    });
  }

  updateFilters() {
    // Category filters
    this.activeFilters.category = Array.from(
      document.querySelectorAll('.filter-options input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    // Size filters
    this.activeFilters.size = Array.from(
      document.querySelectorAll('.size-filter.active')
    ).map(btn => btn.dataset.size);

    // Color filters
    this.activeFilters.color = Array.from(
      document.querySelectorAll('.color-filter.active')
    ).map(btn => btn.dataset.color);

    // Feature filters
    this.activeFilters.features = Array.from(
      document.querySelectorAll('.filter-options input[value="sustainable"]:checked, .filter-options input[value="new"]:checked, .filter-options input[value="sale"]:checked, .filter-options input[value="exclusive"]:checked')
    ).map(cb => cb.value);
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      // Category filter
      if (this.activeFilters.category.length > 0 && 
          !this.activeFilters.category.includes(product.category)) {
        return false;
      }

      // Size filter
      if (this.activeFilters.size.length > 0 && 
          !this.activeFilters.size.some(size => product.sizes.includes(size))) {
        return false;
      }

      // Color filter
      if (this.activeFilters.color.length > 0 && 
          !this.activeFilters.color.some(color => product.colors.includes(color))) {
        return false;
      }

      // Price filter
      if (product.price < this.activeFilters.price[0] || 
          product.price > this.activeFilters.price[1]) {
        return false;
      }

      // Feature filter
      if (this.activeFilters.features.length > 0 && 
          !this.activeFilters.features.some(feature => product.features.includes(feature))) {
        return false;
      }

      return true;
    });

    this.currentPage = 1; // Reset to first page when filtering
    this.updateResultsCount();
  }

  sortProducts() {
    switch (this.currentSort) {
      case 'newest':
        this.filteredProducts.sort((a, b) => b.id - a.id);
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default: // featured
        this.filteredProducts.sort((a, b) => a.id - b.id);
    }
  }

  renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

    grid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
    
    this.updatePagination();
    
    // Animate in new products
    requestAnimationFrame(() => {
      grid.querySelectorAll('.product-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 50}ms`;
        card.classList.add('animate-in');
      });
    });
  }

  createProductCard(product) {
    const badges = product.features.map(feature => {
      const badgeClass = feature === 'sale' ? 'sale' : feature === 'new' ? 'new' : 'sustainable';
      const badgeText = feature === 'sale' ? '-25%' : feature === 'new' ? 'New' : 'Eco';
      return `<span class="badge ${badgeClass}">${badgeText}</span>`;
    }).join('');

    const colors = product.colors.map(color => 
      `<span class="color-dot" style="background: ${this.getColorHex(color)}"></span>`
    ).join('');

    const sizes = product.sizes.map(size => 
      `<span class="size-available">${size.toUpperCase()}</span>`
    ).join('');

    const priceDisplay = product.originalPrice 
      ? `$${product.price} <span class="original-price">$${product.originalPrice}</span>`
      : `$${product.price}`;

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="product-badges">${badges}</div>
          <button class="wishlist-btn" aria-label="Add to wishlist">♡</button>
          <div class="quick-actions">
            <button class="quick-view" aria-label="Quick view">👁</button>
            <button class="quick-add" aria-label="Quick add to cart">+</button>
          </div>
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="product-rating">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} <span>(${product.reviews})</span></p>
          <div class="product-colors">${colors}</div>
          <p class="product-price">${priceDisplay}</p>
          <div class="product-sizes">${sizes}</div>
        </div>
      </article>
    `;
  }

  getColorHex(colorName) {
    const colorMap = {
      black: '#000000',
      white: '#ffffff',
      red: '#ff4444',
      blue: '#4444ff',
      green: '#44ff44',
      pink: '#ff44ff'
    };
    return colorMap[colorName] || '#cccccc';
  }

  updateView() {
    const grid = document.getElementById('product-grid');
    if (grid) {
      grid.className = `product-grid ${this.currentView}-view`;
    }
  }

  updateResultsCount() {
    const countEl = document.getElementById('product-count');
    if (countEl) {
      countEl.textContent = this.filteredProducts.length;
    }
  }

  getTotalPages() {
    return Math.ceil(this.filteredProducts.length / this.productsPerPage);
  }

  updatePagination() {
    const totalPages = this.getTotalPages();
    const pageButtons = document.querySelectorAll('.page-btn');
    
    pageButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.disabled = false;
      
      if (btn.textContent === 'Previous') {
        btn.disabled = this.currentPage === 1;
      } else if (btn.textContent === 'Next') {
        btn.disabled = this.currentPage === totalPages;
      } else if (parseInt(btn.textContent) === this.currentPage) {
        btn.classList.add('active');
      }
    });
  }

  showQuickView(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('quick-view-modal');
    const modalImage = document.getElementById('modal-product-image');
    const modalTitle = document.getElementById('modal-title');
    
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalTitle.textContent = product.name;
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    modal.querySelector('.modal-close').focus();
  }

  closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  clearAllFilters() {
    // Clear checkboxes
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    // Clear size filters
    document.querySelectorAll('.size-filter').forEach(btn => {
      btn.classList.remove('active');
    });

    // Clear color filters
    document.querySelectorAll('.color-filter').forEach(btn => {
      btn.classList.remove('active');
    });

    // Reset price range
    const priceSlider = document.querySelector('.price-slider');
    if (priceSlider) {
      priceSlider.value = 200;
      document.querySelector('.price-display span:last-child').textContent = '$200';
    }

    // Reset filters and re-render
    this.activeFilters = {
      category: [],
      size: [],
      color: [],
      price: [0, 200],
      features: []
    };

    this.filteredProducts = [...this.products];
    this.currentPage = 1;
    this.renderProducts();
    this.updateResultsCount();
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Additional CSS for enhanced PLP
const plpStyles = `
<style>
.plp-page {
  padding-top: var(--space-8);
}

.plp-header {
  background: var(--neutral-50);
  padding: var(--space-8) 0;
  margin-bottom: var(--space-8);
}

.breadcrumb {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.breadcrumb li:not(:last-child)::after {
  content: '/';
  margin-left: var(--space-2);
  color: var(--neutral-500);
}

.breadcrumb a {
  color: var(--neutral-600);
  transition: color var(--transition-fast);
}

.breadcrumb a:hover {
  color: var(--primary);
}

.plp-title-section {
  text-align: center;
  margin-bottom: var(--space-6);
}

.plp-title-section h1 {
  font-family: var(--font-primary);
  font-size: var(--text-4xl);
  font-weight: 800;
  margin-bottom: var(--space-2);
}

.plp-description {
  color: var(--neutral-600);
  font-size: var(--text-lg);
}

.plp-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.view-toggle {
  display: flex;
  gap: var(--space-1);
}

.view-btn {
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  transition: all var(--transition-fast);
}

.view-btn.active,
.view-btn:hover {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.sort-dropdown select {
  padding: var(--space-2) var(--space-4);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  background: var(--white);
  font-size: var(--text-sm);
}

.filter-toggle {
  display: none;
  padding: var(--space-2) var(--space-4);
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-md);
  font-weight: 600;
}

.plp-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
}

.filters-sidebar {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  height: fit-content;
  position: sticky;
  top: 120px;
  box-shadow: var(--shadow-sm);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--neutral-200);
}

.filters-header h2 {
  font-family: var(--font-primary);
  font-weight: 700;
  color: var(--neutral-900);
}

.clear-filters {
  color: var(--primary);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: opacity var(--transition-fast);
}

.clear-filters:hover {
  opacity: 0.8;
}

.filter-group {
  margin-bottom: var(--space-6);
}

.filter-group h3 {
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--neutral-900);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.filter-options label:hover {
  color: var(--primary);
}

.filter-options span {
  margin-left: auto;
  color: var(--neutral-500);
  font-size: var(--text-xs);
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.size-filter {
  padding: var(--space-2);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.size-filter:hover,
.size-filter.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.color-filters {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}

.color-filter {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 3px solid transparent;
  transition: border-color var(--transition-fast);
}

.color-filter:hover,
.color-filter.active {
  border-color: var(--neutral-900);
}

.price-range {
  margin-top: var(--space-3);
}

.price-slider {
  width: 100%;
  margin-bottom: var(--space-2);
}

.price-display {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.results-count {
  color: var(--neutral-600);
  font-size: var(--text-sm);
}

.product-grid.list-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.product-grid.list-view .product-card {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-4);
}

.product-image {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.product-badges {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.badge {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--white);
}

.badge.new {
  background: var(--secondary);
}

.badge.sale {
  background: var(--primary);
}

.badge.sustainable {
  background: var(--accent);
  color: var(--neutral-900);
}

.wishlist-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  transition: all var(--transition-fast);
}

.wishlist-btn:hover {
  background: var(--primary);
  color: var(--white);
}

.quick-actions {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.product-card:hover .quick-actions {
  opacity: 1;
}

.quick-view,
.quick-add {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.8);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.quick-view:hover,
.quick-add:hover {
  background: var(--primary);
}

.product-rating {
  font-size: var(--text-sm);
  color: var(--accent);
  margin: var(--space-1) 0;
}

.product-rating span {
  color: var(--neutral-500);
}

.product-colors {
  display: flex;
  gap: var(--space-1);
  margin: var(--space-2) 0;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--neutral-300);
}

.product-sizes {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.size-available,
.size-unavailable {
  padding: var(--space-1);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.size-unavailable {
  opacity: 0.5;
  text-decoration: line-through;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-8);
}

.page-btn {
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled),
.page-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--neutral-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  z-index: 1;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  padding: var(--space-6);
}

.modal-image img {
  width: 100%;
  border-radius: var(--radius-lg);
}

.modal-info h2 {
  font-family: var(--font-primary);
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.modal-rating {
  color: var(--accent);
  margin-bottom: var(--space-3);
}

.modal-price {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--primary);
  margin-bottom: var(--space-4);
}

.modal-add-to-cart {
  width: 100%;
  margin-bottom: var(--space-3);
}

@media (max-width: 768px) {
  .filter-toggle {
    display: block;
  }
  
  .plp-controls {
    flex-wrap: wrap;
  }
  
  .plp-content {
    grid-template-columns: 1fr;
  }
  
  .filters-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    width: 80%;
    height: 100vh;
    z-index: 200;
    transition: left var(--transition-base);
    overflow-y: auto;
  }
  
  .filters-sidebar.mobile-open {
    left: 0;
  }
  
  .modal-body {
    grid-template-columns: 1fr;
  }
  
  .product-grid.list-view .product-card {
    grid-template-columns: 120px 1fr;
  }
}
</style>
`;

// Inject PLP styles
document.head.insertAdjacentHTML('beforeend', plpStyles);

// Initialize enhanced PLP if on shop page
if (window.location.pathname.includes('shop') || document.querySelector('.plp-page')) {
  const enhancedPLP = new EnhancedPLP();
}