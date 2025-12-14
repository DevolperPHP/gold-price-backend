# 🏆 Gold Price Backend API

A Node.js backend service that caches gold price data from Yahoo Finance API and serves it to multiple clients, reducing API calls and avoiding rate limits.

## ✨ Features

- **🔄 Auto-Updates**: Fetches new gold prices every 5 minutes automatically
- **💾 Smart Caching**: Stores data in memory to serve all clients instantly
- **⚡ Fast Response**: Returns cached data immediately without waiting for API calls
- **🛡️ Rate Limit Protection**: Single API request serves unlimited users
- **🔁 Fallback**: Returns last known data if API is temporarily unavailable
- **📊 Status Monitoring**: Built-in endpoints to check service health and status

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ ([Download](https://nodejs.org/))
- npm or yarn

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env to adjust PORT if needed (default: 3000)
   ```

4. **Start the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify it's running**
   ```bash
   curl http://localhost:3000/health
   ```

## 📡 API Endpoints

### Get Current Gold Price
```http
GET /api/gold-price
```

**Response:**
```json
{
  "success": true,
  "data": {
    "goldPricePerOunceUSD": 2050.50,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "marketState": "REGULAR",
    "previousClose": 2048.75,
    "currency": "USD"
  },
  "meta": {
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "timeSinceLastUpdate": 2,
    "nextUpdateIn": 3,
    "source": "Yahoo Finance API (Cached)"
  }
}
```

### Get Service Status
```http
GET /api/status
```

**Response:**
```json
{
  "service": "Gold Price Backend",
  "version": "1.0.0",
  "status": "operational",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "timeSinceLastUpdate": 2,
  "nextUpdateIn": 3,
  "cacheStatus": "warm",
  "currentPrice": 2050.50
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "gold-price-backend"
}
```

### Force Update (Admin/Testing)
```http
POST /api/gold-price/update
```

Forces an immediate update of gold price data (bypasses the 5-minute schedule).

## ⚙️ Configuration

Edit `.env` file:

```env
# Server port (default: 3000)
PORT=3000

# Environment
NODE_ENV=development
```

## 🔄 How It Works

1. **Initialization**: On startup, the service fetches gold price immediately
2. **Caching**: Data is stored in memory for instant access
3. **Auto-Update**: Every 5 minutes, a cron job fetches fresh data
4. **Serving**: All client requests receive cached data instantly
5. **Fallback**: If API fails, last known data is served with warning

### Update Schedule
```
Minute 0:  Fetch data from Yahoo Finance
Minute 5:  Fetch data from Yahoo Finance
Minute 10: Fetch data from Yahoo Finance
...and so on
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Client Apps (Flutter)           │
│         (Multiple Users)                │
└──────────────┬──────────────────────────┘
               │
               │ HTTP GET /api/gold-price
               │
┌──────────────▼──────────────────────────┐
│       Backend Server (Express)          │
│       Port: 3000                        │
└──────────────┬──────────────────────────┘
               │
               │ Checks cache
               │
┌──────────────▼──────────────────────────┐
│    In-Memory Cache (Latest Price)       │
│    Updates every 5 minutes              │
└──────────────┬──────────────────────────┘
               │
               │ Cron Job (every 5 min)
               │
┌──────────────▼──────────────────────────┐
│     Yahoo Finance API (GC=F)            │
│     Single request per 5 minutes        │
└─────────────────────────────────────────┘
```

## 📊 Benefits

| Metric | Without Backend | With Backend |
|--------|----------------|--------------|
| API Calls (100 users) | 100 requests/5min | 1 request/5min |
| Response Time | ~500ms | ~10ms |
| Rate Limit Risk | High | None |
| Server Load | Distributed | Centralized |

## 🛠️ Development

### Project Structure
```
backend/
├── package.json          # Dependencies and scripts
├── server.js             # Express server and cron jobs
├── goldPriceService.js   # Yahoo Finance integration & caching
├── .env.example          # Environment configuration template
└── README.md            # This file
```

### Scripts
```bash
npm start      # Start production server
npm run dev    # Start with nodemon (auto-restart)
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production (PM2)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name gold-price-api

# Monitor
pm2 monitor

# View logs
pm2 logs gold-price-api
```

### Production (Docker)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Deployment Options

1. **Heroku**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

2. **Railway**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **DigitalOcean App Platform**
   - Connect GitHub repo
   - Set build command: `npm install`
   - Set run command: `npm start`

4. **AWS EC2**
   - Launch EC2 instance
   - Install Node.js
   - Clone repo and run `npm start`
   - Use PM2 for process management

## 📝 Logging

The service logs important events:

```
🚀 Gold Price Backend Server Started
📡 Server running on port 3000
🌐 Health check: http://localhost:3000/health
💰 Gold price API: http://localhost:3000/api/gold-price
⏱️  Auto-update: Every 5 minutes

⏰ Running scheduled update (every 5 minutes)...
Updating gold price data...
Gold price updated successfully: 2050.50
```

## 🔧 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### API not responding
```bash
# Check if server is running
curl http://localhost:3000/health

# Check server logs
npm run dev
```

### Data not updating
```bash
# Force manual update
curl -X POST http://localhost:3000/api/gold-price/update

# Check status
curl http://localhost:3000/api/status
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above

---

**Built with ❤️ using Node.js and Express**
