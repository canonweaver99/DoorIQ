# Post-Launch Monitoring Guide

## 🔍 Immediate Monitoring (First 24 Hours)

### Critical Checks Every Hour

1. **Stripe Webhook Delivery**
   - Go to: Stripe Dashboard → Developers → Webhooks
   - Check delivery rate (should be 100%)
   - Look for failed webhooks
   - Verify events are being processed

2. **Error Logs**
   - Check Vercel/Supabase logs
   - Look for 500 errors
   - Check for authentication failures
   - Monitor API route errors

3. **Purchase Flow**
   - Check Stripe Dashboard → Payments
   - Verify successful purchases
   - Check for failed payments
   - Monitor checkout completion rate

4. **Credit Granting**
   - Check database: `user_session_limits` table
   - Verify credits are granted after purchase
   - Check subscription status updates

### First Purchase Verification

When the first real purchase happens:

1. **In Stripe Dashboard:**
   - ✅ Payment succeeded
   - ✅ Subscription created
   - ✅ Webhook events fired

2. **In Your Database:**
   - ✅ `users.subscription_status` = 'active' or 'trialing'
   - ✅ `users.stripe_customer_id` is set
   - ✅ `user_session_limits.monthly_credits` = 50
   - ✅ `user_session_limits.sessions_limit` = 50

3. **In Your App:**
   - ✅ User sees premium features unlocked
   - ✅ Dashboard shows subscription status
   - ✅ Credits are visible

## 📊 Daily Monitoring Checklist

### Morning Check (First Week)
- [ ] Review error logs from previous night
- [ ] Check Stripe webhook delivery rate
- [ ] Verify no failed payments
- [ ] Check for any support requests

### Key Metrics to Track
- **Purchase Success Rate:** Should be >95%
- **Webhook Delivery Rate:** Should be 100%
- **Credit Granting Rate:** Should be 100%
- **Error Rate:** Should be <1%

## 🚨 Red Flags to Watch For

### Immediate Action Required
1. **Webhook delivery < 95%**
   - Check webhook endpoint is accessible
   - Verify webhook secret is correct
   - Check application logs

2. **Multiple failed payments**
   - Check Stripe Dashboard for reasons
   - Verify payment methods are valid
   - Check for fraud prevention triggers

3. **Credits not granting**
   - Check webhook event logs
   - Verify `grant_subscription_credits` function
   - Check database for errors

4. **High error rate (>5%)**
   - Review error logs
   - Check for API failures
   - Verify environment variables

## 📈 Weekly Review

### Metrics to Review Weekly
1. **Business Metrics:**
   - Total subscriptions
   - Conversion rate
   - Churn rate
   - Revenue

2. **Technical Metrics:**
   - API response times
   - Error rates
   - Upload success rate
   - Database performance

3. **User Feedback:**
   - Support tickets
   - Feature requests
   - Bug reports

## 🛠️ Common Issues & Solutions

### Issue: Webhooks Not Delivering
**Solution:**
1. Verify webhook endpoint URL is correct
2. Check webhook secret matches environment variable
3. Verify endpoint is HTTPS (required)
4. Check application logs for errors

### Issue: Credits Not Granted
**Solution:**
1. Check Stripe webhook event logs
2. Verify `checkout.session.completed` event fired
3. Check database logs for `grant_subscription_credits` function
4. Verify user has `stripe_customer_id`

### Issue: Features Not Unlocking
**Solution:**
1. Check `users.subscription_status` in database
2. Verify status is 'active' or 'trialing'
3. Check `feature_flags` table configuration
4. Test `user_has_feature_access` function

### Issue: Upload Failures
**Solution:**
1. Check file size limits (100MB max)
2. Verify file type is allowed
3. Check Supabase storage bucket permissions
4. Review API error logs

## 📞 Support Resources

### Stripe
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com
- Webhook Logs: Dashboard → Developers → Webhooks

### Supabase
- Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs
- Logs: Dashboard → Logs

### Vercel
- Dashboard: https://vercel.com/dashboard
- Logs: Dashboard → Deployment → Functions → Logs

## 🎯 Success Indicators

### Week 1 Success
- ✅ 100% webhook delivery rate
- ✅ <1% error rate
- ✅ All purchases grant credits
- ✅ No critical bugs reported

### Month 1 Success
- ✅ Stable subscription conversion
- ✅ Low churn rate
- ✅ Positive user feedback
- ✅ No major incidents

---

**Remember:** Monitor closely in the first week, then transition to daily/weekly checks as things stabilize.

