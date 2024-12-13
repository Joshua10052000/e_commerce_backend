import express from "express";
import { authenticate } from "../../middleware/auth.js";
import db from "../../lib/db.js";
import { Item, Link, Order, PurchaseUnit } from "../../types/paypal.js";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import keys from "../../lib/keys.js";

let tokenExpiry: number | null = null;
let paypalToken: string | null = null;

async function getToken() {
  if (paypalToken && tokenExpiry && Date.now() < tokenExpiry) {
    return paypalToken;
  }

  const idSecret = `${keys.paypal.clientId}:${keys.paypal.clientSecret}`;
  const credentials = Buffer.from(idSecret).toString("base64");

  const url = "https://api-m.sandbox.paypal.com/v1/oauth2/token";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${credentials}`,
  };

  try {
    const response = await axios.post<{
      access_token: string;
      expires_in: number;
    }>(url, { grant_type: "client_credentials" }, { headers });

    const { data } = response;

    paypalToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;

    process.env.PAYPAL_ACCESS_TOKEN = paypalToken;

    return paypalToken;
  } catch (error) {
    console.error("Error fetching PayPal token:", error);
    return null;
  }
}

const router = express.Router();

router.use(authenticate);

router.post("/create", async (req, res) => {
  const { session } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Signing in is required" });
    return;
  }

  const accessToken = await getToken();
  if (!accessToken) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }

  try {
    const foundCart = await db.cart.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        cartItems: {
          select: {
            quantity: true,
            product: {
              select: { priceCents: true, name: true, description: true },
            },
          },
        },
      },
    });

    if (!foundCart) {
      res.status(404).json({ message: "You have no items in cart yet." });
      return;
    }

    const cartItems: Item[] = foundCart.cartItems.map((cartItem) => {
      return {
        name: cartItem.product.name,
        quantity: `${cartItem.quantity}`,
        unit_amount: {
          currency_code: "USD",
          value: `${cartItem.product.priceCents / 100}`,
        },
        description: cartItem.product.description,
      };
    });

    const total = cartItems.reduce(
      (pr, cr) =>
        (pr += parseFloat(cr.unit_amount.value) * parseInt(cr.quantity)),
      0
    );

    const purchaseUnits: PurchaseUnit[] = [
      {
        reference_id: foundCart.id,
        items: cartItems,
        amount: {
          currency_code: "USD",
          value: `${total}`,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: `${total}`,
            },
          },
        },
      },
    ];

    const body: Order = {
      intent: "CAPTURE",
      purchase_units: purchaseUnits,
      application_context: {
        return_url: "http://localhost:5173/checkout?success=true",
        cancel_url: "http://localhost:5173/checkout?success=false",
      },
    };

    const headers: AxiosRequestConfig["headers"] = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      body,
      { headers }
    );

    const { data } = response;
    const { links }: { links: Link[] } = data;

    const approveLink = links.find((link) => link.rel === "approve");

    res.status(200).json({ link: approveLink });
  } catch (error) {
    if (error instanceof AxiosError) {
      const { response } = error;

      if (response) {
        const { data } = response;

        res.status(400).json({ message: data.message });
        return;
      }
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
