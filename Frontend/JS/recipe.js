const API   = `${BASE_URL}/api`;

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function heartSVG(f) {
  return f
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function bookmarkSVG(f) {
  return f
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--red)" stroke="var(--red)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
}

function trashSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
}

async function loadRecipe() {
  const detail = document.getElementById('recipe-detail');
  const token  = getToken();

  // ✅ LOGIN GATE — must be logged in to view recipe
  if (!token) {
    detail.innerHTML = `
      <div style="text-align:center; padding:80px 20px;">
        <div style="font-size:3rem; margin-bottom:16px;">🔒</div>
        <h2 style="font-size:1.4rem; font-weight:800; color:#1a1a1a; margin-bottom:10px;">Login to view this recipe</h2>
        <p style="color:#888; font-size:0.95rem; margin-bottom:28px;">You need to be signed in to see the full recipe details.</p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button onclick="location.href='login.html'" style="background:var(--red);color:#fff;border:none;padding:11px 28px;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;">Login</button>
          <button onclick="location.href='signup.html'" style="background:transparent;color:var(--red);border:1.5px solid var(--red);padding:11px 28px;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;">Sign Up</button>
        </div>
        <a href="index.html" style="display:block; margin-top:20px; color:#aaa; font-size:0.88rem;">← Back to Home</a>
      </div>`;
    return;
  }

  // Read recipe ID from localStorage
  const id = localStorage.getItem('currentRecipeId');
  if (!id) {
    detail.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <p style="color:#888;">No recipe selected.</p>
        <a href="index.html" style="color:var(--red); font-weight:700; display:inline-block; margin-top:12px;">← Back to Home</a>
      </div>`;
    return;
  }

  try {
    const [recipe, meData] = await Promise.all([
      fetch(`${API}/recipes/${id}`).then(r => r.json()),
      fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]);

    const author     = recipe.author ? `${recipe.author.firstname} ${recipe.author.lastname}` : 'Anonymous';
    const userId     = meData._id;
    const isAuthor   = recipe.author && recipe.author._id === userId;
    const isLiked    = recipe.likes.includes(userId);
    const savedIds   = (meData.savedRecipes || []).map(r => typeof r === 'object' ? r._id : r);
    const isSaved    = savedIds.includes(recipe._id);

    const media = recipe.mediaType === 'video'
      ? `<video class="recipe-detail-media" src="${recipe.mediaUrl}" controls></video>`
      : `<img class="recipe-detail-media" src="${recipe.mediaUrl}" alt="${recipe.title}"/>`;

    // Delete button only for author
    const deleteBtn = isAuthor ? `
      <button onclick="deleteRecipe('${recipe._id}')"
        style="margin-left:auto; background:#fff; color:#cc0000; border:1.5px solid #cc0000;
               padding:7px 16px; border-radius:8px; font-size:0.85rem; font-weight:700;
               cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s;"
        onmouseover="this.style.background='#cc0000';this.style.color='#fff'"
        onmouseout="this.style.background='#fff';this.style.color='#cc0000'">
        ${trashSVG()} Delete Recipe
      </button>` : '';

    detail.innerHTML = `
      ${media}
      <h1 class="recipe-detail-title">${recipe.title}</h1>
      <div class="recipe-detail-author">By ${author}</div>

      <div class="action-bar">
        <button class="icon-btn ${isLiked ? 'active' : ''}" id="like-btn" onclick="toggleLike('${recipe._id}')">
          ${heartSVG(isLiked)} <span id="like-count">${recipe.likes.length}</span>&nbsp;Likes
        </button>
        <button class="icon-btn ${isSaved ? 'active' : ''}" id="save-btn" onclick="toggleSave('${recipe._id}')">
          ${bookmarkSVG(isSaved)}&nbsp;${isSaved ? 'Saved' : 'Save'}
        </button>
        ${deleteBtn}
      </div>

      <div class="recipe-section-title">Description</div>
      <div class="recipe-detail-text">${recipe.description}</div>

      <div class="recipe-section-title">Ingredients</div>
      <div class="recipe-detail-text">${recipe.ingredients}</div>

      <div class="recipe-section-title">Steps</div>
      <div class="recipe-detail-text">${recipe.steps}</div>

      <div class="comments-section">
        <h3>Comments (<span id="comment-count">${recipe.comments.length}</span>)</h3>
        <div class="comment-input-row">
          <input type="text" id="comment-input" placeholder="Add a comment..."/>
          <button onclick="postComment('${recipe._id}')">Post</button>
        </div>
        <div id="comments-list">
          ${recipe.comments.length
            ? recipe.comments.map(c => buildCommentHTML(c, isAuthor)).join('')
            : `<p style="color:#bbb;font-size:0.88rem;padding:12px 0;">No comments yet. Be the first!</p>`
          }
        </div>
      </div>`;

  } catch (err) {
    detail.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <p style="color:#888;">Could not load recipe.</p>
        <a href="index.html" style="color:var(--red);font-weight:700;display:inline-block;margin-top:12px;">← Back to Home</a>
      </div>`;
  }
}

