# 💕 LoveStream – Dating & Video Streaming Platform

A full-stack romantic platform combining **online dating** with **video streaming** and **live camera** features.

---

## 🗂️ Project Structure

```
lovestream/
├── backend/                  # Django REST API
│   ├── core/
│   │   ├── models.py         # All database models (SEO slugs)
│   │   ├── serializers.py    # DRF serializers
│   │   ├── views.py          # API views + pagination
│   │   └── urls.py           # App URL patterns
│   ├── lovestream/
│   │   ├── settings.py       # Django settings
│   │   └── urls.py           # Root URL config
│   └── requirements.txt
└── frontend/                 # React + Vite
    ├── index.html            # SEO + Bootstrap Icons
    └── src/
        ├── App.jsx           # Router + AuthContext
        ├── main.jsx          # Entry point
        ├── components/
        │   ├── Navbar/
        │   │   ├── Navbar.jsx      # Primary navbar (language, gender, search)
        │   │   ├── SubNavbar.jsx   # Secondary nav (categories dropdown)
        │   │   └── Sidebar.jsx     # Mobile drawer
        │   ├── VideoCard.jsx
        │   ├── PersonCard.jsx
        │   ├── LiveStreamCard.jsx
        │   └── PaymentModal.jsx    # M-Pesa / PayPal / Card
        ├── pages/
        │   ├── HomePage.jsx        # Hero + featured videos + people
        │   ├── VideosPage.jsx      # Paginated video grid + filters
        │   ├── VideoDetail.jsx     # Player + comments + DM + related
        │   ├── LivePage.jsx        # Live streams + pay-to-watch
        │   ├── DatingPage.jsx      # Matching with physical filters
        │   ├── ProfilePage.jsx     # Public profile + tabs
        │   ├── MessagesPage.jsx    # DM with photo sharing
        │   └── LoginPage.jsx       # Login + Register (2-step)
        ├── services/
        │   └── api.js              # All API calls + JWT auto-refresh
        └── styles/
            └── main.css            # Romantic red/white theme
```

---

## ⚡ Quick Start

### Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=lovestream
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost

# Apply migrations
python manage.py makemigrations core
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔑 Key API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/token/` | Login (get JWT) |
| POST | `/api/auth/token/refresh/` | Refresh JWT |
| GET | `/api/auth/profile/` | Get/update own profile |
| GET | `/api/videos/` | List videos (paginated, filterable) |
| GET | `/api/videos/<slug>/` | Video detail + view count |
| POST | `/api/videos/<slug>/like/` | Toggle like |
| GET/POST | `/api/videos/<slug>/comments/` | Comments |
| GET | `/api/streams/` | Live streams |
| POST | `/api/streams/<slug>/go-live/` | Start streaming |
| GET | `/api/dating/suggestions/` | Matched users |
| POST | `/api/dating/matches/send/` | Send match request |
| GET | `/api/messages/` | Conversations |
| POST | `/api/messages/start/` | Start new conversation |
| POST | `/api/payments/initiate/` | Pay via M-Pesa/PayPal/Card |
| POST | `/api/payments/callback/` | Payment gateway webhook |
| GET | `/api/search/?q=query` | Global search |

---

## 💳 Payment Integration

### M-Pesa (Daraja API)
Set in `settings.py`:
```python
MPESA_CONSUMER_KEY    = "..."
MPESA_CONSUMER_SECRET = "..."
MPESA_SHORTCODE       = "174379"
MPESA_PASSKEY         = "..."
MPESA_CALLBACK_URL    = "https://yourdomain.com/api/payments/callback/"
```

### PayPal
```python
PAYPAL_CLIENT_ID     = "..."
PAYPAL_CLIENT_SECRET = "..."
PAYPAL_MODE          = "sandbox"  # → "live" in production
```

---

## 🎨 Design System

- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Primary**: `#e01a4f` (romantic red)
- **Background**: `#fff0f3` / `#fdf8f9` (warm white/cream)
- **Accent**: `#ff5c87` (rose)

---

## 🚀 Features

| Feature | Status |
|---------|--------|
| User registration & JWT auth | ✅ |
| Dating suggestions (age/skin/height/city/goal filters) | ✅ |
| Match request system | ✅ |
| Direct messages with photo sharing | ✅ |
| Free & paid video streaming | ✅ |
| Video views, likes, comments (nested) | ✅ |
| Live camera streaming | ✅ |
| Pay-to-watch (M-Pesa / PayPal / Card) | ✅ |
| Premium subscription | ✅ |
| Paginated video grid | ✅ |
| Global search | ✅ |
| Responsive (mobile sidebar drawer) | ✅ |
| SEO slugs on all models | ✅ |
| Notifications | ✅ |