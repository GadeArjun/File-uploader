// When the DOM is loaded, attach event listeners and check login status.
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("signupForm").addEventListener("submit", signup);
  document.getElementById("showSignup").addEventListener("click", showSignup);
  document.getElementById("showLogin").addEventListener("click", showLogin);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("uploadForm").addEventListener("submit", (e) => {
    e.preventDefault();
    uploadFiles();
  });
  document.getElementById("searchBtn").addEventListener("click", fetchGallery);
  document
    .getElementById("sortSelect")
    .addEventListener("change", fetchGallery);
});

// Check if the user is logged in.
async function checkLoginStatus() {
  const user = localStorage.getItem("user");
  if (!user) {
    showAuth();
    return;
  }
  try {
    showMain();
    fetchGallery();
  } catch (error) {
    console.error("Error checking login status:", error);
    showAuth();
  }
}

// Show authentication form
function showAuth() {
  document.getElementById("authContainer").style.display = "block";
  document.getElementById("mainContainer").style.display = "none";
}

// Show main application
function showMain() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
}

// Login function.
async function login(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("user", username);
      showMain();
      fetchGallery();
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}

// Signup function.
async function signup(e) {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      showLogin();
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Signup error:", error);
  }
}

// Toggle between signup and login form
function showSignup(e) {
  e.preventDefault();
  document.getElementById("loginFormContainer").style.display = "none";
  document.getElementById("signupFormContainer").style.display = "block";
}

function showLogin(e) {
  if (e) e.preventDefault();
  document.getElementById("signupFormContainer").style.display = "none";
  document.getElementById("loginFormContainer").style.display = "block";
}

// Logout function.
async function logout() {
  localStorage.clear();
  showAuth();
}

// // Upload files function with accurate overall progress tracking
async function uploadFiles() {
  const fileInput = document.getElementById("imageInput");
  const loader = document.getElementById("loader");
  const message = document.getElementById("message");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  // Check for file selection.
  if (fileInput.files.length === 0) {
    alert("Please select at least one file!");
    return;
  }
  // Limit upload to 10 files.
  if (fileInput.files.length > 10) {
    alert("You can only upload 10 files at a time.");
    return;
  }

  // Calculate the total size of all files.
  let totalBytes = 0;
  for (const file of fileInput.files) {
    if (file.size > 50 * 1024 * 1024) {
      alert(`File ${file.name} exceeds 50MB limit.`);
      return;
    }
    totalBytes += file.size;
  }

  // Show loader and progress bar.
  loader.style.display = "block";
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0% - 0 B/s";
  message.textContent = "";

  const user = localStorage.getItem("user") || "demo";
  const totalFiles = fileInput.files.length;
  let cumulativeUploaded = 0; // Total bytes uploaded from previous files.
  const uploadedMeta = []; // Array for successfully uploaded file metadata.
  const skippedFiles = []; // Array for files skipped (with reasons).

  // Loop over files sequentially.
  for (let i = 0; i < totalFiles; i++) {
    const file = fileInput.files[i];
    const formData = new FormData();
    formData.append("files", file);

    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const url = `/upload?user=${encodeURIComponent(user)}`;
      xhr.open("POST", url, true);
      const startTime = new Date().getTime();

      // Update progress for the current file and overall progress.
      xhr.upload.addEventListener("progress", function (e) {
        if (e.lengthComputable) {
          // Bytes uploaded for current file.
          const currentFileUploaded = e.loaded;
          // Overall uploaded bytes = bytes from previous files + current file's progress.
          const overallUploaded = cumulativeUploaded + currentFileUploaded;
          const overallProgress = (overallUploaded / totalBytes) * 100;
          progressBar.style.width = overallProgress + "%";

          // Calculate current file upload speed.
          const elapsedTime = (new Date().getTime() - startTime) / 1000; // seconds
          const speed = e.loaded / elapsedTime; // bytes per second
          let speedStr;
          if (speed > 1024 * 1024) {
            speedStr = (speed / (1024 * 1024)).toFixed(2) + " MB/s";
          } else if (speed > 1024) {
            speedStr = (speed / 1024).toFixed(2) + " KB/s";
          } else {
            speedStr = speed.toFixed(2) + " B/s";
          }
          progressText.textContent = `${Math.round(
            overallProgress
          )}% - ${speedStr}`;
        }
      });

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Expect the response.uploaded array to contain metadata for the current file.
            if (response.uploaded && response.uploaded.length > 0) {
              uploadedMeta.push(response.uploaded[0]);
            } else {
              skippedFiles.push({ file: file.name, reason: "Upload failed" });
            }
          } catch (err) {
            skippedFiles.push({
              file: file.name,
              reason: "Response parsing failed",
            });
          }
        } else {
          skippedFiles.push({
            file: file.name,
            reason: "HTTP error " + xhr.status,
          });
        }
        // Update cumulative bytes with the full size of the current file.
        cumulativeUploaded += file.size;
        // Wait 1 second before processing the next file.
        setTimeout(resolve, 1000);
      };

      xhr.onerror = function () {
        skippedFiles.push({ file: file.name, reason: "XHR error" });
        cumulativeUploaded += file.size;
        setTimeout(resolve, 1000);
      };

      xhr.send(formData);
    });
  }

  loader.style.display = "none";
  progressContainer.style.display = "none";
  message.textContent = `Upload complete.`;
  fetchGallery(); // Optionally refresh the gallery.
  fileInput.value = ""; // Reset file input.
}

