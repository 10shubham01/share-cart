# Google OAuth Debugging Guide

## Step 1: Check Console Logs
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Try Google OAuth and look for these logs:
   - "Starting Google OAuth..."
   - "Calling signInWithGoogle..."
   - "signInWithGoogle - redirect URL: ..."
   - "OAuth response: ..."

## Step 2: Test Supabase Configuration
1. Go to `/test-auth`
2. Click "Test Supabase Config"
3. Check if Supabase connection is working

## Step 3: Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Verify these settings:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

## Step 4: Check Google OAuth Settings
1. In Supabase dashboard, go to Authentication > Providers
2. Click on Google provider
3. Verify:
   - Google provider is enabled
   - Client ID and Client Secret are set
   - Redirect URL matches: `http://localhost:3000/auth/callback`

## Step 5: Test OAuth Flow
1. Go to `/test-auth`
2. Click "Test Google OAuth"
3. You should be redirected to Google
4. After Google authentication, you should be redirected to `/auth/callback`
5. Check console for callback logs

## Common Issues:

### Issue: No console logs at all
**Solution**: Check if the page is loading correctly and JavaScript is enabled

### Issue: OAuth starts but no redirect
**Solution**: Check Supabase OAuth configuration and redirect URLs

### Issue: Redirect to wrong URL
**Solution**: Verify the redirect URL in `app.config.ts` matches your port

### Issue: Callback page not reached
**Solution**: Check if the callback route exists and is accessible

## Debugging Commands:

```bash
# Check if the app is running on the correct port
curl http://localhost:3000/auth/callback

# Check if the callback page exists
ls pages/auth/callback.vue
```

## Next Steps:
1. Run through the debugging steps above
2. Check console logs for any errors
3. Verify Supabase configuration
4. Test the OAuth flow step by step 