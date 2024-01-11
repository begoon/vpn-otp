import { mergeReadableStreams } from "https://deno.land/std@0.211.0/streams/merge_readable_streams.ts";
import { TextLineStream } from "https://deno.land/std@0.211.0/streams/text_line_stream.ts";
import {
    Secret,
    TOTP,
} from "https://deno.land/x/otpauth@v9.2.1/dist/otpauth.esm.js";

import djs from "./deno.json" assert { type: "json" };

const { version } = djs;

export type Options = {
    username: string;
    password: string;
    secret: Secret;
    config: string;
    verbose?: boolean;
};

const LINE_CLEAR = new TextEncoder().encode("\r\u001b[K");

export async function* connect({
    username,
    password,
    secret,
    config,
    verbose,
}: Options) {
    if (verbose) console.log("vpn-otp", version);

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

    Deno.addSignalListener("SIGINT", async () => await cleanup());

    if (verbose) console.log("running openvpn");

    const process = new Deno.Command("sudo", {
        args: [
            "openvpn",
            "--config",
            config,
            "--auth-nocache",
            "--auth-user-pass",
            credsPath,
        ],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
    }).spawn();
    process.stdin?.close();

    const output = mergeReadableStreams(process.stdout, process.stderr)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

    let cleanedUp = false;
    async function cleanup() {
        if (cleanedUp) return;
        if (verbose) console.log("deleting credentials", credsPath);
        await Deno.remove(credsPath);
        if (configPath) {
            if (verbose) console.log("deleting config", configPath);
            await Deno.remove(configPath);
        }
        cleanedUp = true;
    }

    const readyRE = /Initialization Sequence Completed/;
    const addrRE = /add net (\d+\.\d+\.\d+\.\d+): gateway (192|172)/;
    let addr = "?";

    console.log("Press Ctrl-C to stop");

    for await (const line of output) {
        if (verbose) console.log(line);
        else Deno.stdout.write(new TextEncoder().encode("."));

        const isAddr = line.match(addrRE);
        if (isAddr) {
            addr = isAddr[1];
            if (verbose) console.log("addr", { addr });
        }
        const isConnected = line.match(readyRE);
        if (isConnected) {
            await cleanup();
            await Deno.stdout.write(LINE_CLEAR);
            yield { addr, connected: true };
        }
    }
    if (verbose) console.log("openvpn exited");
}
