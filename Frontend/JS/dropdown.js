const API_D = `${BASE_URL}/api`;

function goToRecipeFromDropdown(id) {
  localStorage.setItem('currentRecipeId', id);
  window.location.href = 'recipe.html';
}

async function loadMyRecipesDropdown() {
  const token     = getToken();
  const container = document.getElementById('my-recipes-dropdown');
  if (!container) return;

  if (!token) {
    container.innerHTML = `
      <div class="drop-header">My Recipes</div>
      <div class="drop-empty">Sign in to see your recipes</div>`;
    return;
  }

  try {
    const meRes   = await fetch(`${API_D}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    const me      = await meRes.json();

    const recipeRes = await fetch(`${API_D}/recipes`);
    const recipes   = await recipeRes.json();
    const mine      = recipes.filter(r => r.author && r.author._id === me._id);

    if (!mine.length) {
      container.innerHTML = `
        <div class="drop-header">My Recipes</div>
        <div class="drop-empty">You haven't posted any recipes yet</div>
        <div class="drop-item" onclick="location.href='upload.html'" style="color:var(--red);font-weight:600;">+ Share your first recipe</div>`;
      return;
    }

    container.innerHTML = `
      <div class="drop-header">My Recipes</div>
      ${mine.map(r => `
        <div class="drop-item" onclick="goToRecipeFromDropdown('${r._id}')">${r.title}</div>
      `).join('')}
      <div class="drop-item" onclick="location.href='upload.html'" style="color:var(--red);font-weight:600;border-top:1px solid #f0e0e0;">+ Add new recipe</div>`;

  } catch {
    container.innerHTML = `
      <div class="drop-header">My Recipes</div>
      <div class="drop-empty">Could not load recipes</div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadMyRecipesDropdown);