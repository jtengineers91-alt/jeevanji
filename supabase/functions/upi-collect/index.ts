import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, upi_id, user_id } = await req.json();

    if (!amount || !upi_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 50) {
      return new Response(JSON.stringify({ error: "Minimum amount is ₹50" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const auth = btoa(`${keyId}:${keySecret}`);

    // Step 1: Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // paise
        currency: "INR",
        method: "upi",
      }),
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      console.error("Razorpay order error:", errBody);
      throw new Error("Failed to create payment order");
    }

    const order = await orderRes.json();

    // Step 2: Create payment link with UPI intent
    const paymentLinkRes = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        description: `Jeevan Games Deposit ₹${amount}`,
        customer: {
          contact: upi_id,
        },
        upi_link: true,
        notes: {
          user_id,
          purpose: "deposit",
        },
      }),
    });

    if (!paymentLinkRes.ok) {
      const errBody = await paymentLinkRes.text();
      console.error("Razorpay payment link error:", errBody);
      throw new Error("Failed to create UPI payment link");
    }

    const paymentLink = await paymentLinkRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        payment_link_id: paymentLink.id,
        payment_link_url: paymentLink.short_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("UPI collect error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
