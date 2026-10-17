"""CSST106 Lab 1, Part 1: image representation and pixel manipulation."""
import argparse
import json
from pathlib import Path

import cv2


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, default=Path(__file__).parent / "sample.jpg")
    parser.add_argument("--no-display", action="store_true", help="Save results without opening windows")
    args = parser.parse_args()
    if not args.image.is_file():
        parser.error(f"Image does not exist: {args.image}")
    img = cv2.imread(str(args.image), cv2.IMREAD_COLOR)
    if img is None:
        parser.error(f"OpenCV could not decode: {args.image}")

    # shape uses (height, width, channels); indexing uses [y, x].
    height, width, channels = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    x, y = width // 4, height // 2
    before = img[y, x].copy()
    modified = img.copy()  # Preserve the original image.
    modified[y, x] = (0, 255, 0)  # BGR: pure green; changes exactly one pixel.

    # Nearest-neighbor magnification makes the individual pixels visible.
    y1, y2 = max(0, y - 5), min(height, y + 6)
    x1, x2 = max(0, x - 5), min(width, x + 6)
    original_zoom = cv2.resize(img[y1:y2, x1:x2], (330, 330), interpolation=cv2.INTER_NEAREST)
    changed_zoom = cv2.resize(modified[y1:y2, x1:x2], (330, 330), interpolation=cv2.INTER_NEAREST)
    samples = [{"x": px, "y": py, "bgr": img[py, px].tolist(),
                "gray": int(gray[py, px])}
               for px, py in [(0, 0), (x, y), (width // 2, height // 2)]]
    results = {
        "source": str(args.image.resolve()), "shape": list(img.shape),
        "height": height, "width": width, "channels": channels,
        "dtype": str(img.dtype), "pixel_count": height * width,
        "array_bytes": img.nbytes, "gray_shape": list(gray.shape),
        "gray_array_bytes": gray.nbytes, "sample_pixels": samples,
        "modified_coordinate_xy": [x, y], "before_bgr": before.tolist(),
        "after_bgr": modified[y, x].tolist(),
    }
    output = Path(__file__).parent / "outputs" / "part1"
    output.mkdir(parents=True, exist_ok=True)
    images = {"original": img, "grayscale": gray, "modified_pixel": modified,
              "pixel_before_zoom": original_zoom, "pixel_after_zoom": changed_zoom}
    for name, image in images.items():
        if not cv2.imwrite(str(output / f"{name}.png"), image):
            raise OSError(f"Could not save {name}")
    (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))
    print(f"Saved images and measurements to {output}")

    if not args.no_display:
        print("Click each image window and press any key to view the next result.")
        for name, image in images.items():
            title = f"Part 1 - {name} - press any key"
            cv2.namedWindow(title, cv2.WINDOW_NORMAL)
            scale = min(1.0, 800 / image.shape[1], 650 / image.shape[0])
            cv2.resizeWindow(title, int(image.shape[1] * scale), int(image.shape[0] * scale))
            cv2.imshow(title, image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