// Fetch gallery and render previews.
async function fetchGallery() {
  const gallery = document.getElementById("gallery");
  const user = localStorage.getItem("user");
  const searchQuery = document.getElementById("searchInput").value;
  const sortOption = document.getElementById("sortSelect").value;

  gallery.innerHTML =
    '<h2 style="color: orange; text-align: center;">Fetching files...</h2>';
  let url = `/images?sort=${sortOption}&user=${user}`;
  if (searchQuery) {
    url += `&query=${encodeURIComponent(searchQuery)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (res.ok && data.images) {
      gallery.innerHTML = "";
      data.images.forEach((image) => {
        const container = document.createElement("div");
        container.classList.add("image-container");
        const nameOverlay = document.createElement("div");
        nameOverlay.classList.add("image-name");
        nameOverlay.textContent = image.originalname;

        const moreBtn = document.createElement("span");
        moreBtn.innerHTML = "&#8942;";
        moreBtn.classList.add("more-btn");

        const extension = image.originalname.split(".").pop().toLowerCase();
        let previewElement;

        if (
          [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "bmp",
            "webp",
            "tiff",
            "ico",
            "avif",
            "heif",
          ].includes(extension)
        ) {
          previewElement = document.createElement("img");
          previewElement.src = image.url;
        } else if (
          [
            "pdf",
            "doc",
            "docx",
            "txt",
            "rtf",
            "odt",
            "html",
            "xml",
            "json",
            "md",
          ].includes(extension)
        ) {
          previewElement = document.createElement("img");
          previewElement.src = "/icons/pdf-icon.png";
        } else if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
          previewElement = document.createElement("img");
          previewElement.src = "/icons/excel-icon.png";
        } else if (["ppt", "pptx", "odp"].includes(extension)) {
          previewElement = document.createElement("img");
          previewElement.src = "/icons/ppt-icon.png";
        } else if (
          ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"].includes(
            extension
          )
        ) {
          previewElement = document.createElement("img");
          previewElement.src = "/icons/zip-icon.png";
        } else if (
          [
            "mp4",
            "mkv",
            "avi",
            "mov",
            "wmv",
            "flv",
            "webm",
            "mpeg",
            "3gp",
            "ogg",
          ].includes(extension)
        ) {
          previewElement = document.createElement("video");
          previewElement.src = image.url;
          previewElement.controls = true;
          previewElement.style.width = "100%";
          previewElement.style.maxHeight = "300px";
        } else if (["mp3", "aac", "ogg", "wma"].includes(extension)) {
          previewElement = document.createElement("audio");
          previewElement.src = image.url;
          previewElement.controls = true;
        } else {
          previewElement = document.createElement("img");
          previewElement.src = "/icons/file-icon.png";
        }

        moreBtn.addEventListener("click", () => showDownloadModal(image));
        container.appendChild(moreBtn);
        container.appendChild(previewElement);
        previewElement.dataset.id = image._id;
        previewElement.dataset.originalname = image.originalname;
        container.appendChild(nameOverlay);
        gallery.appendChild(container);
      });
    } else {
      gallery.innerHTML = `<h2 style="color: orange; text-align: center;">No files found.</h2>`;
    }
  } catch (error) {
    console.error("Error fetching gallery:", error);
  }
}

// Show Download/Delete modal
let currentImage = null;
function showDownloadModal(image) {
  currentImage = image;
  const modal = document.getElementById("downloadModal");
  const downloadLink = document.getElementById("downloadLink");
  downloadLink.href = image.url;
  modal.style.display = "block";
}

// Hide modal
function hideDownloadModal() {
  document.getElementById("downloadModal").style.display = "none";
}

document
  .getElementById("closeModal")
  .addEventListener("click", hideDownloadModal);
window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("downloadModal")) {
    hideDownloadModal();
  }
});

// Delete image/file from modal.
document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!currentImage) return;
  if (!confirm("Are you sure you want to delete this file?")) return;
  const user = localStorage.getItem("user");
  try {
    const res = await fetch(`/image?user=${user}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: currentImage._id }),
    });
    if (res.ok) {
      hideDownloadModal();
      fetchGallery();
    } else {
      alert("Failed to delete file");
    }
  } catch (error) {
    console.error("Delete error:", error);
  }
});
