# =============================================
# ocr_service.py
# Handles image preprocessing and OCR extraction
# using Pillow and pytesseract (Tesseract OCR).
# =============================================

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import os

# -------------------------------------------------------
# IMPORTANT: On Windows, set the path to the Tesseract
# executable below if it is not already in your PATH.
# Example path after default installation:
#   r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# -------------------------------------------------------
# Auto-detect OS and set Tesseract path
import platform
if platform.system() == "Windows":
    # Windows local development path
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# On Linux (Render/cloud), tesseract is in PATH automatically — no need to set


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocess the image to improve OCR accuracy.

    Steps:
    1. Convert to grayscale  →  removes color noise
    2. Apply slight sharpening  →  makes edges crisper
    3. Enhance contrast  →  makes text stand out more
    4. Scale up if small  →  Tesseract works better on larger images
    """

    # Step 1: Convert to grayscale (L mode = single-channel luminance)
    image = image.convert("L")

    # Step 2: Sharpen edges so characters are cleaner
    image = image.filter(ImageFilter.SHARPEN)

    # Step 3: Boost contrast (factor 2.0 = moderately enhanced)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)

    # Step 4: If the image is very small, scale it up 2x
    # Tesseract performs poorly on images smaller than ~300 DPI equivalent
    width, height = image.size
    if width < 800 or height < 800:
        image = image.resize(
            (width * 2, height * 2),
            resample=Image.LANCZOS  # High-quality downsampling filter
        )

    return image


def extract_text_from_image(image_path: str) -> str:
    """
    Open an image from disk, preprocess it, and run OCR.

    Parameters:
        image_path (str): Absolute path to the saved image file.

    Returns:
        str: Extracted text, stripped of leading/trailing whitespace.
             Returns an empty string if no text is found.

    Raises:
        FileNotFoundError: If the image path does not exist.
        Exception: Propagates any pytesseract or Pillow errors.
    """

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    # Open the image using Pillow
    with Image.open(image_path) as img:
        # Preprocess for better OCR results
        processed_img = preprocess_image(img)

        # Run Tesseract OCR on the preprocessed image.
        # lang="eng" tells Tesseract to use the English language pack.
        # config "--psm 6" tells Tesseract to assume a single uniform block of text.
        raw_text = pytesseract.image_to_string(
            processed_img,
            lang="eng",
            config="--psm 6"
        )

    # Strip extra whitespace from the result
    extracted = raw_text.strip()
    return extracted
