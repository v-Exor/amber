# CSST106 Laboratory 1 Images and Image Processing

A complete, independent GitHub Pages website for **Laboratory Exercise No. 1: Image Manipulation**. It follows the Word handout's two parts: understanding digital images and performing basic image operations. This repository contains only Lab 1.

The website uses white, warm off-white, orange `#FF6B00`, and peach gradients to complement the existing VisionLab compilation. It has no production dependencies, backend, external fonts, CDN scripts, or build requirement. JavaScript modules and a Web Worker perform real image operations locally.

## Repository and website addresses

- GitHub repository: **https://github.com/v-Exor/amber**
- GitHub Pages address: **https://v-exor.github.io/amber/**
- Publishing source: **main**, **/ (root)**.

Use the Pages address above for the Lab 1 button in `Website_LaboratoryAct_Compilation`. The Lab 1 repository link is already configured. The compilation return URL is intentionally empty because that website's actual published address has not been supplied; set `compilationUrl` in `site-config.js` when it is available. The return button opens the configuration dialog until then.

## Start locally

Use Node.js 22 or later. From this folder:

```powershell
npm run dev
```

Open **http://127.0.0.1:4173/**. No npm installation is needed to serve or use the site. The server also exposes **http://127.0.0.1:4173/lab-01/** for checking GitHub Pages repository-subpath compatibility.

Alternatively, use any static HTTP server, including VS Code Live Server. Open the folder containing `index.html` as the website root. Do not double-click `index.html`: browsers restrict ES modules and workers on `file://` URLs.

To use another port in PowerShell:

```powershell
$env:PORT = '4180'
npm run dev
```

Stop the server with Ctrl+C.

## What works

| Handout task | Working browser experiment |
| --- | --- |
| Load a color image, display it, inspect shape | Default handout logo or local JPG, PNG, or WebP; dimensions, channel explanation, pixel count, and raw memory |
| Convert to grayscale | Weighted BT.601 grayscale with same spatial dimensions |
| Inspect and change a pixel | Coordinate inputs, click selection, arrow-key selection, RGB/BGR values, gray intensity, one-pixel assignment, and magnified before/after views |
| Crop a region of interest | Exact row/column selection, boundary validation, live ROI overlay |
| Resize smaller or larger | 50%, 100%, and 150% presets; explicit dimensions; aspect lock; area averaging, bilinear, and nearest neighbor |
| Rotate 90 degrees | Exact clockwise or counterclockwise pixel remapping; rectangular width/height swap |
| Discuss representation, channels, and applications | Overview, concepts, ten expandable answers, analysis, and conclusion |
| Short report and screenshots | Original three-page printable report with genuine OpenCV window screenshots |

Each experiment starts from the loaded original. Operations do not silently chain. The source is preserved. Switch experiments or select Reset output to clear the comparison. Run results remain in the session notebook until cleared or the page closes; the latest 12 are retained. Export JSON to preserve measurements. Download PNG saves the full processed dimensions, while notebook downloads are explicitly reduced previews.

### Input and performance limits

- File types: JPEG, PNG, and WebP. SVG and animated formats are excluded.
- Compressed input size: up to 30 MiB.
- Input and output: at most 10,000,000 pixels each. Files are rejected rather than silently resized.
- Transparent images are composited on white, yielding an opaque color input comparable to this activity's JPEG.
- Processing normally runs in a module Web Worker to keep the UI responsive. If workers cannot start, the same actual processing functions run on the main thread on a subsequent attempt; large operations may briefly block rendering.
- Each worker operation has a 45-second timeout. Output encoding also depends on the browser's memory and Canvas limits.
- Photos are not sent to a server. There is no analytics, account system, or image persistence. Configured destination links navigate to the addresses the owner supplies.

## Configure compilation and repository links

Edit **`site-config.js`** before publishing:

