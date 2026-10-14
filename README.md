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

## Installation

Use Chrome 102 or later, or a compatible Chromium-based Edge version. No build step or Node.js installation is required to load the extension.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode** and select **Load unpacked**.
4. Select the project directory containing `manifest.json`.
5. Pin Session Port to the toolbar.

After changing extension files, reload the extension from the extensions page and refresh any open configuration page.

## Usage

1. Click the toolbar icon and choose **配置站点** (Configure sites) at the bottom.
2. Add a site name and a complete URL, such as `https://example.com/dashboard`.
3. Use the three data tabs to add or remove rows, then save the site.
4. Click the site's entry in the toolbar menu and approve host access if prompted.

The current interface is in Simplified Chinese.

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
