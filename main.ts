import { white } from "jsr:@std/fmt@0.218.2/colors";
import process from "node:process";

import { Secret } from "otpauth";

const env = process.env;

import { connect } from "./openvpn.ts";

const options = {
    username: env.VPN_USERNAME || "*",
    password: env.VPN_PASSWORD || "*",
    secret: Secret.fromBase32(env.VPN_OTP_SECRET || ""),
    config: env.VPN_CONFIG || "?",
    verbose: process.argv.includes("-vv"),
} as const;

const connected = (await connect(options).next()).value;
console.log(connected);

const apify = "https://api.ipify.org";
console.log("public IP from", apify, white(await (await fetch(apify)).text()));