```js
window.LAB_CONFIG = {
  compilationUrl: "", // Your actual compilation website URL
  repositoryUrl: "",  // Your actual GitHub repository URL
  studentName: "",    // Reserved for optional personal customization
  section: "",        // Reserved for optional personal customization
};
```

Use full HTTP or HTTPS URLs. No GitHub username, repository address, student details, or compilation address has been invented.

If links are empty, their buttons open an explanatory link-settings dialog instead of navigating to a broken placeholder. The footer's **Configure site links** opens the same dialog. Saving there sets values for that browser using localStorage; it does **not** edit the repository. **Copy site-config.js** generates a configuration you can paste into the tracked file to share settings with every visitor. Stored browser settings override the file until cleared or changed in that dialog. The website works independently even before external links are configured.

## Publish on GitHub Pages

This repository has been uploaded as `v-Exor/amber`, and Pages is configured to deploy from `main` at the repository root. The following steps document the setup for reproducing this deployment in another repository. Future pushes to this repository's `main` branch update its Pages website automatically.

1. Create your own new **public** GitHub repository for this laboratory. Free GitHub Pages supports public repositories.
2. Upload the **contents of this `lab-01` folder**, so `index.html` is at the root of that repository. Do not upload the containing `Laboratory_Activities_CSST106` folder or `node_modules`.
3. Include `site-config.js`, `.nojekyll`, `assets/`, `downloads/`, `python/`, `report/`, `app.js`, `processing.js`, `worker.js`, and `styles.css`. Preserve names and case.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/ (root)**, then save.
6. Wait for GitHub's Pages deployment to finish. Use the URL shown in Settings → Pages.
7. Put that actual URL into the Lab 1 entry of your existing compilation website. In the existing compilation project, the activity destinations are maintained in `src/config/laboratories.ts`; update only the Lab 1 entry according to that project's configuration format.

Expected project-site URL format:

```text
https://YOUR-USERNAME.github.io/YOUR-LAB1-REPOSITORY/
```

These uppercase names are placeholders for documentation only and are not installed as working website links. Include the trailing slash. All internal URLs are relative, so a repository name such as `csst106-lab1` works without a build-time base path or custom routing rules. Hash anchors keep navigation compatible with static hosting.

### Optional static staging folder

```powershell
npm run package
```

This creates `artifacts/github-pages/` containing only production files. You may upload those contents instead. There is no compiled production build to generate; these are the same HTML, CSS, JavaScript, and assets used locally. The script only replaces this generated staging directory.

