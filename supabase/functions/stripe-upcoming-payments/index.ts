import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-UPCOMING-PAYMENTS] ${step}${detailsStr}`);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate REAL Stripe processing fee (4.43% based on actual charges)
const calculateStripeProcessingFee = (amount: number): number => {
  // Using actual Stripe rate observed: 4.43% (from $44.17 on $997)
  // This accounts for international cards, currency conversion, and actual fees
  return amount * 0.0443;
};

// Get business commission rate from monthly balance configuration
const getBusinessCommissionRate = async (supabase: any): Promise<number> => {
  try {
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('monthly_balances')
      .select('business_commission_rate')
      .eq('month_year', monthYear)
      .single();
    
    if (error || !data?.business_commission_rate) {
      logStep("Using default business commission rate", { defaultRate: 8.0 });
      return 8.0; // Default 8% business commission rate
    }
    
    logStep("Retrieved business commission rate from config", { rate: data.business_commission_rate });
    return data.business_commission_rate;
  } catch (error) {
    logStep("Error getting business commission rate, using default", { error: error.message });
    return 8.0; // Default fallback
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not found");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    logStep("STRIPE_SECRET_KEY found, initializing client");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase client to get business commission rate
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get configurable business commission rate
    const businessCommissionRate = await getBusinessCommissionRate(supabase);

    // Get active subscriptions using expand to reduce API calls
    logStep("Fetching active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer', 'data.discount'], // Also expand discount information
    });

    logStep("Retrieved active subscriptions", { count: subscriptions.data.length });

    // DETAILED DATE ANALYSIS - Current time and month calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    logStep("DATE CALCULATION ANALYSIS", {
      now: now.toISOString(),
      nowLocal: now.toLocaleDateString(),
      currentMonth: currentMonth + 1, // +1 because getMonth() is 0-based
      currentYear,
      nextMonth: nextMonth + 1, // +1 because getMonth() is 0-based
      nextMonthYear,
      businessCommissionRate: businessCommissionRate,
      actualStripeRate: "4.43% (real observed rate)",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Process subscriptions with customer cache for missing data
    const customerCache = new Map();
    const upcomingPayments = [];

    // DETAILED SUBSCRIPTION ANALYSIS
    logStep("ANALYZING ALL SUBSCRIPTIONS", {
      totalSubscriptions: subscriptions.data.length
    });

    for (const subscription of subscriptions.data) {
      let customerInfo = null;
      let planInfo = null;

      // Process customer info with fallbacks
      if (subscription.customer && typeof subscription.customer === 'object') {
        const customer = subscription.customer as any;
        customerInfo = {
          id: customer.id,
          email: customer.email || null,
          name: customer.name || customer.email || null,
        };
      } else if (subscription.customer && typeof subscription.customer === 'string') {
        const customerId = subscription.customer;
        
        if (!customerCache.has(customerId)) {
          try {
            await delay(100); // Rate limiting protection
            const customer = await stripe.customers.retrieve(customerId);
            customerCache.set(customerId, {
              id: customer.id,
              email: (customer as any).email || null,
              name: (customer as any).name || (customer as any).email || null,
            });
          } catch (error) {
            logStep("Error retrieving customer", { customerId, error: error.message });
            customerCache.set(customerId, {
              id: customerId,
              email: null,
              name: `Customer ${customerId.slice(-6)}`,
            });
          }
        }
        customerInfo = customerCache.get(customerId);
      }

      // Final fallback for customer
      if (!customerInfo) {
        customerInfo = {
          id: null,
          email: null,
          name: 'Customer Information Unavailable',
        };
      }

      // Get plan info from the first item
      if (subscription.items.data.length > 0) {
        const item = subscription.items.data[0];
        const price = item.price;
        planInfo = {
          id: price.id,
          nickname: price.nickname,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency,
          interval: price.recurring?.interval,
          interval_count: price.recurring?.interval_count,
        };
      }

      // Calculate next payment date
      const nextPaymentDate = new Date(subscription.current_period_end * 1000);
      const grossAmount = planInfo?.amount || 0;

      // Calculate discount amount
      let discountAmount = 0;
      let discountDetails = null;
      if (subscription.discount && subscription.discount.coupon) {
        const coupon = subscription.discount.coupon;
        discountDetails = {
          coupon_id: coupon.id,
          coupon_name: coupon.name || coupon.id,
          percent_off: coupon.percent_off,
          amount_off: coupon.amount_off ? coupon.amount_off / 100 : null,
        };

        if (coupon.percent_off) {
          discountAmount = grossAmount * (coupon.percent_off / 100);
        } else if (coupon.amount_off) {
          discountAmount = coupon.amount_off / 100; // Convert from cents
        }
      }

      // Calculate fees and net amount using REAL Stripe rates
      const amountAfterDiscount = grossAmount - discountAmount;
      const stripeProcessingFee = calculateStripeProcessingFee(amountAfterDiscount);
      const businessCommissionAmount = amountAfterDiscount * (businessCommissionRate / 100);
      const netAmount = amountAfterDiscount - stripeProcessingFee - businessCommissionAmount;

      // DETAILED LOGGING FOR EACH SUBSCRIPTION WITH REAL FEE BREAKDOWN
      const paymentMonth = nextPaymentDate.getMonth();
      const paymentYear = nextPaymentDate.getFullYear();
      const isCurrentMonth = paymentMonth === currentMonth && paymentYear === currentYear;
      const isNextMonth = paymentMonth === nextMonth && paymentYear === nextMonthYear;

      logStep("SUBSCRIPTION ANALYSIS WITH REAL FEE BREAKDOWN", {
        subscriptionId: subscription.id.slice(-6),
        customerName: customerInfo?.name?.substring(0, 20) || 'Unknown',
        nextPaymentDate: nextPaymentDate.toISOString(),
        nextPaymentDateLocal: nextPaymentDate.toLocaleDateString(),
        paymentMonth: paymentMonth + 1, // +1 because getMonth() is 0-based
        paymentYear,
        isCurrentMonth,
        isNextMonth,
        status: subscription.status,
        grossAmount,
        discountAmount,
        amountAfterDiscount,
        stripeProcessingFee,
        stripeRateUsed: "4.43% (real)",
        businessCommissionRate,
        businessCommissionAmount,
        netAmount,
        discountDetails
      });

      upcomingPayments.push({
        subscription_id: subscription.id,
        customer: customerInfo,
        plan_name: planInfo?.nickname || `${planInfo?.interval || 'monthly'} plan`,
        amount: netAmount, // Net amount after all deductions
        gross_amount: grossAmount, // Original subscription amount
        currency: planInfo?.currency || 'usd',
        next_payment_date: nextPaymentDate.toISOString(),
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_date: new Date(subscription.created * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        // Enhanced fee breakdown with REAL rates
        stripe_processing_fee: stripeProcessingFee,
        business_commission_rate: businessCommissionRate,
        business_commission_amount: businessCommissionAmount,
        discount_amount: discountAmount,
        net_amount: netAmount,
        discount_details: discountDetails,
      });
    }

    // Sort by next payment date (earliest first)
    upcomingPayments.sort((a, b) => 
      new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
    );

    // DETAILED FILTERING ANALYSIS
    const currentMonthPayments = upcomingPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      const isMatch = paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      return isMatch;
    });

    const nextMonthPayments = upcomingPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      const isMatch = paymentDate.getMonth() === nextMonth && paymentDate.getFullYear() === nextMonthYear;
      return isMatch;
    });

    // LOG SUMMARY WITH REAL FEE ANALYSIS
    const totalGrossAmount = nextMonthPayments.reduce((sum, p) => sum + p.gross_amount, 0);
    const totalDiscountAmount = nextMonthPayments.reduce((sum, p) => sum + p.discount_amount, 0);
    const totalStripeFeesAmount = nextMonthPayments.reduce((sum, p) => sum + p.stripe_processing_fee, 0);
    const totalBusinessCommissionAmount = nextMonthPayments.reduce((sum, p) => sum + p.business_commission_amount, 0);
    const totalNetAmount = nextMonthPayments.reduce((sum, p) => sum + p.net_amount, 0);

    logStep("NEXT MONTH FINANCIAL BREAKDOWN WITH REAL RATES", {
      nextMonthExpected: `${nextMonth + 1}/${nextMonthYear}`, // +1 because getMonth() is 0-based
      nextMonthPaymentsFound: nextMonthPayments.length,
      totalGrossAmount,
      totalDiscountAmount,
      totalStripeFeesAmount,
      realStripeRate: "4.43%",
      totalBusinessCommissionAmount,
      totalNetAmount,
      effectiveCommissionRate: totalGrossAmount > 0 ? ((totalStripeFeesAmount + totalBusinessCommissionAmount) / totalGrossAmount * 100).toFixed(2) + '%' : '0%'
    });

    // Filter to only include payments in the next 60 days for backward compatibility
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    const filteredPayments = upcomingPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      return paymentDate >= now && paymentDate <= sixtyDaysFromNow;
    });

    logStep("FINAL FILTERING ANALYSIS", {
      sixtyDaysFromNow: sixtyDaysFromNow.toISOString(),
      totalPayments: upcomingPayments.length,
      filteredPayments: filteredPayments.length,
      currentMonthPayments: currentMonthPayments.length,
      nextMonthPayments: nextMonthPayments.length
    });

    logStep("Processed upcoming payments successfully with REAL rates", { 
      total: upcomingPayments.length,
      next60Days: filteredPayments.length,
      currentMonth: currentMonthPayments.length,
      nextMonth: nextMonthPayments.length,
      businessCommissionRate: businessCommissionRate,
      realStripeRate: "4.43%",
      customersFound: Array.from(customerCache.values()).filter(c => c.name !== 'Customer Information Unavailable').length
    });

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        upcoming_payments: filteredPayments, // For backward compatibility with 60-day filter
        current_month_payments: currentMonthPayments,
        next_month_payments: nextMonthPayments, // FULL NEXT MONTH - NO TIME LIMIT
        total_count: filteredPayments.length,
        business_commission_rate: businessCommissionRate
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error.stack });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      data: {
        upcoming_payments: [],
        current_month_payments: [],
        next_month_payments: []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
