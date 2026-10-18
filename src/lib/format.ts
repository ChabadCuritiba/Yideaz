// Asaas charges in Brazilian reais.
export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function date(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Turns a YouTube or Vimeo link into an embeddable player URL. Returns null for direct files. */
export function embedUrl(url: string) {
  try {
    const u = new URL(url, "http://local");
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return null;
}

/** Thumbnail for a YouTube link, so video cards aren't blank. */
export function videoThumb(url: string) {
  const embed = embedUrl(url);
  const id = embed?.match(/youtube\.com\/embed\/([^?/]+)/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
