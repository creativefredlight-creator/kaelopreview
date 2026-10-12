import os
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

USER_UPLOAD_DIR = r"C:\Users\USER\.gemini\antigravity\brain\71b5baa1-2362-49ef-a520-ef7b31819770\.user_uploaded"
OUT_DIR = r"c:\Users\USER\Desktop\Kaelo\public\assets"
os.makedirs(OUT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. RED MASCOT: Perfect transparent RGBA from user uploaded file
# -----------------------------------------------------------------------------
red_src = os.path.join(USER_UPLOAD_DIR, "media_1791711701790_9a8aea39.png")
red_img = Image.open(red_src).convert("RGBA")
red_img.save(os.path.join(OUT_DIR, "kaelo-mascot-red.png"))

# Red avatar crop (head & eyes region)
red_bbox = red_img.getbbox()
red_avatar = red_img.crop((70, 60, 950, 720))
red_avatar.save(os.path.join(OUT_DIR, "kaelo-avatar-red.png"))
print("Saved red mascot and avatar")

# -----------------------------------------------------------------------------
# 2. PURPLE STANDING MASCOT: Flood-fill external background matting
# -----------------------------------------------------------------------------
purple_src = os.path.join(USER_UPLOAD_DIR, "media_1791711728472_834f1970.jpg")
p_img = Image.open(purple_src).convert("RGB")
w, h = p_img.size
arr = np.array(p_img, dtype=float)

# In media_1791711728472_834f1970.jpg, the mascot is the character standing in front
# Crop to mascot region: y from 250 to 940, x from 160 to 860
mascot_crop = p_img.crop((160, 250, 860, 940))
cw, ch = mascot_crop.size
c_arr = np.array(mascot_crop, dtype=float)

# Background color is roughly (17, 18, 21)
bg_sample = np.array([17.0, 18.0, 21.0])
dist = np.sqrt(np.sum((c_arr - bg_sample)**2, axis=-1))

# Mark seed background pixels at borders where dist < 22
is_bg = np.zeros((ch, cw), dtype=bool)
queue = deque()

for x in range(cw):
    if dist[0, x] < 30:
        is_bg[0, x] = True
        queue.append((0, x))
    if dist[ch - 1, x] < 30:
        is_bg[ch - 1, x] = True
        queue.append((ch - 1, x))

for y in range(ch):
    if dist[y, 0] < 30:
        is_bg[y, 0] = True
        queue.append((y, 0))
    if dist[y, cw - 1] < 30:
        is_bg[y, cw - 1] = True
        queue.append((y, cw - 1))

# Flood fill outer background
while queue:
    cy, cx = queue.popleft()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < ch and 0 <= nx < cw:
            if not is_bg[ny, nx] and dist[ny, nx] < 28:
                is_bg[ny, nx] = True
                queue.append((ny, nx))

# Mascot alpha: 255 where NOT is_bg, with soft edge
alpha = np.where(is_bg, 0, 255).astype(np.uint8)

# Edge anti-aliasing via distance gradient
for y in range(ch):
    for x in range(cw):
        if not is_bg[y, x] and dist[y, x] < 50:
            alpha[y, x] = int(np.clip((dist[y, x] - 18) / 32 * 255, 0, 255))

alpha_img = Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=0.5))
mascot_rgba = mascot_crop.convert("RGBA")
mascot_rgba.putalpha(alpha_img)

# Crop tight bounding box
bbox = mascot_rgba.getbbox()
if bbox:
    mascot_rgba = mascot_rgba.crop(bbox)

# Save as primary kaelo-mascot.png and kaelo-mascot-purple.png
mascot_rgba.save(os.path.join(OUT_DIR, "kaelo-mascot.png"))
mascot_rgba.save(os.path.join(OUT_DIR, "kaelo-mascot-purple.png"))
print("Saved standing purple mascot:", mascot_rgba.size)

# Crop purple avatar (face and big shiny eyes)
head_h = int(mascot_rgba.height * 0.72)
pur_avatar = mascot_rgba.crop((20, 0, mascot_rgba.width - 20, head_h))
pur_avatar.save(os.path.join(OUT_DIR, "kaelo-avatar.png"))
pur_avatar.save(os.path.join(OUT_DIR, "kaelo-avatar-purple.png"))
print("Saved purple avatar:", pur_avatar.size)

