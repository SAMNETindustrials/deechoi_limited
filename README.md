# DEECHOI LIMITED - Edible Menu Management System

A comprehensive food ordering and inventory management system for DEECHOI LIMITED, featuring a modern storefront for customers and a powerful admin dashboard for operations management.

## 🎯 Quick Start

### For Customers
1. Visit the homepage at `/`
2. Browse the menu catalog
3. Search for specific meals or snacks
4. Add items to cart
5. Proceed to checkout

### For Admin
1. Go to `/admin/login`
2. Create an account or login with existing credentials
3. Access the dashboard at `/admin/dashboard`
4. Choose between Store Inventory or Stock Inventory management

## 📋 Features

### Storefront Features
- ✅ Beautiful product catalog with real-time filtering
- ✅ Search functionality across all menu items
- ✅ Shopping cart with add/remove/quantity management
- ✅ Order confirmation system
- ✅ Responsive design for mobile and desktop
- ✅ Real-time inventory status (In Stock / Out of Stock)
- ✅ Navigation pages: About Us, Contact Us, Our Products, Book Us

### Admin Dashboard
- ✅ Secure authentication with Supabase
- ✅ **Store Inventory Management**
  - Add/Edit/Delete products
  - Manage prices and stock levels
  - Toggle product availability
  - Organize products by category
- ✅ **Stock Inventory Management**
  - Track raw ingredients (Fish, Meat, Pepper, etc.)
  - Monitor stock levels and reorder points
  - Generate restock invoices for purchasing
  - Print/download invoices as PDF
  - Supplier management

### Additional Pages
- **About Us** (`/about`) - Company mission, values, and story
- **Contact Us** (`/contact`) - Location, phone, email, and contact form
- **Book Us** (`/book`) - Event booking system for special occasions

## 🏗️ Project Structure

```
project/
├── app/
│   ├── page.tsx                 # Storefront homepage
│   ├── about/page.tsx           # About Us page
│   ├── contact/page.tsx         # Contact Us page
│   ├── book/page.tsx            # Book Us for events page
│   ├── cart/page.tsx            # Shopping cart page
│   ├── order-confirmation/      # Order confirmation page
│   ├── admin/
│   │   ├── login/page.tsx       # Admin login
│   │   ├── dashboard/page.tsx   # Admin dashboard landing
│   │   ├── store-inventory/     # Store product management
│   │   └── stock-inventory/     # Raw materials management
│   ├── auth/callback/route.ts   # Supabase auth callback
│   ├── globals.css              # Tailwind theme colors
│   └── layout.tsx               # Root layout with providers
├── components/
│   ├── storefront/
│   │   ├── header.tsx           # Navigation header with logo
│   │   └── product-card.tsx     # Product display card
│   └── ui/                      # Shadcn UI components
├── lib/
│   ├── cart-context.tsx         # Cart state management
│   └── supabase/                # Supabase client setup
├── middleware.ts                # Supabase auth middleware
├── ADMIN_GUIDE.md               # Detailed admin instructions
└── README.md                    # This file
```

## 🔐 Access Credentials & Contact Info

**Company:** DEECHOI LIMITED

**Address:** Eze Nvuigwe Avenue, Woji  
Port Harcourt, Rivers State, Nigeria

**Phone:** +234 704 614 5982

**Email:** deechoi01@gmail.com

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/pnpm
- Supabase account (database and authentication)
- Modern web browser

### Installation

