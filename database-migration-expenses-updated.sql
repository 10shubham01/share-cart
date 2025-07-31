-- Create expenses table (without category)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_shares table to track which friends are involved in each expense
CREATE TABLE IF NOT EXISTS expense_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_amount DECIMAL(10,2),
    share_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(expense_id, user_id, friend_id)
);

-- Create expense_items table to track individual items in an expense
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (created_by = auth.uid());

-- Expense shares policies
CREATE POLICY "Users can view expense shares they're involved in" ON expense_shares
    FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can insert expense shares they create" ON expense_shares
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update expense shares they're involved in" ON expense_shares
    FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Expense items policies
CREATE POLICY "Users can view expense items for their expenses" ON expense_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = expense_items.expense_id 
            AND expenses.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert expense items for their expenses" ON expense_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = expense_items.expense_id 
            AND expenses.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update expense items for their expenses" ON expense_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = expense_items.expense_id 
            AND expenses.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete expense items for their expenses" ON expense_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM expenses 
            WHERE expenses.id = expense_items.expense_id 
            AND expenses.created_by = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_user_id ON expense_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_friend_id ON expense_shares(friend_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_shares_updated_at BEFORE UPDATE ON expense_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_items_updated_at BEFORE UPDATE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 