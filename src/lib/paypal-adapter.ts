import axios, { AxiosError } from "axios";
import { z } from "zod";
import keys from "./keys.js";

interface Token {
  scopes: string[];
  accessToken: string;
  tokenType: string;
  appId: string;
  expiresIn: number;
  nonce: string;
}

type OrderIntent = Zod.infer<typeof orderIntent>;
type ItemCategory = Zod.infer<typeof itemCategory>;
type TokenType = Zod.infer<typeof tokenType>;
type ShippingPreference = Zod.infer<typeof shippingPreference>;
type LandingPage = Zod.infer<typeof landingPage>;
type UserAction = Zod.infer<typeof userAction>;
type PhoneType = Zod.infer<typeof phoneType>;
type Amount = Zod.infer<typeof amount>;
type Item = Zod.infer<typeof item>;
type PurchaseUnit = Zod.infer<typeof purchaseUnit>;
type Address = Zod.infer<typeof address>;
type UserName = Zod.infer<typeof userName>;
type User = Zod.infer<typeof user>;
type PhoneNumber = Zod.infer<typeof phoneNumber>;
type Phone = Zod.infer<typeof phone>;
type ExperienceContext = Zod.infer<typeof experienceContext>;
type CardPayment = Zod.infer<typeof cardPayment>;
type TokenPayment = Zod.infer<typeof tokenPayment>;
type PaypalPayment = Zod.infer<typeof paypalPayment>;
type PaymentSource = Zod.infer<typeof paymentSource>;
type Method = Zod.infer<typeof method>;
type OrderStatus = Zod.infer<typeof orderStatus>;
type CreateOrder = Zod.infer<typeof schema.createOrder>;
type Order = Zod.infer<typeof order>;
type OrderLink = Zod.infer<typeof orderLink>;

const orderIntent = z.enum(["AUTHORIZE", "CAPTURE"]);
const itemCategory = z.enum(["DIGITAL_GOODS", "PHYSICAL_GOODS", "DONATION"]);
const tokenType = z.enum(["BILLING_AGREEMENT"]);
const shippingPreference = z.enum([
  "GET_FROM_FILE",
  "NO_SHIPPING",
  "SET_PROVIDED_ADDRESS",
]);
const landingPage = z.enum(["LOGIN", "GUEST_CHECKOUT", "NO_PREFERENCE"]);
const userAction = z.enum(["CONTINUE", "PAY_NOW"]);
const paymentPreference = z.enum([
  "UNRESTRICTED",
  "IMMEDIATE_PAYMENT_REQUIRED",
]);
const phoneType = z.enum(["FAX", "HOME", "MOBILE", "PAGER", "OTHER"]);
const method = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "CONNECT",
]);
const orderStatus = z.enum([
  "CREATED",
  "SAVED",
  "VOIDED",
  "COMPLETED",
  "PAYER_ACTION_REQUIRED",
  "APPROVED",
]);

const amount = z.object({ currency_code: z.string(), value: z.string() });
const item = z.object({
  name: z.string(),
  quantity: z.string(),
  unit_amount: amount,
  description: z.string().optional(),
  url: z.string().optional(),
  category: itemCategory.optional(),
});

