import { mergeReadableStreams } from "https://deno.land/std@0.211.0/streams/merge_readable_streams.ts";
import { TextLineStream } from "https://deno.land/std@0.211.0/streams/text_line_stream.ts";

export async function* shell(cmd: string, args: string[] = []) {
    const command = new Deno.Command(cmd, {
        args,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
    });
    const process = command.spawn();
    process.stdin?.close();

    const lines = mergeReadableStreams(process.stdout, process.stderr)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

    for await (const line of lines) yield line;
    console.log("shell", cmd, "exited");
}
