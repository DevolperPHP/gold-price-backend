# Railway Deployment Guide

This guide will help you deploy the Gold Price Backend to Railway.app.

## Prerequisites

- A GitHub account
- Your code pushed to a GitHub repository
- A Railway account (sign up at https://railway.app)

## Deployment Steps

### 1. Push Code to GitHub

```bash
cd /Users/mohammedmajid/Desktop/work/gold_app
git add .
git commit -m "Prepare backend for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

1. **Go to Railway.app**: Visit https://railway.app and sign in with GitHub

2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"

3. **Select Repository**: Choose the repository containing your gold_app project

4. **Select Backend**: Railway will detect it's a Node.js app. Click "Deploy Now"

### 3. Configure Environment Variables (Optional)

Railway will automatically:
- Set the PORT environment variable
- Install dependencies from package.json
- Start the server using `npm start`

No additional environment variables are required, but you can optionally set:
- `API_TIMEOUT`: Request timeout in milliseconds (default: 10000)

### 4. Get Your Backend URL

After deployment:
1. Go to your project dashboard on Railway
2. Click on your backend service
3. Go to "Settings" → "Domains"
4. You'll see a URL like: `https://your-app-name.railway.app`

### 5. Update Frontend Configuration

Update the Flutter app to use your Railway backend URL:

**File**: `lib/services/gold_price_service.dart`

```dart
// Change from:
static const String _baseUrl = 'http://localhost:3000';

// To your Railway URL:
static const String _baseUrl = 'https://your-app-name.railway.app';
```

Then rebuild the app:
```bash
flutter clean
flutter pub get
flutter run
```

## API Endpoints

After deployment, your API will be available at:
- `GET /health` - Health check
- `GET /api/gold-price` - Get current gold price
- `GET /api/status` - Get service status
- `POST /api/gold-price/update` - Force update gold price

## Monitoring

- **Logs**: View real-time logs in Railway dashboard → "Deployments" tab
- **Metrics**: Monitor CPU, memory usage in "Metrics" tab
- **Settings**: Configure custom domains, environment variables in "Settings" tab

## Troubleshooting

### Build Fails
- Check that package.json has a valid "start" script
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### App Crashes on Startup
- Check that server.js uses `process.env.PORT`
- Ensure error handling is in place
- View logs in Railway dashboard

### API Returns 503
- The service initializes in the background
- Wait 10-30 seconds after deployment
- Check /health endpoint: `https://your-app.railway.app/health`

## Auto-Deploy

Railway automatically deploys when you push to your main branch. To deploy changes:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically detect the changes and redeploy.

## Scaling (Optional)

To scale your service:
1. Go to Railway dashboard → Your project → Settings
2. Under "Deploy", increase "Replicas" for high availability
3. Railway will distribute traffic across replicas

## Support

- Railway Docs: https://docs.railway.app
- GitHub Issues: Report problems in your repository
