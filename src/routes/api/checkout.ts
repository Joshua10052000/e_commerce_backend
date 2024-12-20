import express from "express";
import { Item, paypalAdapter, PurchaseUnit } from "../../lib/paypal-adapter.js";
import db from "../../lib/db.js";
import keys from "../../lib/keys.js";
import { z } from "zod";
import {
  convertCentsToDollars,
  convertDollarsToCents,
} from "../../lib/utils.js";

const router = express.Router();

const CURRENCY_CODE = "USD";
const INTENT = "CAPTURE";

const schema = {
  captureParams: z.object({ orderId: z.string() }),
};

router.post("/create", async (req, res) => {
  const { session } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Signing in is required" });
    return;
  }

  try {
    const foundCart = await db.cart.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!foundCart) {
      res.status(404).json({ message: "You have no items in cart yet." });
      return;
    }

    const cartItems: Item[] = foundCart.cartItems.map((cartItem) => {
      const item: Item = {
        name: cartItem.product.name,
        quantity: `${cartItem.quantity}`,
        unit_amount: {
          currency_code: CURRENCY_CODE,
          value: `${convertCentsToDollars(cartItem.product.priceCents)}`,
        },
        category: "PHYSICAL_GOODS",
        description: cartItem.product.description.slice(0, 127),
        url: `${keys.client.url}/products/${cartItem.product.id}`,
      };

      return item;
    });

    const cartItemsTotal = cartItems
      .reduce((cr, pr) => {
        const priceCents = convertDollarsToCents(
          parseFloat(pr.unit_amount.value)
        );
        const quantity = parseInt(pr.quantity);

        return (cr += convertCentsToDollars(priceCents * quantity));
      }, 0)
      .toString();

    const cartUnit: PurchaseUnit = {
      reference_id: foundCart.id,
      amount: {
        currency_code: CURRENCY_CODE,
        value: cartItemsTotal,
        breakdown: {
          item_total: {
            currency_code: CURRENCY_CODE,
            value: cartItemsTotal,
          },
        },
      },
      items: cartItems,
    };

    const purchaseUnits: PurchaseUnit[] = [cartUnit];

    const order = await paypalAdapter.createOrder({
      intent: INTENT,
      purchase_units: purchaseUnits,
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Bazario",
            landing_page: "NO_PREFERENCE",
            user_action: "CONTINUE",
            return_url: `${keys.client.url}/checkout`,
            cancel_url: `${keys.client.url}/cart`,
          },
          email_address: user.email,
          name: {
            given_name: user.name,
          },
        },
      },
    });

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
});

router.get("/confirm/:orderId", async (req, res) => {
  const { params, session } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Signing in is required" });
    return;
  }

  const parsedParams = schema.captureParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.message });
    return;
  }

  try {
    const foundOrder = await paypalAdapter.getOrderDetails(
      parsedParams.data.orderId
    );

    if (!foundOrder) {
      res.status(404).json({ message: "Order does not exists" });
      return;
    }

    const foundCart = await db.cart.findUnique({
      where: { userId: user.id },
      include: { cartItems: true },
    });

    if (!foundCart) {
      res.status(404).json({ message: "Cart does not exists" });
      return;
    }

    const totalCents = convertDollarsToCents(
      parseFloat(foundOrder.purchase_units[0].amount.value)
    );

    await db.order.create({
      data: {
        totalCents,
        userId: user.id,
        orderItems: {
          createMany: {
            data: foundCart.cartItems.map((cartItem) => ({
              productId: cartItem.productId,
              quantity: cartItem.quantity,
            })),
          },
        },
      },
    });

    await db.cart.delete({ where: { id: foundCart.id } });

    res.status(201).json({ message: "User has successfully checkout" });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
});

export default router;
