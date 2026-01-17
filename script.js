const PUBLIC_SAFE_MODE = true; // set to false if you really want phone/school visible publicly

const galleryEl = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeBtn = document.getElementById("closeBtn");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const downloadBtn = document.getElementById("downloadBtn");
const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");

document.getElementById("year").textContent = new Date().getFullYear();

// Public-safe mode: hide phone & school quickly (recommended for a child)
if (PUBLIC_SAFE_MODE) {
  // crude but effective: remove matching rows by label text
  document.querySelectorAll(".contact-row").forEach(row => {
    const label = row.querySelector(".label")?.textContent?.toLowerCase();
    if (label === "phone" || label === "school" || label === "place") row.remove();
  });
}

let allArt = [];
let filtered = [];

fetch("artworks.json")
  .then(r => r.json())
  .then(data => {
    allArt = Array.isArray(data) ? data : [];
    filtered = [...allArt];
    applySort();
    render();
  })
  .catch(() => {
    galleryEl.innerHTML = `<div class="card">Could not load artworks.json. Check the file name/path.</div>`;
  });

function applySort(){
  const mode = sortEl.value;
  filtered.sort((a,b) => {
    if (mode === "title") return (a.title || "").localeCompare(b.title || "");
    const da = new Date(a.date || "1970-01-01").getTime();
    const db = new Date(b.date || "1970-01-01").getTime();
    return mode === "oldest" ? (da - db) : (db - da);
  });
}

function render(){
  if (!filtered.length){
    galleryEl.innerHTML = `<div class="card">No drawings found.</div>`;
    return;
  }

  galleryEl.innerHTML = filtered.map((art, idx) => {
    const safeTitle = escapeHtml(art.title || "Untitled");
    const safeDate = art.date ? new Date(art.date).toLocaleDateString() : "";
    const file = art.file || "";
    return `
      <article class="tile" data-idx="${idx}" tabindex="0" role="button" aria-label="Open ${safeTitle}">
        <img class="thumb" src="${file}" alt="${safeTitle}" loading="lazy" />
        <div class="tile-meta">
          <h3 class="tile-title">${safeTitle}</h3>
          <div class="tile-date">${safeDate}</div>
        </div>
      </article>
    `;
  }).join("");

  galleryEl.querySelectorAll(".tile").forEach(tile => {
    tile.addEventListener("click", () => openFromTile(tile));
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openFromTile(tile);
    });
  });
}

function openFromTile(tile){
  const idx = Number(tile.getAttribute("data-idx"));
  const art = filtered[idx];
  if (!art) return;

  modalTitle.textContent = art.title || "Untitled";
  modalDesc.textContent = art.description || "";
  modalImg.src = art.file;
  modalImg.alt = art.title || "Artwork";

  // Download original file
  downloadBtn.href = art.file;
  downloadBtn.setAttribute("download", fileNameFromPath(art.file));

  // Update URL hash so shareable link works
  const slug = slugify(art.title || "artwork");
  history.replaceState(null, "", `#${slug}`);

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modalImg.src = "";
}

modalBackdrop.addEventListener("click", closeModal);
closeBtn.addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
});

searchEl.addEventListener("input", () => {
  const q = (searchEl.value || "").trim().toLowerCase();
  filtered = allArt.filter(a =>
    (a.title || "").toLowerCase().includes(q) ||
    (a.description || "").toLowerCase().includes(q)
  );
  applySort();
  render();
});

sortEl.addEventListener("change", () => {
  applySort();
  render();
});

function fileNameFromPath(p){
  const parts = (p || "").split("/");
  return parts[parts.length - 1] || "artwork";
}

function slugify(s){
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

