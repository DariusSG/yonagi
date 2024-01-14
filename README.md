## TL;DR

-   RADIUS server for small-scale wireless networks
-   Based on [FreeRADIUS](https://github.com/FreeRADIUS/freeradius-server)
-   Has a web dashboard for configs and PKI
-   Supports Aruba/Cisco MPSK and EAP-TLS authentication methods
-   ~~Supports for EAP-GTC and EAP-MSCHAPv2~~ in the future

## Getting Started

### Prepare

-   Clone this repository (recommended), or download the `docker-compose.yml` and create `data` directory
-   (Optional) Modify `docker-compose.yml` to use `master` branch instead of `latest` tag
-   Run `docker compose up -d` (Docker and Docker Compose plugin required)

### Configure

-   Open `http://localhost:3000` on your browser

    -   Configure your NAS clients (e.g. Aruba Mobility Controllers or Aruba Instant APs)
    -   (Optional) Configure MPSKs for WPA-Personal SSID/devices
    -   (Optional) Initialize PKI and generate certificates for EAP-TLS (WPA-Enterprise)
    -   (Optional) Download client certificates from PKI dashboard to your devices

-   Restart by using the reload button on the top-right corner, to apply changes of your NAS clients/~~MPSKs~~/PKI

## Project Structure

-   `/common` - Shared Libraries: Serializers and Typings on [io-ts](https://github.com/gcanti/io-ts)
    -   `/api` - specific for APIs between `@yonagi/supervisor` and `@yonagi/web`
-   `/supervisor` - The Radiusd Supervisor/Daemon on [NestJS](https://github.com/nestjs/nest)
    -   `/api` - API Controllers: Logic and Sanitization
    -   `/pki` - PKI: CA and Certificate Management on _PKI.js_
    -   `/configs` - Radiusd Config Generation
    -   `/radiusd` - Radiusd Process Management
-   `/web` - The Web Frontend on [next.js](https://github.com/vercel/next.js)
    -   `/app` - React pages with some shiny server components
    -   `/lib` - Shared libraries for all pages

## Roadmap

-   Supervisor
    -   [ ] API Server
        -   [x] Client (NAS) CRUD
        -   [x] MPSK CRUD
        -   [ ] Password/Certificate-based User CRUD
        -   [x] PKI CRUD
        -   [x] Radiusd Log/Status
        -   [x] Radiusd Reload
    -   [ ] Configuration Generator/Renderer
        -   [x] Aruba/Cisco Multi Pre-Shared Key
        -   [ ] EAP-GTC/MSCHAPv2
        -   [x] EAP-TLS
    -   [ ] PKI
        -   [ ] Certificate Authority
            -   [x] Self-Signed CA
            -   [ ] Existing CA/intermediate import
            -   [x] Certificate Issue
            -   [x] CA/Server/Client CRUD
        -   [x] Deployment
            -   [x] Client Certificate Export (PKCS#12 with trust chain)
            -   [x] CA/Server/Client Deployment to Radiusd
    -   [ ] Radiusd
        -   [x] Child Process Management
    -   [ ] Storage
        -   [x] File/JSON-based Storage
        -   [ ] PostgreSQL-backed Storage
-   Web Portal
    -   [ ] MPSK Authentication Dashboard
        -   [x] CRUD: Name/Phy Address/PSK
    -   [ ] Password/Certificate-based Authentication Dashboard
    -   [ ] PKI Dashboard
        -   [x] CA/Server/Client Certificate Issue and Delete
        -   [x] Client Certificate Export (PKCS#12 with trust chain)
            -   [ ] PKCS#12 Export Password Input
    -   [ ] NAS Client Dashboard
        -   [x] CRUD: Name/Allowed Subnet/Secret
    -   [x] Radiusd Dashboard
        -   [x] Log Inspection
        -   [x] Regenerate/Reload

## Backlogs

-   Supervisor
    -   API Server
        -   [ ] Standardize API request/responses with mandatory typed responses
            -   [x] Return types should be strongly typed (e.g. /api/v1/clients should return `ListClientResponse` instead of `Record<Name, Client>`)
            -   [ ] Request types should be also strongly typed
            -   [x] Decorators on API methods to signal io-ts codecs for encoding (e.g. encoding `ReadonlyMap<>` into `Record<>` to accommodate `JSON.stringify`)
    -   Storage
        -   [ ] Move storage-related code from `@yonagi/common` to `@yonagi/supervisor`
-   Web
    -   [x] Migrate away from Fluent UI to candidates:
        -   ~~Base UI~~
        -   **MUI** (migrated)

## Dependencies

-   [fp-ts](https://github.com/gcanti/fp-ts/)/[io-ts](https://github.com/gcanti/io-ts/): Functional Programming and Type-Safe Serialization/Vaidation
-   [NestJS](https://github.com/nestjs/nest): Dependency Injection and API Server
-   [next.js](https://github.com/vercel/next.js): The React Frontend
-   [PKI.js](https://github.com/PeculiarVentures/PKI.js): X.509 Certificate and PKCS #12 Support

## License

MIT
