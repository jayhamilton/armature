/**
 * Turns a server sent event stream, delivered in arbitrary chunks, into the JSON value of each
 * complete `data:` frame.
 *
 * A network chunk can end in the middle of a frame, or carry several frames, so the parser keeps
 * whatever follows the last blank line until the next chunk completes it. A frame that is not
 * valid JSON is skipped rather than ending the stream: one bad frame should not lose the rest of
 * the reply.
 *
 * Frames are separated by a blank line (`\n\n`; `\r\n` line endings are normalized first). Only the
 * first `data:` line of a frame is read, which is all the agent endpoint sends.
 */
export class SseFrameParser {
  private buffer = "";

  /** Adds a chunk and returns the parsed value of every frame it completed, in order. */
  push(chunk: string): unknown[] {
    this.buffer += chunk.replace(/\r\n/g, "\n");
    const frames = this.buffer.split("\n\n");
    // The last segment is empty (the chunk ended on a frame boundary) or a frame still arriving.
    this.buffer = frames.pop() ?? "";
    return frames.flatMap((frame) => parseFrame(frame));
  }

  /** Text received after the last complete frame, still waiting for its end. */
  get pending(): string {
    return this.buffer;
  }
}

function parseFrame(frame: string): unknown[] {
  const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
  if (!dataLine) return [];
  try {
    return [JSON.parse(dataLine.slice("data:".length).trim())];
  } catch {
    return [];
  }
}
