from PIL import Image
import numpy as np

def remove_white_bg(src, dst, threshold=230):
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    r, g, b, a = data[...,0], data[...,1], data[...,2], data[...,3]
    # White background pixels: all channels high
    mask = (r > threshold) & (g > threshold) & (b > threshold)
    # Smooth edge: alpha based on how bright the pixel is
    brightness = (r + g + b) / 3.0
    alpha_factor = 1.0 - (brightness - threshold) / (255 - threshold)
    alpha_factor = np.clip(alpha_factor, 0, 1)
    data[..., 3] = np.where(mask, alpha_factor * 255, 255)
    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    result.save(dst, "PNG")
    print(f"Saved {dst}")

def remove_dark_bg(src, dst, threshold=30):
    img = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    r, g, b, a = data[...,0], data[...,1], data[...,2], data[...,3]
    # Dark background pixels: all channels low
    mask = (r < threshold) & (g < threshold) & (b < threshold)
    brightness = (r + g + b) / 3.0
    alpha_factor = brightness / threshold
    alpha_factor = np.clip(alpha_factor, 0, 1)
    data[..., 3] = np.where(mask, alpha_factor * 255, 255)
    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    result.save(dst, "PNG")
    print(f"Saved {dst}")

base = r"D:\Shqiponja eSIM\frontend\public"
# Light mode icon: white bg → remove white
remove_white_bg(f"{base}\\navbar-icon-light.png", f"{base}\\navbar-icon-light.png")
# Dark mode icon: dark bg → remove dark
remove_dark_bg(f"{base}\\navbar-icon-dark.png", f"{base}\\navbar-icon-dark.png")
