const API   = `${BASE_URL}/api`;

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function heartSVG(filled) {
  return filled
    ? `<svg viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function bookmarkSVG(filled) {
  return filled
    ? `<svg viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
}

function commentSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}

// ✅ KEY FIX: store ID in localStorage then navigate
function goToRecipe(id) {
  localStorage.setItem('currentRecipeId', id);
  window.location.href = 'recipe.html';
}

async function fetchSavedIds() {
  const token = getToken();
  if (!token) return [];
  try {
    const res  = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return (data.savedRecipes || []).map(r => (typeof r === 'object' ? r._id : r));
  } catch { return []; }
}

function buildCard(recipe, savedIds, userId) {
  const isLiked = userId ? recipe.likes.includes(userId) : false;
  const isSaved = savedIds.includes(recipe._id);
  const author  = recipe.author ? `${recipe.author.firstname} ${recipe.author.lastname}` : 'Anonymous';
  const id      = recipe._id;

  const media = recipe.mediaType === 'video'
    ? `<video class="card-media-video" src="${recipe.mediaUrl}" muted playsinline preload="metadata" onclick="goToRecipe('${id}')" style="cursor:pointer;"></video>`
    : `<img class="card-media" src="${recipe.mediaUrl}" alt="${recipe.title}" loading="lazy" onclick="goToRecipe('${id}')" style="cursor:pointer;"/>`;

  return `
    <div class="card" data-id="${id}">
      ${media}
      <div class="card-body">
        <div class="card-author">${author}</div>
        <div class="card-title">${recipe.title}</div>
        <div class="card-desc">${recipe.description}</div>
      </div>
      <div class="card-footer">
        <button class="icon-btn like-btn ${isLiked ? 'active' : ''}" onclick="toggleLike('${id}', this)">
          ${heartSVG(isLiked)} <span class="like-count">${recipe.likes.length}</span>
        </button>
        <button class="icon-btn" onclick="goToRecipe('${id}')">
          ${commentSVG()} <span>${recipe.comments.length}</span>
        </button>
        <button class="icon-btn save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave('${id}', this)">
          ${bookmarkSVG(isSaved)}
        </button>
        <button class="card-view-link" onclick="goToRecipe('${id}')">View →</button>
      </div>
    </div>`;
}

async function toggleLike(id, btn) {
  const token = getToken();
  if (!token) { showToast('Please login to like recipes'); return; }
  try {
    const res  = await fetch(`${API}/recipes/${id}/like`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    btn.classList.toggle('active', data.liked);
    btn.innerHTML = heartSVG(data.liked) + ` <span class="like-count">${data.likes}</span>`;
  } catch { showToast('Something went wrong'); }
}

async function toggleSave(id, btn) {
  const token = getToken();
  if (!token) { showToast('Please login to save recipes'); return; }
  try {
    const res  = await fetch(`${API}/users/save/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    btn.classList.toggle('active', data.saved);
    btn.innerHTML = bookmarkSVG(data.saved);
    showToast(data.saved ? 'Recipe saved!' : 'Recipe unsaved');
  } catch { showToast('Something went wrong'); }
}

let allRecipes      = [];
let currentUserId   = null;
let currentSavedIds = [];

async function loadRecipes() {
  const grid  = document.getElementById('recipe-grid');
  const token = getToken();

  try {
    if (token) {
      try {
        const me = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        const meData = await me.json();
        currentUserId = meData._id;
      } catch {}
    }

    const [recipes, savedIds] = await Promise.all([
      fetch(`${API}/recipes`).then(r => r.json()),
      fetchSavedIds()
    ]);

    allRecipes      = recipes;
    currentSavedIds = savedIds;

    if (!recipes.length) {
      grid.innerHTML = `<div class="empty-state"><p>No recipes yet. Be the first to share!</p></div>`;
      return;
    }

    renderCards(recipes);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Could not load recipes. Please try again.</p></div>`;
  }
}

function renderCards(recipes) {
  const grid = document.getElementById('recipe-grid');
  if (!recipes.length) {
    grid.innerHTML = `<div class="empty-state"><p>No recipes found.</p></div>`;
    return;
  }
  grid.innerHTML = recipes.map(r => buildCard(r, currentSavedIds, currentUserId)).join('');
}

function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  if (!query) { renderCards(allRecipes); return; }
  const filtered = allRecipes.filter(r =>
    r.title.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query) ||
    (r.author && `${r.author.firstname} ${r.author.lastname}`.toLowerCase().includes(query))
  );
  renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecipes();
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('input', handleSearch);
});