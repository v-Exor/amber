# CSST106 Laboratory Exercise 1 Answers and Code

Source: `CSST106_Lab_Experiment_01_Images.docx`, Laboratory Exercise No. 1, Image Manipulation, Parts 1 and 2 and Summary Discussion.

The handout lists tasks and discussion topics rather than numbered questions. The answers below cover every listed task and discussion topic. The handout does not prescribe an input photo, crop coordinates, resize scale, or rotation direction. For this worked example, `sample.jpg` is the College of Computer Studies logo extracted from the handout. The crop, scale factors, selected pixel, and clockwise direction are choices for this demonstration. Numerical observations below come from running the supplied scripts on that image.

## Part 1 Understanding Digital Images

### 1 What is an image in computer vision

A digital image is an array of pixels. Each pixel stores a numerical value describing intensity or color at one location. A grayscale image normally uses a two-dimensional array with shape `(height, width)`. A color image normally uses a three-dimensional array with shape `(height, width, channels)`. The third dimension contains color channels; it does not mean the picture is a three-dimensional scene.

### 2 Grayscale and color images

A grayscale image has one intensity value per pixel. For the 8-bit images used here, 0 represents black, 255 represents white, and intermediate values represent shades of gray. A color image loaded with `cv2.IMREAD_COLOR` has three channels. Each channel also uses values from 0 to 255 in this example. The three values together determine the pixel's color.

### 3 Pixel intensity channels and resolution

Pixel intensity describes the stored brightness value in grayscale or the strength of an individual color component. Channels store separate components of a pixel. Spatial resolution describes the image's width and height in pixels. The sample has a resolution of 2048 × 2048 pixels and contains 4,194,304 pixels. Its array type is `uint8`, so each channel value occupies one byte. These ranges and storage sizes describe this 8-bit sample; other image formats can use other data types.

### 4 Loading displaying and inspecting the image

`cv2.imread(path, cv2.IMREAD_COLOR)` loads the color image. `cv2.imshow(title, img)` displays it. `cv2.waitKey(0)` keeps the image visible until a key is pressed, and `cv2.destroyAllWindows()` closes the windows. The scripts check whether loading succeeded before accessing the array.

For this sample, `img.shape` returns **`(2048, 2048, 3)`**: height = 2048 rows, width = 2048 columns, and channels = 3. Shape lists height before width; resolution is conventionally written width × height.

### 5 Why does OpenCV use BGR ordering

The default OpenCV color-loading convention stores values in **Blue, Green, Red** order. In this representation, `(255, 0, 0)` is blue, `(0, 255, 0)` is green, and `(0, 0, 255)` is red. Interpreting BGR data as RGB swaps the red and blue components. This is an OpenCV storage convention; the number of pixels and spatial resolution do not change because of channel ordering.

### 6 Converting to grayscale

`gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)` converts the image to grayscale. Its shape becomes **`(2048, 2048)`** because each pixel now has one intensity value. Width and height stay the same. Conversion combines the color channels using brightness weights, approximately `Y = 0.114B + 0.587G + 0.299R`; it does not simply average them.

The color pixel `[23, 111, 201]` becomes intensity **128**. Color information is lost, while brightness differences preserve much of the image's structure. The raw color array occupies 12,582,912 bytes and the grayscale array occupies 4,194,304 bytes. These are array memory sizes, excluding array overhead; they are not compressed JPEG or PNG file sizes.

### 7 Examining pixel values

Coordinates are zero-based. Use `img[y, x]`, with row first and column second. The top-left pixel is `(x=0, y=0)`. Increasing x moves right, and increasing y moves down.

| Coordinate as x y | Access expression | BGR value | Grayscale value |
|---|---|---|---|
| 0, 0 | `img[0, 0]` | `[255, 255, 255]` | 255 |
| 512, 1024 | `img[1024, 512]` | `[23, 111, 201]` | 128 |
| 1024, 1024 | `img[1024, 1024]` | `[177, 210, 243]` | 216 |

### 8 Changing a pixel and observing the result

The code copies the image, then runs `modified[1024, 512] = (0, 255, 0)`. That pixel changes from `[23, 111, 201]` to pure green `[0, 255, 0]`. Exactly one pixel changes; the original array remains intact because the operation uses `img.copy()`.

One changed pixel is difficult to see in an image with over four million pixels. The code therefore also enlarges an 11 × 11 neighborhood using nearest-neighbor interpolation. In the enlarged after view, the changed pixel appears as a green square. The square is a display magnification of one source pixel, not a modification to an entire region of the original image.

## Part 2 Basic Image Operations

### 1 Cropping a region of interest

A region of interest, or ROI, is a selected area used for further processing. The demonstration selects the central region with `cropped = img[512:1536, 512:1536].copy()`. Slices use `[start_y:end_y, start_x:end_x]`, and their end indices are excluded. Thus, the crop contains rows and columns 512 through 1535.

The result has shape **`(1024, 1024, 3)`**. It retains the selected area's original pixel values and discards the surrounding area from the result. Cropping does not squeeze the full image into a smaller size. Here it keeps half of each dimension, which is one quarter of the original pixel count.

### 2 Resizing smaller and larger

Resizing changes the dimensions of the whole image. `cv2.resize` receives a target size in **`(width, height)`** order. Both scale choices preserve the square image's aspect ratio.

| Operation | Target width × height | Result shape |
|---|---|---|
| Original | 2048 × 2048 | `(2048, 2048, 3)` |
| Reduce each dimension to 50 percent | 1024 × 1024 | `(1024, 1024, 3)` |
| Enlarge each dimension to 150 percent | 3072 × 3072 | `(3072, 3072, 3)` |

