import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { readLines } from "./read_lines.ts";

Deno.test("read_lines", async () => {
    const input = new Blob(["abc\n123\nlastline"]).stream();
    const expected = ["abc", "123", "SHOULD NEVER BE SEEN"];
    for await (const line of readLines(input)) {
        assertEquals(line, expected.shift());
    }
    assertEquals(expected.length, 1);
});
