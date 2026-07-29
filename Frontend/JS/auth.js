function getToken()     { return localStorage.getItem('token'); }
function getFirstname() { return localStorage.getItem('firstname'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('firstname');
  localStorage.removeItem('currentRecipeId');
  window.location.href = 'index.html';
}

function updateNavAuth() {
  const token     = getToken();
  const firstname = getFirstname();

  const signupBtn = document.getElementById('nav-signup-btn');
  const loginBtn  = document.getElementById('nav-login-btn');
  const userName  = document.getElementById('nav-user-name');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const uploadBtn = document.getElementById('nav-upload-btn');
  const savedBtn  = document.getElementById('nav-saved-btn');

  if (token && firstname) {
    if (signupBtn) signupBtn.style.display = 'none';
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (userName)  { userName.style.display = 'inline'; userName.textContent = firstname; }
    if (logoutBtn) logoutBtn.style.display  = 'inline-block';
    if (uploadBtn) uploadBtn.style.display  = 'inline-block';
    if (savedBtn)  savedBtn.style.display   = 'inline-block';
  } else {
    if (signupBtn) signupBtn.style.display  = 'inline-block';
    if (loginBtn)  loginBtn.style.display   = 'inline-block';
    if (userName)  userName.style.display   = 'none';
    if (logoutBtn) logoutBtn.style.display  = 'none';
    if (uploadBtn) uploadBtn.style.display  = 'none';
    if (savedBtn)  savedBtn.style.display   = 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateNavAuth);