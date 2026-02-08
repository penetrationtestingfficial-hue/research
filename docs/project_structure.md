# CSEC08 Dual-Stack Authentication Platform - Complete Project Structure

```
csec08-research-platform/
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.jsx           # Traditional login UI
│   │   │   │   │   ├── WalletLogin.jsx         # DID login UI
│   │   │   │   │   ├── LoginContainer.jsx      # Unified wrapper
│   │   │   │   │   └── AdminReset.jsx          # Kiosk sanitization
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useWeb3Auth.js          # Ethers.js logic
│   │   │   │   │   ├── useTraditionalAuth.js   # Password auth
│   │   │   │   │   └── useTelemetry.js         # Timing & mouse tracking
│   │   │   │   └── context/
│   │   │   │       └── TelemetryContext.jsx    # Global telemetry state
│   │   │   └── survey/
│   │   │       └── components/
│   │   │           └── PostAuthSurvey.jsx
│   │   ├── api/
│   │   │   └── axios.js                        # API service abstraction
│   │   ├── utils/
│   │   │   ├── telemetry.js                    # Calculation utilities
│   │   │   └── errorCodes.js                   # Error mapping
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Python Flask Backend
│   ├── app/
│   │   ├── __init__.py                         # Flask app factory
│   │   ├── config.py                           # Configuration
│   │   ├── models.py                           # SQLAlchemy models
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py                       # Auth endpoints
│   │   │   ├── services.py                     # Auth business logic
│   │   │   └── utils.py                        # Crypto utilities
│   │   ├── telemetry/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py                       # Telemetry endpoints
│   │   │   └── services.py                     # Log processing
│   │   └── database/
│   │       ├── __init__.py
│   │       └── repositories.py                 # Data access layer
│   ├── migrations/                              # Alembic migrations
│   ├── requirements.txt
│   └── run.py                                   # Entry point
│
├── blockchain/                      # Hardhat Configuration
│   ├── contracts/
│   │   └── .gitkeep                            # No contracts needed
│   ├── scripts/
│   │   └── deploy.js                           # Setup script
│   ├── hardhat.config.js
│   └── package.json
│
├── docs/
│   ├── SETUP_GUIDE.md                          # Lab assistant protocol
│   ├── RESEARCH_PROTOCOL.md                    # Testing procedures
│   └── API_DOCUMENTATION.md
│
├── database/
│   └── schema.sql                              # Initial schema
│
├── docker-compose.yml                          # Optional containerization
└── README.md
```

## Key Architecture Principles

### 1. Vertical Slice Organization
- Each feature (`auth`, `telemetry`) contains all layers (UI, logic, data)
- Minimizes coupling between unrelated features
- Makes research variable modification easier

### 2. Clean Separation of Concerns
- **Presentation Layer**: React components (dumb UI)
- **Application Layer**: Hooks & Context (state management)
- **Domain Layer**: Services (business logic)
- **Infrastructure Layer**: Repositories & External APIs

### 3. Research-Specific Constraints
- All timing uses `performance.now()` for monotonic precision
- Mouse tracking aggregates data client-side (privacy-preserving)
- Local Hardhat node eliminates network latency variables
- Kiosk mode ensures clean state between participants