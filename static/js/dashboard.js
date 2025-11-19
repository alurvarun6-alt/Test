// Global variables
let refreshInterval = null;
let btcChart = null;
let sp500Chart = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Price Monitoring Dashboard initialized');
    initializeCharts();
    fetchPrices();
    updateRefreshInterval();
});

// Initialize Chart.js charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                titleColor: '#f1f5f9',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return '$' + context.parsed.y.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    color: 'rgba(51, 65, 85, 0.3)'
                },
                ticks: {
                    color: '#cbd5e1',
                    maxTicksLimit: 7
                }
            },
            y: {
                display: true,
                grid: {
                    color: 'rgba(51, 65, 85, 0.3)'
                },
                ticks: {
                    color: '#cbd5e1',
                    callback: function(value) {
                        return '$' + value.toLocaleString('en-US');
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    // Bitcoin Chart
    const btcCtx = document.getElementById('btc-chart').getContext('2d');
    btcChart = new Chart(btcCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'BTC Price',
                data: [],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#f59e0b'
            }]
        },
        options: chartOptions
    });

    // S&P 500 Chart
    const sp500Ctx = document.getElementById('sp500-chart').getContext('2d');
    sp500Chart = new Chart(sp500Ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'S&P 500 Price',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#3b82f6'
            }]
        },
        options: chartOptions
    });
}

// Fetch current prices from API
async function fetchPrices() {
    try {
        updateStatus('connecting');
        const response = await fetch('/api/prices');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        updatePriceDisplay(result);
        updateCharts();
        updateStatus('connected');
        updateLastUpdateTime();

    } catch (error) {
        console.error('Error fetching prices:', error);
        updateStatus('disconnected');
        showError('Failed to fetch price data. Please check your connection.');
    }
}

// Update price display
function updatePriceDisplay(result) {
    // Update Bitcoin
    if (result.data.btc) {
        const btc = result.data.btc;
        document.getElementById('btc-price').textContent = formatPrice(btc.price);

        const btcChange = document.getElementById('btc-change');
        btcChange.querySelector('.change-value').textContent =
            formatPercentage(btc.change_24h);
        btcChange.className = 'price-change ' + (btc.change_24h >= 0 ? 'positive' : 'negative');

        if (btc.market_cap) {
            document.getElementById('btc-mcap').textContent = formatLargeNumber(btc.market_cap);
        }

        // Remove error state if present
        document.getElementById('btc-card').classList.remove('error');
    }

    // Update S&P 500
    if (result.data.sp500) {
        const sp500 = result.data.sp500;
        document.getElementById('sp500-price').textContent = formatPrice(sp500.price);

        const sp500Change = document.getElementById('sp500-change');
        sp500Change.querySelector('.change-value').textContent =
            formatPercentage(sp500.change_24h);
        sp500Change.className = 'price-change ' + (sp500.change_24h >= 0 ? 'positive' : 'negative');

        if (sp500.prev_close) {
            document.getElementById('sp500-prev').textContent = formatPrice(sp500.prev_close);
        }

        // Remove error state if present
        document.getElementById('sp500-card').classList.remove('error');
    }
}

// Update charts with historical data
async function updateCharts() {
    const days = document.getElementById('chart-period').value;

    try {
        // Fetch BTC historical data
        const btcResponse = await fetch(`/api/historical/btc?days=${days}`);
        const btcData = await btcResponse.json();

        if (btcData.timestamps && btcData.prices) {
            btcChart.data.labels = btcData.timestamps.map(formatChartDate);
            btcChart.data.datasets[0].data = btcData.prices;
            btcChart.update('none');
        }

        // Fetch S&P 500 historical data
        const sp500Response = await fetch(`/api/historical/sp500?days=${days}`);
        const sp500Data = await sp500Response.json();

        if (sp500Data.timestamps && sp500Data.prices) {
            sp500Chart.data.labels = sp500Data.timestamps.map(formatChartDate);
            sp500Chart.data.datasets[0].data = sp500Data.prices;
            sp500Chart.update('none');
        }

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update refresh interval
function updateRefreshInterval() {
    const interval = parseInt(document.getElementById('refresh-interval').value);

    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    // Set new interval if not 0
    if (interval > 0) {
        refreshInterval = setInterval(fetchPrices, interval);
        console.log(`Auto-refresh set to ${interval}ms`);
    } else {
        console.log('Auto-refresh disabled');
    }
}

// Update connection status indicator
function updateStatus(status) {
    const indicator = document.getElementById('connection-status');
    indicator.className = 'status-indicator ' + status;
}

// Update last update timestamp
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('last-update-time').textContent = timeString;
}

// Show error message
function showError(message) {
    // You could implement a toast notification here
    console.error(message);
}

// Formatting functions
function formatPrice(price) {
    if (!price || isNaN(price)) return '--';

    return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) return '--';

    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
}

function formatLargeNumber(num) {
    if (!num || isNaN(num)) return '--';

    if (num >= 1e12) {
        return '$' + (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return '$' + (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return '$' + (num / 1e6).toFixed(2) + 'M';
    }
    return '$' + num.toLocaleString('en-US');
}

function formatChartDate(dateString) {
    const date = new Date(dateString);
    const days = parseInt(document.getElementById('chart-period').value);

    if (days === 1) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Handle visibility change (pause updates when tab is hidden)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    } else {
        updateRefreshInterval();
        fetchPrices();
    }
});
