// // On DOM load, check login status and attach event listeners.
// document.addEventListener('DOMContentLoaded', () => {
//   checkLoginStatus();
//   document.getElementById('loginForm').addEventListener('submit', login);
//   document.getElementById('signupForm').addEventListener('submit', signup);
//   document.getElementById('showSignup').addEventListener('click', showSignup);
//   document.getElementById('showLogin').addEventListener('click', showLogin);
//   document.getElementById('logoutBtn').addEventListener('click', logout);
//   document.getElementById('uploadForm').addEventListener('submit', (e) => {
//     e.preventDefault();
//     uploadFiles();
//   });
//   document.getElementById('searchBtn').addEventListener('click', fetchGallery);
// });

// // Check if the user is logged in.
// async function checkLoginStatus() {
//   const user = localStorage.getItem('user');
//   if (!user) {
//     showAuth();
//     return;
//   }
//   try {
//     showMain();
//     fetchGallery();
//   }
//   catch (error) {
//     console.error('Error checking login status', error);
//     showAuth();
//   }
// }

// // Display authentication forms.
// function showAuth() {
//   document.getElementById('authContainer').style.display = 'block';
//   document.getElementById('mainContainer').style.display = 'none';
// }

// // Display main app.
// function showMain() {
//   document.getElementById('authContainer').style.display = 'none';
//   document.getElementById('mainContainer').style.display = 'block';
// }

// // Login function.
// async function login(e) {
//   e.preventDefault();
//   const username = document.getElementById('loginUsername').value;
//   const password = document.getElementById('loginPassword').value;
//   try {
//     const res = await fetch('/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//     });
//     const data = await res.json();
//     if (res.ok) {
//       localStorage.setItem('user', username);
//       showMain();
//       fetchGallery();
//     } else {
//       alert(data.error);
//     }
//   } catch (error) {
//     console.error('Login error:', error);
//   }
// }

// // Signup function.
// async function signup(e) {
//   e.preventDefault();
//   const username = document.getElementById('signupUsername').value;
//   const password = document.getElementById('signupPassword').value;
//   try {
//     const res = await fetch('/signup', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//     });
//     const data = await res.json();
//     if (res.ok) {
//       alert(data.message);
//       showLogin();
//     } else {
//       alert(data.error);
//     }
//   } catch (error) {
//     console.error('Signup error:', error);
//   }
// }

// function showSignup(e) {
//   e.preventDefault();
//   document.getElementById('loginFormContainer').style.display = 'none';
//   document.getElementById('signupFormContainer').style.display = 'block';
// }

// function showLogin(e) {
//   e && e.preventDefault();
//   document.getElementById('signupFormContainer').style.display = 'none';
//   document.getElementById('loginFormContainer').style.display = 'block';
// }

// // Logout function.
// async function logout() {
//   localStorage.clear()
//   showAuth();
// }

// // Upload files function.
// async function uploadFiles() {
//   const formData = new FormData();
//   const loader = document.getElementById('loader');
//   const message = document.getElementById('message');
//   const fileInput = document.getElementById('imageInput');
//   if (fileInput.files.length === 0) {
//     alert('Please select at least one file!');
//     return;
//   }
//   for (let file of fileInput.files) {
//     formData.append('images', file);

//   }
//   loader.style.display = 'block';
//   message.textContent = '';
//   const user = localStorage.getItem('user');
//   try {
//     const res = await fetch(`/upload?user=${user}`, {
//       method: 'POST',
//       body: formData
//     });
//     const data = await res.json();
//     if (res.ok) {
//       message.textContent = data.message;

//       setTimeout(() => {
//         fetchGallery();
//       }, 1000);
//     } else {
//       message.textContent = data.error || 'Upload failed.';
//     }
//   } catch (error) {
//     message.textContent = 'Error uploading files.';
//     console.error(error);
//   } finally {
//     loader.style.display = 'none';
//   }
// }

// async function fetchGallery() {
//   const gallery = document.getElementById('gallery');
//   const searchQuery = document.getElementById('searchInput').value;
//   const sortOption = document.getElementById('sortSelect').value;
//   const user = localStorage.getItem('user');
//   let url = `/images?sort=${sortOption}&user=${user}`;
//   if (searchQuery) {
//     url += `&query=${encodeURIComponent(searchQuery)}`;
//   }
//   try {
//     // Include credentials so the session cookie is sent
//     const res = await fetch(url);
//     console.log(res);
//     if (res.ok) {
//       const data = await res.json();
//       console.log(data);

