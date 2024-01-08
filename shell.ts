import { mergeStreams } from "./merge_streams.ts";
import { readLines } from "./read_lines.ts";

export async function* shell(cmd: string, args: string[] = []) {
    const command = new Deno.Command(cmd, {
        args,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
    });
    const process = command.spawn();
    process.stdin?.close();
    const output = mergeStreams([process.stdout, process.stderr]);
    for await (const line of readLines(output)) yield line;
    console.log("shell", cmd, "exited");
}
