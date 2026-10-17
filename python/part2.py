"""CSST106 Lab 1, Part 2: crop, resize, and rotate an image."""
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
    height, width = img.shape[:2]

    # Keep the center half of each dimension. Slice stop indices are exclusive.
    x1, y1 = width // 4, height // 4
    x2, y2 = max(x1 + 1, 3 * width // 4), max(y1 + 1, 3 * height // 4)
    cropped = img[y1:y2, x1:x2].copy()
    # cv2.resize takes (width, height), unlike img.shape.
    smaller = cv2.resize(img, (max(1, width // 2), max(1, height // 2)),
                         interpolation=cv2.INTER_AREA)
    larger = cv2.resize(img, (max(1, round(width * 1.5)), max(1, round(height * 1.5))),
                        interpolation=cv2.INTER_LINEAR)
    rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

    images = {"original": img, "cropped": cropped, "resized_smaller": smaller,
              "resized_larger": larger, "rotated_90_clockwise": rotated}
    results = {"source": str(args.image.resolve()),
               "roi_xyxy": [x1, y1, x2, y2],
               "shapes": {name: list(image.shape) for name, image in images.items()}}
    output = Path(__file__).parent / "outputs" / "part2"
    output.mkdir(parents=True, exist_ok=True)
    for name, image in images.items():
        if not cv2.imwrite(str(output / f"{name}.png"), image):
            raise OSError(f"Could not save {name}")
    (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))
    print(f"Saved images and measurements to {output}")

    if not args.no_display:
        print("Click each image window and press any key to view the next result.")
        for name, image in images.items():
            title = f"Part 2 - {name} - press any key"
            cv2.namedWindow(title, cv2.WINDOW_NORMAL)
            scale = min(1.0, 800 / image.shape[1], 650 / image.shape[0])
            cv2.resizeWindow(title, int(image.shape[1] * scale), int(image.shape[0] * scale))
            cv2.imshow(title, image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
