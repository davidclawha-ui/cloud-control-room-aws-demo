# Cloud Control Room (AWS Demo)

A polished, single-page **Next.js + TypeScript + Tailwind** playground that simulates an AWS architecture under changing traffic, data growth, and failure conditions.

## What was built

- Interactive **Cloud Control Room** dashboard with:
  - Concurrent users slider
  - Data volume slider (TB)
  - Resilience mode switch (`cost`, `balanced`, `maximum`)
  - Failure simulation (`healthy`, `AZ loss`, `region loss`)
- Preset scenario buttons:
  - **Normal Day**
  - **Traffic Spike**
  - **Region Failure**
- Live architecture visualization:
  - Two-region card layout
  - Active/standby routing state
  - Failover status indicator
  - Animated EKS pod dots showing dynamic scaling/degradation
  - Request flow bar that reacts to traffic/failure
- Compact metrics panel (simulated):
  - Latency (p95)
  - Monthly cost
  - Availability
- Smooth transitions and responsive layout for desktop/tablet/mobile

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4

## Run locally

```bash
cd cloud-control-room-aws
npm install
npm run dev
```

Open `http://localhost:3000`.

Production build check:

```bash
npm run build
npm run start
```

## AWS icon source / attribution

This demo uses **official AWS Architecture Icons** (SVG files), downloaded from AWS’s official architecture icons page and package:

- AWS Architecture Icons page: https://aws.amazon.com/architecture/icons/
- Icon package used in this project: `Icon-package_01302026...zip` (official `d1.awsstatic.com` download linked from the AWS page)

Icons included in `public/aws-icons/` are unmodified AWS service icons used for demonstrative architecture visualization.

AWS and related marks are trademarks of Amazon.com, Inc. or its affiliates. Please follow AWS branding/trademark usage guidance when reusing these assets.

## Project structure

- `src/app/page.tsx` — complete interactive Cloud Control Room UI and simulation logic
- `public/aws-icons/` — selected official AWS architecture SVG icons used by the UI
- `assets/aws-icons/` — extracted source icon package (reference assets)
