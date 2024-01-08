import { assert } from "https://deno.land/std@0.210.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.210.0/assert/assert_equals.ts";
import { shell } from "./shell.ts";

Deno.test("shell/uname -a", async () => {
    const exe = shell("uname", ["-a"]);
    for await (const line of exe) {
        assert(line.toLowerCase().includes(Deno.build.os));
    }
});

Deno.test("shell/echo", async () => {
    const exe = shell("echo", ["123\nabc\n"]);
    const expected = ["123", "abc", "", "SHOULD NOT BE SEEN"];
    for await (const line of exe) assertEquals(line, expected.shift());
    assertEquals(expected.length, 1);
});
