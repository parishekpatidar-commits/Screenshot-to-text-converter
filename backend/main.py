# =============================================
# main.py
# FastAPI application entry point.
# Exposes a single endpoint: POST /extract-text
# which accepts an uploaded image and returns
# the OCR-extracted text as JSON.
# =============================================

import os
import uuid
import tempfile

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import our custom OCR service
from ocr_service import extract_text_from_image

# -------------------------------------------------------
# App initialisation
# -------------------------------------------------------
app = FastAPI(
    title="Screenshot to Text Converter API",
    description="Upload an image and extract text using Tesseract OCR.",
    version="1.0.0",
)

# -------------------------------------------------------
# CORS Middleware
# Allows the frontend (served from a browser / file://)
# to send requests to this backend.
# In production, restrict 'allow_origins' to your domain.
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins (dev mode)
    allow_credentials=True,
    allow_methods=["*"],          # Allow GET, POST, OPTIONS, …
    allow_headers=["*"],          # Allow all request headers
)

# -------------------------------------------------------
# Allowed image MIME types (basic security check)
# -------------------------------------------------------
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/bmp",
    "image/gif",
    "image/tiff",
    "image/webp",
}


# -------------------------------------------------------
# Health-check endpoint  →  GET /
# -------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Simple health-check – confirms the API is running."""
    return {"message": "Screenshot to Text Converter API is running! POST /extract-text to use it."}


# -------------------------------------------------------
# Main OCR endpoint  →  POST /extract-text
# -------------------------------------------------------
@app.post("/extract-text", tags=["OCR"])
async def extract_text(file: UploadFile = File(...)):
    """
    Accept an uploaded image file, run OCR on it, and return
    the extracted text.

    **Request:** multipart/form-data with a field named `file`.
    **Response:** JSON `{ "text": "...", "filename": "...", "char_count": N }`
    """

    # ---- 1. Validate file type ----
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: '{file.content_type}'. "
                f"Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}"
            ),
        )

    # ---- 2. Read raw bytes from the upload ----
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read uploaded file.")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ---- 3. Save to a temporary file ----
    # We use a random UUID name to avoid collisions in concurrent requests.
    suffix = os.path.splitext(file.filename or ".png")[-1] or ".png"
    temp_filename = f"{uuid.uuid4().hex}{suffix}"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)

    try:
        with open(temp_path, "wb") as temp_file:
            temp_file.write(image_bytes)

        # ---- 4. Run OCR via our service module ----
        extracted_text = extract_text_from_image(temp_path)

    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        # Catch pytesseract / Pillow errors and return a readable message
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )

    finally:
        # ---- 5. Always clean up the temp file ----
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # ---- 6. Return extracted text as JSON ----
    return JSONResponse(content={
        "text": extracted_text,
        "filename": file.filename,
        "char_count": len(extracted_text),
    })


# -------------------------------------------------------
# Run the server directly with: python main.py
# Or (recommended): uvicorn main:app --reload
# -------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
