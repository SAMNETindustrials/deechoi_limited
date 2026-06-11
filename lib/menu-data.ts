export interface MenuItem {
  id: string
  category: string
  name: string
  description?: string
}

export const MENU_DATA: MenuItem[] = [
  // Soups
  { id: '1', category: 'Soups', name: 'Draw Soup', description: 'Traditional Nigerian soup' },
  { id: '2', category: 'Soups', name: 'Banga Soup', description: 'Creamy coconut-based soup' },
  { id: '3', category: 'Soups', name: 'Egusi Soup', description: 'Melon seed soup' },
  { id: '4', category: 'Soups', name: 'Afang Soup', description: 'Leafy vegetable soup' },
  { id: '5', category: 'Soups (Preorder)', name: 'Oha Soup', description: 'Bitter leaf soup' },
  { id: '6', category: 'Soups (Preorder)', name: 'Edikiakong', description: 'Waterleaf & pumpkin soup' },
  { id: '7', category: 'Soups (Preorder)', name: 'Fisherman Soup', description: 'Seafood based soup' },

  // Swallows
  { id: '8', category: 'Swallows', name: 'Garri', description: 'Cassava-based swallow' },
  { id: '9', category: 'Swallows', name: 'Semolina', description: 'Wheat-based swallow' },

  // Rice & Grains
  { id: '10', category: 'Rice & Grains', name: 'Native Rice', description: 'Traditional parboiled rice' },
  { id: '11', category: 'Rice & Grains', name: 'Jollof Rice', description: 'Spiced red rice' },
  { id: '12', category: 'Rice & Grains', name: 'Special Fried Rice', description: 'Mixed vegetables & protein' },
  { id: '13', category: 'Rice & Grains', name: 'Plain Rice & Stew', description: 'Simple and classic' },

  // Pasta
  { id: '14', category: 'Pasta', name: 'Stir Fry Pasta', description: 'Asian-style pasta' },
  { id: '15', category: 'Pasta', name: 'Basil Tomato Pasta', description: 'Italian-inspired' },
  { id: '16', category: 'Pasta', name: 'Yum Pasta & Stew', description: 'Special house blend' },

  // Proteins - Chicken
  { id: '17', category: 'Chicken', name: 'Chicken Lap', description: 'Fried chicken pieces' },
  { id: '18', category: 'Chicken', name: 'Chicken Schnitzel', description: 'Breaded chicken cutlet' },
  { id: '19', category: 'Chicken', name: 'Chicken Wings', description: 'Crispy baked wings' },

  // Proteins - Beef
  { id: '20', category: 'Beef', name: 'Fried Beef', description: 'Tender fried beef' },

  // Proteins - Fish
  { id: '21', category: 'Fish', name: 'Overbaked Fish', description: 'Oven-baked seasoned fish' },

  // Salads
  { id: '22', category: 'Salads', name: 'Green Salad', description: 'Fresh garden vegetables' },
  { id: '23', category: 'Salads', name: 'Coleslaw', description: 'Cabbage-based salad' },

  // Chips
  { id: '24', category: 'Chips', name: 'Plantain Chips', description: 'Crispy fried plantain' },
  { id: '25', category: 'Chips', name: 'Potato Chips', description: 'Golden fried potatoes' },

  // Pastries
  { id: '26', category: 'Pastries', name: 'Chinchin', description: 'Crunchy fried snack' },
  { id: '27', category: 'Pastries', name: 'Meat Pie', description: 'Savory pastry' },
  { id: '28', category: 'Pastries', name: 'Chicken Burger', description: 'Chicken filled burger' },
  { id: '29', category: 'Pastries', name: 'Beef Burger', description: 'Beef filled burger' },
  { id: '30', category: 'Pastries', name: 'Puff Puff', description: 'With sweet chocolate & caramel' },
  { id: '31', category: 'Pastries', name: 'Chicken Taco', description: 'Mexican-style taco' },
  { id: '32', category: 'Pastries', name: 'Beef Taco', description: 'Beef-filled taco' },
  { id: '33', category: 'Pastries', name: 'Mixed Taco', description: 'Mixed proteins taco' },
  { id: '34', category: 'Pastries', name: 'Doughnut', description: 'Soft fried doughnut' },
  { id: '35', category: 'Pastries', name: 'Fish Pie', description: 'Fish-filled pastry' },
  { id: '36', category: 'Pastries', name: 'Chicken Sandwich', description: 'Fresh sandwich' },
  { id: '37', category: 'Pastries', name: 'Chicken Shawarma', description: 'Spiced chicken wrap' },
  { id: '38', category: 'Pastries', name: 'Beef Shawarma', description: 'Spiced beef wrap' },
  { id: '39', category: 'Pastries', name: 'Mixed Shawarma', description: 'Mixed protein wrap' },

  // Desserts
  { id: '40', category: 'Desserts', name: 'Vanilla Cake Slice', description: 'Classic vanilla flavor' },
  { id: '41', category: 'Desserts', name: 'Red Velvet Cake Slice', description: 'Rich velvet flavor' },
  { id: '42', category: 'Desserts', name: 'Chocolate Cake Slice', description: 'Decadent chocolate' },
  { id: '43', category: 'Desserts', name: 'Birthday Cake (Preorder)', description: '6", 8", 10" sizes available' },
  { id: '44', category: 'Desserts', name: 'Bento Cakes', description: 'Individual sized cakes' },
  { id: '45', category: 'Desserts', name: 'Cupcakes', description: 'Assorted flavors' },

  // Drinks
  { id: '46', category: 'Fresh Juices', name: 'Cucumber Juice', description: 'Refreshing cucumber blend' },
  { id: '47', category: 'Fresh Juices', name: 'Orange Juice', description: 'Fresh squeezed orange' },
  { id: '48', category: 'Fresh Juices', name: 'Pineapple Juice', description: 'Tropical pineapple' },
  { id: '49', category: 'Fresh Juices', name: 'Watermelon Juice', description: 'Hydrating watermelon' },
  { id: '50', category: 'Fresh Juices', name: 'Coconut & Mango Juice', description: 'Tropical blend' },
  { id: '51', category: 'Fresh Juices', name: 'Mixed Fruit Juice', description: 'Choose your flavors' },

  // Book Us Items
  { id: '52', category: 'Book Us', name: 'Sandwich', description: 'For events' },
  { id: '53', category: 'Book Us', name: 'Sausage Roll', description: 'For events' },
  { id: '54', category: 'Book Us', name: 'Small Chops', description: 'For events' },
  { id: '55', category: 'Book Us', name: 'Chicken Wings', description: 'For events' },
  { id: '56', category: 'Book Us', name: 'Lucky Pack', description: 'Surprise assortment' },
  { id: '57', category: 'Book Us', name: 'Platters', description: 'Large quantities for events' },
]

export const CATEGORIES = Array.from(new Set(MENU_DATA.map(item => item.category)))

export function searchMenuItems(query: string): MenuItem[] {
  if (!query.trim()) return MENU_DATA
  
  const lowerQuery = query.toLowerCase()
  return MENU_DATA.filter(
    item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
  )
}
