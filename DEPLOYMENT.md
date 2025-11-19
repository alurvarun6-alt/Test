# Deployment Guide - Price Monitoring Dashboard

This guide covers multiple deployment options for hosting your price monitoring dashboard 24/7.

## Quick Deployment Options

### Option 1: Run on Your Local Machine (Simplest)

**Pros**: Free, full control, easy setup
**Cons**: Computer must stay on 24/7

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Access at http://localhost:5000
```

To keep it running in the background (Linux/Mac):
```bash
nohup python app.py > dashboard.log 2>&1 &
```

---

### Option 2: Deploy to Render.com (Recommended - Free Tier Available)

**Pros**: Free tier available, auto-deploy from Git, HTTPS included
**Cons**: May sleep after inactivity on free tier

1. **Create account at [render.com](https://render.com)**

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Or use "Deploy without Git" option

3. **Configure the service**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment**: Python 3

4. **Add gunicorn to requirements.txt**:
   ```bash
   echo "gunicorn>=21.0.0" >> requirements.txt
   ```

5. **Deploy**: Click "Create Web Service"

Your dashboard will be available at: `https://your-app-name.onrender.com`

---

### Option 3: Deploy to Railway.app (Great for Beginners)

**Pros**: Easy setup, free tier, automatic HTTPS
**Cons**: Limited free hours per month

1. **Sign up at [railway.app](https://railway.app)**

2. **Create new project from GitHub repo** or upload code

3. **Railway auto-detects Flask** and deploys automatically

4. **Add environment variable** (if needed):
   - `PORT=5000`

5. **Get your public URL** from Railway dashboard

---

### Option 4: Docker Deployment (For VPS/Cloud)

**Pros**: Portable, consistent environment, works anywhere
**Cons**: Requires basic Docker knowledge

I've created a `Dockerfile` and `docker-compose.yml` for you.

**To run with Docker**:

```bash
# Build the image
docker build -t price-dashboard .

# Run the container
docker run -d -p 5000:5000 --name dashboard price-dashboard

# Or use docker-compose
docker-compose up -d
```

**To run on cloud providers with Docker**:
- AWS ECS
- Google Cloud Run
- DigitalOcean App Platform
- Azure Container Instances

---

### Option 5: Deploy to PythonAnywhere (Free Tier Available)

**Pros**: Specialized for Python, free tier, always on
**Cons**: Limited customization on free tier

1. **Create account at [pythonanywhere.com](https://www.pythonanywhere.com)**

2. **Upload your files** via Files tab

3. **Install requirements** in Bash console:
   ```bash
   pip3 install --user -r requirements.txt
   ```

4. **Configure Web App**:
   - Go to Web tab → Add new web app
   - Select Flask
   - Point to your `app.py` file

5. **Reload the web app**

Access at: `https://yourusername.pythonanywhere.com`

---

### Option 6: Deploy to Heroku

**Pros**: Popular, well-documented, free tier (with limitations)
**Cons**: Free tier has sleep mode

1. **Install Heroku CLI**:
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login and create app**:
   ```bash
   heroku login
   heroku create your-dashboard-name
   ```

3. **Create a `Procfile`** (already included):
   ```
   web: gunicorn app:app
   ```

4. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Open your app**:
   ```bash
   heroku open
   ```

---

### Option 7: VPS Deployment (DigitalOcean, Linode, AWS EC2)

**Pros**: Full control, always on, scalable
**Cons**: Costs $4-5/month, requires server management

**Example with DigitalOcean Droplet**:

1. **Create a $4/month droplet** (Ubuntu 22.04)

2. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

3. **Install dependencies**:
   ```bash
   apt update
   apt install python3 python3-pip nginx -y
   ```

4. **Upload your code** (via git or scp)

5. **Install Python packages**:
   ```bash
   cd /var/www/price-dashboard
   pip3 install -r requirements.txt
   pip3 install gunicorn
   ```

6. **Create systemd service** (`/etc/systemd/system/dashboard.service`):
   ```ini
   [Unit]
   Description=Price Dashboard
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/price-dashboard
   ExecStart=/usr/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

7. **Start the service**:
   ```bash
   systemctl enable dashboard
   systemctl start dashboard
   ```

8. **Configure Nginx** as reverse proxy (see NGINX.md for config)

---

## Setting Up Hourly Refresh

The dashboard already supports configurable auto-refresh! Users can set it via the web interface:
- 5 seconds
- 10 seconds
- 30 seconds
- 1 minute
- 5 minutes
- Or manual refresh

**To set 1 hour as default**, edit `templates/index.html`:

```html
<select id="refresh-interval" onchange="updateRefreshInterval()">
    <option value="0">Off</option>
    <option value="3600000" selected>1 hour</option>
</select>
```

---

## Production Best Practices

### 1. Use Production WSGI Server

Replace:
```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

With gunicorn (add to requirements.txt):
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 2. Environment Variables

Create `.env` file for configuration:
```env
FLASK_ENV=production
PORT=5000
CACHE_TTL=30
```

### 3. HTTPS/SSL

Most cloud providers (Render, Railway, Heroku) provide free HTTPS.

For VPS, use Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### 4. Monitoring

Add uptime monitoring:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

### 5. Caching & Rate Limiting

The app already includes caching (30s TTL). Adjust in `app.py`:
```python
cache = TTLCache(maxsize=100, ttl=3600)  # 1 hour cache
```

---

## Cost Comparison

| Platform | Free Tier | Always On | Cost (if paid) |
|----------|-----------|-----------|----------------|
| Render.com | Yes | No (sleeps) | $7/mo |
| Railway | Yes (500hrs) | Yes | $5/mo |
| PythonAnywhere | Yes | Yes | $5/mo |
| Heroku | Limited | No (sleeps) | $7/mo |
| DigitalOcean | No | Yes | $4/mo |
| Local Machine | Yes | Yes | Electricity |

---

## Recommended Setup for Your Use Case

**For hourly refresh dashboard that's always available**:

1. **Best Free Option**: PythonAnywhere (always on, no sleep)
2. **Best Paid Option**: DigitalOcean Droplet ($4/mo, full control)
3. **Easiest Option**: Render.com or Railway (one-click deploy)
4. **DIY Option**: Run on Raspberry Pi or old computer at home

---

## Troubleshooting

**API Rate Limits**:
- Increase cache TTL to reduce API calls
- Consider upgrading to paid API tiers

**App Sleeping (Free Tiers)**:
- Use UptimeRobot to ping every 25 minutes
- Upgrade to paid tier for always-on

**Connection Issues**:
- Check API endpoints are accessible from server
- Verify firewall settings
- Check server logs: `journalctl -u dashboard -f`

---

## Next Steps

1. Choose your deployment platform
2. Follow the specific guide above
3. Set your preferred refresh interval
4. Add monitoring
5. Enjoy your 24/7 price dashboard!

For questions or issues, check the main README.md file.
