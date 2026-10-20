#!/usr/bin/env python3
"""Pre-publication checks for the 12 Silhueta body-measurement illustrations.

Automatic checks detect omissions, substitutions, and misplaced pink bands.
They DO NOT certify anatomic correctness: visual inspection remains mandatory.
"""
from pathlib import Path
from io import BytesIO
from statistics import median
import base64
import hashlib
import json
import re

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
spec = json.loads((ROOT / "qa" / "anatomy-manifest.json").read_text(encoding="utf-8"))
expected = spec["images"]

match = re.search(r"const ANATOMY_IMAGES=(\{[^\n]*\});\nconst GUIDE_MEDIA=", index)
assert match, "Missing embedded image map"
images = json.loads(match.group(1))
assert len(expected) == 12 and set(images) == set(expected), "Exactly 12 mapped images required"

guide = index.split("const GUIDE_MEDIA=", 1)[1].split("function guideFigure(metric)", 1)[0]
pairs = dict(re.findall(r"^\s*(\w+):\{image:'(\w+)'", guide, re.M))
assert len(pairs) == 12 and set(pairs) == set(expected), "Guide region mismatch"
assert all(key == value for key, value in pairs.items()), "Wrong image mapped to guide region"
assert "const marked=" not in index, "Forbidden extra mark/circle overlays"
assert 'class="anatomy-overlay"' not in index, "Guide must use its real tape, not SVG overlays"
assert index.count("data:image/webp;base64,") == 12, "Exactly 12 WebP images must be embedded"
assert "async function syncNow(reason='manual')" in index, "Gist integration unexpectedly changed"
assert "icon-192-v21.png" in index, "User-approved Opção A icon unexpectedly changed"

for key in sorted(expected):
    uri = images[key]
    assert uri.startswith("data:image/webp;base64,"), key + ": invalid media"
    data = base64.b64decode(uri.split(",", 1)[1], validate=True)
    sha = hashlib.sha256(data).hexdigest()
    assert sha == expected[key]["sha256"], key + ": illustration altered; re-review before approval"
    with Image.open(BytesIO(data)) as im:
        assert im.format == "WEBP" and min(im.size) >= expected[key]["minSize"], key + ": low-resolution image"
        rgb = im.convert("RGB")
        pink_positions = []
        for y in range(110, im.height - 120, 4):
            for x in range(140, im.width - 130, 4):
                r, g, b = rgb.getpixel((x, y))
                if r > 170 and r-g > 45 and b-g > 3 and g < 184 and 80 < b < 234:
                    pink_positions.append(y)
        assert len(pink_positions) > 800, key + ": bright pink measuring tape not detected"
        center_y = median(pink_positions) / im.height
        assert abs(center_y - expected[key]["tapeCenterY"]) < .08, key + ": tape is outside reviewed anatomical zone"
        print(key, "OK", im.size, "tape-center", round(center_y, 3))

print("PASS: image count, association, immutable hashes, tape color and location, no overlays")
print("NOTE: human anatomy review is still required for all new or modified pictures.")
