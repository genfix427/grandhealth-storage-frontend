# Grand Health Storage

Production-oriented React frontend for Grand Health Institute's private AWS file workspace. It integrates with the existing Cognito user pool, API Gateway, Lambda, and private S3 bucket; it does not create or replace any AWS infrastructure.

## What is included

- Cognito OAuth 2.0 Authorization Code Flow with PKCE through `oidc-client-ts`
- Session restoration, access-token expiry handling, protected routes, and Cognito group permissions
- Paginated file/folder listing with TanStack Query caching and abortable requests
- Grid and list views, breadcrumbs, loaded-result search, filters, sorting, and details panel
- Direct-to-S3 uploads using presigned URLs, exact `application/octet-stream` content type, progress, cancel, retry, and 100 MB validation
- Secure downloads based on backend-provided object keys and short-lived presigned URLs
- Fullscreen universal previews for images, PDF, DOC/DOCX, XLS/XLSX/CSV, text/code/JSON/Markdown, video, and audio
- Lazy preview renderer chunks, PDF page-at-a-time rendering, virtualized spreadsheet/code rows, keyboard navigation, zoom, rotation, and fullscreen controls
- Dashboard metrics explicitly scoped to currently loaded API results
- Admin, profile, settings, light/dark/system themes, skeletons, empty states, and responsive navigation
- Automated tests for permissions, validation, navigation, API errors, pagination, upload/download URL requests, OAuth callback detection, and route protection

## Requirements

- Node.js version compatible with Vite 8
- Existing AWS resources described in the project brief
- The real Cognito hosted UI domain for the `GrandHealthStorage` app client

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`.
3. Fill in `VITE_COGNITO_DOMAIN` with the real Cognito domain. Do not add a client secret, AWS access key, secret key, password, token, or S3 public URL.
4. Confirm the Cognito app client allows these development URLs:

   - Callback: `http://localhost:5173/`
   - Sign-out: `http://localhost:5173/`

5. Start the application:

   ```bash
   npm run dev
   ```

The current Cognito setup returns the authorization code to `/`. `AuthProvider` detects `code` and `state`, completes the callback, validates the OIDC state through the library, then removes OAuth parameters from browser history.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_APP_NAME` | Product display name |
| `VITE_AWS_REGION` | Cognito region (`us-east-2`) |
| `VITE_COGNITO_USER_POOL_ID` | Existing user pool ID |
| `VITE_COGNITO_CLIENT_ID` | Public app client ID; no client secret |
| `VITE_COGNITO_SCOPES` | OAuth scopes enabled on the app client; defaults to `openid email` |
| `VITE_COGNITO_DOMAIN` | Real Cognito managed-login domain; intentionally blank in the example |
| `VITE_COGNITO_REDIRECT_URI` | Registered OAuth callback URI |
| `VITE_COGNITO_LOGOUT_URI` | Registered post-logout URI |
| `VITE_API_BASE_URL` | Existing HTTP API Gateway base URL |
| `VITE_GOOGLE_WORKSPACE_ENABLED` | Optional UI gate; requires a separately deployed Google OAuth backend and Google file metadata |

Vite exposes `VITE_*` values to the browser. Never place secrets in these variables.

## Authentication and session security

The app uses the Cognito **access token** for `Authorization: Bearer ...` API calls. The ID token is used only for identity display and group claims. OIDC state, PKCE verifier, and the resulting user session use browser `sessionStorage`, never `localStorage`; this limits persistence to the current tab/session but does not make browser-readable tokens immune to an XSS compromise.

For stronger production isolation, add a backend-for-frontend that stores the session in `Secure`, `HttpOnly`, `SameSite` cookies and proxies authorized API requests. That enhancement requires backend work and is intentionally not simulated here.

Frontend role checks improve the interface only. API Gateway/Lambda must continue enforcing every authorization decision, especially destructive file and folder deletion.

## API contract

Only these existing endpoints are called:

- `GET /files?folder=&cursor=`
- `POST /files/upload-url`
- `POST /files/download-url`
- `DELETE /files` with `{ "key": "..." }` (Admin only)
- `DELETE /folders` with `{ "folder": "..." }` (Admin only)

The preview system deliberately reuses `POST /files/download-url`. It requests a fresh URL each time a preview opens, cancels stale requests when the user closes or changes files, and never stores or logs the signed URL. A separate `/files/preview-url` route is not required for the working browser renderers.

The frontend never sends file bytes through API Gateway. It requests an upload URL and then performs an S3 `PUT` without the Cognito authorization header. Download URLs are used immediately and are not persisted.

Folder query values are relative to the `company/` root. S3 keys returned by the API are preserved exactly for downloads.

Folder creation uses the same authorized upload flow: the frontend stores a small `.folder` marker inside the requested prefix, then hides that reserved marker from file lists and dashboard totals. This allows empty S3 prefixes to remain visible without making the bucket public or requiring a separate API route. The backend must permit the reserved marker filename and safe folder names containing spaces.

Upload names may contain spaces and common punctuation. The client rejects control characters and `\\ / : * ? " < > |` so a filename cannot alter the object path or cause common cross-platform filename problems. The Lambda must validate the same boundary instead of restricting names to ASCII letters and underscores.

