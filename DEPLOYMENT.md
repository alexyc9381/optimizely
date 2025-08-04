# 🚀 Universal AI Analytics - Deployment Guide

## 🎯 **Quick Deploy Options for MVP**

Your project is deployment-ready with **enterprise-grade infrastructure**. Choose your deployment strategy:

---

## **Option 1: Railway (Recommended for MVP)** ⭐
**One-click deployment with full Docker support**

### 1. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

**What Railway provides:**
- ✅ PostgreSQL database (automatic)
- ✅ Redis cache (automatic)
- ✅ Environment variables management
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Monitoring & logs
- ✅ $5/month startup tier

---

## **Option 2: Vercel + Supabase (Serverless MVP)**
**Ultra-fast deployment with built-in auth**

### 1. Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXTAUTH_SECRET
```

### 2. Set up Supabase for Backend
```bash
# Create account at https://supabase.com
# Create new project
# Copy connection strings
```

### 3. Deploy API to Railway/Render
```bash
# Backend API deployment (same as Option 1)
railway up
```

---

## **Option 3: DigitalOcean App Platform**
**Professional hosting with managed services**

### 1. Create app.yaml
```yaml
name: universal-ai-analytics
services:
- name: web
  source_dir: apps/web
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

- name: api
  source_dir: apps/api
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: postgres
  engine: PG
  production: false
```

---

## **🔒 Adding Authentication (Choose One)**

### **Quick Auth: Auth0**
```bash
# Install Auth0
npm install @auth0/nextjs-auth0

# Add to apps/web/pages/api/auth/[...auth0].js
import { handleAuth } from '@auth0/nextjs-auth0';
export default handleAuth();
```

### **Self-hosted: NextAuth**
```bash
# Install NextAuth
npm install next-auth

# Add to apps/web/pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ]
})
```

---

## **📋 Environment Variables Setup**

### Required for Production:
```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/database
REDIS_URL=redis://username:password@host:6379

# API
API_PORT=4000
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-session-secret

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Optional: Auth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## **🚀 One-Command Deployment Scripts**

### Railway Deployment
```bash
# Your existing script
npm run deploy:production
```

### Manual Docker Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d --build

# Check health
curl https://your-domain.com/health
```

---

## **📊 What You Get After Deployment**

### Frontend URLs:
- **Dashboard**: `https://your-domain.com`
- **Analytics**: `https://your-domain.com/analytics`
- **A/B Testing**: `https://your-domain.com/ab-testing`

### API Endpoints:
- **Health**: `https://api.your-domain.com/health`
- **Events**: `https://api.your-domain.com/api/v1/events`
- **Analytics**: `https://api.your-domain.com/api/v1/analytics/data`
- **GraphQL**: `https://api.your-domain.com/api/v1/graphql`

### Integration Script:
```html
<!-- Add to any website -->
<script src="https://api.your-domain.com/api/v1/tracking/tracker.min.js"></script>
<script>
  UniversalAI.init({
    apiEndpoint: 'https://api.your-domain.com/api/v1',
    siteId: 'your-website-id'
  });
</script>
```

---

## **🎯 MVP Recommendation**

**Start with Railway for fastest deployment:**

1. **Deploy in 5 minutes**: `railway up`
2. **Add auth later**: Auth0 integration
3. **Scale when needed**: Move to DigitalOcean/AWS

**Cost**: ~$10-20/month for MVP traffic

---

## **🔧 Need Help?**

**Quick Deploy Railway:**
```bash
git push railway main
```

**Check Status:**
```bash
railway status
railway logs
```

**Add Domain:**
```bash
railway domain
```

Your infrastructure is **production-ready**! 🚀
