# Debugging Localhost vs Production Differences

## Common Causes

### 1. **Build Cache Issues** ✅ FIXED
- Cleared `.next` folder
- Run `npm run dev` again to rebuild

### 2. **Environment Variables**
Check that your `.env.local` has these critical variables:
- `NEXT_PUBLIC_SITE_URL` (should be `http://localhost:3002` for local)
- `NEXT_PUBLIC_APP_URL` (should be `http://localhost:3002` for local)
- `NEXT_PUBLIC_SUPABASE_URL` (should match production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should match production)

### 3. **Browser Cache**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or open in Incognito/Private mode

### 4. **Port Mismatch**
Your dev server runs on port **3002**, but the layout defaults to `localhost:3001` if no env vars are set.

### 5. **CSS/Styling Differences**
Production builds optimize CSS differently. Check:
- Are fonts loading correctly?
- Are Tailwind classes applying?
- Check browser console for CSS errors

## Quick Fix Steps

1. **Clear build cache** ✅ Done
2. **Check environment variables**:
   ```bash
   # Make sure .env.local has:
   NEXT_PUBLIC_SITE_URL=http://localhost:3002
   NEXT_PUBLIC_APP_URL=http://localhost:3002
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

4. **Clear browser cache** and hard refresh

5. **Compare specific elements**:
   - What exactly looks different?
   - Is it styling, content, or functionality?
   - Check browser console for errors

## Debugging Specific Differences

If you can describe what looks different, we can check:
- Component rendering differences
- CSS/styling issues
- Data fetching differences
- Environment-specific conditionals

