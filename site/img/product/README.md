# Homepage product assets

These are captures of the actual local Castrapid app, not generated UI mockups.
The browser intercepts API requests and supplies fictional Studio Notes accounts,
posts, members and analytics. It never creates records or uploads files.
The campaign artwork is original SVG, rendered to PNG for the media picker.
No Wikimedia photographs are used in these assets.

To rebuild from the running local stack:

```sh
node site/scripts/capture-product.mjs http://localhost:8088
node site/scripts/check-homepage.mjs
```

- `*.png`: full resolution, 2× originals (2880 pixels wide).
- `*-720.webp`, `*-1440.webp`, `*-2880.webp`: responsive delivery sizes.
- `*-mobile.webp`: close-up crops of the same UI for narrow screens.
- `campaign-*.svg`: editable source artwork, with PNG derivatives.

Calendar dates are fixed to November 2–8, 2026. Analytics are illustrative data,
not customer results. UI screenshots reflect the app version at the capture URL;
rebuild that app first when product components change.
