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
    const data = username + "\n" + password + code + "\n";

    const file = "data.txt";
    Deno.writeTextFileSync(file, data, { create: true, mode: 0o600 });

    if (verbose) console.log("connecting");
    const exe = shell("sudo", [
        "openvpn",
        "--config",
        config,
        "--auth-nocache",
        "--auth-user-pass",
        file,
    ]);

    const readyRE = /Initialization Sequence Completed/;
    const addrRE = /add net (\d+\.\d+\.\d+\.\d+): gateway 192.168.0.1/;
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
            await Deno.remove(file);
            yield { addr, connected: true };
        }
    }
    if (verbose) console.log("openvpn exited");
}
