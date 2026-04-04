# Deployment Guide

This guide covers deployment options for AuroraChat, including Vercel (recommended) and manual deployment.

## 📋 Prerequisites

- Supabase project set up
- Environment variables configured
- Node.js 18+ installed locally

## 🚀 Deploying to Vercel (Recommended)

### Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_FAWRY_MERCHANT_CODE=your_fawry_merchant_code
VITE_FAWRY_SECRET_KEY=your_fawry_secret_key
VITE_FAWRY_BASE_URL=https://atfawry.fawry.com/api
NODE_ENV=production
```

### Step 4: Deploy

Click "Deploy". Vercel will:
1. Install dependencies
2. Build your application
3. Deploy to a production URL

### Step 5: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## 🐳 Docker Deployment

### Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://your-supabase-url.supabase.co;
    }
}
```

### Build and Run

```bash
# Build image
docker build -t aurorachat .

# Run container
docker run -p 80:80 aurorachat
```

## 🔧 Supabase Edge Functions Deployment

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login and Link

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy process-payment
```

### Set Secrets

```bash
# Payment secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set FAWRY_SECRET_KEY=your_secret

# Other secrets
supabase secrets set JWT_SECRET=your_jwt_secret
```

## 📊 Post-Deployment Checklist

### Functionality Tests

- [ ] User registration and login
- [ ] Product browsing
- [ ] Add to cart functionality
- [ ] Checkout process
- [ ] Payment integration (test mode)
- [ ] Order confirmation emails
- [ ] Chat functionality
- [ ] Admin dashboard access

### Performance Checks

- [ ] Page load times (< 3s)
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Database query performance

### Security Verification

- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] RLS policies active
- [ ] Environment variables secured
- [ ] No sensitive data in client bundle

## 🔍 Monitoring and Logging

### Vercel Analytics

Enable Vercel Analytics in your project settings for:
- Page views
- Web vitals
- Error tracking

### Supabase Logs

```bash
# View function logs
supabase functions logs process-payment

# Stream logs
supabase functions logs --tail
```

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Uptime monitoring (UptimeRobot, Pingdom)

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Build Failures

**Issue**: TypeScript errors during build
```bash
# Check types locally
npm run build:check

# Fix strict mode issues
# See tsconfig.app.json configuration
```

**Issue**: Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Issue**: Environment variables not loading
- Verify variable names match exactly
- Check Vercel environment variable settings
- Ensure variables are prefixed with `VITE_` for client access

**Issue**: Supabase connection failed
- Verify SUPABASE_URL is correct
- Check RLS policies allow anonymous access where needed
- Review browser console for specific errors

### Performance Issues

**Issue**: Slow page loads
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Optimize imports
# Use lazy loading for routes
```

**Issue**: Database queries slow
- Add appropriate indexes
- Review query execution plans
- Consider caching with React Query

## 📈 Scaling Considerations

### Database

- Monitor Supabase usage
- Implement pagination for large datasets
- Use database functions for complex queries
- Consider read replicas for high traffic

### Frontend

- Implement code splitting
- Use CDN for static assets
- Enable compression
- Cache API responses

### Images

- Use Next.js Image component or similar
- Implement lazy loading
- Serve responsive images
- Consider image CDN (Cloudinary, Imgix)

## 🎯 Production Best Practices

1. **Always use environment variables** - Never hardcode secrets
2. **Enable HTTPS** - Required for payment processing
3. **Set up monitoring** - Catch issues before users report them
4. **Regular backups** - Supabase handles this automatically
5. **Keep dependencies updated** - Security patches are critical
6. **Test payment flows** - Always verify in sandbox first
7. **Document everything** - Help your future self

## 📞 Support

If you encounter deployment issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review Supabase and Vercel documentation
3. Search existing GitHub issues
4. Contact support with error logs

---

**Last Updated**: April 2025
**Version**: 1.0.0