const purchaseUnit = z.object({
  items: z.array(item),
  amount: amount.extend({
    breakdown: z.object({
      item_total: amount,
    }),
  }),
  reference_id: z.string().optional(),
  description: z.string().optional(),
});
const address = z.object({
  country_code: z.string(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  admin_area_1: z.string().optional(),
  admin_area_2: z.string().optional(),
  postal_code: z.string().optional(),
});
const userName = z.object({
  given_name: z.string().optional(),
  surname: z.string().optional(),
});
const user = z.object({
  name: userName.optional(),
});
const phoneNumber = z.object({
  national_number: z.string(),
});
const phone = z.object({
  phone_type: phoneType.optional(),
  phone_number: phoneNumber,
});

const experienceContext = z.object({
  brand_name: z.string().optional(),
  shipping_preference: shippingPreference.default("GET_FROM_FILE").optional(),
  landing_page: landingPage.default("NO_PREFERENCE").optional(),
  user_action: userAction.default("CONTINUE").optional(),
  payment_preference: paymentPreference.default("UNRESTRICTED").optional(),
  return_url: z.string().optional(),
  cancel_url: z.string().optional(),
});
const cardPayment = z.object({
  name: z.string().optional(),
  number: z.string().optional(),
  security_code: z.string().optional(),
  expiry: z.string().optional(),
  billing_address: address.optional(),
  experience_context: experienceContext.optional(),
});
const tokenPayment = z.object({
  id: z.string(),
  type: tokenType,
});

const paypalPayment = z.object({
  experience_context: experienceContext.optional(),
  email_address: z.string().optional(),
  name: user.shape.name.optional(),
  phone: phone.optional(),
  birth_date: z.string().optional(),
  address: address.optional(),
});
const paymentSource = z.object({
  card: cardPayment.optional(),
  token: tokenPayment.optional(),
  paypal: paypalPayment.optional(),
});
const orderLink = z.object({
  href: z.string(),
  rel: z.string(),
  method: method.optional(),
});
const order = z.object({
  create_time: z.string().optional(),
  update_time: z.string().optional(),
  id: z.string().optional(),
  purchase_units: z.array(purchaseUnit),
  links: z.array(orderLink),
  payment_source: paymentSource.optional(),
  intent: orderIntent.optional(),
  status: orderStatus.optional(),
});

const schema = {
  createOrder: z.object({
    intent: orderIntent,
    purchase_units: z.array(purchaseUnit),
    payment_source: paymentSource.optional(),
  }),
};

const API_BASEURL = "https://api-m.sandbox.paypal.com";
// keys.server.environment !== "production"
//   ? "https://api-m.sandbox.paypal.com"
//   : "https://api-m.paypal.com";

class PaypalAdapter {
  #credentials;
  #token: Token | null;

  constructor(args: { clientId: string; clientSecret: string }) {
    this.#credentials = Buffer.from(
      `${args.clientId}:${args.clientSecret}`
    ).toString("base64");
    this.#token = null;
  }

  #checkIsExpired(token: Token) {
    const [timestamps] = token.nonce.split(/(?=[\Z])/, 1);
    const dateIssued = new Date(timestamps);
    const expiresIn = 31668;
    const expiresAt = new Date(dateIssued.getTime() + expiresIn * 1000);
    const today = new Date();

    return today >= expiresAt;
  }

  async #createToken() {
    if (this.#token) {
      const isExpired = this.#checkIsExpired(this.#token);

      if (!isExpired) return this.#token;
    }

    const url = `${API_BASEURL}/v1/oauth2/token`;
    const body = {
      grant_type: "client_credentials",
    };
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${this.#credentials}`,
    };

    try {
      const response = await axios.post(url, body, {
        headers,
        withCredentials: true,
      });
      const { data } = response;

      this.#token = {
        scopes: data.scope.split(" "),
        accessToken: data.access_token,
        tokenType: data.token_type,
        appId: data.app_id,
        expiresIn: data.expires_in,
        nonce: data.nonce,
      };
      return this.#token;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
      this.#token = null;
      return this.#token;
    }
  }

  async createOrder(body: CreateOrder) {
    const url = `${API_BASEURL}/v2/checkout/orders`;
    const accessToken = this.#token
      ? this.#token.accessToken
      : (await this.#createToken())?.accessToken || "";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post<Order>(url, body, {
        headers,
        withCredentials: true,
      });
      const { data } = response;

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
      return null;
    }
  }

  async getOrderDetails(orderId: string) {
    const url = `${API_BASEURL}/v2/checkout/orders/${orderId}`;
    const accessToken = this.#token
      ? this.#token.accessToken
      : (await this.#createToken())?.accessToken || "";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.get<Order>(url, { headers });
      const { data } = response;

      return data;
    } catch (error) {
      return null;
    }
  }

  async confirmOrder(orderId: string, body?: PaymentSource) {
    const url = `${API_BASEURL}/v2/checkout/orders/${orderId}/capture`;
    const accessToken = this.#token
      ? this.#token.accessToken
      : (await this.#createToken())?.accessToken || "";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post<Order>(url, body, { headers });
      const { data } = response;

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
      return null;
    }
  }
}

const paypalAdapter = new PaypalAdapter({
  clientId: keys.paypal.clientId,
  clientSecret: keys.paypal.clientSecret,
});

export type {
  OrderLink,
  PaymentSource,
  OrderIntent,
  ItemCategory,
  TokenType,
  ShippingPreference,
  LandingPage,
  UserAction,
  PhoneType,
  Amount,
  Item,
  PurchaseUnit,
  Address,
  UserName,
  User,
  PhoneNumber,
  Phone,
  ExperienceContext,
  CardPayment,
  TokenPayment,
  PaypalPayment,
  Method,
  OrderStatus,
  CreateOrder,
};
export { paypalAdapter };
