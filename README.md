# 🛍️ MaxShop — Premium Digital Access

> Platform jual beli akun digital premium (Netflix, CapCut, Disney+, YouTube) dengan sistem struk otomatis via WhatsApp.

![MaxShop](https://img.shields.io/badge/MaxShop-Premium-0066ff?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![HTML](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-orange?style=for-the-badge)

---

## ✨ Fitur Utama

- 🛒 **Katalog Produk** — Tampilkan produk digital premium dengan UI premium dark mode
- 📋 **Checkout Dinamis** — Halaman order otomatis menyesuaikan produk yang dipilih
- 📲 **Struk WhatsApp** — Setelah checkout, struk dikirim otomatis ke WhatsApp admin
- 🔐 **Admin Dashboard** — Panel admin dengan auth JWT untuk kelola produk & pesanan
- 🚀 **REST API** — Backend Express.js dengan endpoint lengkap

---

## 📁 Struktur Project

```
MAXSHOP WEBSITE/
├── index.html            # Halaman utama (Home)
├── login.html            # Halaman login
├── checkout.html         # Halaman order & struk WA
├── admin-overview.html   # Dashboard admin
├── admin-products.html   # Manajemen produk
├── admin-settings.html   # Pengaturan admin
├── .gitignore
├── README.md
└── backend/
    ├── server.js         # Express.js server utama
    ├── package.json
    └── .env.example      # Template env variables
```

---

## 🚀 Cara Menjalankan

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/maxshop-website.git
cd maxshop-website
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env   # Lalu edit .env sesuai kebutuhan
node server.js
```

### 3. Buka Website

Setelah server jalan, buka browser ke:
```
http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| `POST` | `/api/auth/login` | Public | Login admin |
| `GET` | `/api/products` | Public | Daftar produk |
| `POST` | `/api/products` | Admin | Tambah produk |
| `PUT` | `/api/products/:id` | Admin | Edit produk |
| `DELETE` | `/api/products/:id` | Admin | Hapus produk |
| `POST` | `/api/orders` | Public | Buat pesanan |
| `GET` | `/api/orders` | Admin | Daftar pesanan |
| `PATCH` | `/api/orders/:id/status` | Admin | Update status |
| `GET` | `/api/stats` | Admin | Statistik dashboard |

### Contoh Login Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"maxshop2024"}'
```

---

## ⚙️ Konfigurasi `.env`

```env
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=maxshop2024
ADMIN_EMAIL=admin@maxshop.id
JWT_SECRET=ganti_dengan_string_random_panjang
WA_NUMBER=62895393870131
SESSION_SECRET=ganti_juga_ini
```

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS (Tailwind CDN), JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Session**: express-session

---

## 📞 Kontak

WhatsApp Admin: [+62 895-3938-70131](https://wa.me/62895393870131)

---

> © 2024 MaxShop Digital. All rights reserved.
