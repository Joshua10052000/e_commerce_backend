import axios from "axios";
import keys from "../lib/keys.js";
import express from "express";

interface ResponseData {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

const tokenMap = new Map<
  string,
  Omit<ResponseData, "scope"> & { scopes: string[] }
>();

type RequestTokenResponse =
  | {
      success: true;
      data: Omit<ResponseData, "scope"> & { scopes: string[] };
    }
  | { success: false; error: unknown };

async function requestToken(): Promise<RequestTokenResponse> {
  try {
    const url = "https://api-m.sandbox.paypal.com/v1/oauth2/token";
    const credentials = `${keys.paypal.clientId}:${keys.paypal.clientSecret}`;
    const authorization = `Basic ${Buffer.from(credentials).toString(
      "base64"
    )}`;
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authorization,
    };
    const body = {
      grant_type: "client_credentials",
    };

    const response = await axios.post<ResponseData>(
      `${url}`,
      { ...body },
      { headers }
    );

    const {
      data: { scope, ...data },
    } = response;

    const scopes = scope.split(" ");

    return { success: true, data: { ...data, scopes } };
  } catch (error) {
    if (error instanceof axios.AxiosError) {
      const { response } = error;

      if (response) {
        const { data } = response;

        return { success: false, error: { data } };
      }
    }

    return { success: false, error: { data: error } };
  }
}

async function authenticatePaypal(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const header = req.headers["paypal-access-token"] as string | undefined;

    const [_, token] = header?.split(" ") || "";

    const foundToken = tokenMap.get(token);

    if (!foundToken) {
      const response = await requestToken();

      if (response.success) {
        tokenMap.set(response.data.access_token, response.data);
        req.headers[
          "paypal-access-token"
        ] = `Bearer ${response.data.access_token}`;
      }

      return next();
    }

    const [timestamps] = foundToken.nonce.split(":");

    const today = new Date();
    const issuedAt = new Date(timestamps);
    const expiresAt = new Date(
      issuedAt.getTime() + foundToken.expires_in * 1000
    );

    if (today > expiresAt) {
      tokenMap.delete(token);
      const response = await requestToken();

      if (response.success) {
        tokenMap.set(response.data.access_token, response.data);
        req.headers[
          "paypal-access-token"
        ] = `Bearer ${response.data.access_token}`;
      }
    }

    next();
  } catch (error) {
    next();
  }
}

export { requestToken, authenticatePaypal };
