# Session Port — Developer Session Toolkit

English | [简体中文](README.zh-CN.md)

![Session Port icon](icons/icon-128.png)

A Chrome / Edge extension for preparing development sessions. Configure a site's cookies, localStorage, and sessionStorage, then open it in a new tab from the toolbar menu.

The icon combines an internet-inspired letter **e** with a pipe, representing an experienced developer who knows their way around the web.

## Features

- Save multiple sites with a name and an HTTP or HTTPS URL.
- Switch between Cookie, localStorage, and sessionStorage tabs to edit data row by row.
- Configure cookie name, value, domain, path, expiration time, and HttpOnly.
- Edit storage keys and values in separate columns, including empty or multiline values.
- Set cookies before opening a tab, then initialize web storage before loading the target page.
- Request access to each site's host when it is first opened.
- English and Simplified Chinese UI, selected automatically from the browser's interface language. Other languages fall back to English.

## Installation

Use Chrome 102 or later, or a compatible Chromium-based Edge version. No build step or Node.js installation is required to load the extension.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode** and select **Load unpacked**.
4. Select the project directory containing `manifest.json`.
5. Pin Session Port to the toolbar.

After changing extension files, reload the extension from the extensions page and refresh any open configuration page.

## Usage

1. Click the toolbar icon and choose **Configure sites** at the bottom.
2. Add a site name and a complete URL, such as `https://example.com/dashboard`.
3. Use the three data tabs to add or remove rows, then save the site.
4. Click the site's entry in the toolbar menu and approve host access if prompted.

The extension name, interface, field descriptions, confirmations, and error messages follow the browser's interface language. After changing that language, restart the browser if prompted and reopen the extension pages.

### Cookie settings

| Field | Behavior |
| --- | --- |
| Name / Value | The cookie's name and string value. The value may be empty. |
| Domain | Leave blank for a cookie scoped to the site's host. A custom domain must match the host or a parent domain. |
| Path | Defaults to `/`. Must start with `/`. |
| Expiration | Enter a date and time in your computer's local time zone. Leave blank for a session cookie. |
| HttpOnly | Prevents the cookie from being read through page JavaScript. |

Cookies for HTTPS URLs are marked Secure automatically. Existing configurations without the additional cookie fields use the defaults.

### Storage scope and privacy

- Cookies and localStorage use the browser's normal site storage and are shared with other tabs for the same site. Site configurations do not create isolated browser profiles.
- sessionStorage is initialized in the newly opened tab.
- Only configured keys are written; other stored data is retained.
- Settings stay in this browser's extension storage and are not synced through the browser account. They are not additionally encrypted.
- Access applies to the configured host. A redirect to a different host does not automatically authorize or initialize that host.

## Packaging and distribution

On Windows, generate a clean release directory and ZIP:

```sh
npm run package
```

For version `1.0.0`, the outputs are `dist/session-port-1.0.0/` and `dist/session-port-1.0.0.zip`. The ZIP contains `manifest.json` at its root and includes the extension's runtime files, icons, both translations, and license. Development dependencies, tests, screenshots, and signing keys are excluded.

- **Developer installation:** Share the ZIP, extract it, then use **Load unpacked** on `edge://extensions` or `chrome://extensions` to select the extracted folder.
- **Edge Add-ons distribution:** Upload the ZIP through Microsoft Partner Center. The store publishing process produces the installable CRX; users install from the store after approval. See [Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension).
- **Self-hosted enterprise CRX:** Use Edge's **Pack extension** command on the clean release directory. Keep the resulting PEM key private and reuse it for updates. Installation requires an appropriate enterprise deployment setup; see [Self-host Microsoft Edge extensions](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-manage-extensions-webstore).

### `CRX_REQUIRED_PROOF_MISSING`

This error means the installation verifier did not find a required signature proof. A locally packed CRX has a developer signature, which does not necessarily satisfy an installation path that requires a trusted publisher proof. Repacking it or changing the manifest does not provide that proof.

For local testing, use **Load unpacked** on `edge://extensions` with Developer mode enabled, and select the clean release directory. Dragging a self-packed CRX onto the extensions page may install it in some Edge configurations, but successful installation does not guarantee it can be enabled. For ordinary user distribution, publish through Edge Add-ons; for managed enterprise deployment, follow the self-hosting requirements. See [Edge extension hosting](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/hosting-and-updating) and the [Chromium CRX verifier](https://chromium.googlesource.com/chromium/src/+/HEAD/components/crx_file/crx_verifier.h).

### Installed CRX is disabled as an unknown source

If Edge reports “This extension is not from any known source and may have been added without your knowledge” and will not let you enable it, the packed extension is being blocked by the browser's source checks. Repacking or changing `manifest.json` does not grant store trust.

For development, open `edge://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/session-port-1.0.0/` (or the current version's release directory). See [Microsoft's local installation instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading). If Developer mode or unpacked loading is unavailable on a managed device, check `edge://policy` and contact the administrator responsible for its extension policies.

## Development

The extension uses Manifest V3 and plain HTML, CSS, and JavaScript.

Run the local checks with Node.js:

```sh
npm test
```

These checks cover input validation, cookie parameters, launch ordering, and storage initialization using mocked browser APIs.

To regenerate the shipped PNG icons from `icons/icon.svg`:

```sh
npm install
npm run icons
```

This produces 16, 32, 48, and 128 pixel PNGs with transparency. Commit the PNGs together with SVG changes because the extension loads them directly.

## License

[Apache License 2.0](LICENSE).
