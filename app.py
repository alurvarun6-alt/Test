#!/usr/bin/env python3
"""
Price Monitoring Dashboard - Flask Backend
Fetches real-time prices for BTC and SP500 index
"""

from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from cachetools import TTLCache
import logging
import json

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache to prevent excessive API calls (cache for 30 seconds)
cache = TTLCache(maxsize=100, ttl=30)


def get_btc_price():
    """Fetch Bitcoin price from CoinGecko API"""
    try:
        if 'btc' in cache:
            return cache['btc']

        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            'ids': 'bitcoin',
            'vs_currencies': 'usd',
            'include_24hr_change': 'true',
            'include_market_cap': 'true'
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        result = {
            'price': data['bitcoin']['usd'],
            'change_24h': data['bitcoin']['usd_24h_change'],
            'market_cap': data['bitcoin'].get('usd_market_cap', 0),
            'symbol': 'BTC',
            'name': 'Bitcoin'
        }

        cache['btc'] = result
        return result

    except Exception as e:
        logger.error(f"Error fetching BTC price: {e}")
        return {
            'error': str(e),
            'price': 0,
            'change_24h': 0,
            'symbol': 'BTC',
            'name': 'Bitcoin'
        }


def get_sp500_price():
    """Fetch S&P 500 price using Yahoo Finance API"""
    try:
        if 'sp500' in cache:
            return cache['sp500']

        # Use Yahoo Finance query API
        url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC"
        params = {
            'interval': '1d',
            'range': '2d'
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Extract price data
        result_data = data['chart']['result'][0]
        meta = result_data['meta']
        quotes = result_data['indicators']['quote'][0]

        current_price = meta['regularMarketPrice']
        prev_close = meta['chartPreviousClose']
        change_pct = ((current_price - prev_close) / prev_close) * 100

        result = {
            'price': float(current_price),
            'change_24h': float(change_pct),
            'prev_close': float(prev_close),
            'symbol': 'SPX',
            'name': 'S&P 500'
        }

        cache['sp500'] = result
        return result

    except Exception as e:
        logger.error(f"Error fetching SP500 price: {e}")
        return {
            'error': str(e),
            'price': 0,
            'change_24h': 0,
            'symbol': 'SPX',
            'name': 'S&P 500'
        }


def get_historical_data(symbol, days=7):
    """Fetch historical price data for charts"""
    try:
        if symbol.lower() == 'btc':
            url = f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily' if days > 1 else 'hourly'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            prices = data['prices']
            return {
                'timestamps': [datetime.fromtimestamp(p[0]/1000).isoformat() for p in prices],
                'prices': [p[1] for p in prices]
            }

        elif symbol.lower() == 'sp500':
            # Use Yahoo Finance API for historical data
            url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC"
            params = {
                'interval': '1d' if days > 1 else '1h',
                'range': f'{days}d'
            }
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()

            result_data = data['chart']['result'][0]
            timestamps = result_data['timestamp']
            prices = result_data['indicators']['quote'][0]['close']

            # Filter out None values
            filtered_data = [(t, p) for t, p in zip(timestamps, prices) if p is not None]
            timestamps, prices = zip(*filtered_data) if filtered_data else ([], [])

            return {
                'timestamps': [datetime.fromtimestamp(t).isoformat() for t in timestamps],
                'prices': list(prices)
            }

    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        return {'timestamps': [], 'prices': []}


@app.route('/')
def index():
    """Serve the dashboard HTML page"""
    return render_template('index.html')


@app.route('/api/prices')
def get_prices():
    """API endpoint to get current prices for both BTC and SP500"""
    btc_data = get_btc_price()
    sp500_data = get_sp500_price()

    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'data': {
            'btc': btc_data,
            'sp500': sp500_data
        }
    })


@app.route('/api/price/<symbol>')
def get_price(symbol):
    """API endpoint to get price for a specific symbol"""
    if symbol.lower() == 'btc':
        data = get_btc_price()
    elif symbol.lower() in ['sp500', 'spx']:
        data = get_sp500_price()
    else:
        return jsonify({'error': 'Invalid symbol'}), 400

    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'data': data
    })


@app.route('/api/historical/<symbol>')
def get_historical(symbol):
    """API endpoint to get historical price data"""
    days = request.args.get('days', default=7, type=int)

    if symbol.lower() not in ['btc', 'sp500', 'spx']:
        return jsonify({'error': 'Invalid symbol'}), 400

    data = get_historical_data(symbol, days)
    return jsonify(data)


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    logger.info("Starting Price Monitoring Dashboard...")
    logger.info("Access the dashboard at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
