# CSEC08 Platform - Complete Setup & Configuration Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Project Setup](#initial-project-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Blockchain Configuration](#blockchain-configuration)
6. [Database Setup](#database-setup)
7. [First Run](#first-run)
8. [Verification Tests](#verification-tests)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 16+ and npm (Download: https://nodejs.org/)
- **Python** 3.9-3.11 (Download: https://www.python.org/)
- **PostgreSQL** 14+ (Download: https://www.postgresql.org/)
- **Git** (Download: https://git-scm.com/)
- **MetaMask** browser extension (Chrome/Firefox)

### Verify Installations
```bash
# Check versions
node --version    # Should be v16+
npm --version     # Should be 8+
python3 --version # Should be 3.9-3.11
psql --version    # Should be 14+
git --version
```

---

## Initial Project Setup

### Step 1: Create Project Directory Structure

```bash
# Create main project folder
mkdir csec08-research-platform
cd csec08-research-platform

# Create all subdirectories
mkdir -p client/src/{features/{auth/{components,hooks,context},survey/components},api,utils}
mkdir -p server/app/{auth,telemetry,database}
mkdir -p blockchain/{contracts,scripts}
mkdir -p database
mkdir -p docs
mkdir -p backups
```

### Step 2: Create All Configuration Files

Create the following files in your project root:

**`.gitignore`** (Root level)
```bash
# Copy from the .gitignore artifact provided earlier
```

---

## Backend Configuration

### Step 1: Create Python Files

Navigate to `server/` directory and create these files:

#### A. `server/run.py`
```python
# Copy from the "Flask Entry Point (run.py)" artifact
```

#### B. `server/app/__init__.py`
```python
# Copy from the "Flask App Factory" artifact
```

#### C. `server/app/config.py`
```python
# Copy from the "Flask Configuration" artifact
```

#### D. `server/app/models.py`
```python
# Copy from the "SQLAlchemy Models" artifact
```

#### E. `server/app/auth/__init__.py`
```python
# Empty file (makes it a package)
```

#### F. `server/app/auth/routes.py`
```python
# Copy from the "Authentication Routes" artifact
```

#### G. `server/app/auth/services.py`
```python
# Copy from the "Authentication Service" artifact
```

#### H. `server/app/telemetry/__init__.py`
```python
# Empty file
```

#### I. `server/app/telemetry/routes.py`
```python
# Copy from the "Telemetry Routes" artifact
```

### Step 2: Create Python Virtual Environment

```bash
cd server

# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Your prompt should now show (venv)
```

### Step 3: Create requirements.txt

```bash
# In server/ directory
# Copy from the "Python Requirements" artifact
```

### Step 4: Install Python Dependencies

```bash
# Make sure venv is activated (you should see (venv) in prompt)
pip install --upgrade pip
pip install -r requirements.txt

# This will take 2-3 minutes
# You should see "Successfully installed..." messages
```

### Step 5: Create Environment File

```bash
# In server/ directory
touch .env

# Edit .env and add:
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key-please-change-this
JWT_SECRET_KEY=jwt-secret-please-change-this
DATABASE_URL=postgresql://localhost/csec08_research
```

**Generate secure keys (optional):**
```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

---

## Frontend Configuration

### Step 1: Create React Files

Navigate to `client/` directory:

#### A. `client/package.json`
```json
// Copy from the "package.json (Client/React)" artifact
```

#### B. `client/vite.config.js`
```javascript
// Copy from the "Vite Configuration" artifact
```

#### C. `client/tailwind.config.js`
```javascript
// Copy from the "Tailwind CSS Configuration" artifact
```

#### D. `client/postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### E. `client/index.html`
```html
<!-- Copy from the "index.html" artifact -->
```

#### F. `client/src/main.jsx`
```javascript
// Copy from the "React Entry Point" artifact
```

#### G. `client/src/App.jsx`
```javascript
// Copy from the "React App.jsx" artifact
```

#### H. `client/src/index.css`
```css
/* Copy from the "Global CSS Styles" artifact */
```

#### I. `client/src/api/axios.js`
```javascript
// Copy from the "Axios API Client" artifact
```

#### J. Create Auth Components

In `client/src/features/auth/components/`:

- **LoginForm.jsx** - Copy from artifact
- **WalletLogin.jsx** - Copy from artifact
- **AdminReset.jsx** - Copy from artifact

#### K. Create Auth Hooks

In `client/src/features/auth/hooks/`:

- **useWeb3Auth.js** - Copy from artifact
- **useTelemetry.js** - Copy from artifact

### Step 2: Install Node Dependencies

```bash
cd client

# Install all dependencies
npm install

# This will take 3-5 minutes
# Creates node_modules/ folder
```

### Step 3: Create Environment File

```bash
# In client/ directory
touch .env

# Edit .env and add:
VITE_API_BASE_URL=http://127.0.0.1:5000/api
VITE_HARDHAT_RPC_URL=http://127.0.0.1:8545
VITE_HARDHAT_CHAIN_ID=31337
```

---

## Blockchain Configuration

### Step 1: Create Hardhat Files

Navigate to `blockchain/` directory:

#### A. `blockchain/package.json`
```json
// Copy from "package.json (Blockchain/Hardhat)" artifact
```

#### B. `blockchain/hardhat.config.js`
```javascript
// Copy from "Hardhat Configuration" artifact
```

### Step 2: Install Hardhat Dependencies

```bash
cd blockchain

# Install dependencies
npm install

# This creates node_modules/
```

### Step 3: Initialize Hardhat

```bash
# Already configured, but verify:
npx hardhat
# Should show available commands
```

---

## Database Setup

### Step 1: Start PostgreSQL

```bash
# macOS (if using Homebrew):
brew services start postgresql@14

# Linux (Ubuntu/Debian):
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL service from Services app
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql prompt:
CREATE DATABASE csec08_research;

# Verify:
\l
# You should see csec08_research in the list

# Exit:
\q
```

### Step 3: Load Database Schema

```bash
# Make sure you're in project root
cd csec08-research-platform

# Copy schema to database/ folder
# (Use the SQL schema artifact provided earlier)

# Load schema
psql csec08_research < database/schema.sql

# You should see:
# CREATE TABLE
# CREATE TABLE
# ... (multiple times)
```

### Step 4: Verify Database

```bash
# Connect to database
psql csec08_research

# List tables:
\dt

# You should see:
# - users
# - auth_nonces
# - auth_logs
# - survey_responses
# - system_events
# - admin_actions

# Exit:
\q
```

---

## First Run

### Open 4 Terminal Windows

#### Terminal 1: PostgreSQL (should already be running)
```bash
# Verify it's running:
psql csec08_research -c "SELECT version();"
```

#### Terminal 2: Hardhat Node
```bash
cd csec08-research-platform/blockchain
npx hardhat node

# You should see:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# ... (20 accounts listed)

# ⚠️ KEEP THIS TERMINAL OPEN
```

#### Terminal 3: Flask Backend
```bash
cd csec08-research-platform/server
source venv/bin/activate  # Windows: venv\Scripts\activate
python run.py

# You should see:
# ✅ Database tables created/verified
# 🚀 Server starting...
# Running on http://127.0.0.1:5000

# ⚠️ KEEP THIS TERMINAL OPEN
```

#### Terminal 4: React Frontend
```bash
cd csec08-research-platform/client
npm run dev

# You should see:
# VITE v5.x.x ready in xxx ms
# ➜ Local: http://localhost:5173/

# Browser should open automatically
# ⚠️ KEEP THIS TERMINAL OPEN
```

---

## Verification Tests

### Test 1: Backend Health Check
```bash
# In a new terminal:
curl http://127.0.0.1:5000/api/health

# Expected response:
# {"status":"healthy","version":"1.0.0"}
```

### Test 2: Frontend Loading
1. Open browser to http://localhost:5173
2. You should see the method selection page
3. No console errors

### Test 3: Traditional Login
1. Click "Password Login"
2. Username: `student001`
3. Password: `test123`
4. Click "Login"
5. Should see success page

### Test 4: MetaMask Setup

#### Install MetaMask
1. Go to https://metamask.io/download/
2. Install extension
3. Create wallet (temporary - just for testing)

#### Add Hardhat Network
1. Open MetaMask
2. Click network dropdown
3. "Add Network" → "Add a network manually"
4. Fill in:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
5. Save

#### Import Test Account
1. In Hardhat terminal, copy the first private key
2. MetaMask → Account icon → Import Account
3. Paste private key
4. Should show ~10,000 ETH balance

### Test 5: DID Login
1. Refresh page (or press Ctrl+Shift+X to reset)
2. Click "Wallet Login"
3. Click "Connect Wallet"
4. MetaMask popup → "Next" → "Connect"
5. Click "Sign & Login"
6. MetaMask signature popup → "Sign"
7. Should see success page

---

## Troubleshooting

### Problem: "Command not found: npx"
**Solution:** 
```bash
npm install -g npx
# Or update Node.js to latest version
```

### Problem: "Module not found: flask"
**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install flask
```

### Problem: "psql: command not found"
**Solution:**
```bash
# macOS:
brew install postgresql@14

# Ubuntu/Debian:
sudo apt-get install postgresql-14

# Windows: Download installer from postgresql.org
```

### Problem: "Port 5000 already in use"
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill it or change Flask port in run.py:
app.run(port=5001)
```

### Problem: "MetaMask won't connect"
**Solution:**
1. Make sure Hardhat node is running
2. Verify network settings (Chain ID: 31337)
3. Try resetting MetaMask account: Settings → Advanced → Reset Account

### Problem: "Database connection refused"
**Solution:**
```bash
# Check if PostgreSQL is running:
pg_isready

# If not, start it:
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux
```

### Problem: "React page is blank"
**Solution:**
```bash
# Check browser console for errors
# Common fixes:
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Quick Reference Commands

### Start Everything
```bash
# Terminal 1: Hardhat
cd blockchain && npx hardhat node

# Terminal 2: Backend
cd server && source venv/bin/activate && python run.py

# Terminal 3: Frontend  
cd client && npm run dev
```

### Stop Everything
```bash
# Press Ctrl+C in each terminal
```

### Reset Database
```bash
psql csec08_research
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q
psql csec08_research < database/schema.sql
```

### Reset Kiosk (During Testing)
Press: `Ctrl + Shift + X`

---

## Next Steps After Setup

1. ✅ **Test with multiple participants** (use different test accounts)
2. ✅ **Check telemetry data** in database:
   ```sql
   SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 10;
   ```
3. ✅ **Export data** for analysis:
   ```bash
   curl http://127.0.0.1:5000/api/telemetry/export > data.json
   ```
4. ✅ **Read the Setup Guide** in `docs/SETUP_GUIDE.md` for testing protocols

---

## Success Checklist

- [ ] All 4 terminals running without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Traditional login works
- [ ] MetaMask connected to Hardhat network
- [ ] DID login works with signature
- [ ] Data appears in database
- [ ] Admin reset (Ctrl+Shift+X) works
- [ ] No console errors in browser

**If all checked, you're ready to start collecting research data! 🎉**

---

## Support

For issues, refer to:
- **Troubleshooting** section above
- **docs/SETUP_GUIDE.md** for detailed protocols
- Check Hardhat/Flask/Vite terminal outputs for specific errors

**Good luck with your research!** 📊🔬