/**
 * products.js - 产品商店模块
 * 负责：加载产品、按分类渲染、Modal 详情、Lightbox 预览、加购 Toast
 * 使用 ES6+ 特性：async/await、模板字面量、箭头函数、解构赋值、let/const
 */

// ES6: 分类映射表（代码 → 显示名）
const CATEGORY_MAP = {
  all: 'All',
  parts: 'Parts Catalog',
  ecommerce: 'Ecommerce',
  service: 'Service Management',
  analytics: 'Data Analytics',
  ai: 'AI'
};

// 当前选中的分类（ES6 let 可变状态）
let currentCategory = 'all';
// 产品数据缓存（ES6 let）
let allProducts = [];

/**
 * 异步加载产品数据（ES7: async/await）
 * 先从 localStorage 读取，若无则 fetch products.json
 */
const loadProductsData = async () => {
  // ES7: await 等待 main.js 的初始化
  const products = await Main.ensureProductsLoaded();
  allProducts = products || [];
  return allProducts;
};

/**
 * 按分类筛选产品（ES6 箭头函数 + filter）
 * @param {string} category - 分类代码
 * @returns {Array} 筛选后的产品列表
 */
const filterProducts = (category = 'all') => {
  if (category === 'all') return allProducts;
  // ES6: 箭头函数过滤
  return allProducts.filter((p) => p.category === category);
};

/**
 * 渲染分类筛选按钮（ES6 模板字面量）
 */
const renderFilterBar = () => {
  const bar = document.getElementById('filterBar');
  if (!bar) return;

  // ES6: Object.entries 遍历映射表
  bar.innerHTML = Object.entries(CATEGORY_MAP)
    .map(
      ([code, label]) => `
      <button class="filter-btn ${currentCategory === code ? 'active' : ''}" 
              data-category="${code}">${label}</button>`
    )
    .join('');

  // 绑定点击事件（ES6: forEach + 箭头函数）
  bar.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      renderFilterBar();
      renderProductGrid();
    });
  });
};

/**
 * 渲染产品网格（ES6 模板字面量生成卡片）
 */
const renderProductGrid = () => {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const products = filterProducts(currentCategory);

  // 空状态
  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-cart" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-box-open"></i>
        <h3>No products found</h3>
        <p>Try a different category.</p>
      </div>`;
    return;
  }

  // ES6: map 遍历生成产品卡片
  grid.innerHTML = products
    .map((product) => {
      // ES6: 解构赋值
      const { id, name, price, category, stock, image } = product;
      // 库存小于 5 显示红色"库存紧张"
      const lowStock = stock < 5;
      const stockBadge = lowStock
        ? `<span class="product-stock-badge low">Low Stock: ${stock}</span>`
        : `<span class="product-stock-badge">In Stock: ${stock}</span>`;

      // ES6: 模板字面量
      return `
        <div class="product-card" data-id="${id}">
          <div class="product-image">
            <img src="${image}" alt="${name}" loading="lazy" 
                 onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20software%20product%20placeholder&image_size=square'">
            ${stockBadge}
          </div>
          <div class="product-info">
            <span class="product-category">${CATEGORY_MAP[category] || category}</span>
            <h3 class="product-name">${name}</h3>
            <p class="product-desc">${product.description || ''}</p>
            <div class="product-footer">
              <span class="product-price">$${price}<span class="per">/mo</span></span>
              <button class="btn btn-primary btn-sm view-detail-btn" data-id="${id}">
                <i class="fa-solid fa-eye"></i> View
              </button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  // 绑定点击事件（点击卡片或按钮打开 Modal）
  grid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // 避免点击库存徽章触发
      if (e.target.closest('.product-stock-badge')) return;
      const id = Number(card.dataset.id);
      openProductModal(id);
    });
  });
};

/**
 * 打开产品详情 Modal（600×500）
 * @param {number} id - 产品 ID
 */
const openProductModal = (id) => {
  // ES6: find 查找产品
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  const { name, price, category, stock, image, description } = product;
  const lowStock = stock < 5;

  // 创建 Modal（ES6 模板字面量）
  let overlay = document.getElementById('productModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'productModalOverlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  // ES6: 模板字面量生成 Modal 内容
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Product Details</h3>
        <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="product-modal-content">
          <div class="product-modal-image" id="modalImage" title="Click to enlarge">
            <img src="${image}" alt="${name}" 
                 onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20software%20product%20placeholder&image_size=square'">
          </div>
          <div class="product-modal-info">
            <span class="product-category">${CATEGORY_MAP[category] || category}</span>
            <h2 style="margin: 8px 0;">${name}</h2>
            <div class="price">$${price}<span style="font-size:0.9rem;color:var(--text-muted);">/mo</span></div>
            <p class="description">${description || 'No description available.'}</p>
            <div class="product-modal-meta">
              <div class="meta-item">
                <div class="label">Category</div>
                <div class="value">${CATEGORY_MAP[category] || category}</div>
              </div>
              <div class="meta-item">
                <div class="label">Stock</div>
                <div class="value ${lowStock ? 'low-stock' : ''}">${stock} ${lowStock ? 'left!' : 'available'}</div>
              </div>
            </div>
            <button class="btn btn-accent btn-lg" id="modalAddCart" style="width:100%;">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // 显示 Modal
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';

  // 绑定关闭事件（ES6 箭头函数）
  document.getElementById('modalClose').addEventListener('click', closeProductModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProductModal();
  });

  // 点击大图打开 Lightbox
  document.getElementById('modalImage').addEventListener('click', () => {
    openLightbox(image);
  });

  // 加入购物车按钮
  document.getElementById('modalAddCart').addEventListener('click', () => {
    addToCartFromModal(product);
  });
};