# -----------------------------------------------------------------------------
# 3. PURPLE CELEBRATE / JUMPING MASCOT
# -----------------------------------------------------------------------------
cel_src = os.path.join(USER_UPLOAD_DIR, "media_1791711701790_1333e591.jpg")
cel_img = Image.open(cel_src).convert("RGB")
cw, ch = cel_img.size
c_arr = np.array(cel_img, dtype=float)

# Purple mascot body has high R & B, lower G (e.g., R>120, B>180, G<140)
# Eyes are white (R>220, G>220, B>220) with black pupil (R<40, G<40, B<40)
# Mouth has tongue (pink/red) and dark cavity
# The background is pastel lime-purple-white gradient:
# Let's detect the mascot pixels
is_purple_body = (c_arr[:, :, 2] > c_arr[:, :, 1] + 40) & (c_arr[:, :, 0] > c_arr[:, :, 1] + 20) & (c_arr[:, :, 2] > 140)
is_eye_white = (c_arr[:, :, 0] > 215) & (c_arr[:, :, 1] > 215) & (c_arr[:, :, 2] > 215)
is_black = (c_arr[:, :, 0] < 55) & (c_arr[:, :, 1] < 55) & (c_arr[:, :, 2] < 55)
is_mouth = (c_arr[:, :, 0] > 180) & (c_arr[:, :, 1] < 120)

mascot_core = is_purple_body | is_eye_white | is_black | is_mouth

# Flood fill external background starting from corners
bg_mask = np.zeros((ch, cw), dtype=bool)
queue = deque([(0, 0), (0, cw - 1), (ch - 1, 0), (ch - 1, cw - 1)])
for y, x in queue:
    bg_mask[y, x] = True

while queue:
    cy, cx = queue.popleft()
    for dy, dx in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < ch and 0 <= nx < cw:
            if not bg_mask[ny, nx] and not mascot_core[ny, nx]:
                bg_mask[ny, nx] = True
                queue.append((ny, nx))

cel_alpha = np.where(bg_mask, 0, 255).astype(np.uint8)
cel_alpha_img = Image.fromarray(cel_alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=0.8))
cel_rgba = cel_img.convert("RGBA")
cel_rgba.putalpha(cel_alpha_img)
c_bbox = cel_rgba.getbbox()
if c_bbox:
    cel_rgba = cel_rgba.crop(c_bbox)
cel_rgba.save(os.path.join(OUT_DIR, "kaelo-celebrate.png"))
cel_rgba.save(os.path.join(OUT_DIR, "kaelo-celebrate-purple.png"))
print("Saved celebrate mascot:", cel_rgba.size)

# -----------------------------------------------------------------------------
# 4. APP ICON: SQUIRCLE CROP
# -----------------------------------------------------------------------------
icon_src = os.path.join(USER_UPLOAD_DIR, "media_1791711701790_e5e0e9ce.jpg")
icon_img = Image.open(icon_src).convert("RGB")
icon_crop = icon_img.crop((72, 76, 951, 959))
icon_crop.save(os.path.join(OUT_DIR, "kaelo-app-icon.png"))
print("Saved app icon:", icon_crop.size)

# -----------------------------------------------------------------------------
# 5. KAELO-AI LOGO TEXT: Transparent extraction
# -----------------------------------------------------------------------------
logo_crop = p_img.crop((65, 110, 955, 345))
lw, lh = logo_crop.size
l_arr = np.array(logo_crop, dtype=float)
l_dist = np.sqrt(np.sum((l_arr - bg_sample)**2, axis=-1))

# Text is either lime (G high, B low) or purple (R&B high, G low)
# Background is dark
l_alpha = np.clip((l_dist - 20) / 35 * 255, 0, 255).astype(np.uint8)
# Zero out the top of the mascot head that enters at bottom middle
# The head enters below y=165 between x=280 and x=560
for y in range(155, lh):
    for x in range(250, 580):
        # If it's purple head rather than lime text
        if l_arr[y, x, 0] > 140 and l_arr[y, x, 1] < 150 and l_arr[y, x, 2] > 220:
            l_alpha[y, x] = 0

l_alpha_img = Image.fromarray(l_alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=0.5))
logo_rgba = logo_crop.convert("RGBA")
logo_rgba.putalpha(l_alpha_img)
l_bbox = logo_rgba.getbbox()
if l_bbox:
    logo_rgba = logo_rgba.crop(l_bbox)
logo_rgba.save(os.path.join(OUT_DIR, "kaelo-logo.png"))
print("Saved logo banner:", logo_rgba.size)

print("ALL ASSETS CREATED SUCCESSFULLY!")
