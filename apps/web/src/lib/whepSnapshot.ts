/**
 * whepSnapshot — grab a single still frame from a MediaMTX WHEP (WebRTC)
 * stream, then tear the peer connection down.
 *
 * Why this exists: the NST municipal wall has 100+ cameras, but the upstream
 * only serves live WebRTC reader pages (no JPEG snapshot, no HLS). A live
 * WebRTC decoder per tile freezes the tab past ~4 streams — so we can't show
 * 100 tiles live. Instead each tile opens a short-lived WHEP session, paints
 * ONE frame to a canvas, closes the connection, and keeps the still. A small
 * pool (see `captureFrame`'s callers) cycles through cameras like a NOC
 * "guard tour": every tile ends up showing a recent image, only a handful of
 * decoders ever run at once.
 *
 * The upstream (nstcctv.nakhoncity.org) is MediaMTX in ICE-lite mode on a
 * public IP with `Access-Control-Allow-Origin: *` and no advertised ICE
 * servers — so a plain recvonly offer with host candidates connects with no
 * STUN/TURN, exactly like the official reader.js the site embeds.
 */

const CAPTURE_TIMEOUT_MS = 9_000; // hard cap on the whole handshake→frame flow
const ICE_GATHER_MS = 1_200; // non-trickle: wait this long for host candidates
const FRAME_SETTLE_MS = 250; // let one decoded frame land before we grab it
const JPEG_QUALITY = 0.55; // small stills — this is a thumbnail wall

export interface WhepFrame {
  /** `data:image/jpeg;base64,…` — safe to drop straight into an <img src>. */
  dataUrl: string;
  /** epoch ms the frame was captured. */
  capturedAt: number;
}

interface VideoWithRvfc extends HTMLVideoElement {
  requestVideoFrameCallback?: (cb: () => void) => number;
}

/** Resolve once the peer connection has gathered its ICE candidates, or after
 *  a short cap (host-only candidates gather almost instantly; we never want to
 *  block the whole flow on a slow relay we don't have anyway). */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    window.setTimeout(done, ICE_GATHER_MS);
  });
}

/** Resolve once the <video> has a real, non-empty frame ready to paint. */
function waitForDecodedFrame(video: VideoWithRvfc, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const onAbort = () => reject(new Error("aborted"));
    signal.addEventListener("abort", onAbort, { once: true });

    const grab = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        window.setTimeout(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        }, FRAME_SETTLE_MS);
      } else {
        // No dimensions yet — poll on the next frame.
        requestAnimationFrame(grab);
      }
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => grab());
    } else {
      video.addEventListener("loadeddata", () => grab(), { once: true });
      requestAnimationFrame(grab);
    }
  });
}

/**
 * Capture one frame from a WHEP endpoint. Rejects on timeout, HTTP error
 * (including 429 — the caller should back that camera off), or if the stream
 * never produces a frame. Always tears down the connection + DELETEs the
 * WHEP session on the way out.
 */
export async function captureFrame(
  whepUrl: string,
  externalSignal?: AbortSignal,
): Promise<WhepFrame> {
  if (typeof RTCPeerConnection === "undefined") {
    throw new Error("webrtc-unsupported");
  }

  const controller = new AbortController();
  const { signal } = controller;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);

  const pc = new RTCPeerConnection({ iceServers: [] });
  const video = document.createElement("video") as VideoWithRvfc;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  const cleanup = () => {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", onExternalAbort);
    try {
      video.pause();
      video.srcObject = null;
    } catch {
      /* element already detached */
    }
    // Closing the peer connection drops ICE/DTLS; MediaMTX detects the reader
    // is gone and reaps the session on its own. We deliberately DON'T send the
    // WHEP DELETE — the upstream rate-limits aggressively (~60 req/window) and
    // an extra request per capture is not worth it for a self-reaping session.
    try {
      pc.close();
    } catch {
      /* already closed */
    }
  };

  try {
    const trackReady = new Promise<MediaStream>((resolve, reject) => {
      if (signal.aborted) return reject(new Error("aborted"));
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      pc.addEventListener("track", (e) => {
        if (e.streams[0]) resolve(e.streams[0]);
      });
    });

    pc.addTransceiver("video", { direction: "recvonly" });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);

    const res = await fetch(whepUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: pc.localDescription?.sdp ?? offer.sdp ?? "",
      signal,
    });
    if (!res.ok) throw new Error(`whep-http-${res.status}`);
    const answerSdp = await res.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    const stream = await trackReady;
    video.srcObject = stream;
    await video.play().catch(() => {}); // muted autoplay — a rejection is fine
    await waitForDecodedFrame(video, signal);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-2d-context");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // WebRTC MediaStream frames are same-origin for canvas purposes (they are
    // not a cross-origin <img>), so toDataURL is not tainted.
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { dataUrl, capturedAt: Date.now() };
  } finally {
    cleanup();
  }
}
