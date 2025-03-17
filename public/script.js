
// On DOM load, check login status and attach event listeners.
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  document.getElementById('loginForm').addEventListener('submit', login);
  document.getElementById('signupForm').addEventListener('submit', signup);
  document.getElementById('showSignup').addEventListener('click', showSignup);
  document.getElementById('showLogin').addEventListener('click', showLogin);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('uploadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    uploadFiles();
  });
  document.getElementById('searchBtn').addEventListener('click', fetchGallery);
  document.getElementById('sortSelect').addEventListener('change', fetchGallery);
});

// Check if the user is logged in.
async function checkLoginStatus() {
  const user = localStorage.getItem('user');
  if (!user) {
    showAuth();
    return;
  }
  try {
    showMain();
    fetchGallery();
  } catch (error) {
    console.error('Error checking login status', error);
    showAuth();
  }
}

// Display authentication forms.
function showAuth() {
  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('mainContainer').style.display = 'none';
}

// Display main app.
function showMain() {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
}

// Login function.
async function login(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', username);
      showMain();
      fetchGallery();
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Signup function.
async function signup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  try {
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      showLogin();
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Signup error:', error);
  }
}

function showSignup(e) {
  e.preventDefault();
  document.getElementById('loginFormContainer').style.display = 'none';
  document.getElementById('signupFormContainer').style.display = 'block';
}

function showLogin(e) {
  e && e.preventDefault();
  document.getElementById('signupFormContainer').style.display = 'none';
  document.getElementById('loginFormContainer').style.display = 'block';
}

// Logout function.
async function logout() {
  localStorage.clear();
  showAuth();
}

// Upload files function.
async function uploadFiles() {
  const formData = new FormData();
  const loader = document.getElementById('loader');
  const message = document.getElementById('message');
  const fileInput = document.getElementById('imageInput');
  if (fileInput.files.length === 0) {
    alert('Please select at least one file!');
    return;
  }
  // Append each file using the field name 'files'
  for (let file of fileInput.files) {
    formData.append('files', file);
  }
  if (fileInput.files.length > 10) {
    alert('You can only upload 10 files at a time.');
    return;
  }
  loader.style.display = 'block';
  message.textContent = '';
  const user = localStorage.getItem('user');
  try {
    const res = await fetch(`/upload?user=${user}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      message.textContent = data.message;
      setTimeout(() => {
        fetchGallery();
      }, 1000);
      fileInput.value = '';
    } else {
      message.textContent = data.error || 'Upload failed.';
    }
  } catch (error) {
    message.textContent = 'Error uploading files.';
    console.error(error);
  } finally {
    loader.style.display = 'none';
  }
}

// Fetch gallery and render previews.
async function fetchGallery() {
  const gallery = document.getElementById('gallery');
  const searchQuery = document.getElementById('searchInput').value;
  const sortOption = document.getElementById('sortSelect').value;
  const user = localStorage.getItem('user');

  gallery.innerHTML = '<h2 style="color: orange; font-size: 24px; font-weight: bold; text-align: center; margin-top: 8px;">Fetching files...</h2>';

  let url = `/images?sort=${sortOption}&user=${user}`;
  if (searchQuery) {
    url += `&query=${encodeURIComponent(searchQuery)}`;
  }
  try {
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.images) {
        gallery.innerHTML = '';
        data.images.forEach(image => {
          const container = document.createElement('div');
          container.classList.add('image-container');

          const nameOverlay = document.createElement('div');
          nameOverlay.classList.add('image-name');
          nameOverlay.textContent = image.originalname;

          // Determine file type by extension.
          const extension = image.originalname.split('.').pop().toLowerCase();
          let previewElement;
          // List of image extensions
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', "avif"];
          if (imageExtensions.includes(extension.toLowerCase())) {
            // Display actual image.
            previewElement = document.createElement('img');
            previewElement.src = image.url;
          } else if (extension === 'pdf') {
            // Display a PDF icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/pdf-icon.png';
          } else if (extension === 'xls' || extension === 'xlsx') {
            // Display an Excel icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/excel-icon.png';
          } else if (extension === 'doc' || extension === 'docx' || extension === 'csv') {
            // Display a Word icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/word-icon.png';
          }
          else if (extension === 'zip' || extension === 'rar' || extension === '7z' || extension === 'tar' || extension === 'gz' || extension === 'bz2' || extension === 'xz') {
            // Display a Word icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/zip-icon.png';
          }
          else if (extension === 'ppt' || extension === 'pptx') {
            // Display a Word icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/ppt-icon.png';
          }
          else if (extension === 'mp4' || extension === 'mkv' || extension === 'avi' || extension === 'mov' || extension === 'wmv' || extension === 'flv') {
            // Display a Word icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/mp4-icon.png';
          }
          else if (extension === 'mp3' || extension === 'aac' || extension === 'ogg' || extension === 'wma') {
            // Display a Word icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/mp3-icon.png';
          }
          else {
            // For any other file types, display a generic file icon.
            previewElement = document.createElement('img');
            previewElement.src = '/icons/file-icon.png';
          }
          previewElement.dataset.id = image.id;
          previewElement.dataset.originalname = image.originalname;
          addDownloadListener(previewElement, image);
          container.appendChild(previewElement);
          container.appendChild(nameOverlay);
          gallery.appendChild(container);
        });
      }
    } else {
      const data = await res.json();
      alert(data.error);
      gallery.innerHTML = `<h2 style="color: orange; font-size: 24px; font-weight: bold; text-align: center; margin-top: 8px;">${data.error || "Error fetching gallery."}</h2>`;
    }
  } catch (error) {
    console.error('Error fetching gallery:', error);
    gallery.innerHTML = `<h2 style="color: orange; font-size: 24px; font-weight: bold; text-align: center; margin-top: 8px;">Error fetching files: ${error}</h2>`;
  }
}

// Attach event listeners to preview element for modal popup.
function addDownloadListener(el, image) {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    showDownloadModal(image);
  });
  let pressTimer;
  el.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      showDownloadModal(image);
    }, 500);
  });
  el.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
  });
}

// Modal handling: show modal with download and delete options.
let currentImage = null;
function showDownloadModal(image) {
  currentImage = image;
  const modal = document.getElementById('downloadModal');
  const downloadLink = document.getElementById('downloadLink');
  downloadLink.href = image.url;
  const filename = image.url.substring(image.url.lastIndexOf('/') + 1);
  downloadLink.setAttribute('download', filename);
  modal.style.display = 'block';
}

function hideDownloadModal() {
  const modal = document.getElementById('downloadModal');
  modal.style.display = 'none';
  currentImage = null;
}

document.getElementById('closeModal').addEventListener('click', hideDownloadModal);
window.addEventListener('click', (e) => {
  const modal = document.getElementById('downloadModal');
  if (e.target === modal) {
    hideDownloadModal();
  }
});

// Delete image/file from modal.
document.getElementById('deleteBtn').addEventListener('click', async () => {
  if (!currentImage) return;
  if (!confirm('Are you sure you want to delete this file?')) return;
  const user = localStorage.getItem('user');
  try {
    const res = await fetch(`/image?user=${user}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentImage.id })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      hideDownloadModal();
      fetchGallery();
    } else {
      alert(data.error || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
});
