# Price Monitoring Dashboard

A real-time web-based monitoring dashboard for tracking Bitcoin (BTC) and S&P 500 (SPX) prices with live charts and auto-refresh capabilities.

## Features

- **Real-time Price Tracking**: Live prices for Bitcoin and S&P 500 index
- **24-Hour Change Indicators**: Color-coded percentage changes (green for gains, red for losses)
- **Historical Price Charts**: Interactive charts with Chart.js showing price trends
- **Auto-Refresh**: Configurable auto-refresh intervals (5s, 10s, 30s, 1m, 5m)
- **Responsive Design**: Beautiful dark-themed UI that works on all devices
- **Multiple Data Sources**: CoinGecko API for Bitcoin, Yahoo Finance for S&P 500
- **API Caching**: Smart caching to prevent excessive API calls

## Architecture

### Backend (Python Flask)
- RESTful API endpoints for price data
- Data fetching from multiple sources (CoinGecko, Yahoo Finance)
- Built-in caching mechanism (30-second TTL)
- Error handling and logging

### Frontend (HTML/CSS/JavaScript)
- Modern dark-themed responsive design
- Real-time updates using fetch API
- Interactive charts with Chart.js
- Configurable refresh intervals
- Connection status indicators

## API Endpoints

- `GET /` - Main dashboard page
- `GET /api/prices` - Get current prices for both BTC and SP500
- `GET /api/price/<symbol>` - Get price for specific symbol (btc or sp500)
- `GET /api/historical/<symbol>?days=7` - Get historical data for charts
- `GET /health` - Health check endpoint

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. **Clone or navigate to the repository**
   ```bash
   cd /path/to/Test
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the dashboard**
   Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

### Dashboard Controls

1. **Refresh Button**: Manually refresh price data
2. **Auto-refresh Interval**: Choose how often prices update automatically
   - Off (manual only)
   - 5 seconds
   - 10 seconds
   - 30 seconds (default)
   - 1 minute
   - 5 minutes

3. **Chart Period**: Select the time range for historical charts
   - 24 hours
   - 7 days (default)
   - 30 days

### Price Cards

Each asset displays:
- Current price in USD
- 24-hour percentage change
- Additional metrics (Market Cap for BTC, Previous Close for S&P 500)
- Historical price chart

## Project Structure

```
Test/
├── app.py                  # Flask backend application
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── templates/
│   └── index.html         # Main dashboard HTML
└── static/
    ├── css/
    │   └── style.css      # Dashboard styles
    └── js/
        └── dashboard.js   # Dashboard JavaScript logic
```

## Technical Details

### Data Sources

1. **Bitcoin (BTC)**
   - API: CoinGecko Public API
   - Endpoint: `/api/v3/simple/price`
   - Data: Price, 24h change, market cap
   - Rate limit: ~50 calls/minute (handled by caching)

2. **S&P 500 (SPX)**
   - API: Yahoo Finance (via yfinance library)
   - Ticker: ^GSPC
   - Data: Price, previous close, daily change
   - No strict rate limits

### Caching Strategy

- TTL (Time To Live): 30 seconds
- Max cache size: 100 entries
- Prevents excessive API calls
- Ensures data freshness

### Error Handling

- Network errors: Displays connection status indicator
- API failures: Shows error state on price cards
- Graceful degradation: Dashboard remains functional with cached data

## Development

### Running in Development Mode

```bash
# The app runs in debug mode by default
python app.py
```

Debug mode features:
- Auto-reload on code changes
- Detailed error messages
- Debug logging

### Modifying the Dashboard

- **Add new assets**: Update `app.py` with new fetch functions and add UI in `index.html`
- **Change styling**: Edit `static/css/style.css`
- **Modify behavior**: Update `static/js/dashboard.js`
- **Add API endpoints**: Add routes in `app.py`

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   ```bash
   # Change port in app.py (last line)
   app.run(debug=True, host='0.0.0.0', port=5001)
   ```

2. **API rate limits**
   - The caching mechanism should prevent this
   - Increase TTL in `app.py` if needed

3. **Charts not displaying**
   - Check browser console for JavaScript errors
   - Ensure Chart.js CDN is accessible
   - Verify API endpoints are returning data

4. **No data showing**
   - Check internet connection
   - Verify API endpoints are accessible
   - Check browser console and terminal logs

## Future Enhancements

Potential features to add:
- Additional cryptocurrencies and stock indices
- Price alerts and notifications
- Historical data export (CSV, JSON)
- User preferences persistence (localStorage)
- WebSocket support for true real-time updates
- Portfolio tracking capabilities
- Comparison charts
- Mobile app version

## License

This project is open source and available for educational purposes.

## Data Attribution

- Bitcoin data provided by [CoinGecko](https://www.coingecko.com/)
- S&P 500 data provided by [Yahoo Finance](https://finance.yahoo.com/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console and terminal logs
3. Ensure all dependencies are installed correctly
4. Verify internet connection and API accessibility
