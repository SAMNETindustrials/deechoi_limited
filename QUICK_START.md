# DEECHOI LIMITED - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Development Server
```bash
cd /vercel/share/v0-project
pnpm dev
```
Server will run on `http://localhost:3000`

### Step 2: Visit the Storefront
Open your browser and go to:
```
http://localhost:3000
```

You'll see:
- DEECHOI logo in the top left
- Navigation menu (About Us, Contact Us, Our Products, Book Us)
- Shopping cart icon
- Search bar for products
- Orange and dark navy branding colors matching the logo

### Step 3: Access the Admin Dashboard
Go to:
```
http://localhost:3000/admin/login
```

**First Time Setup:**
1. Click "Sign Up" link
2. Enter your email and password
3. Confirm your email (check spam folder)
4. Login with your credentials

**After Login:**
- You'll be redirected to `/admin/dashboard`
- Choose between:
  - **Store Inventory** - Manage products for sale
  - **Stock Inventory** - Manage raw materials and create purchase invoices

---

## 📍 Key URLs

### Customer Facing
| Page | URL | Purpose |
|------|-----|---------|
| Home/Products | `/` | Browse and order meals |
| About Us | `/about` | Company info and mission |
| Contact Us | `/contact` | Location, phone, email |
| Book Us | `/book` | Event booking form |
| Shopping Cart | `/cart` | View/manage cart items |
| Order Confirmation | `/order-confirmation/[id]` | Order receipt |

### Admin Only (Requires Login)
| Page | URL | Purpose |
|------|-----|---------|
| Login | `/admin/login` | Admin authentication |
| Dashboard | `/admin/dashboard` | Main admin hub |
| Store Inventory | `/admin/store-inventory` | Product management |
| Stock Inventory | `/admin/stock-inventory` | Raw materials & invoices |

---

## 🎯 Common Tasks

### Adding Your First Product
1. Login to admin dashboard (`/admin/login`)
2. Click **"Store Inventory"**
3. Click **"Add Product"**
4. Fill in:
   - **Name**: "Jollof Rice"
   - **Price**: "2500"
   - **Category**: "Rice & Foods"
   - **Stock Quantity**: "20"
   - **In Stock**: Toggle ON
5. Click **"Save Product"**
6. Product appears on homepage immediately!

### Managing Stock Items
1. Login and go to `/admin/stock-inventory`
2. Select **"Stock Items"** tab
3. Click **"Add Item"**
4. Enter:
   - **Name**: "Fresh Fish"
   - **Unit**: "kg"
   - **Current Quantity**: "50"
   - **Unit Price**: "3500"
   - **Reorder Level**: "20"
   - **Supplier**: "Market Supplies"
5. Click **"Save"**

### Creating a Purchase Order
1. Go to `/admin/stock-inventory`
2. Click **"Restock Invoices"** tab
3. Click **"Create New Invoice"**
4. Select items to order (e.g., Fish, Meat, Pepper)
5. Enter quantities
6. Review total cost
7. Click **"Generate Invoice"**
8. Click **"Download PDF"** to share with purchasing team

---

## 🎨 Branding & Design

### Colors
- **Primary (Orange)**: Used for buttons, links, highlights
- **Secondary (Dark Navy)**: Used for headers, footers, main text
- **Background (Cream)**: Light, clean backdrop
- **Accents**: Orange highlights for CTAs

### Logo
- DEECHOI logo displays in header (top left)
- Shows on all pages
- Mobile-responsive

### Typography
- Clean, modern font (Geist)
- Professional appearance
- Accessible sizing

---

## 📋 Menu Categories

When adding products, use these categories:

1. **Soups** - Banga, Egusi, Afang, Oha, Edikiakong, Fisherman Soup
2. **Rice & Foods** - Jollof, Fried Rice, Pasta, Plain Rice with Stew
3. **Proteins** - Chicken (Lap, Schnitzel, Wings), Beef (Fried), Fish (Baked)
4. **Salads** - Green Salad, Coleslaw
5. **Chips** - Plantain Chips, Potato Chips
6. **Pastries** - Chinchin, Meat Pie, Burger, Puff Puff, Tacos, Doughnut, Fish Pie, Sandwich, Shawarma
7. **Cakes** - Vanilla, Red Velvet, Chocolate, Birthday Cakes (Pre-order)
8. **Drinks** - Fresh Juice, Cucumber, Orange, Pineapple, Watermelon, Coconut & Mango, Mixed Fruit
9. **Book Us** - Event packages (Small Chops, Sandwiches, Wings, Lucky Packs, Platters)

---

## 💰 Pricing Tips

All prices are in **Nigerian Naira (₦)**

**Example Pricing:**
- Soups: ₦1,500 - ₦2,500
- Rice Dishes: ₦2,000 - ₦3,000
- Proteins (per piece): ₦1,000 - ₦2,000
- Pastries: ₦500 - ₦1,500
- Drinks: ₦500 - ₦1,500
- Cakes (per slice): ₦800 - ₦1,500

---

## 📞 Contact Information

**DEECHOI LIMITED**
- **Address**: Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria
- **Phone**: +234 704 614 5982
- **Email**: deechoi01@gmail.com
- **Hours**: Mon-Fri 9AM-8PM, Sat 10AM-9PM, Sun 12PM-7PM

---

## 🔐 Admin Credentials

For testing admin features without signing up:

1. Create a test account:
   - Email: `admin@deechoi.com`
   - Password: `SecurePassword123!`

2. Or use your own email/password combination

---

## 🛠️ Troubleshooting

### Products not showing?
- Ensure "In Stock" toggle is ON
- Check that category is filled in
- Wait 2-3 seconds for real-time sync

### Can't login to admin?
- Check that email is confirmed (check spam folder)
- Ensure password is correct
- Try password reset if needed

### Images not loading?
- Add image URL when creating product (optional)
- Or leave empty to skip images for now

### Cart not working?
- Ensure CartProvider is active (check layout.tsx)
- Clear browser cache if needed
- Check browser console for errors

---

## 📱 Mobile Responsiveness

The app is fully responsive:
- **Desktop** (1200px+): Full layout with navigation
- **Tablet** (768px - 1199px): Optimized layout
- **Mobile** (below 768px): Mobile menu, stacked layout

---

## 🚀 Deployment

Ready to go live? Deploy to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables (Supabase keys)
4. Deploy with one click
5. Share your live link

---

## 📚 Documentation

For detailed information, see:
- `README.md` - Full project documentation
- `ADMIN_GUIDE.md` - Detailed admin instructions
- `QUICK_START.md` - This file

---

## 🎓 Next Steps

1. **Add Products** - Start adding your menu items
2. **Test Ordering** - Try placing a test order
3. **Setup Admin** - Create admin account and test dashboard
4. **Customize** - Update company info, colors, content
5. **Deploy** - Launch to production on Vercel

---

## ❓ Need Help?

- Check the `ADMIN_GUIDE.md` for detailed instructions
- Review `README.md` for full documentation
- Contact: deechoi01@gmail.com or +234 704 614 5982

---

**Happy selling! 🍽️**
