# Stripe Product Configuration

## ✅ Single Product Requirement

**All Stripe prices MUST belong to product:** `prod_TmlX1S82Ed4Gpe`

This is the **only product ID** that should be used for all plans (Starter, Team, Enterprise).

## 📋 Configuration Updated

### Files Modified:

1. **`lib/stripe/config.ts`**
   - Added `STRIPE_PRODUCT_ID = 'prod_TmlX1S82Ed4Gpe'`
   - Added comments indicating all prices must belong to this product

2. **`lib/stripe/validate-prices.ts`** (NEW)
   - Validation utilities to ensure prices belong to correct product
   - Functions:
     - `validatePriceBelongsToProduct()` - Validate a single price
     - `validateAllConfigPrices()` - Validate all prices in config
     - `getProductPrices()` - Get all prices for the product

3. **`app/api/checkout/create-session/route.ts`**
   - Added validation to ensure price belongs to `prod_TmlX1S82Ed4Gpe`
   - Returns error if price belongs to wrong product

4. **`scripts/validate-stripe-config.js`** (NEW)
   - Script to validate all prices belong to correct product
   - Usage: `node scripts/validate-stripe-config.js`

## 🔍 Current Price Configuration

The following prices are configured (these MUST belong to `prod_TmlX1S82Ed4Gpe`):

- **Starter**: `price_1SpC081fQ6MPQdN0Oi42IDV0`
- **Team**: `price_1SW66b1fQ6MPQdN0SJ1r5Kbj`
- **Enterprise**: `price_1SW66b1fQ6MPQdN0SJ1r5Kbj` (using team price)

## ⚠️ Important Notes

1. **Validation in Checkout**: The checkout API now validates that prices belong to `prod_TmlX1S82Ed4Gpe` before creating sessions
2. **Test Mode**: Current prices are production prices and won't exist in test mode
3. **When Switching to Production**: Run `node scripts/validate-stripe-config.js` to verify all prices belong to the correct product

## 🧪 Testing

### Validate Configuration (Production Mode)

```bash
# After switching to production Stripe keys, run:
node scripts/validate-stripe-config.js
```

This will:
- ✅ Check all prices in `STRIPE_CONFIG`
- ✅ Verify each price belongs to `prod_TmlX1S82Ed4Gpe`
- ✅ List all prices available for the product
- ✅ Report any errors or warnings

### Expected Output (Production Mode)

```
✅ All prices are valid and belong to the correct product!
```

## 📝 Next Steps

1. **Switch to Production Mode** (see `SWITCH_TO_PRODUCTION.md`)
2. **Verify Prices**: Run validation script to ensure all prices belong to `prod_TmlX1S82Ed4Gpe`
3. **Update Prices if Needed**: If any prices don't belong to the product, update `lib/stripe/config.ts` with correct price IDs

## 🔧 Adding New Prices

When adding new prices:

1. **Create price in Stripe Dashboard** under product `prod_TmlX1S82Ed4Gpe`
2. **Update `lib/stripe/config.ts`** with the new price ID
3. **Run validation script** to verify: `node scripts/validate-stripe-config.js`
4. **Test checkout flow** to ensure it works correctly

## 🚨 Error Handling

If a price doesn't belong to the correct product, the checkout API will return:

```json
{
  "error": "Price {priceId} does not belong to the correct product. All prices must belong to product prod_TmlX1S82Ed4Gpe. Please update STRIPE_CONFIG."
}
```

This prevents accidentally using prices from other products.

