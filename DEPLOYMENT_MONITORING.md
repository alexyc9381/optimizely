# 📊 Deployment Monitoring & Testing Guide

## 🎯 **How to Check Your Deployment Status**

### **1. Railway Dashboard Monitoring**

**Go to: [railway.app/project/your-project](https://railway.app)**

**✅ What to Check:**
- **Build Status**: Green = Success, Red = Failed
- **Deployment Status**: "Active" means live
- **Logs**: Real-time logs for troubleshooting
- **Metrics**: CPU, Memory, Network usage
- **Custom Domain**: Your live website URL

### **2. Live URL Testing**

Once deployed, your app will be available at:
```
https://your-project-name.railway.app
```

**✅ Test These URLs:**
- `https://your-domain.railway.app` - Frontend dashboard
- `https://your-domain.railway.app/api/health` - API health check
- `https://your-domain.railway.app/api/v1/docs` - API documentation
- `https://your-domain.railway.app/auth/signin` - Authentication

### **3. Website Integration Testing**

**Test the tracking script on any website:**

```html
<!-- Add to your test website's <head> -->
<script src="https://your-domain.railway.app/api/v1/tracking/tracker.min.js"></script>
<script>
  UniversalAI.init({
    apiEndpoint: 'https://your-domain.railway.app/api/v1',
    siteId: 'your-test-site',
    trackPageViews: true,
    trackClicks: true,
    trackForms: true
  });
</script>
```

### **4. Performance Monitoring**

**Check these in Railway dashboard:**
- **Response Times**: Should be < 500ms
- **Error Rate**: Should be < 1%
- **Uptime**: Should be > 99%
- **Database Performance**: Query times
- **Redis Cache**: Hit rate

---

## 🛠️ **Troubleshooting Common Issues**

### **Build Failures**
- Check Railway logs for error messages
- Verify all environment variables are set
- Ensure Dockerfile is configured correctly

### **Database Issues**
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Review database migration logs

### **Authentication Problems**
- Verify OAuth app settings (Google/GitHub)
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

### **API Connection Issues**
- Verify CORS_ORIGIN includes your frontend domain
- Check API_PORT is set to 4000
- Test health endpoint directly

---

## 🌐 **Custom Domain Setup (Optional)**

### **1. In Railway Dashboard:**
- Go to your service settings
- Click "Domains" tab
- Click "Add Domain"
- Enter your custom domain (e.g., analytics.yourcompany.com)

### **2. In Your DNS Provider:**
Add CNAME record:
```
analytics.yourcompany.com → your-project.railway.app
```

### **3. SSL Certificate:**
Railway automatically provides SSL certificates for custom domains.

---

## 📱 **Mobile & Cross-Browser Testing**

**Test your deployed app on:**
- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Firefox
- ✅ Edge

**Key features to test:**
- Dashboard loads correctly
- Charts render properly
- Authentication works
- Real-time data updates
- Mobile responsive design

---

## 🔄 **Continuous Deployment**

**Railway automatically redeploys when you:**
- Push to your main branch
- Update environment variables
- Change service configuration

**Monitor deployments:**
- Each deployment gets a unique ID
- View deployment history in Railway dashboard
- Rollback to previous versions if needed

---

## 📈 **Production Readiness Checklist**

- [ ] All environment variables configured
- [ ] OAuth providers set up correctly
- [ ] Custom domain configured (if needed)
- [ ] Database migrations completed
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Error monitoring configured
- [ ] Performance metrics within acceptable ranges
- [ ] Authentication working end-to-end
- [ ] Tracking script tested on real website
