# CSEC08: Dual-Stack Authentication Research Platform

**Usability Analysis of DID-Based Authentication in Higher Education**

A full-stack research instrument designed to empirically measure the usability gap between traditional password-based authentication and Decentralized Identity (DID) systems.

---

## 🎯 Project Overview

### Research Question
**"How does the Day-1 to Day-100 usability of DID authentication compare to traditional username/password authentication for non-technical university students?"**

### Key Innovation
This platform operates as a **"Black Box" recorder** for human behavior, isolating the authentication friction by:
- Using a **local blockchain** (zero network latency)
- Implementing **millisecond-precision telemetry**
- Controlling the **"Day-0" onboarding** variable (pre-configured wallets)
- Capturing **cognitive hesitation** through mouse movement analysis

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Responsive UI with A/B testing |
| **Backend** | Python Flask | Lightweight API for crypto verification |
| **Database** | PostgreSQL | Relational storage for telemetry |
| **Blockchain** | Hardhat (Local) | Zero-latency Ethereum simulation |
| **Cryptography** | Ethers.js / Web3.py | ECDSA signature verification |
| **Styling** | Tailwind CSS | Consistent, minimal UI |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Research Participant                      │
│                    (Kiosk Workstation)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   React Frontend        │
        │  (Telemetry Client)     │
        │  - Mouse tracking       │
        │  - Timing capture       │
        │  - State management     │
        └────────┬────────────────┘
                 │
                 │ HTTPS/JSON
                 │
        ┌────────▼────────────────┐
        │   Flask Backend         │
        │  (Auth Controller)      │
        │  - Route handling       │
        │  - JWT issuance         │
        │  - Service orchestration│
        └────┬─────────────┬──────┘
             │             │
   ┌─────────▼───┐    ┌───▼──────────────┐
   │ PostgreSQL  │    │  Hardhat Node    │
   │             │    │  (Localhost)     │
   │ • Users     │    │  • Instant mining│
   │ • AuthLogs  │    │  • 20 accounts   │
   │ • Nonces    │    │  • Zero latency  │
   └─────────────┘    └──────────────────┘
```

---

## 📊 Research Methodology

### A/B Test Design

**Control Group (Pathway A):** Traditional username/password  
**Experimental Group (Pathway B):** DID wallet authentication

**Critical Constraint:** Unified UI design (eliminates "Aesthetic-Usability Effect")

### Measured Variables

| Metric | Type | Purpose |
|--------|------|---------|
| `time_taken_ms` | Quantitative | Primary efficiency metric |
| `hesitation_score` | Quantitative | Cognitive load proxy |
| `mouse_total_distance` | Quantitative | Searching behavior indicator |
| `success` | Boolean | Completion rate |
| `error_category` | Categorical | Distinguishes tech vs. human failure |
| Survey responses | Qualitative | User perception data |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.9-3.11
- **PostgreSQL** 14+
- **MetaMask** browser extension
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/csec08-research-platform.git
cd csec08-research-platform

# Install backend dependencies
cd server
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd ../client
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

# Set up database
createdb csec08_research
psql csec08_research < ../database/schema.sql
```

### Running the System

**Terminal 1: Hardhat Node**
```bash
cd blockchain
npx hardhat node
```

**Terminal 2: Flask Backend**
```bash
cd server
source venv/bin/activate
python run.py
```

**Terminal 3: React Frontend**
```bash
cd client
npm run dev
```

**Access the application:** http://localhost:5173

---

## 📁 Project Structure

```
csec08-research-platform/
│
├── client/                      # React Frontend
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/           # Authentication feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.jsx        # Traditional login
│   │   │   │   │   ├── WalletLogin.jsx      # DID login
│   │   │   │   │   └── AdminReset.jsx       # Kiosk reset
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useWeb3Auth.js       # DID logic
│   │   │   │   │   └── useTelemetry.js      # Tracking
│   │   │   └── survey/
│   │   ├── api/
│   │   │   └── axios.js                     # API client
│   │   └── App.jsx
│   └── package.json
│
├── server/                      # Python Flask Backend
│   ├── app/
│   │   ├── auth/
│   │   │   ├── routes.py                    # API endpoints
│   │   │   └── services.py                  # Business logic
│   │   ├── models.py                        # SQLAlchemy models
│   │   └── __init__.py
│   ├── requirements.txt
│   └── run.py
│
├── blockchain/                  # Hardhat Configuration
│   ├── hardhat.config.js                    # Network config
│   └── package.json
│
├── database/
│   └── schema.sql                           # PostgreSQL schema
│
└── docs/
    ├── SETUP_GUIDE.md                       # Lab setup protocol
    └── API_DOCUMENTATION.md
```

---

## 🔐 Security Architecture

### DID Authentication Flow (EIP-191)