// Build comment HTML — show delete button only if current user is recipe author
function buildCommentHTML(comment, isAuthor) {
  const commentId = comment._id;
  const name = comment.user
    ? `${comment.user.firstname} ${comment.user.lastname}`
    : 'Anonymous';

  const deleteCommentBtn = isAuthor ? `
    <button onclick="deleteComment('${commentId}')"
      title="Delete comment"
      style="background:none; border:none; cursor:pointer; color:#ccc; padding:2px 6px;
             border-radius:4px; font-size:0.75rem; display:inline-flex; align-items:center;
             gap:3px; transition:color 0.2s; margin-left:8px;"
      onmouseover="this.style.color='#cc0000'"
      onmouseout="this.style.color='#ccc'">
      ${trashSVG()}
    </button>` : '';

  return `
    <div class="comment-item" id="comment-${commentId}" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div class="comment-name">${name}</div>
        <div class="comment-text">${comment.text}</div>
      </div>
      ${deleteCommentBtn}
    </div>`;
}

async function deleteRecipe(id) {
  const confirmed = confirm('Are you sure you want to delete this recipe? This cannot be undone.');
  if (!confirmed) return;

  const token = getToken();
  try {
    const res = await fetch(`${API}/recipes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.msg); return; }

    showToast('Recipe deleted!');
    localStorage.removeItem('currentRecipeId');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } catch {
    showToast('Could not delete recipe. Try again.');
  }
}

async function deleteComment(commentId) {
  const recipeId = localStorage.getItem('currentRecipeId');
  const token    = getToken();
  if (!token || !recipeId) return;

  const confirmed = confirm('Delete this comment?');
  if (!confirmed) return;

  try {
    const res = await fetch(`${API}/recipes/${recipeId}/comment/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { showToast('Could not delete comment'); return; }

    // Remove comment from DOM
    const el = document.getElementById(`comment-${commentId}`);
    if (el) {
      el.style.opacity    = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        el.remove();
        // Update comment count
        const countEl = document.getElementById('comment-count');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) - 1;
      }, 300);
    }
    showToast('Comment deleted');
  } catch {
    showToast('Could not delete comment');
  }
}

async function toggleLike(id) {
  const token = getToken();
  if (!token) { showToast('Please login to like'); return; }

  const res  = await fetch(`${API}/recipes/${id}/like`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const btn = document.getElementById('like-btn');
  btn.classList.toggle('active', data.liked);
  btn.innerHTML = heartSVG(data.liked) + ` <span id="like-count">${data.likes}</span>&nbsp;Likes`;
}

async function toggleSave(id) {
  const token = getToken();
  if (!token) { showToast('Please login to save'); return; }

  const res  = await fetch(`${API}/users/save/${id}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const btn = document.getElementById('save-btn');
  btn.classList.toggle('active', data.saved);
  btn.innerHTML = bookmarkSVG(data.saved) + (data.saved ? '&nbsp;Saved' : '&nbsp;Save');
  showToast(data.saved ? 'Recipe saved!' : 'Recipe unsaved');
}

async function postComment(id) {
  const token = getToken();
  if (!token) { showToast('Please login to comment'); return; }

  const input = document.getElementById('comment-input');
  const text  = input.value.trim();
  if (!text) return;

  try {
    const res     = await fetch(`${API}/recipes/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    const comment = await res.json();
    input.value   = '';

    // Check if current user is author to show delete button on new comment
    const meRes  = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    const me     = await meRes.json();
    const recipe = await fetch(`${API}/recipes/${id}`).then(r => r.json());
    const isAuthor = recipe.author && recipe.author._id === me._id;

    const list = document.getElementById('comments-list');

    // Remove "no comments" placeholder if present
    const placeholder = list.querySelector('p');
    if (placeholder) placeholder.remove();

    list.insertAdjacentHTML('afterbegin', buildCommentHTML(comment, isAuthor));

    // Update comment count
    const countEl = document.getElementById('comment-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

  } catch { showToast('Could not post comment'); }
}

document.addEventListener('DOMContentLoaded', loadRecipe);