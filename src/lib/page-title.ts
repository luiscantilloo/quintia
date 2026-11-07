import type { Metadata } from "next";

type PageTitleOptions = {
  /** Si es false (default en pantallas de la app), Google no indexa la URL. */
  index?: boolean;
  description?: string;
};

export function pageTitle(title: string, opts: PageTitleOptions = {}): Metadata {
  const index = opts.index === true;
  return {
    title,
    ...(opts.description ? { description: opts.description } : {}),
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}
