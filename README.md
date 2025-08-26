# GHL API Proxy Server

En Next.js API proxy server til sikker integration med GoHighLevel API.

## Features

- **Sikker API proxy** - Beskytter API keys fra frontend eksponering
- **CORS support** - Tillader cross-origin requests fra frontend apps
- **Auto-discovery** - Understøtter locations og calendars discovery
- **Metrics tracking** - Sporer beskeder, samtaler og møder
- **TypeScript** - Fuldt typesikret implementation

## API Endpoints

### `/api/ghl/locations`
- **Method:** GET
- **Headers:** `x-api-key: [GHL_API_KEY]`
- **Response:** Liste af tilgængelige locations

### `/api/ghl/calendars`
- **Method:** GET
- **Headers:** `x-api-key: [GHL_API_KEY]`
- **Query:** `locationId=[LOCATION_ID]`
- **Response:** Liste af kalendere for valgt location

### `/api/ghl/appointments`
- **Method:** GET
- **Headers:** `x-api-key: [GHL_API_KEY]`
- **Query:** `from=YYYY-MM-DD&to=YYYY-MM-DD&calendarId=[CALENDAR_ID]`
- **Response:** Antal møder og daglig breakdown

### `/api/ghl/ai-metrics`
- **Method:** GET
- **Headers:** `x-api-key: [GHL_API_KEY]`
- **Query:** `from=YYYY-MM-DD&to=YYYY-MM-DD&locationId=[LOCATION_ID]`
- **Response:** Besked statistikker og KPI'er

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to test the API endpoints.

## Deployment

Denne proxy er designet til at blive deployed på Vercel:

```bash
npm run build
vercel --prod
```

## Miljøvariabler

- `GHL_API_VERSION` - GoHighLevel API version (default: "2021-07-28")

## Brug med Frontend

Sæt proxy URL'en i din frontend app:
```
https://[PROXY_URL]/api/ghl
```
