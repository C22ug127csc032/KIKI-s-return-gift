# KIKI'S Return Gift Store

A full-stack e-commerce platform for return gifts — weddings, birthdays, Diwali, pooja & more.

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Icons  
**Backend:** Node.js, Express, MongoDB, Cloudinary (image uploads)

## Fonts
- **Cormorant Garamond** — Display / headings (elegant serif)
- **Plus Jakarta Sans** — Body text (clean sans-serif)

## Brand Colors
- Primary: Rose-600 (`#e11d48`) — buttons, accents, highlights
- Background: White / Rose-50 gradient
- Text: Gray-900 / Gray-500

## Folder Structure

```
KIKI-s-return-gift/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── config/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance
    │   ├── components/
    │   │   ├── layout/      # Navbar, Footer, PublicLayout, AdminLayout
    │   │   ├── shop/        # ProductCard
    │   │   └── ui/          # Loader, Skeleton, Badge, Pagination, Modal
    │   ├── context/         # AuthContext, CartContext
    │   ├── pages/
    │   │   ├── admin/       # 🔒 Admin panel (untouched)
    │   │   ├── auth/        # Login, Register
    │   │   ├── public/      # Home, Shop, Product, Cart, Checkout, Confirmation
    │   │   └── user/        # Profile, My Orders
    │   ├── routes/          # ProtectedRoute
    │   └── utils/           # pricing.js
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

## Setup

### Backend
```bash
cd backend
npm install
# Configure .env (MongoDB URI, JWT secret, Cloudinary keys)
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Configure .env (VITE_API_BASE_URL, VITE_WHATSAPP_NUMBER)
npm run dev
```

## Environment Variables

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WHATSAPP_NUMBER=919876543210
```

**backend/.env**
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Features

### Public Frontend (New UI)
- 🏠 **Homepage** — Hero with animated gift cards, occasion chips, category grid, featured products, WhatsApp CTA
- 🛍️ **Shop Page** — Filterable product grid (category, occasion, price, sort), mobile filter drawer
- 🎁 **Product Detail** — Image gallery, quantity selector, WhatsApp enquiry, related products
- 🛒 **Cart** — Animated item list, free shipping indicator, order summary
- 💳 **Checkout** — Delivery form, COD / UPI / WhatsApp payment methods
- ✅ **Order Confirmation** — Order details, copy order ID, WhatsApp tracking
- 👤 **Profile** — Edit name/phone, change password
- 📦 **My Orders** — Expandable order history with invoice download

### Admin Panel (Unchanged)
- Dashboard, Orders, Products, Categories
- Suppliers, Raw Materials, Product BOM, Production
- Inventory, Offline Sales, Settings
