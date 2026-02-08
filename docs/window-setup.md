# CSEC08 Platform - Windows Setup Guide

## 📋 Complete Installation Guide for Windows 10/11

---

## 🎯 Prerequisites Installation

### Step 1: Install Node.js

1. **Download Node.js:**
   - Go to https://nodejs.org/
   - Download the **LTS version** (e.g., 20.x.x)
   - Choose "Windows Installer (.msi)" - 64-bit

2. **Install:**
   - Run the downloaded `.msi` file
   - Click "Next" through the installer
   - ✅ Check "Automatically install necessary tools" (includes Python tools)
   - Click "Install"
   - Wait 3-5 minutes

3. **Verify Installation:**
   ```cmd
   # Open Command Prompt (Win + R, type "cmd", press Enter)
   node --version
   # Should show: v20.x.x
   
   npm --version
   # Should show: 10.x.x
   ```

### Step 2: Install Python

1. **Download Python:**
   - Go to https://www.python.org/downloads/
   - Download **Python 3.11.x** (or 3.10.x)
   - Click "Download Python 3.11.x"

2. **Install:**
   - Run the downloaded `.exe` file
   - ✅ **IMPORTANT:** Check "Add Python to PATH" at bottom
   - Click "Install Now"
   - Wait 2-3 minutes
   - Click "Close"

3. **Verify Installation:**
   ```cmd
   python --version
   # Should show: Python 3.11.x
   
   pip --version
   # Should show: pip 23.x.x
   ```

   **If `python` doesn't work, try:**
   ```cmd
   python3 --version
   py --version
   ```

### Step 3: Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Download **PostgreSQL 14.x** or **15.x**

