import { Secret } from "https://deno.land/x/otpauth@v9.2.1/dist/otpauth.esm.js";
import process from "node:process";

const env = process.env;

import { connect } from "./openvpn.ts";

const options = {
    username: env.VPN_USERNAME || "*",
    password: env.VPN_PASSWORD || "*",
    secret: Secret.fromBase32(env.VPN_OTP_SECRET || ""),
    config: env.VPN_CONFIG || "?",
    verbose: process.argv.includes("-vv"),
};

const connected = (await connect(options).next()).value;

console.log({ connected });
