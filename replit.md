# replit.md

## Overview

This is a **QR Code Visitor Management System** (Sistem Keluar Masuk) built for tracking visitor entry and exit. The application allows users to:

- Add visitor data (number, name, address) and generate QR codes
- View and filter visitor lists by status (entered/exited)
- Scan QR codes to mark visitors as exited
- Export visitor data to PDF/Excel and import from Excel files

The system is designed for use cases like office buildings, events, or facilities that need to track visitor flow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with separate client configuration
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter (lightweight React router)
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **UI Components**: Custom components with Lucide React icons

The frontend uses a tab-based navigation pattern with four main sections: Add Data, Visitor List, QR Scanner, and Export.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Runtime**: Node.js with tsx for development
- **Architecture Pattern**: Simple storage abstraction layer separating routes from database operations

The server runs on port 3001 and proxies API requests from the Vite dev server running on port 5000.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Validation**: Zod schemas generated from Drizzle schema using drizzle-zod

Single table design with `entries` table containing: id (UUID), number, name, address, entry_time, exit_time, status, created_at.

### Key Design Decisions

1. **Monorepo Structure**: Client and server code in same repository with shared schema definitions in `/shared` directory. This ensures type safety across the full stack.

2. **Shared Schema**: The `/shared/schema.ts` file defines both database schema and TypeScript types, used by both frontend and backend for consistent data contracts.

3. **Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations, making it easier to swap implementations if needed.

4. **QR Code Strategy**: QR codes are generated client-side using qrcode.react and contain visitor entry IDs. Scanning validates against the database to prevent duplicate exits.

5. **Export Capabilities**: Client-side PDF generation with jsPDF/jspdf-autotable and Excel handling with xlsx library for offline-capable exports.

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database abstraction with `drizzle-kit push` for schema migrations

### Frontend Libraries
- **html5-qrcode**: Camera-based QR code scanning
- **qrcode.react**: QR code generation as SVG
- **jsPDF + jspdf-autotable**: PDF document generation
- **xlsx**: Excel file import/export

### Development Tools
- **concurrently**: Runs frontend and backend dev servers simultaneously
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production bundling for server code