# 🚀 Deployment Guide - Focus Sessions

This guide provides comprehensive instructions for deploying Focus Sessions to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Deployment with Docker](#local-deployment-with-docker)
- [Production Deployment](#production-deployment)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**
- **PostgreSQL** 14+ (for production database)
- **Python** 3.11+ (for local development)
- **Node.js** 18+ (for frontend)

### Recommended Tools
- **kubectl** (for Kubernetes deployments)
- **Terraform/Pulumi** (for infrastructure as code)
- **CloudFlare/AWS CLI** (for CDN/hosting)

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/focus-sessions.git
cd focus-sessions
```

### 2. Create Environment Files

Create `.env.production` with production values:
```bash
cp .env.example .env.production
```

Edit `.env.production` with your production configuration:
```env
ENVIRONMENT=production
SECRET_KEY=your-32-character-secret-key-change-this
DATABASE_URL=postgresql+psycopg://focus_user:secure_password@db-host:5432/focus_sessions
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
AUTO_CREATE_TABLES=false
LOG_LEVEL=warning
DISABLE_DOCS=true
DISABLE_REDOC=true
```

### 3. Database Preparation

#### PostgreSQL Setup
```bash
# Create database and user (run on PostgreSQL server)
psql -U postgres
CREATE USER focus_user WITH PASSWORD 'secure_password';
CREATE DATABASE focus_sessions OWNER focus_user;
GRANT ALL PRIVILEGES ON DATABASE focus_sessions TO focus_user;
\q
```

#### Run Migrations
```bash
# From project root
cd backend
alembic upgrade head
```

---

## Local Deployment with Docker

### Quick Start with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.yml up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Verify Deployment
```bash
# Backend health check
curl http://localhost:8000/api/health

# Frontend access
open http://localhost:3000
```

### Stop Services
```bash
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## Production Deployment

### Option 1: Cloud Platforms

#### Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create focus-sessions

# Set environment variables
heroku config:set ENVIRONMENT=production
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DATABASE_URL=your-database-url

# Deploy
git push heroku main
```

#### AWS Deployment (ECS/Fargate)
See AWS-specific deployment documentation in `docs/DEPLOYMENT_AWS.md`

#### Azure Deployment (Container Instances/App Service)
See Azure-specific deployment documentation in `docs/DEPLOYMENT_AZURE.md`

### Option 2: Self-Hosted (VPS/Dedicated Server)

#### Prerequisites
- Ubuntu 20.04 LTS or similar
- SSH access
- Domain name with DNS configured

#### Initial Setup
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/focus-sessions.git
cd focus-sessions

# Create production compose file
cp docker-compose.yml docker-compose.prod.yml

# Update environment variables
nano .env.production

# Start services with production config
docker-compose -f docker-compose.prod.yml up -d

# Enable auto-restart
docker update --restart=always focus-sessions-backend-1
docker update --restart=always focus-sessions-frontend-1
docker update --restart=always focus-sessions-db-1
```

#### Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/focus-sessions
```

Example Nginx configuration:
```nginx
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/focus-sessions /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Database Migrations

### Create New Migration
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

### View Migration Status
```bash
alembic current
alembic history
```

### Apply Migrations
```bash
# Upgrade to latest
alembic upgrade head

# Upgrade specific version
alembic upgrade +1

# Downgrade
alembic downgrade -1
```

---

## Monitoring & Logging

### Docker Container Logs
```bash
# Backend logs
docker-compose logs backend -f

# Frontend logs
docker-compose logs frontend -f

# Database logs
docker-compose logs db -f

# All services
docker-compose logs -f
```

### Performance Monitoring
```bash
# View resource usage
docker stats

# Check container health
docker-compose ps
```

### Setup Application Insights (Optional)
Configure monitoring tools like:
- **Sentry** for error tracking
- **DataDog** for infrastructure monitoring
- **Grafana** for metrics visualization
- **ELK Stack** for centralized logging

---

## Security Checklist

Before production deployment, ensure:

- [ ] **Secret Key**: Changed from default value (minimum 32 characters)
- [ ] **Database**: Using PostgreSQL with strong password
- [ ] **SSL/TLS**: HTTPS enabled with valid certificate
- [ ] **CORS**: Configured for specific domains only
- [ ] **Documentation**: Disabled in production (`DISABLE_DOCS=true`)
- [ ] **Auto-reload**: Disabled in production
- [ ] **Logging**: Set to appropriate level (warning/error)
- [ ] **Headers**: Security headers configured in Nginx/reverse proxy
- [ ] **Dependencies**: Updated to latest security patches
- [ ] **Backups**: Database backup strategy implemented
- [ ] **Firewall**: Properly configured to restrict access
- [ ] **Secrets Management**: Using environment variables, not in code
- [ ] **API Keys**: Rotated and stored securely
- [ ] **CSRF Protection**: Enabled for form submissions
- [ ] **Rate Limiting**: Configured to prevent abuse

---

## Troubleshooting

### Common Issues

#### Backend fails to start
```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend python -c "from app.core.database import engine; print(engine.url)"

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
```

#### Database connection errors
```bash
# Verify PostgreSQL is running
docker-compose ps db

# Check database credentials
psql -h localhost -U focus_user -d focus_sessions -c "SELECT 1"

# Reset database (careful in production!)
docker-compose down -v
docker-compose up -d
```

#### Frontend not connecting to backend
```bash
# Verify backend is accessible
curl http://localhost:8000/api/health

# Check CORS configuration
# Verify frontend CORS_ORIGINS setting

# Check frontend API endpoint
docker-compose exec frontend cat /app/.env
```

#### Port already in use
```bash
# Find process using port
lsof -i :8000
lsof -i :3000
lsof -i :5432

# Kill process or use different ports in docker-compose.yml
```

### Performance Optimization

```bash
# Enable database query caching
# Configure Nginx compression
# Use CDN for static assets
# Implement API response caching
# Use database connection pooling
```

---

## Rollback Procedure

### Rollback to Previous Version
```bash
# View git history
git log --oneline

# Revert to previous commit
git revert <commit-hash>

# Or reset (careful!)
git reset --hard <commit-hash>

# Rebuild Docker images
docker-compose down
docker-compose up -d --build

# Rollback database (if needed)
cd backend
alembic downgrade -1
```

---

## Support & Updates

For issues or questions:
- Check documentation in `/docs` folder
- Review GitHub Issues
- Contact the development team

---

**Last Updated**: 2024
**Version**: 1.0.0
