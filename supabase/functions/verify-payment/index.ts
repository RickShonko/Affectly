import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
    
    const paystackSecretKey = Deno.env.get('paystack_key');
    
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      throw new Error('Payment verification failed');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from payment data
    const email = paystackData.data.customer.email;
    
    // Find user by email
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (!authUser.user) {
      throw new Error('User not found');
    }

    // Calculate subscription end date (1 month from now)
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    // Update user's subscription
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_tier: 'premium',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.user.id);

    if (updateError) {
      throw new Error(`Failed to update user subscription: ${updateError.message}`);
    }

    // Insert/update subscriber record
    const { error: subscriberError } = await supabase
      .from('subscribers')
      .upsert({
        user_id: authUser.user.id,
        email: email,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: subscriptionEnd.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriberError) {
      console.error('Subscriber update error:', subscriberError);
    }

    console.log('Payment verified and subscription updated for user:', authUser.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription updated',
        subscription_end: subscriptionEnd.toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});