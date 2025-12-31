# Backend Setup Guide

## Database Setup (Vercel Postgres)

1. **Create Vercel Postgres Database**:
   ```bash
   # In Vercel dashboard:
   # - Go to your project
   # - Navigate to Storage tab
   # - Create a new Postgres database
   ```

2. **Initialize Database Schema**:
   ```bash
   # Connect to your Vercel Postgres instance
   # Run the schema.sql file
   psql $POSTGRES_URL < db/schema.sql
   ```

   Or use the Vercel dashboard:
   - Go to Storage → Your Database → Query
   - Copy and paste contents of `db/schema.sql`
   - Execute the query

## Environment Variables

1. **Set up environment variables in Vercel**:
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `JWT_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)
   - Database variables are auto-configured by Vercel Postgres

2. **For local development**:
   ```bash
   cp .env.example .env
   # Edit .env and add your values
   ```

## Install Dependencies

```bash
npm install
```

## API Endpoints

The backend provides the following endpoints:

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user (requires Bearer token)

## Security Notes

1. **JWT_SECRET**: Must be a strong random string in production
2. **HTTPS**: Always use HTTPS in production (Vercel provides this automatically)
3. **Password Requirements**: Minimum 8 characters (enforced in both frontend and backend)
4. **Rate Limiting**: Consider adding rate limiting in production
5. **Email Service**: Currently returns reset token in response for demo. In production, integrate an email service (SendGrid, AWS SES, etc.)

## Testing the Backend

After deployment:

1. **Create an account**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

2. **Sign in**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

3. **Get user info** (replace TOKEN with the token from login):
   ```bash
   curl https://your-domain.vercel.app/api/auth/me \
     -H "Authorization: Bearer TOKEN"
   ```

## Next Steps

1. Set up email service for password resets
2. Add rate limiting to prevent abuse
3. Implement email verification for new accounts
4. Add OAuth providers (Google, Discord, etc.)
5. Implement billing integration for tier upgrades
