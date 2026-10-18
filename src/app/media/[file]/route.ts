import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { MIME, UPLOAD_DIR } from "@/lib/storage";

// Serves uploaded media, with Range support so videos can seek.
export async function GET(req: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  const name = path.basename(file);
  const full = path.join(UPLOAD_DIR, name);
  const type = MIME[path.extname(name).toLowerCase()];
  const stat = await fs.promises.stat(full).catch(() => null);
  if (!type || !stat?.isFile()) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(stat.size - Number(range[2]), 0);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(stat.size) } });
}