/**
 * 关闭产品 Modal
 */
const closeProductModal = () => {
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
};

/**
 * 从 Modal 加入购物车（ES6 解构赋值）
 * 加入后显示 Toast 通知并关闭 Modal
 */
const addToCartFromModal = (product) => {
  // 库存校验
  const cartItem = Storage.getCart().find((item) => item.id === product.id);
  const currentQty = cartItem ? cartItem.quantity : 0;
  if (currentQty >= product.stock) {
    Main.showToast('Insufficient stock!', 'error');
    return;
  }

  // ES6: 解构赋值提取需要的字段
  const { id, name, price, image } = product;
  Storage.addToCart({ id, name, price, image });
  Main.updateCartBadge();
  Main.showToast('Added to cart successfully!', 'success');
  closeProductModal();
};

/**
 * 打开全屏 Lightbox 预览图片
 * @param {string} imageUrl - 图片 URL
 */
const openLightbox = (imageUrl) => {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    document.body.appendChild(lb);
  }

  // ES6: 模板字面量
  lb.innerHTML = `
    <button class="lightbox-close" id="lightboxClose"><i class="fa-solid fa-xmark"></i></button>
    <img src="${imageUrl}" alt="Preview">`;

  lb.classList.add('show');
  document.body.style.overflow = 'hidden';

  // 点击任意位置关闭
  lb.addEventListener('click', closeLightbox);
};

/**
 * 关闭 Lightbox
 */
const closeLightbox = () => {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.classList.remove('show');
    document.body.style.overflow = '';
  }
};

/**
 * 从 URL 参数读取分类（支持从首页/其他页面跳转携带 ?cat=xxx）
 * ES6: URLSearchParams
 */
const readCategoryFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat && CATEGORY_MAP[cat]) {
    currentCategory = cat;
  }
};

/**
 * 渲染首页精选产品（4 个）
 * @param {number} limit - 显示数量（ES6 默认参数）
 */
const renderFeaturedProducts = (limit = 4) => {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  // 取前 limit 个产品
  const featured = allProducts.slice(0, limit);
  if (featured.length === 0) {
    grid.innerHTML = '<p class="text-muted text-center">No products available.</p>';
    return;
  }

  // ES6: map 生成卡片
  grid.innerHTML = featured
    .map((product) => {
      const { id, name, price, category, stock, image } = product;
      const lowStock = stock < 5;
      return `
        <div class="product-card" data-id="${id}">
          <div class="product-image">
            <img src="${image}" alt="${name}" loading="lazy"
                 onerror="this.src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20software%20product%20placeholder&image_size=square'">
            ${lowStock ? `<span class="product-stock-badge low">Low: ${stock}</span>` : `<span class="product-stock-badge">Stock: ${stock}</span>`}
          </div>
          <div class="product-info">
            <span class="product-category">${CATEGORY_MAP[category] || category}</span>
            <h3 class="product-name">${name}</h3>
            <p class="product-desc">${product.description || ''}</p>
            <div class="product-footer">
              <span class="product-price">$${price}<span class="per">/mo</span></span>
              <button class="btn btn-outline btn-sm">Details</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  // 绑定点击事件
  grid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      openProductModal(id);
    });
  });
};

/**
 * 产品页初始化入口（ES7: async/await）
 */
const initProductsPage = async () => {
  await loadProductsData();
  readCategoryFromUrl();
  renderFilterBar();
  renderProductGrid();
};

/**
 * 首页精选产品初始化（ES7: async/await）
 */
const initFeaturedProducts = async () => {
  await loadProductsData();
  renderFeaturedProducts(4);
};

// 暴露 API
window.Products = {
  loadProductsData, filterProducts, renderFilterBar, renderProductGrid,
  openProductModal, closeProductModal, addToCartFromModal,
  openLightbox, closeLightbox, renderFeaturedProducts,
  initProductsPage, initFeaturedProducts, CATEGORY_MAP
};