//       if (data.images) {
//         gallery.innerHTML = '';
//         data.images.forEach(image => {
//           const img = document.createElement('img');
//           img.src = image.url;
//           img.dataset.id = image.id;
//           img.dataset.originalname = image.originalname;



//           const nameOverlay = document.createElement('div');
//           nameOverlay.classList.add('image-name');
//           nameOverlay.textContent = img.originalname;



//           // Attach event listeners for right-click and long press.
//           addDownloadListener(img, image);
//           gallery.appendChild(img);
//         });
//       }
//     } else {
//       alert(res.error);
//     }
//   } catch (error) {
//     console.error('Error fetching gallery:', error);
//   }
// }


// // Attach event listeners to image for modal popup.
// function addDownloadListener(img, image) {
//   img.addEventListener('contextmenu', (e) => {
//     e.preventDefault();
//     showDownloadModal(image);
//   });
//   let pressTimer;
//   img.addEventListener('touchstart', () => {
//     pressTimer = setTimeout(() => {
//       showDownloadModal(image);
//     }, 500);
//   });
//   img.addEventListener('touchend', () => {
//     clearTimeout(pressTimer);
//   });
// }

// // Modal handling: show modal with download and delete options.
// let currentImage = null;
// function showDownloadModal(image) {
//   currentImage = image;
//   const modal = document.getElementById('downloadModal');
//   const downloadLink = document.getElementById('downloadLink');
//   downloadLink.href = image.url;
//   const filename = image.url.substring(image.url.lastIndexOf('/') + 1);
//   downloadLink.setAttribute('download', filename);
//   modal.style.display = 'block';
// }

// function hideDownloadModal() {
//   const modal = document.getElementById('downloadModal');
//   modal.style.display = 'none';
//   currentImage = null;
// }

// document.getElementById('closeModal').addEventListener('click', hideDownloadModal);
// window.addEventListener('click', (e) => {
//   const modal = document.getElementById('downloadModal');
//   if (e.target === modal) {
//     hideDownloadModal();
//   }
// });

// // Delete image from modal.
// document.getElementById('deleteBtn').addEventListener('click', async () => {
//   if (!currentImage) return;
//   if (!confirm('Are you sure you want to delete this file?')) return;
//   const user = localStorage.getItem('user');
//   try {
//     const res = await fetch(`/image?user=${user}`, {
//       method: 'DELETE',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ id: currentImage.id })
//     });
//     const data = await res.json();
//     if (res.ok) {
//       alert(data.message);
//       hideDownloadModal();
//       fetchGallery();
//     } else {
//       alert(data.error || 'Failed to delete file');
//     }
//   } catch (error) {
//     console.error('Delete error:', error);
//   }
// });

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

async function fetchGallery() {
  const gallery = document.getElementById('gallery');
  const searchQuery = document.getElementById('searchInput').value;
  const sortOption = document.getElementById('sortSelect').value;
  const user = localStorage.getItem('user');
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
          const img = document.createElement('img');
          img.src = image.url;
          img.dataset.id = image.id;
          img.dataset.originalname = image.originalname;
          
          // Create an overlay to show the image's original name.
          const nameOverlay = document.createElement('div');
          nameOverlay.classList.add('image-name');
          nameOverlay.textContent = image.originalname;
          
          // Optionally, wrap the image and overlay in a container.
          const container = document.createElement('div');
          container.classList.add('image-container');
          container.appendChild(img);
          container.appendChild(nameOverlay);
          
          // Attach event listeners for right-click and long press.
          addDownloadListener(img, image);
          gallery.appendChild(container);
        });
      }
    } else {
      const data = await res.json();
      alert(data.error);
    }
  } catch (error) {
    console.error('Error fetching gallery:', error);
  }
}

// Attach event listeners to image for modal popup.
function addDownloadListener(img, image) {
  img.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showDownloadModal(image);
  });
  let pressTimer;
  img.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      showDownloadModal(image);
    }, 500);
  });
  img.addEventListener('touchend', () => {
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

// Delete image from modal.
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
