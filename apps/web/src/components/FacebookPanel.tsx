/**
 * FacebookPanel — embeds the official Nakhon Si Thammarat City PR Facebook page
 * (facebook.com/nakhoncity — เทศบาลนครนครศรีธรรมราช) via Meta's no-auth page plugin
 * (https://developers.facebook.com/docs/plugins/page-plugin).
 *
 * The plugin iframe pulls live posts directly from facebook.com with no
 * credentials needed. It respects the visitor's FB login state and
 * shows the latest 4-6 posts in a timeline.
 *
 * If the FACEBOOK_PAGE_TOKEN env is set on the API, server-side Graph API
 * data is shown above the iframe (richer formatting, action-tagged).
 */

import { PanelHeader } from "./PanelHeader";
import type { FallbackTier } from "@nst/shared";
import { ago } from "../lib/time";

interface FbPost {
  id: string;
  message: string;
  permalink: string;
  createdAt: string;
  reactions?: number;
  comments?: number;
  shares?: number;
}

interface Props {
  posts: FbPost[];
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const PAGE_URL = "https://www.facebook.com/pr.nakhoncity1";
const PAGE_USERNAME = "pr.nakhoncity1";
const POST_LIMIT = 4;
const MESSAGE_LIMIT = 240;
const EMBED_HEIGHT = 420;

function engagement(p: FbPost): string {
  const parts: string[] = [];
  if (p.reactions != null) parts.push(`${p.reactions} reactions`);
  if (p.comments != null) parts.push(`${p.comments} comments`);
  if (p.shares != null) parts.push(`${p.shares} shares`);
  return parts.join(" · ");
}

export function FacebookPanel({ posts, loading, ageMinutes, fallbackTier }: Props) {
  const embedSrc = `https://www.facebook.com/plugins/page.php?` +
    `href=${encodeURIComponent(PAGE_URL)}` +
    `&tabs=timeline&width=320&height=${EMBED_HEIGHT}&locale=th_TH` +
    `&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`;

  return (
    <section className="panel" aria-label="City Facebook page" aria-busy={loading}>
      <PanelHeader
        title="FACEBOOK // เทศบาลนครนครศรีธรรมราช"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="facebook-graph"
        actions={
          <a href={PAGE_URL} target="_blank" rel="noreferrer noopener" className="link pc-meta">
            @{PAGE_USERNAME} <span aria-hidden="true">↗</span>
          </a>
        }
      />

      {/* Server-side posts via Graph API (only when token configured) */}
      {posts.length > 0 && (
        <ul className="pc-list">
          {posts.slice(0, POST_LIMIT).map((p) => (
            <li key={p.id}>
              <a href={p.permalink} target="_blank" rel="noreferrer noopener" className="desk-item">
                <span className="pc-spread">
                  <span className="pc-label">Post</span>
                  <span className="pc-meta num">{ago(p.createdAt)}</span>
                </span>
                <span className="fb-post__msg" lang="th">
                  {p.message.slice(0, MESSAGE_LIMIT)}{p.message.length > MESSAGE_LIMIT ? "…" : ""}
                </span>
                {engagement(p) && <span className="pc-meta num">{engagement(p)}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Meta's free page-plugin iframe — always works, no token needed.
          Width sized to column minus a 12 px right gutter so it never
          bleeds past the right edge of the news rail. Wrapper clips any
          overflow so the iframe never pushes into adjacent layout zones. */}
      <div className="fb-embed">
        <iframe
          className="fb-embed__frame"
          src={embedSrc}
          height={EMBED_HEIGHT}
          title="Nakhon Si Thammarat City Facebook page timeline"
          allow="encrypted-media"
          loading="lazy"
        />
      </div>

      {posts.length === 0 && !loading && (
        <p className="pc-meta">
          Live timeline above via Meta page plugin. For server-side tagged posts,
          set <code>FACEBOOK_PAGE_TOKEN</code> in the API env.
        </p>
      )}
    </section>
  );
}