The smaller version uses `cv2.INTER_AREA` to combine pixel information during reduction. The larger version uses `cv2.INTER_LINEAR` to estimate intermediate values. A smaller image loses detail. Enlarging creates additional samples but cannot recover scene detail absent from the original. A crop and a smaller resize can have the same shape while showing different content: the crop shows only the ROI, while the resize shows the entire logo.

### 3 Rotating by 90 degrees

`rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)` turns the image 90 degrees clockwise. This changes its orientation without cropping away content. A 90-degree rotation normally swaps height and width, so `(H, W, 3)` becomes `(W, H, 3)`. The sample is square, so its shape remains **`(2048, 2048, 3)`** even though its orientation changes. This exact quarter-turn rearranges pixels without interpolation.

## Summary Discussion

### How are images digitally represented and manipulated

Images are numerical arrays. Loading makes these numbers available to a program, and displaying turns the numbers into a visible image. Pixel editing assigns new values, grayscale conversion combines channels, cropping selects array rows and columns, resizing changes the sampling grid, and rotation rearranges pixel positions. Understanding array dimensions and coordinate order helps prevent indexing and size errors.

### What is the significance of color channels and pixel values

Pixel values encode the information an algorithm processes. Channels separate color components, enabling color-based selection and analysis. Grayscale retains brightness in one channel and can reduce memory and simplify some processing tasks. Correct BGR interpretation is necessary to choose or interpret colors correctly. Shape, type, and valid value range determine how the data can be safely processed.

### What are real life applications

1. **Document scanning and OCR:** grayscale conversion and cropping isolate text and reduce irrelevant background before recognition.
2. **Manufacturing inspection:** cropping focuses on a product area, and intensity or color differences help reveal defects.
3. **Traffic monitoring:** resizing prepares camera frames for detection, and an ROI restricts analysis to a roadway.
4. **Medical image analysis:** intensity information and selected regions support examination of structures in scans.
5. **Photo and mobile scanning tools:** resizing and rotation prepare images for viewing, storage, or further processing.

These are examples explaining the handout's discussion topic, not additional experiments required by the handout.

## Short Report for the Hardcopy

**Title: Image Representation and Basic Manipulation Using OpenCV**

**Objective:** To understand digital image representation and perform basic image operations using Python and OpenCV.

**Materials:** A computer, Python, OpenCV, and a sample color image. The sample for this demonstration is the College of Computer Studies logo embedded in the laboratory handout.

**Procedure and results:** The color image was loaded with `cv2.imread`, displayed with `cv2.imshow`, and inspected through its shape and pixel values. Its shape was `(2048, 2048, 3)`, indicating 2048 rows, 2048 columns, and three BGR channels. It was converted to grayscale using `cv2.cvtColor`, producing a two-dimensional array of shape `(2048, 2048)`. At coordinate `(x=512, y=1024)`, the original BGR value was `[23, 111, 201]` and the grayscale intensity was 128. In a copy of the image, the same pixel was changed to `[0, 255, 0]`. An enlarged neighborhood made this single-pixel change visible.

The central ROI was cropped using `img[512:1536, 512:1536]`, producing a `(1024, 1024, 3)` image. The complete image was resized to 1024 × 1024 and 3072 × 3072 pixels, and then rotated 90 degrees clockwise. The rotation retained shape `(2048, 2048, 3)` because the source was square. Cropping preserved only the selected area, whereas resizing preserved the whole scene at a different size.

**Learning and conclusion:** Digital images are arrays whose values encode brightness and color. This activity demonstrated how channel ordering, array indexing, and dimensions affect image processing. Grayscale conversion reduces color information, pixel editing changes local values, cropping selects content, resizing changes dimensions, and rotation changes orientation. These operations provide a foundation for applications such as document scanning, inspection, and object detection.

## Required Evidence and Submission

The handout asks for a **short report and screenshots of the original, grayscale, and manipulated images on hardcopy**. It does not explicitly require submitting source code or a digital report.

1. Review the report above and fill in your name, section, instructor, and actual activity date in `REPORT.html`.
2. Actual screenshots of the running OpenCV windows have already been captured in `screenshots/` and embedded in the printable report. They show the original, grayscale, pixel edit, zoom views, crop, both resized versions, and rotation.
3. Run both scripts yourself to explore the results. Click an image window and press a key to move to the next result.
4. If you change the image or code, use Windows **Win + Shift + S** to capture fresh result windows and update the report. The separate `outputs/` PNGs are exported image arrays rather than screenshots.
5. Open `REPORT.html` in a browser and print with **Ctrl + P** after adding your personal details. The existing report includes screenshots from the supplied sample run.

The full code for each part is provided below and in the separate Python files. Each part runs independently. If you change the sample image, rerun the scripts and update the numerical observations and report to match.

## OpenCV API References

The activity requirements come from the supplied Word handout. OpenCV documentation was used only to check API behavior: [image loading and display](https://opencv.org/read-display-and-write-an-image-using-opencv/), [array coordinates and BGR ordering](https://docs.opencv.org/4.12.0/d5/d98/tutorial_mat_operations.html), and [geometric transformations](https://docs.opencv.org/4.13.0/da/d6e/tutorial_py_geometric_transformations.html).

## Copy and Paste Code for Part 1

Save as `part1.py` beside `sample.jpg`. Run with `python part1.py`.

```python
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

```

## Copy and Paste Code for Part 2

Save as `part2.py` beside `sample.jpg`. Run with `python part2.py`.

```python
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

```
