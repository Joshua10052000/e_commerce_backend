interface Link {
  rel: "self" | "approve" | "update" | "capture";
  method: "GET" | "POST" | "PUT" | "DELETE";
  href: string;
}

interface PaymentInstruction {}

interface Payee {
  email_address?: string;
  merchant_id?: string;
}

interface Breakdown {
  item_total: Amount;
}

interface UPC {
  type: string;
  code: string;
}

interface Amount {
  currency_code: string;
  value: string;
  breakdown?: Breakdown;
}

interface Item {
  name: string;
  quantity: string;
  description?: string;
  sku?: string;
  url?: string;
  category?: "DIGITAL_GOODS" | "PHYSICAL_GOODS" | "DONATION";
  image_url?: string;
  unit_amount: Amount;
  tax?: Amount;
  upc?: UPC;
}

interface PurchaseUnit {
  reference_id?: string;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  soft_descriptor?: string;
  items: Item[];
  amount: Amount;
  payee?: Payee;
  payment_instruction?: PaymentInstruction;
}

interface PaymentSource {}

interface ApplicationContext {
  brand_name?: string;
  landing_page?: "LOGIN" | "BILLING" | "NO_PREFERENCE";
  shipping_preference?:
    | "GET_FROM_FILE"
    | "NO_SHIPPING"
    | "SET_PROVIDED_ADDRESS";
  user_action?: "CONTINUE" | "PAYNOW";
  return_url?: string;
  cancel_url?: string;
}

interface Order {
  purchase_units: PurchaseUnit[];
  intent: "CAPTURE" | "AUTHORIZE";
  payment_source?: PaymentSource;
  application_context?: ApplicationContext;
}

export {
  Link,
  Order,
  ApplicationContext,
  PaymentSource,
  PurchaseUnit,
  Item,
  Amount,
  UPC,
  Payee,
  PaymentInstruction,
};
