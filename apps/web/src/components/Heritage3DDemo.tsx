/**
 * Heritage3DDemo — a 3D-photogrammetry heritage viewer.
 *
 * The model we ship is the Ayutthaya "Wat Mahathat" photogrammetry,
 * captured by CyArk and processed by Agisoft, distributed under CC
 * Attribution-NonCommercial-ShareAlike via Sketchfab:
 *
 *   https://sketchfab.com/3d-models/none-991ff575867e4b3699e2019adf86b589
 *
 * Wat Mahathat is in Ayutthaya Historical Park (~700 km north of NST),
 * not in Nakhon Si Thammarat itself. We surface it on the NST map as
 * a flagship "what's possible" demo — for the NST city team, we ship
 * the same primitive (Sketchfab embed) alongside the existing CyArk-
 * derived terrain tiles. The visible attribution strip below the
 * iframe makes the geographic location explicit so a viewer doesn't
 * confuse Ayutthaya with NST.
 *
 * Why Sketchfab iframe (not self-host GLB, not Cesium 3D Tiles):
 *
 *   1. Sketchfab serves the model + textures + lighting from their own
 *      CDN. We pay zero bandwidth.
 *   2. Embed = keyless, no OAuth dance. The Data API (used to find
 *      uid 991ff575… by searching "Wat Mahattat") is keyless for read.
 *   3. Adding it is <dialog> + <iframe>. Twenty lines.
 *
 * When the user wants to ship photogrammetry of an actual NST spire
 * (e.g. Phra Borommathat Chedi or Wat Phra Mahathat Woromawihan), the
 * next iteration replaces the Skethfab uid with one of their own and
 * leaves the rest of this file unchanged.
 */
import { Dialog } from "./Dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Sketchfab model uid for the CC-BY-NC-SA "Wat Mahathat" photogrammetry.
const SKETCHFAB_UID = "991ff575867e4b3699e2019adf86b589";

// Tunable embed params. silent mode hides the Sketchfab "explore more"
// chrome; autostart gets the user into orbit-spin on first paint;
// ui_theme=dark matches the NST dashboard's primary surface.
const EMBED_BASE = `https://sketchfab.com/models/${SKETCHFAB_UID}/embed`;
const EMBED_PARAMS =
  "autostart=1&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_watermark=0&ui_inspector=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=1&ui_annotations=1&ui_animations=0&transparent=1";

export function Heritage3DDemo({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      modal
      size="full"
      eyebrow="NST · HERITAGE 3D DEMO"
      title="วัดมหาธาตุ (Wat Mahathat) — photogrammetry"
      description={
        <>
          CyArk & Agisoft, CC BY-NC-SA — Ayutthaya Historical Park, central
          Thailand. ~700 km north of NST; we ship it here as a flagship
          proof-of-concept for the same Sketchfab-embed primitive on the
          city's own spires.
        </>
      }
      actions={
        <a
          className="btn topbar-heritage-3d__external"
          href={`https://sketchfab.com/3d-models/none-${SKETCHFAB_UID}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the Wat Mahathat model on Sketchfab in a new tab"
        >
          Open on Sketchfab ↗
        </a>
      }
    >
      <div className="heritage-3d-frame">
        <iframe
          title="Wat Mahathat photogrammetry — Sketchfab embed"
          src={`${EMBED_BASE}?${EMBED_PARAMS}`}
          allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="heritage-3d-credit">
        Model <a href={`https://sketchfab.com/3d-models/none-${SKETCHFAB_UID}`} target="_blank" rel="noopener noreferrer">"Wat Mahathat"</a> by <strong>CyArk</strong>, processed in <strong>Agisoft</strong>.
        Source photos: CyArk / Open Heritage 3D. Licensed{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>.
        Embedded via <a href="https://sketchfab.com" target="_blank" rel="noopener noreferrer">Sketchfab</a>.
        Hosted by Sketchfab; the model is <em>not</em> of a Nakhon Si Thammarat
        monument — it's the same <code>&lt;iframe&gt;</code> primitive that we
        will reuse for an NST spire the next iteration.
      </p>
    </Dialog>
  );
}