1. **Clone or download the project**
   ```bash
   cd /vercel/share/v0-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🛒 Using the Storefront

### Browsing Products
1. Homepage displays all available products in a grid
2. Use the search bar to find specific items
3. Products show:
   - Product image
   - Name and description
   - Price in Naira (₦)
   - Stock status (In Stock / Out of Stock)

### Adding to Cart
1. Click "Add to Cart" on any product
2. Item count updates in header cart icon
3. Click the cart icon to view your cart

### Checkout
1. Review items in cart
2. Modify quantities or remove items
3. Enter your details (name, email, phone)
4. Review order summary
5. Click "Place Order"
6. Receive order confirmation with order ID

## 🔧 Admin Dashboard Usage

### Login & Access
1. Navigate to `/admin/login`
2. Sign up with your email and password (first time only)
3. Confirm your email
4. Login with credentials
5. Access dashboard at `/admin/dashboard`

### Store Inventory Management (`/admin/store-inventory`)

**Adding a Product:**
1. Click "Add Product"
2. Fill in:
   - Product Name (e.g., "Jollof Rice")
   - Description (e.g., "Flavorful rice with spices")
   - Price in Naira
   - Category (from predefined list)
   - Image URL (optional)
   - Stock Quantity
   - Toggle "In Stock" status
3. Click "Save Product"

**Editing a Product:**
1. Find product in list
2. Click "Edit"
3. Update information
4. Click "Update"

**Deleting a Product:**
1. Find product in list
2. Click "Delete"
3. Confirm deletion

**Available Categories:**
- Soups (Banga, Egusi, Afang, etc.)
- Rice & Foods (Jollof, Fried, Pasta)
- Proteins (Chicken, Beef, Fish)
- Salads (Green Salad, Coleslaw)
- Chips (Plantain, Potato)
- Pastries (Meat Pie, Burger, Shawarma)
- Cakes (Vanilla, Red Velvet, Chocolate)
- Drinks (Fresh Juice, Orange, Pineapple)
- Book Us (Event packages)

### Stock Inventory Management (`/admin/stock-inventory`)

#### Stock Items Tab
**Add Raw Materials:**
1. Click "Add Stock Item"
2. Enter:
   - Item Name (e.g., "Fresh Fish")
   - Unit (kg, lbs, packs)
   - Current Quantity
   - Unit Price
   - Reorder Level
   - Supplier Name
3. Click "Save"

**Monitor Inventory:**
- View all stock items in table
- Identify items below reorder level (highlighted)
- Edit quantities as items are used
- Delete discontinued items

#### Restock Invoices Tab
**Create Purchase Orders:**
1. Click "Create Invoice"
2. Select stock items to reorder
3. Enter quantities needed
4. System calculates total cost
5. Click "Generate Invoice"

**Manage Invoices:**
- View all invoices and their status
- Download as PDF
- Print for purchasing team
- Track invoice history

## 🎨 Design & Branding

### Logo
DEECHOI LIMITED logo is displayed in:
- Header navigation
- Footer
- Storefront pages

### Color Scheme
- **Primary (Orange):** oklch(0.58 0.22 40) - Main brand color
- **Secondary (Dark Navy):** oklch(0.18 0.02 35) - Headers and footers
- **Accent (Orange):** Used for highlights and CTA buttons
- **Neutral (Cream/White):** Background and cards

### Typography
- **Font Family:** Geist (headings and body)
- **Font Mono:** Geist Mono (code and special text)

## 📱 Pages Overview

| Page | URL | Purpose |
|------|-----|---------|
| Storefront | `/` | Main product catalog and shopping |
| About Us | `/about` | Company mission and values |
| Contact Us | `/contact` | Location, phone, email, contact form |
| Book Us | `/book` | Event booking system |
| Shopping Cart | `/cart` | View and manage cart items |
| Order Confirmation | `/order-confirmation/[id]` | Order receipt and details |
| Admin Login | `/admin/login` | Authentication for admin users |
| Dashboard | `/admin/dashboard` | Admin main dashboard |
| Store Inventory | `/admin/store-inventory` | Product management |
| Stock Inventory | `/admin/stock-inventory` | Raw materials management |

## 🔗 Navigation Menu

Header navigation includes:
- **About Us** → `/about`
- **Contact Us** → `/contact`
- **Our Products** → `/`
- **Book Us** → `/book`
- **Shopping Cart Icon** → `/cart`

## 💳 Payment Processing

Currently, the system supports order placement with manual payment confirmation. For future integration:
- Monify payment gateway integration (in progress)
- Stripe integration option available
- PayStack integration available

## 🗄️ Database Schema

### Tables
- `store_products` - Menu items for sale
- `stock_items` - Raw ingredients inventory
- `restock_invoices` - Purchase orders
- `restock_invoice_items` - Invoice line items
- `orders` - Customer orders
- `order_items` - Order line items
- `admin_users` - Admin authentication

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Secure authentication with Supabase
- ✅ Admin-only access to management features
- ✅ Email verification for admin accounts
- ✅ Session management with HTTP-only cookies

## 📧 Support & Contact

For technical support or questions:
- **Email:** deechoi01@gmail.com
- **Phone:** +234 704 614 5982
- **Address:** Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria

## 📄 License

DEECHOI LIMITED © 2026. All rights reserved.

## 🚀 Deployment

To deploy on Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy with a single click

```bash
git push origin main
# Deploy via Vercel dashboard
```

## 📞 Getting Help

1. Check `ADMIN_GUIDE.md` for detailed admin instructions
2. Review feature documentation in this README
3. Contact: deechoi01@gmail.com or +234 704 614 5982
4. Check browser console for error messages

---

**Made with ❤️ for DEECHOI LIMITED**