```
1. [Browser] Connect to MetaMask
   └─> User approves connection (identification)

2. [Frontend → Backend] Request nonce
   GET /api/auth/nonce/<address>
   └─> Backend generates cryptographically secure nonce

3. [Frontend] Sign challenge
   personal_sign(message + nonce)
   └─> MetaMask displays message to user
   └─> User clicks "Sign"
   └─> Returns signature (r, s, v)

4. [Frontend → Backend] Submit signature
   POST /api/auth/verify
   {address, signature}
   └─> Backend reconstructs message hash (EIP-191 prefix)
   └─> Recovers signer address via ECDSA
   └─> Compares recovered address === claimed address
   └─> Issues JWT if match

5. [Backend → Frontend] Session token
   JWT containing {user_id, auth_method, role}
```

### Security Features

- **No Private Key Transmission:** Keys never leave MetaMask
- **Replay Protection:** Single-use nonces with 5-minute expiration
- **Transaction Isolation:** EIP-191 prefix prevents signing disguised transactions
- **Phishing Resistance:** Cannot forge signatures without private key
- **Stateless Sessions:** JWT-based authentication

---

## 📈 Data Collection Protocol

### Telemetry Capture Points

```javascript
// Client-side (React)
TaskTimer.start()  // On component mount or focus
  ↓
MouseTracker.sample()  // Every 100ms
  ↓
User interacts (login button click / signature)
  ↓
TaskTimer.stop()
  ↓
Calculate metrics:
  - time_taken_ms
  - hesitation_score = totalDistance / optimalDistance
  - mouse_total_distance
  - mouse_idle_time_ms
  ↓
POST to backend with telemetry payload
```

### Privacy-Preserving Design

- **Raw coordinates are NOT stored** (only aggregated metrics)
- **No behavioral fingerprinting** (prevents participant identification)
- **Minimal data retention** (only research-relevant fields)

---

## 🧪 Testing Protocol

### Pre-Testing Checklist

- [ ] Hardhat node running (localhost:8545)
- [ ] Flask backend running (localhost:5000)
- [ ] React frontend running (localhost:5173)
- [ ] MetaMask configured with Hardhat network
- [ ] 10 test accounts imported to MetaMask
- [ ] Database schema loaded
- [ ] Test login successful (both methods)

### Between Participants

1. Press `Ctrl+Shift+X` (admin reset)
2. Verify MetaMask disconnected
3. Verify clean login screen
4. Welcome next participant

### End of Day

```bash
# Export telemetry data
python scripts/export_data.py --date today

# Backup database
pg_dump csec08_research > backups/backup_$(date +%Y%m%d).sql
```

---

## 📊 Data Analysis

### SQL Queries for Research

**Compare median login times:**
```sql
SELECT 
  auth_method,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_taken_ms) as median_time_ms
FROM auth_logs
WHERE success = true
GROUP BY auth_method;
```

**Calculate success rates:**
```sql
SELECT 
  auth_method,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM auth_logs
GROUP BY auth_method;
```

**Analyze hesitation patterns:**
```sql
SELECT 
  auth_method,
  AVG(hesitation_score) as avg_hesitation,
  STDDEV(hesitation_score) as stddev_hesitation
FROM auth_logs
WHERE success = true AND hesitation_score IS NOT NULL
GROUP BY auth_method;
```

---

## 🔧 Troubleshooting

### Common Issues

**"MetaMask nonce too high"**
```
Solution: Settings → Advanced → Reset Account
```

**"Cannot connect to backend"**
```bash
# Check Flask is running
curl http://localhost:5000/api/auth/session

# Check CORS configuration in app/__init__.py
```

**"Hardhat connection refused"**
```bash
# Verify Hardhat is running
curl http://127.0.0.1:8545

# Restart node
cd blockchain && npx hardhat node
```

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete lab setup protocol
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Backend endpoints
- **[Research Protocol](docs/RESEARCH_PROTOCOL.md)** - Testing procedures

---

## 🤝 Contributing

This is a research project. For technical issues or suggestions:

1. Check existing issues
2. Create detailed bug report
3. Include: OS, browser version, error logs

---

## 📄 License

MIT License - See LICENSE file

---

## 👥 Research Team

**Principal Investigator:** [Your Name]  
**Institution:** [Your University]  
**Department:** Computer Science / Cybersecurity  
**Email:** [your.email@university.edu]

---

## 📖 Citation

If you use this platform in your research, please cite:

```bibtex
@mastersthesis{yourname2024did,
  title={Usability Analysis of DID-Based Authentication in Higher Education},
  author={Your Name},
  year={2024},
  school={Your University},
  type={Final Year Project}
}
```

---

## 🙏 Acknowledgments

- **Web3 Foundation** for DID standards
- **MetaMask** for wallet infrastructure
- **Hardhat** for local blockchain tooling
- **Research participants** for their valuable time

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Active Research

For questions or technical support, contact: [your.email@university.edu]