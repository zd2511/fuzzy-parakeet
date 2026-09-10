const STORAGE_KEY = "vts_products";
const SESSION_KEY = "vts_admin_session";
const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f3f6f4"/><rect x="120" y="130" width="560" height="340" rx="24" fill="#dce4e0"/><circle cx="285" cy="300" r="74" fill="#26342f"/><circle cx="285" cy="300" r="38" fill="#07110e"/><text x="400" y="370" font-family="Arial" font-size="32" font-weight="700" fill="#23312c">VTS PRODUCT</text></svg>`);

if (sessionStorage.getItem(SESSION_KEY) !== "authenticated") {
  window.location.replace("index.html");
}

let products = loadProducts();
let currentImageData = "";

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "vts-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function loadProducts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    alert("The product could not be saved. Your browser may have reached its localStorage limit. Try using a smaller image.");
    console.error(error);
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function money(value) {
  return "R" + Number(value || 0).toLocaleString("en-ZA");
}

function renderTable() {
  const table = document.getElementById("productTable");

  if (!products.length) {
    table.innerHTML = `<tr><td colspan="7" class="empty-row">No products yet. Click “Add Product” to create one.</td></tr>`;
  } else {
    table.innerHTML = products.map(product => `
      <tr>
        <td>
          <img class="table-thumb"
            src="${escapeHtml(product.image || FALLBACK_IMAGE)}"
            alt="${escapeHtml(product.name)}"
            onerror="this.src='${FALLBACK_IMAGE}'">
        </td>
        <td class="table-name">${escapeHtml(product.name)}</td>
        <td><span class="table-category">${escapeHtml(product.category)}</span></td>
        <td class="table-price">${money(product.price)}</td>
        <td>${(product.features || []).length}</td>
        <td>
          <span class="status-pill ${product.installed ? "installed" : ""}">
            ${product.installed ? "Fully Installed" : "Supply Only"}
          </span>
        </td>
        <td>
          <button class="table-action edit-action" data-edit="${escapeHtml(product.id)}">Edit</button>
          <button class="table-action delete-action" data-delete="${escapeHtml(product.id)}">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  document.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => openForm(button.dataset.edit));
  });

  document.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteProduct(button.dataset.delete));
  });

  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("installedProducts").textContent = products.filter(p => p.installed).length;
  document.getElementById("categoryCount").textContent = new Set(products.map(p => p.category)).size;
}

function addFeature(value = "") {
  const row = document.createElement("div");
  row.className = "feature-row";

  const input = document.createElement("input");
  input.className = "feature-input";
  input.type = "text";
  input.maxLength = 180;
  input.placeholder = "Feature description";
  input.value = value;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-feature";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove feature");
  remove.addEventListener("click", () => row.remove());

  row.append(input, remove);
  document.getElementById("featuresList").appendChild(row);
}

function resetForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("featuresList").innerHTML = "";
  document.getElementById("formTitle").textContent = "Add Product";
  currentImageData = "";
  setPreview("");
  addFeature();
}

function setPreview(dataUrl, filename = "") {
  const preview = document.getElementById("imagePreview");
  const image = document.getElementById("previewImage");
  const placeholder = document.getElementById("previewPlaceholder");
  const fileName = document.getElementById("fileName");

  if (dataUrl) {
    image.src = dataUrl;
    preview.classList.add("has-image");
    currentImageData = dataUrl;
    if (filename) fileName.textContent = filename;
  } else {
    image.removeAttribute("src");
    preview.classList.remove("has-image");
    currentImageData = "";
    fileName.textContent = "No photo selected";
    placeholder.textContent = "Your uploaded photo preview will appear here";
  }
}

function openForm(id = null) {
  resetForm();

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    document.getElementById("formTitle").textContent = "Edit Product";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productCategory").value = product.category || "CCTV";
    document.getElementById("productPrice").value = product.price ?? "";
    document.getElementById("productInstalled").checked = Boolean(product.installed);

    document.getElementById("featuresList").innerHTML = "";
    const features = Array.isArray(product.features) ? product.features : [];
    if (features.length) features.forEach(addFeature);
    else addFeature();

    if (product.image) {
      setPreview(product.image, "Current product photo");
    }
  }

  document.getElementById("productModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("productName").focus(), 50);
}

function closeForm() {
  document.getElementById("productModal").classList.add("hidden");
}

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const confirmed = window.confirm(
    `Delete "${product.name}"?\n\nThis product will be removed from the public website.`
  );

  if (!confirmed) return;

  products = products.filter(item => item.id !== id);
  saveProducts();
  renderTable();
}

async function handlePhotoUpload(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  const maxBytes = 6 * 1024 * 1024;
  if (file.size > maxBytes) {
    alert("Please choose an image smaller than 6 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    setPreview(event.target.result, file.name);
  };

  reader.onerror = () => {
    alert("The selected image could not be read.");
  };

  reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", () => {
  renderTable();

  document.getElementById("addProductBtn").addEventListener("click", () => openForm());
  document.getElementById("closeProductModal").addEventListener("click", closeForm);
  document.getElementById("cancelProductBtn").addEventListener("click", closeForm);
  document.getElementById("addFeatureBtn").addEventListener("click", () => addFeature());

  const uploadButton = document.getElementById("uploadPhotoBtn");
  const fileInput = document.getElementById("productImage");

  uploadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", event => handlePhotoUpload(event.target.files[0]));

  document.getElementById("productModal").addEventListener("click", event => {
    if (event.target.id === "productModal") closeForm();
  });

  document.getElementById("productForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("productId").value || makeId();
    const features = [...document.querySelectorAll(".feature-input")]
      .map(input => input.value.trim())
      .filter(Boolean);

    const existingIndex = products.findIndex(product => product.id === id);
    const existingProduct = existingIndex >= 0 ? products[existingIndex] : null;

    const product = {
      id,
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value,
      price: Number(document.getElementById("productPrice").value),
      installed: document.getElementById("productInstalled").checked,
      image: currentImageData || existingProduct?.image || FALLBACK_IMAGE,
      features
    };

    if (!product.name) {
      alert("Please enter a product name.");
      return;
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (existingIndex >= 0) products[existingIndex] = product;
    else products.push(product);

    if (saveProducts()) {
      renderTable();
      closeForm();
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace("index.html");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeForm();
  });
});
