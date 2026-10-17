# Validation record

Executed on **16 October 2026** using Node.js 24.16.0, installed Google Chrome, Playwright, axe-core, and the original Python/OpenCV laboratory outputs.

## Source and scope

The original Word document was re-read. Its topic is **Image Manipulation**, Laboratory Exercise No. 1. The website contains both required parts, six hands-on experiments, the image-representation concepts, all three discussion topics, complete answers, the preserved Python implementations, and the original hardcopy report with genuine window screenshots. `SOURCE_MAP.md` records the requirement mapping. No Labs 2–7 functionality was added.

## Numerical tests

`npm test` passed **7 tests**:

- BT.601 grayscale intensity and preserved dimensions.
- RGB/BGR interpretation and a single-pixel edit without mutating the source.
- Exact ROI selection, row copying, end exclusion, and edge crop handling.
- Both quarter-turn directions on a rectangular fixture, with exact remapping and a round trip.
- Area averaging, bilinear edge behavior, and nearest-neighbor sample selection.
- Fractional area footprints, verified against hand-calculated expected intensities.
- Invalid coordinates, colors, dimensions, methods, and large allocations.

## Browser workflows

`npm run test:e2e` passed **5 end-to-end tests** covering:

- All six modules on the 2048 × 2048 handout sample.
- Actual grayscale channel equality, exact pixel editing, exact crop correspondence, 50% and 150% sizes, and clockwise pixel remapping.
- Counting exactly one changed pixel in the full browser output while preserving the original.
- A generated lossless 3 × 2 PNG upload with known colors, coordinate readout, keyboard selection, and both rotations.
- Invalid ROI width, blank pixel coordinate, incorrect area enlargement, a corrupt image, and unsupported file type; previous source retained on load failure.
- Full-size PNG download, parsed session JSON, Python ZIP, complete scripts, answer file, and report HTTP responses.
- Expandable source code and real destination configuration, local persistence, unsafe URL rejection, and Escape dismissal.
- Responsive navigation, reduced-motion rendering, all six experiment panels and expanded code at widths **320, 390, 768, and 1440** without horizontal page overflow.
- Loading under **`/lab-01/`**, which exercises repository-relative imports, assets, workers, and report paths for GitHub Pages project sites.
- Successful report image loading and no JavaScript page errors during the checked workflows.

The initial mobile overflow was traced to two decorative rings. Their mobile dimensions were corrected. Desktop and mobile screenshots were inspected, including original and processed image panels and the full academic sections. Lazy image assets were allowed to decode before final full-page captures.

## Accessibility checks

`npm run test:a11y` reported **zero axe-core violations** for the selected WCAG 2 A/AA and WCAG 2.1 AA rule sets in four states:

1. Desktop overview and default experiment.
2. Completed pixel experiment, before/after zooms, expanded Python code, and expanded answers.
3. Open link-configuration dialog.
4. Mobile resize experiment at 390 pixels.

The audit prompted darker secondary text and orange buttons, an explicit mobile compilation-button name, and keyboard focus on scrollable code. The site also includes a skip link, visible focus indicators, labeled inputs, keyboard pixel selection, live statuses/errors, native dialog focus handling, and reduced-motion styles. This is an automated check of representative states, not full screen-reader or accessibility certification.

## Static checks and packaging

`npm run check` passed JavaScript parsing, referenced local-file checks, report screenshot references, and relative-path checks. `npm run package` stages production HTML, styles, modules, configuration, sample assets, downloads, Python source, and report images in `artifacts/github-pages/`. There is no runtime CDN dependency or production framework build.

The bundled Python source files were preserved from the completed laboratory. The report's fixed numbers are from that original Python run, while the live browser notebook records the current browser results. Browser Canvas data is RGBA, grayscale has one logical channel, and differences in JPEG decoding and resampling rounding are disclosed.

## Limitations and external steps

- On 17 October 2026, the owner authorized publication. The complete source was pushed to **https://github.com/v-Exor/LabAct1_CSST106**, and Pages was configured from **main / (root)** at **https://v-exor.github.io/LabAct1_CSST106/**.
- The repository URL is configured. The actual compilation website URL is still unavailable; its return button opens the functioning settings dialog until the owner supplies it. Per-browser saved settings do not update repository configuration.
- Local repository-subpath behavior was verified before publication. Public-deployment verification is recorded below.
- Current browser testing uses Chrome. No claim is made of exhaustive Safari, Firefox, low-memory device, or assistive-technology testing.
- Inputs/outputs are capped at 10 million pixels and files at 30 MiB. Transparent inputs are flattened on white; other file formats are excluded. Timing depends on the visitor's device.
- Images and session data are not persisted after the page closes. Users can download PNGs and export session JSON.
- The local preview initially could not serve through sandbox socket restrictions. Running the preview and Chrome verification outside those restrictions resolved it. npm registry access for development test dependencies also needed that execution context. Visitors do not need npm or Node.js.

## Public deployment verification on 17 October 2026

- Repository **v-Exor/LabAct1_CSST106** was created as public, and all **49 project files** were verified in the remote tree.
- GitHub Pages was enabled from **main / (root)**, with HTTPS enforced by GitHub.
- GitHub's initial Pages build and deployment completed successfully: [deployment run](https://github.com/v-Exor/LabAct1_CSST106/actions/runs/39014254116).
- The published homepage returned **HTTP 200**, and GitHub's Pages settings confirmed **Your site is live** at **https://v-exor.github.io/LabAct1_CSST106/**.
- All **5 browser end-to-end tests passed against that public GitHub Pages address**, including every image operation, original preservation, rectangular image upload, pixel keyboard selection, input errors, PNG/JSON/Python downloads, link settings, all tested screen widths, expanded code, and report image loading.
- The repository link is set in `site-config.js`. The compilation URL remains configurable until `Website_LaboratoryAct_Compilation` has an actual published address. Use the public Pages URL above as that compilation's Lab 1 destination.
- Browser tests support `LAB_BASE_URL` for repeatable checks of the public deployment; see the README.
