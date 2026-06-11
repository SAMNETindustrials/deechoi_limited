# DEECHOI LIMITED - Admin Dashboard Guide

## How to Access the Admin Dashboard

### Step 1: Navigate to Admin Login
Go to the following URL in your browser:
```
http://localhost:3000/admin/login
```

Or if deployed on Vercel:
```
https://your-domain.vercel.app/admin/login
```

### Step 2: Create Admin Account
1. Click on the **"Sign Up"** link on the login page
2. Enter your email address
3. Create a secure password
4. Click **"Create Account"**
5. You'll receive a confirmation email from Supabase - click the link to confirm your email

### Step 3: Login
Once your email is confirmed:
1. Return to `/admin/login`
2. Enter your email and password
3. Click **"Sign In"**

## Admin Dashboard Features

### Dashboard Landing Page (`/admin/dashboard`)
After login, you'll see the main dashboard with two primary buttons:

#### 1. **Store Inventory Management** (`/admin/store-inventory`)
Manage products that appear on the storefront for customers to order.

**Features:**
- **View Products**: See all products currently available
- **Add New Product**: 
  - Product Name
  - Description
  - Price
  - Image URL (optional)
  - Category (Soups, Rice & Foods, Proteins, Salads, Chips, Pastries, Cakes, Drinks, Book Us)
  - Stock Quantity
  - In Stock Status Toggle
- **Edit Products**: Update any product information
- **Delete Products**: Remove products from the catalog
- **Real-time Sync**: Changes immediately appear on the storefront

**Quick Actions:**
- Search products by name
- Filter by category
- Toggle in/out of stock status
- Bulk price updates

#### 2. **Stock Inventory Management** (`/admin/stock-inventory`)
Manage raw materials and ingredients for your kitchen operations.

**Sub-sections:**

##### A. Stock Items Tab
Manage raw ingredients (Fish, Meat, Pepper, Onions, etc.)

**Features:**
- Add Stock Items:
  - Item Name (e.g., "Fresh Fish", "Ground Beef")
  - Unit (kg, lbs, packs, etc.)
  - Current Quantity
  - Unit Price
  - Reorder Level
  - Supplier Name
- Edit Stock Information
- Delete Items
- Track Current Stock vs. Reorder Level

**Actions:**
- View stock levels at a glance
- Identify items below reorder level
- Update quantities as stock is used

##### B. Restock Invoices Tab
Create purchase orders and invoices for your sales team

**Features:**
- **Create New Invoice**:
  - Generate unique invoice number (auto-generated)
  - Select stock items to reorder
  - Set quantities needed
  - System calculates total cost
- **View Invoices**: List of all invoices with status
- **Print/Download**: Generate PDF invoices for purchasing team
- **Invoice Status**: Track pending, approved, or received items

**Workflow:**
1. Click "Create New Restock Invoice"
2. Select items you need to purchase
3. Enter quantities
4. Review total cost
5. Print or download invoice
6. Share with sales/purchasing team for execution

## Step-by-Step Examples

### Example 1: Adding a New Product to Storefront

1. Go to `/admin/store-inventory`
2. Click **"Add Product"**
3. Fill in the details:
   - Name: "Jollof Rice"
   - Description: "Flavorful rice with vegetables and spices"
   - Price: 2500 (in Naira)
   - Category: "Rice & Foods"
   - Stock Quantity: 50
   - In Stock: Toggle ON
4. Click **"Save Product"**
5. Product now appears on the storefront homepage!

### Example 2: Creating a Restock Invoice

1. Go to `/admin/stock-inventory`
2. Click the **"Restock Invoices"** tab
3. Click **"Create New Invoice"**
4. Select items:
   - Fish: 50 kg
   - Ground Beef: 30 kg
   - Peppers: 20 kg
5. System shows total cost
6. Click **"Generate Invoice"**
7. Click **"Download PDF"** to send to purchasing team

### Example 3: Updating Inventory When Items Are Used

1. Go to `/admin/stock-inventory`
2. Find the item you used (e.g., "Fish")
3. Click **"Edit"**
4. Update Current Quantity (e.g., from 50kg to 42kg)
5. Click **"Update"**
6. System flags if quantity falls below reorder level

## Contact & Company Information

**Address:** Eze Nvuigwe Avenue, Woji, Port Harcourt, Rivers State, Nigeria

**Phone:** +234 704 614 5982

**Email:** deechoi01@gmail.com

## Menu Categories

All products should be organized under these categories:

1. **Soups**: Draw soup, Banga soup, Egusi soup, Afang soup, etc.
2. **Rice & Foods**: Jollof Rice, Fried Rice, Plain Rice with Stew, Pasta
3. **Proteins**: Chicken (Lap, Schnitzel, Wings), Beef (Fried), Fish (Baked)
4. **Salads**: Green Salads, Coleslaw
5. **Chips**: Plantain Chips, Potato Chips
6. **Pastries**: Chinchin, Meat Pie, Burger, Puff Puff, Tacos, Doughnut, Fish Pie, Sandwich, Shawarma
7. **Cakes**: Vanilla, Red Velvet, Chocolate, Birthday Cakes (Pre-order)
8. **Drinks**: Fresh Juice, Cucumber Juice, Orange Juice, Pineapple Juice, Watermelon Juice, Coconut & Mango Juice, Mixed Fruit Juice
9. **Book Us**: Packages for special events

## Important Notes

- ✅ Products marked "In Stock" appear on the storefront
- ✅ Products marked "Out of Stock" still appear but with a "Sold Out" badge
- ✅ Real-time synchronization - storefront updates immediately when you make changes
- ✅ All prices should be in Naira (₦)
- ✅ Stock items track raw materials for cost management
- ✅ Restock invoices help plan purchases and manage budget

## Troubleshooting

**Can't login?**
- Ensure your email is confirmed (check spam folder for confirmation email)
- Reset password if you forgot it
- Contact: deechoi01@gmail.com

**Product not appearing on storefront?**
- Ensure "In Stock" toggle is ON
- Check that all required fields are filled
- Wait a few seconds for real-time sync

**Permission denied errors?**
- Your admin account must be created first
- Ensure you're logged in (check browser console)

## Next Steps

After setup, you can:
- Customize your menu based on seasonal availability
- Monitor inventory levels
- Plan purchasing schedules
- Track sales and popular items
- Scale operations efficiently

For questions or support, contact: deechoi01@gmail.com or call +234 704 614 5982
