
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-UPCOMING-PAYMENTS] ${step}${detailsStr}`);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Get active subscriptions using expand to reduce API calls
    logStep("Fetching active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer'], // Expand customer data directly
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

      // DETAILED LOGGING FOR EACH SUBSCRIPTION
      const paymentMonth = nextPaymentDate.getMonth();
      const paymentYear = nextPaymentDate.getFullYear();
      const isCurrentMonth = paymentMonth === currentMonth && paymentYear === currentYear;
      const isNextMonth = paymentMonth === nextMonth && paymentYear === nextMonthYear;

      logStep("SUBSCRIPTION ANALYSIS", {
        subscriptionId: subscription.id.slice(-6),
        customerName: customerInfo?.name?.substring(0, 20) || 'Unknown',
        nextPaymentDate: nextPaymentDate.toISOString(),
        nextPaymentDateLocal: nextPaymentDate.toLocaleDateString(),
        paymentMonth: paymentMonth + 1, // +1 because getMonth() is 0-based
        paymentYear,
        isCurrentMonth,
        isNextMonth,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodEndDate: new Date(subscription.current_period_end * 1000).toISOString()
      });

      upcomingPayments.push({
        subscription_id: subscription.id,
        customer: customerInfo,
        plan_name: planInfo?.nickname || `${planInfo?.interval || 'monthly'} plan`,
        amount: planInfo?.amount || 0,
        currency: planInfo?.currency || 'usd',
        next_payment_date: nextPaymentDate.toISOString(),
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_date: new Date(subscription.created * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
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

    // LOG ALL NEXT MONTH PAYMENTS IN DETAIL
    logStep("NEXT MONTH PAYMENTS DETAILED ANALYSIS", {
      nextMonthExpected: `${nextMonth + 1}/${nextMonthYear}`, // +1 because getMonth() is 0-based
      nextMonthPaymentsFound: nextMonthPayments.length,
      nextMonthPaymentsDetails: nextMonthPayments.map(payment => ({
        subscriptionId: payment.subscription_id.slice(-6),
        customerName: payment.customer?.name?.substring(0, 20) || 'Unknown',
        amount: payment.amount,
        nextPaymentDate: payment.next_payment_date,
        nextPaymentDateLocal: new Date(payment.next_payment_date).toLocaleDateString(),
        dayOfMonth: new Date(payment.next_payment_date).getDate()
      }))
    });

    // Check for payments that might be excluded
    const allPaymentsNextMonth = upcomingPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      return paymentDate.getMonth() === nextMonth && paymentDate.getFullYear() === nextMonthYear;
    });

    const paymentsAfter16th = nextMonthPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      return paymentDate.getDate() > 16;
    });

    logStep("PAYMENTS AFTER 16TH ANALYSIS", {
      totalNextMonthPayments: allPaymentsNextMonth.length,
      paymentsAfter16th: paymentsAfter16th.length,
      paymentsAfter16thDetails: paymentsAfter16th.map(payment => ({
        subscriptionId: payment.subscription_id.slice(-6),
        customerName: payment.customer?.name?.substring(0, 20) || 'Unknown',
        nextPaymentDate: payment.next_payment_date,
        dayOfMonth: new Date(payment.next_payment_date).getDate()
      }))
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

    logStep("Processed upcoming payments successfully", { 
      total: upcomingPayments.length,
      next60Days: filteredPayments.length,
      currentMonth: currentMonthPayments.length,
      nextMonth: nextMonthPayments.length,
      customersFound: Array.from(customerCache.values()).filter(c => c.name !== 'Customer Information Unavailable').length
    });

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        upcoming_payments: filteredPayments, // For backward compatibility with 60-day filter
        current_month_payments: currentMonthPayments,
        next_month_payments: nextMonthPayments, // FULL NEXT MONTH - NO TIME LIMIT
        total_count: filteredPayments.length
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