2. **Install:**
   - Run the downloaded `.exe` file
   - Click "Next"
   - Installation Directory: Keep default (`C:\Program Files\PostgreSQL\14`)
   - Select Components: ✅ All (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - Data Directory: Keep default
   - **Set Password:** Choose a password (remember this!)
     - Example: `postgres123` (for testing)
   - Port: Keep default `5432`
   - Locale: Keep default
   - Click "Next" → "Install"
   - Wait 5-10 minutes
   - ✅ Uncheck "Launch Stack Builder" at end
   - Click "Finish"

3. **Add to PATH (Manual Method):**
   - Press `Win + R`
   - Type: `sysdm.cpl` and press Enter
   - Click "Advanced" tab
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\14\bin`
   - Click "OK" on all windows
   - **Close and reopen Command Prompt**

4. **Verify Installation:**
   ```cmd
   # Close and reopen Command Prompt first!
   psql --version
   # Should show: psql (PostgreSQL) 14.x
   ```

### Step 4: Install Git

1. **Download Git:**
   - Go to https://git-scm.com/download/win
   - Download will start automatically

2. **Install:**
   - Run the downloaded `.exe` file
   - Click "Next" through most screens (defaults are fine)
   - Editor: Choose "Use Visual Studio Code" or "Use Notepad"
   - PATH: Select "Git from the command line and also from 3rd-party software"
   - Click "Next" → "Install"
   - Click "Finish"

3. **Verify Installation:**
   ```cmd
   git --version
   # Should show: git version 2.x.x
   ```

### Step 5: Install MetaMask

1. **For Chrome:**
   - Open Chrome browser
   - Go to: https://metamask.io/download/
   - Click "Install MetaMask for Chrome"
   - Click "Add to Chrome"
   - Click "Add extension"

2. **For Firefox:**
   - Open Firefox
   - Go to: https://metamask.io/download/
   - Click "Install MetaMask for Firefox"
   - Click "Add to Firefox"

3. **Setup MetaMask:**
   - Click the MetaMask fox icon
   - Click "Get Started"
   - Click "Create a new wallet"
   - Set a password
   - **Save your Secret Recovery Phrase** (write it down!)
   - Click "Done"

---

## 📁 Project Setup

### Step 1: Create Project Folder

```cmd
# Open Command Prompt
# Press Win + R, type "cmd", press Enter

# Navigate to where you want the project (e.g., Desktop)
cd %USERPROFILE%\Desktop

# Create project folder
mkdir csec08-research-platform
cd csec08-research-platform
```

### Step 2: Create Folder Structure

**Option A: Manual Creation**
```cmd
# Create all folders
mkdir client
mkdir server
mkdir blockchain
mkdir database
mkdir docs
mkdir backups

cd client
mkdir src
cd src
mkdir features
mkdir api
mkdir utils
cd features
mkdir auth
mkdir survey
cd auth
mkdir components
mkdir hooks
mkdir context

# Go back to project root
cd %USERPROFILE%\Desktop\csec08-research-platform
```

**Option B: Use PowerShell Script**

Save this as `setup_structure.ps1`:

```powershell
# Create directory structure
$folders = @(
    "client\src\features\auth\components",
    "client\src\features\auth\hooks",
    "client\src\features\auth\context",
    "client\src\features\survey\components",
    "client\src\api",
    "client\src\utils",
    "client\public",
    "server\app\auth",
    "server\app\telemetry",
    "server\app\database",
    "blockchain\contracts",
    "blockchain\scripts",
    "database",
    "docs",
    "backups",
    "scripts"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder
}

# Create empty __init__.py files
$pythonPackages = @(
    "server\app\__init__.py",
    "server\app\auth\__init__.py",
    "server\app\telemetry\__init__.py",
    "server\app\database\__init__.py"
)

foreach ($file in $pythonPackages) {
    New-Item -ItemType File -Force -Path $file
}

Write-Host "✅ Project structure created successfully!"
```

Run it:
```powershell
# Open PowerShell (not Command Prompt)
# Win + X → "Windows PowerShell"

cd %USERPROFILE%\Desktop\csec08-research-platform
powershell -ExecutionPolicy Bypass -File setup_structure.ps1
```

### Step 3: Create Configuration Files

#### A. Create `.gitignore` (Project Root)

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform
notepad .gitignore
```

Copy the `.gitignore` content from the artifact and save.

#### B. Create Backend Files

```cmd
cd server

# Create empty __init__ files
type nul > app\__init__.py
type nul > app\auth\__init__.py
type nul > app\telemetry\__init__.py
type nul > app\database\__init__.py

# Create main files (we'll add content next)
notepad run.py
notepad app\config.py
notepad app\models.py
notepad app\auth\routes.py
notepad app\auth\services.py
notepad app\telemetry\routes.py
notepad requirements.txt
```

**For each file, copy the content from the corresponding artifact.**

#### C. Create Frontend Files

```cmd
cd ..\client

# Create config files
notepad package.json
notepad vite.config.js
notepad tailwind.config.js
notepad postcss.config.js
notepad index.html

# Create source files
cd src
notepad main.jsx
notepad App.jsx
notepad index.css

# Create API file
cd api
notepad axios.js
cd ..

# Create auth components
cd features\auth\components
notepad LoginForm.jsx
notepad WalletLogin.jsx
notepad AdminReset.jsx
cd ..

# Create auth hooks
cd hooks
notepad useWeb3Auth.js
notepad useTelemetry.js
```

**Copy content from artifacts for each file.**

#### D. Create Blockchain Files

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform\blockchain

notepad package.json
notepad hardhat.config.js
```

Copy from artifacts.

#### E. Create Database Schema

```cmd
cd ..\database
notepad schema.sql
```

Copy the SQL schema from artifact.

---

## 🔧 Install Dependencies

### Step 1: Install Backend Dependencies

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform\server

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
# Your prompt should now show (venv)

# Upgrade pip
python -m pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

**This will take 3-5 minutes. You'll see many "Successfully installed..." messages.**

**Troubleshooting:**
```cmd
# If you get SSL errors:
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# If psycopg2-binary fails:
pip install psycopg2-binary==2.9.7 --no-binary psycopg2-binary
```

### Step 2: Create Backend .env File

```cmd
# Still in server folder with (venv) active
notepad .env
```

Add this content:
```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-this
JWT_SECRET_KEY=jwt-secret-change-this
DATABASE_URL=postgresql://postgres:postgres123@localhost/csec08_research
```

**Change `postgres123` to your PostgreSQL password!**

Save and close.

### Step 3: Install Frontend Dependencies

```cmd
# Open a NEW Command Prompt (keep the other one running)
cd %USERPROFILE%\Desktop\csec08-research-platform\client

# Install dependencies
npm install
```

**This will take 5-8 minutes. You'll see a progress bar.**

**Troubleshooting:**
```cmd
# If you get errors, try:
npm cache clean --force
npm install

# Or delete node_modules and try again:
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Step 4: Create Frontend .env File

```cmd
# In client folder
notepad .env
```

Add:
```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
VITE_HARDHAT_RPC_URL=http://127.0.0.1:8545
VITE_HARDHAT_CHAIN_ID=31337
```

Save and close.

### Step 5: Install Blockchain Dependencies

```cmd
cd ..\blockchain
npm install
```

**This will take 2-3 minutes.**

---

## 🗄️ Database Setup

### Step 1: Start PostgreSQL Service

**Method 1: Services (Recommended)**
1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find "postgresql-x64-14" in the list
5. Right-click → "Start" (if not already started)
6. Right-click → "Properties"
7. Startup type: "Automatic"
8. Click "OK"

**Method 2: Command Line**
```cmd
# Run as Administrator
# Win + X → "Command Prompt (Admin)"
net start postgresql-x64-14
```

### Step 2: Create Database

```cmd
# Open Command Prompt
# Connect to PostgreSQL (enter your password when prompted)
psql -U postgres
# Enter password: postgres123 (or your password)

# You should see: postgres=#

# Create database
CREATE DATABASE csec08_research;

# Verify
\l
# You should see csec08_research in the list

# Exit
\q
```

### Step 3: Load Schema

```cmd
# Navigate to project
cd %USERPROFILE%\Desktop\csec08-research-platform

# Load schema
psql -U postgres -d csec08_research -f database\schema.sql
# Enter password when prompted

# You should see:
# CREATE TABLE
# CREATE TABLE
# ... (multiple times)
# INSERT 0 5
# INSERT 0 5
```

### Step 4: Verify Database

```cmd
# Connect to database
psql -U postgres -d csec08_research

# List tables
\dt

# You should see:
# users
# auth_nonces
# auth_logs
# survey_responses
# system_events
# admin_actions

# Check sample data
SELECT * FROM users;

# Should show 10 sample users

# Exit
\q
```

---

## 🚀 Running the Application

### You Need 4 Command Prompt Windows

#### Window 1: Hardhat Blockchain

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform\blockchain
npx hardhat node
```

**You should see:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**⚠️ KEEP THIS WINDOW OPEN!**

**Copy the first 5 private keys** - you'll need them for MetaMask.

#### Window 2: Flask Backend

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform\server
venv\Scripts\activate
python run.py
```

**You should see:**
```
✅ Database tables created/verified

╔════════════════════════════════════════════════════╗
║   CSEC08 Research Platform - Backend Server       ║
╚════════════════════════════════════════════════════╝

🚀 Server starting...
 * Running on http://127.0.0.1:5000
```

**⚠️ KEEP THIS WINDOW OPEN!**

#### Window 3: React Frontend

```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform\client
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Your browser should open automatically to http://localhost:5173**

**⚠️ KEEP THIS WINDOW OPEN!**

#### Window 4: Keep for Testing

Keep this for running test commands.

---

## 🦊 MetaMask Configuration

### Step 1: Add Hardhat Network

1. **Open MetaMask extension**
2. **Click the network dropdown** (top center, shows "Ethereum Mainnet")
3. **Click "Add Network"** at bottom
4. **Click "Add a network manually"**

Fill in these exact values:
| Field | Value |
|-------|-------|
| Network Name | `Hardhat Local` |
| New RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

5. **Click "Save"**
6. **Network dropdown should now show "Hardhat Local"** - click it to switch

### Step 2: Import Test Accounts

**From your Hardhat window (Window 1), copy the first private key:**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**In MetaMask:**
1. Click the **account circle icon** (top right)
2. Click **"Import Account"**
3. Paste the **private key**
4. Click **"Import"**

**You should see:**
- Account name: "Account 2" (or similar)
- Balance: 10000 ETH

**Rename the account:**
1. Click the three dots next to the account
2. Click "Account details"
3. Click the pencil icon
4. Change name to: `Test Account #0`
5. Click checkmark

**Repeat for accounts #1 through #4** (import 5 accounts total)

### Step 3: Verify MetaMask Setup

- [ ] Network shows "Hardhat Local"
- [ ] Chain ID shows 31337
- [ ] Have 5 imported accounts
- [ ] Each account shows ~10000 ETH
- [ ] Accounts are named (Test Account #0, #1, etc.)

---

## ✅ Testing the System

### Test 1: Backend Health Check

**In Window 4:**
```cmd
curl http://127.0.0.1:5000/api/health
```

**Or open in browser:**
```
http://127.0.0.1:5000/api/health
```

**Expected response:**
```json
{"status":"healthy","version":"1.0.0"}
```

### Test 2: Frontend Loading

1. **Open browser:** http://localhost:5173
2. **You should see:** Method selection page with two cards
3. **Press F12** → Console tab
4. **Should see:** No errors (red text)

### Test 3: Traditional Login

1. **Click "Password Login"**
2. **Enter:**
   - Username: `student001`
   - Password: `test123`
3. **Click "Login"**
4. **Should see:** Success page with "Authentication Successful!"
5. **Check database:**
   ```cmd
   psql -U postgres -d csec08_research
   SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 1;
   \q
   ```
   Should show your login attempt!

### Test 4: Wallet Login

1. **Refresh page** (F5)
2. **Click "Wallet Login"**
3. **Click "Connect Wallet"**
4. **MetaMask popup appears:**
   - Click "Next"
   - Click "Connect"
5. **See "Wallet Connected"** with your address
6. **Click "Sign & Login"**
7. **MetaMask signature popup:**
   - Review the message
   - Click "Sign"
8. **Should see:** Success page!

### Test 5: Admin Reset (Critical!)

1. **After successful login, press:** `Ctrl + Shift + X`
2. **Admin panel appears**
3. **Click "Reset Kiosk for Next Participant"**
4. **Page reloads**
5. **MetaMask should show "Not connected"**
6. **You can log in again fresh**

---

## 🔧 Troubleshooting Windows-Specific Issues

### Issue: "python: command not found"

**Solution:**
```cmd
# Try these alternatives:
python3 --version
py --version

# If one works, use that instead of "python"
# Example:
py -m venv venv
```

**Or reinstall Python with "Add to PATH" checked!**

### Issue: "psql: command not found"

**Solution: Add PostgreSQL to PATH**
1. Press `Win + R`
2. Type: `sysdm.cpl`
3. Advanced tab → Environment Variables
4. System variables → Path → Edit
5. New → Add: `C:\Program Files\PostgreSQL\14\bin`
6. OK all windows
7. **Close and reopen Command Prompt**

### Issue: "npm: command not found"

**Solution:**
```cmd
# Verify Node.js installation
where node

# If not found, reinstall Node.js
# Make sure to check "Add to PATH" during installation
```

### Issue: Port 5000 already in use

**Solution:**
```cmd
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace XXXX with the PID from above)
taskkill /PID XXXX /F

# Or change Flask port in run.py:
# app.run(port=5001)
```

### Issue: "Access Denied" when creating folders

**Solution:**
```cmd
# Run Command Prompt as Administrator
# Win + X → "Command Prompt (Admin)"

# Or use a different location:
cd C:\Users\YourUsername\Documents
mkdir csec08-research-platform
```

### Issue: PowerShell execution policy error

**Solution:**
```powershell
# Run PowerShell as Administrator
# Win + X → "Windows PowerShell (Admin)"

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass

# Then run your script
```

### Issue: PostgreSQL service won't start

**Solution:**
```cmd
# Run as Administrator
net stop postgresql-x64-14
net start postgresql-x64-14

# If still fails, check Services app:
# Win + R → services.msc
# Find postgresql-x64-14 → Properties → Log On tab
# Ensure "Local System account" is selected
```

### Issue: MetaMask shows "Nonce too high"

**Solution:**
1. Open MetaMask
2. Click account icon → Settings
3. Advanced
4. Scroll down → "Reset Account"
5. Confirm

### Issue: Hardhat node crashes

**Solution:**
```cmd
# Stop the node (Ctrl + C)
# Clear cache
cd blockchain
rmdir /s /q cache
rmdir /s /q artifacts

# Restart
npx hardhat node
```

---

## 📝 Quick Start Commands (After Initial Setup)

Save this as `start.bat` in project root:

```batch
@echo off
echo Starting CSEC08 Research Platform...
echo.
echo Opening 3 Command Prompt windows...
echo.

REM Window 1: Hardhat
start cmd /k "cd blockchain && npx hardhat node"
timeout /t 3

REM Window 2: Backend
start cmd /k "cd server && venv\Scripts\activate && python run.py"
timeout /t 3

REM Window 3: Frontend
start cmd /k "cd client && npm run dev"

echo.
echo ✅ All services starting!
echo Browser should open automatically to http://localhost:5173
echo.
echo To stop: Close all Command Prompt windows
pause
```

**Run it:**
```cmd
cd %USERPROFILE%\Desktop\csec08-research-platform
start.bat
```

---

## 📚 Daily Startup Checklist

1. [ ] PostgreSQL service running (check Services app)
2. [ ] Open 3 Command Prompts
3. [ ] Start Hardhat: `cd blockchain && npx hardhat node`
4. [ ] Start Flask: `cd server && venv\Scripts\activate && python run.py`
5. [ ] Start React: `cd client && npm run dev`
6. [ ] Open browser: http://localhost:5173
7. [ ] MetaMask connected to "Hardhat Local"
8. [ ] Test both login methods
9. [ ] Test admin reset (Ctrl+Shift+X)

---

## 🎯 Success Criteria

You're ready to collect data when:

- [ ] All 3 services run without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Traditional login works (student001 / test123)
- [ ] MetaMask shows Hardhat Local network (31337)
- [ ] 5 test accounts imported with 10000 ETH each
- [ ] Wallet login works with signature
- [ ] Data appears in PostgreSQL database
- [ ] Admin reset (Ctrl+Shift+X) cleans state
- [ ] No red errors in browser console (F12)

**🎉 If all checked, you're ready for research!**

---

## 🆘 Getting Help

**Common error patterns:**

1. **"Module not found" errors** → Reinstall dependencies
2. **"Connection refused" errors** → Check services are running
3. **"Permission denied" errors** → Run as Administrator
4. **"Port already in use"** → Kill the process or change port

**Check logs:**
- Flask errors: Look at the Flask window output
- React errors: Browser console (F12)
- Database errors: Try connecting with pgAdmin 4
- Hardhat errors: Look at the Hardhat window output

**Still stuck?** Check the Complete Configuration Steps artifact for detailed troubleshooting.