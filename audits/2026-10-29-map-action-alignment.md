# Map action alignment — 29 October 2026

Task: operate the compass, zoom and ASK controls without a launcher covering the map navigation.

Found: at390×844 the closed ASK banner occupied374×72px and overlapped the zoom stack vertically by16px. Its right edge was382px while compass/zoom ended at378px. At1024px ASK followed desktop footer placement while the map used mobile tabs, producing a separate edge. The user's screenshot also showed the long description wrapping into a large banner.

Changed: compass and zoom now flow in one map-navigation stack. Phone/tablet ASK is a content-sized, one-line task label. The map controls and ASK share an8px right inset and8px vertical separation above the62px tab bar; targets are44px tall. Desktop keeps ASK in the existing footer while compass and zoom share the map edge. No chat functionality or map interactions removed.

Verified locally: web typecheck and diff check passed. Rendered actual app at390×844,1024×900 and1440×900, including chat dialog, Escape close, compass click and keyboard zoom activation. Right edges382/1016px match for allthree phone/tablet controls; zoom and compass match ondesktop. No horizontal overflow. Phone top/nav chrome52+62px=13.5%; tablet12.7%; desktop header56px=6.2%, with existing footer. Independent visual review found no scoped alignment blocker. Evidence: /Volumes/Data/agent-artifacts/NST/2026-10-29-map-alignment.

Limits: initial local renders used an unavailable dev API; repeated with production API. Basemap/buildings loading is a separate unresolved audit item, not certified by this alignment pass. Before1440 screenshot was invalidated by HMR and is not comparison evidence. All-menu/all-lens behavior is outside this change.

Release: successful CI and automatic deployment required before live verification.
