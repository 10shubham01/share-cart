# ShareCart - Group Grocery Tracking & Expense Sharing

A comprehensive web application for managing group grocery shopping, expense tracking, and expense sharing built with Nuxt 3, Supabase, and Nuxt UI.

## Features

### 🔐 User Authentication
- **Email/Password Registration & Login**: Secure user registration and authentication
- **Google OAuth Integration**: One-click sign-in with Google accounts
- **Automatic Username Generation**: Automatically generates usernames for Google users
- **Profile Management**: User profiles with avatars and personal information

### 👥 Group Management
- **Create Groups**: Users can create groups for collaborative shopping
- **Member Management**: Add/remove members with admin controls
- **Join Requests**: Users can request to join groups with admin approval
- **Role-based Access**: Admin and member roles with different permissions

### 🛒 Shopping Lists
- **Create Shopping Lists**: Individual or group-based shopping lists
- **Grocery Item Management**: Comprehensive grocery item database with categories
- **Item Categories**: Organized items by categories (Fruits & Vegetables, Dairy, etc.)
- **Quantity & Price Tracking**: Track quantities and prices for each item

### 💰 Expense Tracking
- **Expense Recording**: Record expenses with date, store, and notes
- **Group Expenses**: Track expenses shared within groups
- **Expense Sharing**: Automatically calculate and share expenses among group members
- **Payment Status Tracking**: Track who has paid their share

### 📊 Reports & Analytics
- **Visual Dashboards**: Interactive charts and graphs
- **Category-wise Spending**: Pie charts showing spending by category
- **Monthly Trends**: Line charts showing spending trends over time
- **Filterable Reports**: Filter by group, date range, or category
- **Export Functionality**: Export reports to PDF, Excel, or CSV

### 📧 Notifications & Communication
- **Email Reports**: Monthly email summaries sent to groups
- **In-app Notifications**: Real-time notifications for expense shares
- **Weekly Summaries**: Automated weekly expense summaries

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **UI Framework**: Nuxt UI 3, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel, Netlify, or any static hosting

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- **users**: User profiles and authentication data
- **groups**: Group information and admin details
- **group_members**: Group membership and roles
- **categories**: Grocery item categories
- **grocery_items**: Master list of grocery items
- **shopping_lists**: Shopping list management
- **shopping_list_items**: Items within shopping lists
- **expenses**: Expense records
- **expense_items**: Individual items within expenses
- **expense_shares**: Expense sharing and payment tracking
- **notifications**: User notifications

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd share-cart-01
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Supabase

#### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

#### Configure Environment Variables
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

#### Set Up the Database
Run the following SQL commands in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery items table
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id),
  default_price DECIMAL(10,2),
  unit VARCHAR(50) DEFAULT 'piece',
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping lists table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list items table
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  grocery_item_id UUID NOT NULL REFERENCES grocery_items(id),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10,2),
  notes TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES users(id),
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id),
  group_id UUID REFERENCES groups(id),
  created_by UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  store_name VARCHAR(255),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense items table
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  grocery_item_id UUID NOT NULL REFERENCES grocery_items(id),
  quantity DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense shares table
CREATE TABLE expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color, icon) VALUES
('Fruits & Vegetables', '#10B981', 'i-lucide-apple'),
('Dairy & Eggs', '#F59E0B', 'i-lucide-milk'),
('Meat & Fish', '#EF4444', 'i-lucide-fish'),
('Grains & Cereals', '#8B5CF6', 'i-lucide-wheat'),
('Snacks & Beverages', '#F97316', 'i-lucide-coffee'),
('Household', '#6B7280', 'i-lucide-home'),
('Personal Care', '#EC4899', 'i-lucide-heart'),
('Frozen Foods', '#06B6D4', 'i-lucide-snowflake'),
('Bakery', '#D97706', 'i-lucide-bread'),
('Others', '#9CA3AF', 'i-lucide-package');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_grocery_items_category_id ON grocery_items(category_id);
CREATE INDEX idx_shopping_lists_group_id ON shopping_lists(group_id);
CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_purchase_date ON expenses(purchase_date);
CREATE INDEX idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

### 4. Configure Google OAuth (Optional)
1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add the client ID and secret to Supabase Auth settings

### 5. Run the Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 6. Build for Production
```bash
pnpm build
```

## Usage

### Getting Started
1. **Sign Up/Login**: Create an account or sign in with Google
2. **Create a Group**: Start by creating a group for your household or roommates
3. **Add Grocery Items**: Add common grocery items to your database
4. **Create Shopping Lists**: Create shopping lists for your group
5. **Track Expenses**: Record expenses and share them with group members
6. **View Reports**: Analyze spending patterns and generate reports

### Key Workflows

#### Group Management
1. Create a group and invite members
2. Members request to join
3. Admin approves/rejects requests
4. Group members can create shopping lists and track expenses

#### Shopping & Expense Tracking
1. Create a shopping list with items
2. Mark items as purchased when shopping
3. Record the total expense
4. System automatically calculates shares for group members
5. Members can mark their shares as paid

#### Reporting
1. View dashboard with spending overview
2. Filter reports by date range and group
3. Export reports in various formats
4. Receive monthly email summaries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
