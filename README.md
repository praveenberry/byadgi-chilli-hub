# BYADGI CHILLI HUB

Next.js application migration of the approved BYADGI CHILLI HUB visual frontend.

## Status

The catalogue, prices and brands are explicitly **demo data only**. No real suppliers, payments, authentication, GST invoices, shipping services or database records are connected yet.

## Local setup

1. Copy `.env.example` to `.env` and provide a local PostgreSQL `DATABASE_URL` when ready to begin the database phase.
2. Install dependencies: `npm install`.
3. Start development: `npm run dev`.
4. Visit `http://localhost:3000`.

## Database readiness

`prisma/schema.prisma` contains the production domain model. Pack sizes are a separate `PackSize` model and variants relate to it rather than storing fixed sizes in application code. The current `src/lib/products.ts` is temporary demo UI data that should be replaced with Prisma catalogue reads after migrations and supplier approval.

## Deliberately deferred integrations

- Retailer authentication and registration
- Special retailer pricing
- Payment gateway
- GST invoices
- Shipping API
- Persistent carts, orders and quotations