## Commands

```bash
npm run dev      # local development
npm run lint     # Oxlint
npm test         # Vitest suite
npm run build    # production bundle
npm run preview  # serve the production bundle locally
```

## Deployment checklist

- Add the exact production callback and logout URLs to the Cognito app client.
- Set the production `VITE_COGNITO_DOMAIN`, redirect/logout URIs, and API base URL in the deployment environment.
- Serve only over HTTPS.
- Configure a restrictive Content Security Policy at the hosting layer, including only the Cognito domain, API Gateway host, and required presigned S3 origins.
- Confirm API Gateway CORS allows the production origin plus `GET`, `POST`, `DELETE`, and `OPTIONS` with the `Authorization` and `Content-Type` headers.
- Confirm S3 CORS permits presigned `PUT` uploads from the production origin with `Content-Type: application/octet-stream`.
- Confirm S3 CORS permits private preview `GET`, `HEAD`, and range requests from the production origin.
- Re-run `npm run lint`, `npm test`, and `npm run build` in CI.

## Current backend limitations

The interface intentionally does not fabricate unsupported functions. These require real, authorized backend endpoints:

- Rename or move files and folders
- External sharing and version history
- Global/server-side search
- Admin user or Cognito group management
- Storage analytics and audit logs
- Multipart uploads and files larger than 100 MB

## Future backend enhancements

1. Add a backend-for-frontend for HttpOnly-cookie sessions.
2. Add server-side search, storage summary metrics, and an auditable activity feed.
3. Add multipart upload endpoints for large files with resume support.
4. Add separately authorized endpoints for rename, move, and user administration.
5. Add an organization-controlled document conversion pipeline for PPT/PPTX and pixel-identical legacy DOC previews.

## Universal file previews

### Fully working with the existing API

| Format | Renderer and behavior |
| --- | --- |
| JPG, JPEG, PNG, WEBP, GIF, BMP, SVG | Native image element with fit, original size, zoom, rotation, pan/scroll, fullscreen, and previous/next navigation. SVG is loaded as an image resource; raw SVG markup is never injected. |
| PDF | `react-pdf`/PDF.js with one page rendered at a time, selectable text, page navigation, current-page search, zoom, fit controls, and a Vite-compatible worker. |
| DOCX | `docx-preview` rendered in a detached DOM, altChunk rendering disabled, generated markup sanitized with DOMPurify, and then inserted into the viewer. |
| Legacy DOC | `@file-viewer/doc` parses Word 97–2003 OLE files locally, sanitizes generated markup, and blocks external links/resources. ZIP-based DOCX files with a `.doc` extension are detected and rendered through the DOCX path. |
| XLSX, XLS, CSV | SheetJS read-only parsing with worksheet tabs, row/column headers, formatted display values, search, and virtualized rows. Formulas, macros, and external links are not executed. |
| TXT, JSON, XML, MD, LOG, JS/JSX, TS/TSX, CSS, HTML, SQL, PY, JAVA, YAML and similar text | UTF-8 read-only viewer with line numbers, virtualized rows, syntax highlighting, search, wrap toggle, and copy. JSON is formatted when valid. Markdown uses safe React rendering, skips raw HTML, and does not load embedded remote images. |
| MP4, WEBM, OGV | Native streaming video with metadata preloading, seek, volume, fullscreen, and speed selection. Codec support still depends on the browser. |
| MP3, WAV, OGG/OGA, M4A, AAC, FLAC | Native audio with seek, volume, duration, and speed selection where the browser supports the codec. |

