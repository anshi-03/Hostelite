const API   = `${BASE_URL}/api`;

function previewMedia(input) {
  const preview = document.getElementById('media-preview');
  const label   = document.getElementById('drop-label');
  const file    = input.files[0];
  if (!file) return;

  label.style.display = 'none';
  preview.innerHTML   = '';

  const url = URL.createObjectURL(file);
  if (file.type.startsWith('video')) {
    preview.innerHTML = `<video src="${url}" controls style="max-width:100%;max-height:240px;border-radius:10px;"></video>`;
  } else {
    preview.innerHTML = `<img src="${url}" style="max-width:100%;max-height:240px;border-radius:10px;"/>`;
  }
}

async function submitRecipe() {
  const token = getToken();
  if (!token) { window.location.href = 'login.html'; return; }

  const title       = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const ingredients = document.getElementById('ingredients').value.trim();
  const steps       = document.getElementById('steps').value.trim();
  const file        = document.getElementById('media-file').files[0];
  const errEl       = document.getElementById('upload-err');
  errEl.textContent = '';

  if (!title || !description || !ingredients || !steps || !file) {
    errEl.textContent = 'Please fill all fields and attach a photo or video.'; return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('ingredients', ingredients);
  formData.append('steps', steps);
  formData.append('media', file);

  const progWrap = document.getElementById('prog-wrap');
  const progBar  = document.getElementById('prog-bar');
  progWrap.style.display = 'block';
  progBar.style.width    = '20%';

  try {
    // Simulate progress while uploading
    let p = 20;
    const interval = setInterval(() => {
      p = Math.min(p + 10, 85);
      progBar.style.width = p + '%';
    }, 400);

    const res  = await fetch(`${API}/recipes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    clearInterval(interval);

    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.msg || 'Upload failed'; progWrap.style.display = 'none'; return; }

    progBar.style.width = '100%';
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
  } catch (err) {
    errEl.textContent = 'Server error. Try again.';
    progWrap.style.display = 'none';
  }
}