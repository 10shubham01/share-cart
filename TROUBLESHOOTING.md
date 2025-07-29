# Troubleshooting Authentication Issues

## Quick Steps to Fix Login Problems

### 1. Check Database Tables
The most common issue is that the database tables don't exist. Run the SQL statements in `database-setup.sql` in your Supabase SQL editor.

### 2. Test Authentication
Visit `/test-auth` to test basic authentication functionality.

### 3. Check Environment Variables
Make sure your `.env` file has the correct Supabase credentials:
```
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-anon-key"
```

### 4. Enable Email Confirmation (Optional)
If you want to require email confirmation, go to your Supabase dashboard:
- Authentication > Settings > Email Auth
- Enable "Confirm email" if needed

### 5. Check Console for Errors
Open browser developer tools and check the console for any error messages.

## Common Issues and Solutions

### Issue: "Failed to resolve component" errors
**Solution**: Update component names to match Nuxt UI v3:
- `UFormGroup` → `UFormField`
- `UDivider` → Use custom CSS divider
- `UDropdown` → Use custom dropdown implementation

### Issue: Database connection errors
**Solution**: 
1. Run the SQL statements in `database-setup.sql`
2. Check that RLS policies are correctly set up
3. Verify your Supabase credentials

### Issue: "ON CONFLICT specification" error
**Solution**: 
1. Run the `fix-categories.sql` script to recreate the categories table
2. This happens when the categories table exists without a unique constraint on the name column
3. The fix script will drop and recreate the table with proper constraints

### Issue: Google OAuth not working
**Solution**:
1. Configure Google OAuth in Supabase dashboard
2. Add your domain to authorized redirect URLs
3. Make sure the callback URL is correct: `https://yourdomain.com/auth/callback`

### Issue: User profile not created
**Solution**: The application uses Supabase's default auth system:
1. Users are automatically created in `auth.users` table
2. No custom user profile table is needed
3. User data is retrieved from Supabase auth metadata

## Testing Steps

1. **Test Basic Auth**: Go to `/test-auth`
2. **Test Sign Up**: Try creating a new account
3. **Test Sign In**: Try logging in with existing credentials
4. **Test Database**: Check if database queries work
5. **Test Google Auth**: Try Google sign-in

## Debug Information

The application includes console logging for debugging:
- Authentication attempts are logged
- Database errors are logged
- User creation steps are logged

Check the browser console for detailed error information.

## Getting Help

If you're still having issues:
1. Check the browser console for errors
2. Verify your Supabase project settings
3. Ensure all database tables are created
4. Test with the `/test-auth` page 