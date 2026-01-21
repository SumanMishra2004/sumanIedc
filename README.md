# Web Application

A modern web application built with Next.js 15, featuring authentication, role-based access control, and a responsive dashboard.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Authentication:** NextAuth.js v5
- **Database:** CockroachDB with Prisma ORM
- **UI:** React, TailwindCSS, shadcn/ui
- **TypeScript:** Full type safety

## Features

- 🔐 **Authentication System**
  - Google OAuth
  - Microsoft OAuth
  - Email/Password credentials
  
- 👥 **Role-Based Access Control**
  - Three user roles: STUDENT, ADMIN, FACULTY
  - Special users system for pre-assigning roles
  - Protected routes and API endpoints

- 📊 **Dashboard**
  - Interactive charts and visualizations
  - Book chapters management
  - Admin panel for special users

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Database connection string (CockroachDB)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your database URL and auth provider credentials

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma db push
```

6. Start the development server:

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                  # Next.js app router pages
├── components/           # React components
├── lib/                  # Utility functions & configs
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions

prisma/
└── schema.prisma        # Database schema
```

## Database Schema

The application uses Prisma with the following main models:
- **User** - User accounts with role-based access
- **SpecialUser** - Pre-configured roles for specific emails
- **Account** - OAuth account connections
- **Session** - User sessions
- **VerificationToken** - Email verification tokens

## Development

To view your database:
```bash
npx prisma studio
```

To update the database schema:
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` or `npx prisma migrate dev`

## License

MIT