Official GitHub instructions: [creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Tests

The numerical tests and asset checks use built-in Node modules:

```powershell
npm test
npm run check
```

To install the development-only browser test runner and run Chrome end-to-end tests:

```powershell
npm ci
npm run test:e2e
npm run test:a11y
```

The browser tests use an installed **Google Chrome** through Playwright. If Chrome is unavailable, install Chrome or change `launchOptions.channel` in `playwright.config.js` to an installed Playwright browser and install that browser using Playwright's documented setup. No browser needs to be installed for visitors to use the hosted website.

The suite checks all six experiments, actual output pixels, original preservation, a rectangular PNG upload, pixel keyboard selection, errors, downloads, JSON export, URL settings, source code including narrow-screen expansion, mobile navigation, widths 320/390/768/1440, repository-subpath loading, report assets, and browser JavaScript errors. The accessibility command uses axe-core to check WCAG 2 A/AA and 2.1 AA rules in four representative states. Screenshots and audit results are written to ignored `artifacts/`. See `VALIDATION.md` for the final executed results and limitations.

To run the same browser suite against the public deployment instead of a local server:

```powershell
$env:LAB_BASE_URL = 'https://v-exor.github.io/amber/'
npm run test:e2e
Remove-Item Env:\LAB_BASE_URL
```

## Original Python laboratory

The two original scripts are preserved in `python/`. They are independent of the website and run on a local desktop:

```powershell
cd python
python -m pip install -r requirements.txt
python part1.py
python part2.py
```

For saving outputs without opening windows:

```powershell
python part1.py --no-display
python part2.py --no-display
```

`downloads/python-lab1.zip` bundles both scripts, their sample image, requirements, and instructions. The website's expandable code excerpts explain each operation; later excerpts assume `img` was loaded in Experiment 1.1. The complete scripts include their own image loading and error handling. They are fixed demonstrations; changing browser parameters does not rewrite downloaded Python files.

## Scientific distinctions

- The primary activity source is `CSST106_Lab_Experiment_01_Images.docx`, Laboratory Exercise No. 1, Image Manipulation. `SOURCE_MAP.md` maps its requirements to this project.
- The handout contains tasks and summary topics, not a numbered question sheet. The website labels its derived learning questions accordingly.
- Canvas exposes **RGBA**, while OpenCV normally loads color as **BGR**. The website reports equivalent OpenCV shapes and explicitly identifies browser storage. A displayed grayscale Canvas still uses RGBA bytes; a Python grayscale array is two-dimensional.
- Browser grayscale uses 8-bit fixed-point BT.601 coefficients. Browser JPEG decoding and color handling may differ slightly from OpenCV, so static Python observations are kept separate from live browser measurements.
- Bilinear resizing is a real half-pixel implementation; area averaging integrates pixel coverage. Browser implementation rounding may differ slightly from optimized OpenCV kernels. Exact crop, pixel edits, and quarter-turn rotations do not resample values.
- Reference gallery assets are optimized previews of genuine existing Python outputs. Captions report underlying original output sizes rather than preview file dimensions.
- Session timings measure processing work, not file decode, transfer, UI rendering, or PNG encoding. They are observations on the current device, not a benchmark claim.

## Project map

```text
index.html             Academic content and complete interface
styles.css             Responsive orange/white theme and reduced-motion rules
app.js                 UI, image loading, worker orchestration, downloads, settings
processing.js          Pure numerical image kernels
worker.js              Background processing entry
site-config.js         Owner-supplied external URLs
assets/                Original sample, favicon, genuine result previews
python/                Preserved desktop Python implementations
downloads/             Complete answers and Python package
report/                Printable original report and actual window screenshots
scripts/               Local server, syntax/asset checks, static staging
tests/                 Numerical and browser tests
SOURCE_MAP.md          Handout-to-implementation traceability
VALIDATION.md          Executed checks and outstanding external verification
```

## Troubleshooting

- **Blank page after double-clicking:** start the HTTP server. Module imports and workers should be served over HTTP or HTTPS.
- **Assets return 404 on GitHub:** ensure `index.html` and its sibling files are at the selected Pages publishing root. Do not rename files or use root-relative `/assets` URLs.
- **External buttons ask for configuration:** supply your real links in `site-config.js`, or use the settings dialog. No destination was provided in the request.
- **A new site-config value seems ignored:** previously saved local settings take precedence. Change them using Configure site links or clear that site's localStorage.
- **PNG download appears visually the same size:** the UI fits images into comparison boxes; downloaded images preserve the actual dimensions shown above each canvas.
- **Single-pixel change looks invisible:** inspect the magnified before/after views. Use a color different from the source pixel.
- **Large image rejected:** reduce the source size before uploading or choose smaller output dimensions. There is no hidden automatic downscaling.
- **Browser values differ from the reference:** the reference is an actual Python/OpenCV JPEG decode. Browser decode and rounding may differ; read the current live values.
- **Report images missing after moving it:** keep `report/index.html` together with its `screenshots/` subfolder.
- **Printing:** open the report, fill in personal details, and use Ctrl+P. Those fields are temporary until printing or saving to PDF; they are not sent to a server.

The site includes focus indicators, semantic controls, keyboard pixel movement, a skip link, mobile navigation, status/error announcements, and reduced-motion support. These do not substitute for an exhaustive assistive-technology audit.
