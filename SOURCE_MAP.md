# Laboratory 1 source mapping

Primary source: **CSST106_Lab_Experiment_01_Images.docx**, College of Computer Studies, Laboratory Exercise No. 1, **Image Manipulation**, Weeks 1–2, Perception and Computer Vision, AY 2026–2027.

The original source was re-read before implementation. No requirements from Labs 2–7 are included. In particular, thresholding, edge detection, histograms, SURF, PCA, YOLO, and segmentation are outside this handout's scope.

| Source requirement | Implemented location and evidence |
| --- | --- |
| Familiarity with computer vision and image representation | Hero, overview, concepts, and objectives |
| 2D/3D arrays, grayscale vs color | Overview concept cards, Q&A 1–3, live array-shape measurements |
| Pixel intensity, channels, resolution | Overview, experiment 1.1, pixel readout, Q&A 2–3 and 9 |
| Load color with cv2.imread | Original Python `part1.py`; live sample/upload decode in experiment 1.1 |
| Display with cv2.imshow and print img.shape | Preserved Python scripts, code excerpts, live original/output Canvas and shape labels |
| Identify height, width, channels, and BGR | Experiment 1.1 and Q&A 3, including RGBA distinction |
| Convert to grayscale and display | Experiment 1.2, Python Part 1, genuine reference result |
| Examine pixel values at coordinates | Experiment 1.3 with coordinate fields, click/keyboard selection, RGB/BGR and gray values |
| Change one pixel and observe | Experiment 1.3 with exact assignment, preserved original, before/after neighborhood zooms |
| Crop ROI | Experiment 2.1, validated rectangular crop, overlay, preserved Python Part 2 |
| Resize smaller or larger | Experiment 2.2 with 50/100/150% presets, explicit dimensions, interpolation, aspect lock |
| Rotate 90 degrees | Experiment 2.3 with both directions, exact remapping and shape observations |
| Discuss digital representation and manipulation | Q&A 1, 4–8 and conclusion |
| Significance of channels and values | Q&A 3, 5, 9, live channel and memory observations |
| Real-life applications | Q&A 10 and conclusion |
| Hardcopy short report describing procedure and learning | `report/index.html`, plus complete answers in `downloads/ANSWERS.md` |
| Screenshots of original, grayscale, manipulated images | Actual original OpenCV window captures in `report/screenshots/` and embedded printable report |

## Preserved and derived material

- `python/part1.py` and `python/part2.py` are the prior completed solutions from this conversation, copied without changing their numerical behavior.
- `assets/sample.jpg` is the College of Computer Studies logo embedded in the Word handout. It is a demonstration choice; the handout does not designate an input photograph.
- Crop coordinates, resize ratios, example pixel, and clockwise direction are prior demonstration choices, not extra instructor requirements.
- `assets/results/` contains compressed previews derived from actual saved OpenCV outputs. They are labeled precomputed and do not impersonate live processing.
- `report/screenshots/` contains the original genuine window captures. Saved image dimensions and display window dimensions are distinguished in the report.
- The six experiment labels and ten learning questions organize the source's tasks and discussion topics; they are not claimed to be original numbered questions.
- Browser interactions implement equivalent core concepts with JavaScript kernels rather than executing Python remotely. Differences in buffer order, JPEG decode, resizing, and grayscale storage are disclosed in the interface and README.

Technical references: [MDN ImageData ordering](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data), [OpenCV image operations](https://docs.opencv.org/4.12.0/d5/d98/tutorial_mat_operations.html), [OpenCV geometric transformations](https://docs.opencv.org/4.13.0/da/d6e/tutorial_py_geometric_transformations.html), and [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
