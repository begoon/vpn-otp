import { shell } from "./shell.ts";

import {
    Secret,
    TOTP,
} from "https://deno.land/x/otpauth@v9.2.1/dist/otpauth.esm.js";

export type Options = {
    username: string;
    password: string;
    secret: Secret;
    config: string;
    verbose?: boolean;
};

export async function* connect({
    username,
    password,
    secret,
    config,
    verbose,
}: Options) {
    const code = new TOTP({ secret }).generate();
    const creds = username + "\n" + password + code + "\n";

    const credsPath = await Deno.makeTempFile();
    if (verbose) console.log("credentials", credsPath);
    await Deno.writeTextFile(credsPath, creds, { create: true, mode: 0o600 });

    let configPath: string | undefined;

    if (config?.includes("BEGIN CERTIFICATE")) {
        configPath = await Deno.makeTempFile();
        await Deno.writeTextFile(configPath, config);
        config = configPath;
        if (verbose) console.log("config", configPath);
    }

    if (verbose) console.log("connecting");
    const exe = shell("sudo", [
        "openvpn",
        "--config",
        config,
        "--auth-nocache",
        "--auth-user-pass",
        credsPath,
    ]);

    const readyRE = /Initialization Sequence Completed/;
    const addrRE = /add net (\d+\.\d+\.\d+\.\d+): gateway (192|172)/;
    let addr = "?";
    for await (const line of exe) {
        if (verbose) console.log(line);
        const isAddr = line.match(addrRE);
        if (isAddr) {
            addr = isAddr[1];
            if (verbose) console.log("addr", { addr });
        }
        const isConnected = line.match(readyRE);
        if (isConnected) {
            await Deno.remove(credsPath);
            if (configPath) await Deno.remove(configPath);
            yield { addr, connected: true };
        }
    }
    if (verbose) console.log("openvpn exited");
}
