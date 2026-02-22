# Screenshot to Text Converter 🖼️➜📝

A full-stack web application that extracts text from any image (screenshot, photo, scanned document) using **Tesseract OCR** and **FastAPI**.

---

## 📁 Project Structure

```
screenshot-to-text/
├── frontend/
│   ├── index.html      ← Main UI page
│   ├── style.css       ← Styling (dark theme, animations)
│   └── script.js       ← All frontend logic (upload, API call, copy, download)
│
├── backend/
│   ├── main.py         ← FastAPI app + /extract-text endpoint
│   ├── ocr_service.py  ← Image preprocessing + Tesseract OCR logic
│   └── requirements.txt← Python dependencies
│
└── README.md
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 📂 Image Upload | Click-to-browse or drag & drop |
| 🖼️ Image Preview | Instant preview before extraction |
| 🔍 OCR Extraction | Tesseract-powered text recognition |
| 📋 Copy to Clipboard | One-click copy |
| ⬇️ Download as .txt | Save extracted text locally |
| 🔄 Reset | Clear and start over |
| ⚡ Preprocessing | Grayscale + contrast boost for better accuracy |

---

## 🛠️ Prerequisites

Before running the project, make sure you have:

1. **Python 3.8+** → [python.org](https://python.org)
2. **Tesseract OCR** installed on your system:

### Installing Tesseract

**Windows:**
1. Download the installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer → note the installation path (e.g. `C:\Program Files\Tesseract-OCR\`)
3. Add the folder to your **System PATH**, OR set the path manually in `ocr_service.py`:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
   ```

**macOS (Homebrew):**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

---

## ⚙️ Backend Setup & Run

```bash
# 1. Navigate to the backend folder
cd screenshot-to-text/backend

# 2. (Optional but recommended) Create a virtual environment
python -m venv venv

# Activate on Windows:
venv\Scripts\activate
# Activate on macOS/Linux:
source venv/bin/activate

# 3. Install all Python dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: **http://127.0.0.1:8000**  
Interactive docs (Swagger UI): **http://127.0.0.1:8000/docs**

---

## 🌐 Frontend Setup & Open

No build step required! Simply open the HTML file:

**Option A – Double-click (simplest):**
```
screenshot-to-text/frontend/index.html
→ Double-click it in File Explorer
```

**Option B – VS Code Live Server:**
```
Right-click index.html → "Open with Live Server"
```

**Option C – Python simple server:**
```bash
cd screenshot-to-text/frontend
python -m http.server 3000
# Then visit: http://localhost:3000
```

---

## 🔌 API Reference

### `POST /extract-text`

Extract text from an uploaded image.

**Request:**
```
Content-Type: multipart/form-data
Field: file  (image file)
```

**Success Response (200):**
```json
{
  "text": "Hello World\nThis is the extracted text.",
  "filename": "screenshot.png",
  "char_count": 42
}
```

**Error Response (400/500):**
```json
{
  "detail": "Unsupported file type: 'application/pdf'. ..."
}
```

**Example with curl:**
```bash
curl -X POST "http://127.0.0.1:8000/extract-text" \
  -F "file=@/path/to/your/screenshot.png"
```

**Example with Python requests:**
```python
import requests

with open("screenshot.png", "rb") as f:
    response = requests.post(
        "http://127.0.0.1:8000/extract-text",
        files={"file": f}
    )

print(response.json()["text"])
```

---

## 🧠 How It Works

```
User uploads image
       ↓
FastAPI receives multipart form data (main.py)
       ↓
File type validated → saved to temp directory
       ↓
ocr_service.py: Pillow opens & preprocesses image
  • Convert to Grayscale
  • Apply Sharpening filter
  • Enhance Contrast (×2.0)
  • Scale up if image is small (< 800px)
       ↓
pytesseract.image_to_string() → Tesseract OCR runs
       ↓
Extracted text returned as JSON
       ↓
Frontend displays text + char/word counts
```

---

## 🧪 Testing the App

1. Start the backend (see above)
2. Open `frontend/index.html` in your browser
3. Upload any screenshot that contains text (e.g. a photo of a document, a UI screenshot, or a photo of printed text)
4. Click **"Extract Text"**
5. The recognized text appears in the output box
6. Click **Copy** or **Download .txt**

> **Tip:** For best results, use clear, high-resolution screenshots with good contrast between the text and background.

---

## 🛑 Troubleshooting

| Problem | Solution |
|---|---|
| `TesseractNotFoundError` | Install Tesseract OCR and add it to PATH, or set `tesseract_cmd` in `ocr_service.py` |
| `Could not connect to backend` | Make sure `uvicorn main:app --reload` is running |
| Empty text result | Try a higher-quality or higher-contrast image |
| CORS error in browser | The backend already enables CORS for all origins in dev mode |

---

## 📦 Dependencies

| Library | Purpose |
|---|---|
| `fastapi` | Web framework for the API |
| `uvicorn` | ASGI server to run FastAPI |
| `pytesseract` | Python wrapper for Tesseract OCR |
| `pillow` | Image opening and preprocessing |
| `python-multipart` | Enables file upload parsing in FastAPI |

---

## 📄 License

MIT — free to use, modify, and distribute.
