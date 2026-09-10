VTS Energy & Security - Frontend Product Catalog
====================================================

Files:
  index.html
  styles.css
  script.js
  admin.html
  admin.js
  admin.css
  logo.png

Admin password:
  admin123

How it works:
  - The public site reads products from localStorage key "vts_products".
  - If no products exist, default products are created automatically.
  - The hidden "VTS" footer link opens the password modal.
  - Correct password creates sessionStorage key "vts_admin_session" and opens admin.html.
  - admin.html redirects to index.html if the session is missing.
  - Product images are selected through the phone/computer file picker.
  - Uploaded images are converted to a data URL and stored directly inside the product object in localStorage.
  - Add, edit and delete operations update localStorage immediately.

Important:
  This is intentionally frontend-only. The admin password is visible to anyone who inspects the JavaScript and localStorage is browser-local storage, not secure server storage. Use a real authentication/backend system before using this for sensitive production administration.

Run:
  Put all files in the same folder and open index.html. For the most reliable browser behavior, serve the folder with any simple local HTTP server.
