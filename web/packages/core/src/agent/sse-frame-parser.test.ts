import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SseFrameParser } from "./sse-frame-parser.js";

describe("SseFrameParser", () => {
  it("parses several frames delivered in one chunk, in order", () => {
    const parser = new SseFrameParser();

    const values = parser.push('data: {"n":1}\n\ndata: {"n":2}\n\n');

    assert.deepEqual(values, [{ n: 1 }, { n: 2 }]);
    assert.equal(parser.pending, "");
  });

  it("holds a frame split across chunks until it is complete", () => {
    const parser = new SseFrameParser();

    assert.deepEqual(parser.push('data: {"text":"hel'), []);
    assert.equal(parser.pending, 'data: {"text":"hel');
    assert.deepEqual(parser.push('lo"}\n'), []);
    assert.deepEqual(parser.push('\ndata: {"n":2}'), [{ text: "hello" }]);
    assert.equal(parser.pending, 'data: {"n":2}');
  });

  it("skips a malformed frame and keeps parsing the ones after it", () => {
    const parser = new SseFrameParser();

    const values = parser.push('data: {"n":1}\n\ndata: {not json\n\ndata: {"n":3}\n\n');

    assert.deepEqual(values, [{ n: 1 }, { n: 3 }]);
  });

  it("ignores frames without a data line, such as comments and event names alone", () => {
    const parser = new SseFrameParser();

    assert.deepEqual(parser.push(": keep alive\n\nevent: ping\n\n"), []);
  });

  it("reads the data line of a frame that also has other fields", () => {
    const parser = new SseFrameParser();

    assert.deepEqual(parser.push('event: message\nid: 7\ndata: {"n":7}\n\n'), [{ n: 7 }]);
  });

  it("accepts CRLF line endings", () => {
    const parser = new SseFrameParser();

    assert.deepEqual(parser.push('data: {"n":1}\r\n\r\n'), [{ n: 1 }]);
  });
});
