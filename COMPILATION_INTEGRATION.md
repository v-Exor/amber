# Connect Laboratory Activity 1 to your compilation

Repository: **https://github.com/v-Exor/amber**

Live laboratory website: **https://v-exor.github.io/amber/**

Use the live website URL as the destination of the Lab 1 button in `Website_LaboratoryAct_Compilation`. The repository URL is for viewing source code.

For an HTML compilation, a link can be:

```html
<a href="https://v-exor.github.io/amber/"
   target="_blank"
   rel="noopener noreferrer">
  Open Laboratory Activity 1
</a>
```

For the existing compilation project that keeps activity records in `src/config/laboratories.ts`, set only the Lab 1 live-site destination to the Pages URL above and its source destination to the repository URL. Preserve that project's actual property names and the other laboratory entries.

To connect the return button on the Lab 1 website, edit **`site-config.js`** in this repository and set `compilationUrl` to your compilation website's actual public URL. Commit and push that edit to `main`; GitHub Pages redeploys automatically. The exact compilation URL has not been supplied, so it is intentionally left blank. The Lab 1 return button currently opens a working configuration dialog rather than a guessed destination.

The site's Configure site links dialog can also store links for an individual browser. For all visitors to receive the return destination, update the tracked `site-config.js` file. Browser-specific saved settings override file defaults until changed or cleared.
