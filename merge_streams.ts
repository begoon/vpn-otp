type StreamReadResult = ReadableStreamDefaultReadResult<Uint8Array>;

type DoneFunc = (value: StreamReadResult["value"]) => void;

export function mergeStreams(streams: ReadableStream<Uint8Array>[]) {
    const readers = streams.map((stream) => stream.getReader());
    const reads: (Promise<StreamReadResult> | null)[] = streams.map(() => null);
    const dones: DoneFunc[] = [];
    const allDone = Promise.all(
        streams.map((_stream) => new Promise((resolve) => dones.push(resolve)))
    );

    function pull(controller: ReadableByteStreamController) {
        const races = readers.map((reader, i) => {
            const read = reader.read();
            read.then((v) => {
                if (v.done) {
                    dones[i](v.value);
                    // never firing promise
                    return new Promise(() => {});
                }
                controller.enqueue(v.value);
                reads[i] = null;
            });
            if (!reads[i]) reads[i] = read;
            return reads[i];
        });
        return Promise.race(races);
    }

    return new ReadableStream({
        start: (controller) => {
            allDone.then(() => controller.close());
        },
        // @ts-ignore deno-ts(2769)
        pull,
        cancel: (reason) => readers.forEach((r) => r.cancel(reason)),
    });
}
