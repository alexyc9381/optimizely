# 🚀 Railway Environment Variables Setup

## Required Environment Variables for Production

Add these in your Railway project settings under "Variables":

### Database & Cache (Auto-provided by Railway)
```
DATABASE_URL=<Railway PostgreSQL URL - auto-generated>
REDIS_URL=<Railway Redis URL - auto-generated>
```

### API Configuration
```
NODE_ENV=production
API_PORT=4000
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

### Security (Generate secure values)
```
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters-long
SESSION_SECRET=your-session-secret-min-32-characters-long
NEXTAUTH_SECRET=your-nextauth-secret-min-32-characters-long
NEXTAUTH_URL=https://your-frontend-domain.railway.app
```

### OAuth Providers (Get from Google/GitHub)
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## How to Add Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Click "Add Variable"
5. Add each variable above

## OAuth Setup:

### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.railway.app/api/auth/callback/google`

### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://your-domain.railway.app/api/auth/callback/github`