Double-clicking a grid card or list row opens preview. Single click still selects the file. Preview is also available in each file actions menu and the details panel. While the viewer is open, `Escape` closes it, left/right move through the current visible file collection, and plus/minus change zoom where applicable. Keyboard navigation ignores text inputs and native media controls.

Client-side parsing limits are intentionally conservative:

- Text/code: 5 MB
- XLS/XLSX/CSV: 25 MB
- DOCX: 50 MB
- Legacy DOC: 50 MB

Images, video, and audio use the signed URL directly instead of loading the complete file into JavaScript memory. PDFs are page-at-a-time. Files above a parser limit remain downloadable.

### Backend-dependent formats and limitations

- **PPT/PPTX:** needs a trusted conversion worker that produces PDF or slide images. Do not send private S3 documents to public Office/Google viewers. A production design should enqueue a conversion job, run LibreOffice or another pinned converter in an organization-controlled container runtime, write derived previews to a private preview prefix, and return a short-lived URL through an authorized API.
- **Legacy DOC limitations:** browser preview is best-effort for Word 97–2003 files. Password-protected, damaged, very old Word 6/95, and unusually complex documents may still require downloading and opening in Microsoft Word. For pixel-identical pagination, use an organization-controlled conversion worker rather than a public document viewer.
- **Google Docs, Sheets, and Slides:** needs separate Google OAuth endpoints, read-only Google Drive scopes, server-side encrypted refresh-token storage, an explicit Cognito-to-Google account link, and Google file metadata in the listing response. The optional UI never reuses Cognito tokens or stores Google tokens in browser storage.

### Required S3 CORS

Apply CORS to the bucket actually configured on `grandhealth-storage-api`. The original application configuration referenced `grandhealthinstitute`, while the later preview brief referenced `grandhealthinstitute01`; the frontend intentionally hardcodes neither value. Verify the Lambda environment before applying this configuration.

Replace the production example origin with the exact deployed HTTPS origin:

```json
[
  {
    "AllowedHeaders": [
      "Content-Type",
      "Range"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT"
    ],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://storage.example.com"
    ],
    "ExposeHeaders": [
      "Accept-Ranges",
      "Content-Length",
      "Content-Range",
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

In the AWS Console: open S3, select the private bucket, choose **Permissions**, edit **Cross-origin resource sharing (CORS)**, paste the reviewed configuration, replace the example production origin, and save. Do not use `*` as a production origin. Keep the bucket's public-access block enabled.

### Required Lambda IAM

Preview reuses `GetObject`, so no new object permission is required when downloads already work. The Lambda execution role needs the bucket-level and object-level permissions below, using the bucket that is actually configured:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR_BUCKET",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["company", "company/*"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/company/*"
    }
  ]
}
```

The Lambda must continue validating keys, Cognito groups, and resource ownership before signing a URL. A `company/` prefix check alone is not a complete authorization boundary. If objects use a customer-managed KMS key, add only the corresponding KMS permissions required by the operation and key policy.

### Security and operational notes

- Signed URLs expire and are bearer credentials. They are kept in component memory only and are discarded on close.
- Closing the viewer or changing files aborts pending API and content fetches.
- HTML and uploaded JavaScript are displayed as inert code and never executed.
- Spreadsheet formulas and macros are not evaluated.
- Remote images in Markdown are omitted to avoid unintended third-party requests.
- If a preview fails with a CORS message, verify `GET`/`HEAD`, the exact frontend origin, and response headers on the S3 bucket.

Do not expose the S3 bucket publicly or add AWS credentials to the browser to implement any future feature.
