const STORAGE_KEY = "vts_products";
const SESSION_KEY = "vts_admin_session";
const ADMIN_PASSWORD = "admin123";

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<rect width="800" height="600" fill="#f3f6f4"/>
<rect x="120" y="130" width="560" height="340" rx="24" fill="#dce4e0"/>
<circle cx="285" cy="300" r="74" fill="#26342f"/>
<circle cx="285" cy="300" r="38" fill="#07110e"/>
<rect x="410" y="225" width="170" height="42" rx="12" fill="#ffffff"/>
<rect x="410" y="285" width="140" height="28" rx="9" fill="#ffffff"/>
<text x="400" y="380" font-family="Arial" font-size="32" font-weight="700" fill="#23312c">VTS PRODUCT</text>
</svg>`);

const DEFAULT_PRODUCTS = [
  {
    id: makeId(),
    name: "Hikvision 8-Channel CCTV Package",
    category: "CCTV",
    price: 7800,
    installed: true,
    image: FALLBACK_IMAGE,
    features: [
      "8 × Hikvision 1080P HD Bullet Cameras",
      "8CH 1080P HD DVR",
      "1TB Seagate HDD",
      "100m RG59 Cable",
      "8 × BNC Male Crimp Connectors",
      "8 × DC Plugs",
      "Mole",
      "Fully Installed"
    ]
  },
  {
    id: makeId(),
    name: "Hikvision 4-Channel CCTV Package",
    category: "CCTV",
    price: 5200,
    installed: true,
    image: FALLBACK_IMAGE,
    features: [
      "4 × 2MP Hikvision Bullet Cameras",
      "1 × ZATECH 4-Channel DVR",
      "1 × 500GB HDD",
      "100m CAT5 Cable Roll",
      "4 × DC Power Connectors",
      "4 × Balun Packs",
      "1 × 5A 4-Channel Power Supply",
      "Fully Installed"
    ]
  }
];

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "vts-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function getProducts() {
  let products;
  try {
    products = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    products = null;
  }

  if (!Array.isArray(products) || products.length === 0) {
    products = DEFAULT_PRODUCTS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
  return products;
}

function formatPrice(value) {
  return "R" + Number(value || 0).toLocaleString("en-ZA");
}

function renderProducts(category = "All") {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const products = getProducts().filter(product =>
    category === "All" || product.category === category
  );

  if (!products.length) {
    grid.innerHTML = `<div class="empty-products">No products are available in this category.</div>`;
    return;
  }

  grid.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img
          src="${escapeHtml(product.image || FALLBACK_IMAGE)}"
          alt="${escapeHtml(product.name)}"
          onerror="this.src='${FALLBACK_IMAGE}'"
        >
      </div>
      <div class="product-info">
        <span class="product-tag">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-status ${product.installed ? "" : "supply"}">
          ${product.installed ? "Fully Installed" : "Supply Only"}
        </div>
        <ul class="product-features">
          ${(product.features || []).map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
        <button class="whatsapp-product" data-product="${escapeHtml(product.name)}">
          ◉ &nbsp; Enquire on WhatsApp
        </button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".whatsapp-product").forEach(button => {
    button.addEventListener("click", () => {
      const productName = button.dataset.product;
      const message = encodeURIComponent(
        `Hi VTS Energy & Security, I am interested in the ${productName}. Please send me more information.`
      );
      window.open(`https://wa.me/27330322153?text=${message}`, "_blank", "noopener");
    });
  });
}

function buildFilters() {
  const holder = document.getElementById("productFilters");
  if (!holder) return;

  const categories = ["All", "Solar", "Batteries", "Inverters", "CCTV", "Access Control", "Alarms"];
  holder.innerHTML = categories.map((category, index) =>
    `<button class="filter ${index === 0 ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
  ).join("");

  holder.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      holder.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      renderProducts(button.dataset.category);
    });
  });
}

function setupAdminModal() {
  const modal = document.getElementById("passwordModal");
  const link = document.getElementById("adminLink");
  const close = document.getElementById("closeModal");
  const input = document.getElementById("adminPassword");
  const error = document.getElementById("loginError");
  const login = document.getElementById("loginBtn");

  if (!modal || !link) return;

  function open() {
    modal.classList.remove("hidden");
    error.textContent = "";
    input.value = "";
    setTimeout(() => input.focus(), 50);
  }

  function hide() {
    modal.classList.add("hidden");
  }

  link.addEventListener("click", event => {
    event.preventDefault();
    open();
  });

  close.addEventListener("click", hide);

  modal.addEventListener("click", event => {
    if (event.target === modal) hide();
  });

  function authenticate() {
    if (input.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "authenticated");
      window.location.href = "admin.html";
    } else {
      error.textContent = "Incorrect password. Please try again.";
      input.select();
    }
  }

  login.addEventListener("click", authenticate);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") authenticate();
    if (event.key === "Escape") hide();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  getProducts();
  buildFilters();
  renderProducts();
  setupAdminModal();

  const mobileMenu = document.getElementById("mobileMenu");
  const nav = document.querySelector(".main-nav");

  mobileMenu?.addEventListener("click", () => {
    nav.classList.toggle("mobile-open");
  });
});
