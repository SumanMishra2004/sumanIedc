# Authentication System Documentation

## Overview
This application implements a complete authentication system with role-based access control using NextAuth.js v5, Prisma, and PostgreSQL.

## Features

### Authentication Providers
1. **Google OAuth** - Sign in with Google accounts
2. **Microsoft OAuth** - Sign in with Microsoft/Azure AD accounts
3. **Credentials** - Email and password authentication

### Role-Based Access Control
Three user roles are supported:
- **STUDENT** (default role for new users)
- **TEACHER**
- **FACULTY** (admin role with special privileges)

### Special Users System
The `SpecialUser` model allows administrators to pre-assign roles to specific email addresses. When a user signs in:
1. The system checks if their email exists in the `SpecialUser` table
2. If found, the user is assigned the role specified in `SpecialUser`
3. If not found, the user receives the default `STUDENT` role

## Database Models

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials auth
  role          String    @default("STUDENT")
  accounts      Account[]
  sessions      Session[]
}
```

### SpecialUser Model
```prisma
model SpecialUser {
  id    String @id @default(cuid())
  email String @unique
  role  String @default("STUDENT")
}
```

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `MICROSOFT_CLIENT_ID` - From Azure Portal
- `MICROSOFT_CLIENT_SECRET` - From Azure Portal
- `MICROSOFT_TENANT_ID` - Usually "common" for multi-tenant

### 2. Install Dependencies
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 3. Database Migration
```bash
npx prisma migrate dev --name add-auth-system
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

## OAuth Provider Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Add redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Go to "Certificates & secrets" → Create new client secret
6. Copy Application (client) ID and secret to `.env`

## Usage

### Sign In
Users can sign in at `/auth/signin` using:
- Google account
- Microsoft account
- Email and password (after signing up)

### Sign Up (Credentials)
```typescript
// POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Managing Special Users (Faculty Only)

#### Add/Update Special User
```typescript
// POST /api/admin/special-users
{
  "email": "teacher@example.com",
  "role": "TEACHER"
}
```

#### Get All Special Users
```typescript
// GET /api/admin/special-users
```

#### Remove Special User
```typescript
// DELETE /api/admin/special-users
{
  "email": "teacher@example.com"
}
```

### Accessing Session in Components

#### Server Components
```typescript
import { auth } from '@/lib/auth'

export default async function ServerComponent() {
  const session = await auth()
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <img src={session.user.image} alt="Avatar" />
    </div>
  )
}
```

#### Client Components
```typescript
'use client'

import { useSession } from 'next-auth/react'

export default function ClientComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

### Sign Out
```typescript
import { signOut } from 'next-auth/react'

// In a client component
<button onClick={() => signOut()}>Sign Out</button>
```

## Route Protection

The middleware automatically protects routes:
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires FACULTY role

## Session Contents
The session object contains:
```typescript
{
  user: {
    id: string
    name: string
    email: string
    image: string
    role: string // "STUDENT" | "TEACHER" | "FACULTY"
  }
}
```

## Role Authorization Examples

### Conditional Rendering
```typescript
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {session?.user.role === 'FACULTY' && (
        <Link href="/admin">Admin Panel</Link>
      )}
      
      {(session?.user.role === 'TEACHER' || session?.user.role === 'FACULTY') && (
        <Link href="/manage-students">Manage Students</Link>
      )}
    </div>
  )
}
```

### API Route Protection
```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.user.role !== 'TEACHER' && session.user.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Your protected logic here
  return NextResponse.json({ data: 'Protected data' })
}
```

## Troubleshooting

### Common Issues

1. **"Adapter error" on sign in**
   - Ensure database is running
   - Check DATABASE_URL is correct
   - Run `npx prisma migrate dev`

2. **OAuth redirect error**
   - Verify redirect URIs in OAuth provider settings
   - Check NEXTAUTH_URL matches your app URL

3. **Role not updating**
   - Roles are checked on each sign-in
   - User must sign out and sign in again for role changes to take effect

## Security Notes

- Never commit `.env` file to version control
- Use strong, randomly generated `NEXTAUTH_SECRET`
- Enable HTTPS in production
- Implement rate limiting for signup/signin endpoints
- Regularly review special user permissions
- Use environment-specific OAuth credentials
