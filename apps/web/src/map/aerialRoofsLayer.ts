import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import type { TextureSource } from "@deck.gl/core";
import type { BuildingFeature } from "../lib/buildingAppearance";
import { indexAerialRoofs, type RoofTileBounds } from "../lib/aerialRoofMesh";

/** Runtime imagery stays with the existing attributed Esri provider. No images
 * are baked into the repo. Neutral roof surfaces remain underneath on failure.
 */
export function aerialRoofsLayer(features: BuildingFeature[]) {
  const tileMesh = indexAerialRoofs(features);
  return new TileLayer({
    id: "aerial-roof-surfaces",
    data: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    minZoom: 15, maxZoom: 19, tileSize: 256, maxRequests: 4, maxCacheSize: 64,
    extent: [99.90, 8.37, 100.08, 8.50],
    updateTriggers: { getTileData: [features] },
    renderSubLayers: props => {
      if (!props.data) return null;
      const [[w, s], [e, n]] = props.tile.boundingBox;
      const { origin, mesh } = tileMesh([w, s, e, n] as RoofTileBounds);
      if (!mesh.attributes.POSITION.value.length) return null;
      return new SimpleMeshLayer({
        ...props, id: `${props.id}-roofs`, data: [{ position: [0, 0, 0] }], mesh,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS, coordinateOrigin: origin,
        getPosition: d => d.position as [number, number, number],
        texture: props.data as TextureSource, getColor: [255, 255, 255], material: false,
        pickable: false,
      });
    },
  });
}
