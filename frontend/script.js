/* ============================================================
   script.js  –  Screenshot to Text Converter
   Handles:
     • File selection via browse button
     • Drag & drop upload
     • Image preview
     • API call to FastAPI backend (POST /extract-text)
     • Displaying extracted text, character/word stats
     • Copy to clipboard
     • Download as .txt
     • Reset / start over
   ============================================================ */

// ---- Backend API URL ----
// Change this if your backend runs on a different host/port.
const API_URL = "https://screenshot-to-text-converter.onrender.com/extract-text";

// ---- DOM References ----
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const fileInfo = document.getElementById("fileInfo");
const previewSection = document.getElementById("previewSection");
const imagePreview = document.getElementById("imagePreview");
const extractBtn = document.getElementById("extractBtn");
const resetBtn = document.getElementById("resetBtn");
const loader = document.getElementById("loader");
const resultSection = document.getElementById("resultSection");
const textOutput = document.getElementById("textOutput");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const alertBox = document.getElementById("alertBox");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");

// ---- State ----
let selectedFile = null;   // Currently selected File object

/* ============================================================
   FILE SELECTION  –  via browse button
   ============================================================ */

browseBtn.addEventListener("click", () => fileInput.click());

// Clicking the upload zone (but not the button) also opens file picker
uploadZone.addEventListener("click", (e) => {
  if (e.target !== browseBtn) fileInput.click();
});

// When user picks a file through the native dialog
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    handleFileSelection(fileInput.files[0]);
  }
});

/* ============================================================
   DRAG & DROP
   ============================================================ */

// Prevent browser from opening the file when dropped on the page
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelection(files[0]);
  }
});

/* ============================================================
   HANDLE FILE SELECTION (common for both methods)
   ============================================================ */

function handleFileSelection(file) {
  // Validate that it is an image
  if (!file.type.startsWith("image/")) {
    showAlert("error", "⚠️ Please upload a valid image file (PNG, JPG, BMP, TIFF, WebP).");
    return;
  }

  selectedFile = file;

  // Show file name + size tag
  const sizeKB = (file.size / 1024).toFixed(1);
  fileInfo.textContent = `📎 ${file.name}  (${sizeKB} KB)`;
  fileInfo.style.display = "block";

  // Generate and display image preview using FileReader
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    previewSection.style.display = "block";
  };
  reader.readAsDataURL(file);

  // Show control buttons; clear previous results
  extractBtn.disabled = false;
  resetBtn.style.display = "inline-flex";
  hideAlert();
  resultSection.style.display = "none";
  textOutput.value = "";
}

/* ============================================================
   EXTRACT TEXT  –  call the FastAPI backend
   ============================================================ */

extractBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showAlert("error", "⚠️ Please select an image first.");
    return;
  }

  // --- UI: show loader, disable button ---
  setLoading(true);
  hideAlert();
  resultSection.style.display = "none";

  // Build a multipart/form-data payload
  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Server returned an HTTP error (4xx or 5xx)
      throw new Error(data.detail || `Server error: ${response.status}`);
    }

    // --- Display the extracted text ---
    const text = data.text || "";
    textOutput.value = text;

    // Update character and word counts
    const chars = text.length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    charCount.textContent = chars.toLocaleString();
    wordCount.textContent = words.toLocaleString();

    if (text.trim() === "") {
      showAlert("error", "🔍 No text could be detected in this image. Try a clearer screenshot.");
    } else {
      resultSection.style.display = "block";
      showAlert("success", `✅ Successfully extracted ${chars.toLocaleString()} characters!`);
    }

  } catch (err) {
    // Network error or backend not running
    if (err.name === "TypeError") {
      showAlert(
        "error",
        "❌ Could not connect to the backend. Make sure the FastAPI server is running on port 8000."
      );
    } else {
      showAlert("error", `❌ Error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
});

/* ============================================================
   COPY TO CLIPBOARD
   ============================================================ */

copyBtn.addEventListener("click", async () => {
  const text = textOutput.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);

    // Brief visual feedback
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = "✅ Copied!";
    copyBtn.classList.add("success");

    setTimeout(() => {
      copyBtn.innerHTML = original;
      copyBtn.classList.remove("success");
    }, 2000);

  } catch {
    // Fallback for browsers that block clipboard API
    textOutput.select();
    document.execCommand("copy");
  }
});

/* ============================================================
   DOWNLOAD AS .TXT
   ============================================================ */

downloadBtn.addEventListener("click", () => {
  const text = textOutput.value;
  if (!text) return;

  // Create a temporary <a> element to trigger the download
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  // Use original filename (without extension) as base for .txt file
  const baseName = selectedFile
    ? selectedFile.name.replace(/\.[^/.]+$/, "")
    : "extracted-text";

  a.href = url;
  a.download = `${baseName}-ocr.txt`;
  a.click();

  // Clean up the temporary object URL
  URL.revokeObjectURL(url);
});

/* ============================================================
   RESET  –  clear everything and start over
   ============================================================ */

resetBtn.addEventListener("click", resetAll);

function resetAll() {
  selectedFile = null;

  // Reset file input so the same file can be re-selected
  fileInput.value = "";

  // Hide and clear all dynamic sections
  fileInfo.style.display = "none";
  fileInfo.textContent = "";
  previewSection.style.display = "none";
  imagePreview.src = "";
  resultSection.style.display = "none";
  textOutput.value = "";
  resetBtn.style.display = "none";
  extractBtn.disabled = true;
  hideAlert();

  // Smoothly scroll back to the top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   HELPERS
   ============================================================ */

/** Toggle the loading spinner and button state */
function setLoading(isLoading) {
  loader.style.display = isLoading ? "flex" : "none";
  extractBtn.disabled = isLoading;
  extractBtn.innerHTML = isLoading
    ? `<span class="btn-spinner"></span> Extracting…`
    : `🔍 Extract Text`;
}

/** Show a styled alert message */
function showAlert(type, message) {
  alertBox.className = `alert ${type}`;
  alertBox.innerHTML = message;
  alertBox.style.display = "flex";
}

/** Hide the alert box */
function hideAlert() {
  alertBox.style.display = "none";
}
