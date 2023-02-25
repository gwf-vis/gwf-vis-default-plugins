import type { GeoJsonObject } from "geojson";
import type { LayerType, leaflet } from "gwf-vis-host";
import { property } from "lit/decorators.js";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";

export default class GWFVisPluginGeoJSONLayer extends GWFVisMapLayerPluginBase {
  #geojsonLayerInstance?: leaflet.GeoJSON;

  @property() displayName: string = "geojson layer";
  @property() type: LayerType = "overlay";
  @property() active: boolean = false;
  @property() geojson?: GeoJsonObject | GeoJsonObject[] | string;
  @property() options?: leaflet.GeoJSONOptions;

  obtainHeaderCallback = () => `GeoJSON Layer - ${this.displayName}`;

  protected override initializeMapLayer() {
    this.#geojsonLayerInstance &&
      this.removeMapLayerDelegate?.(this.#geojsonLayerInstance);
    this.#geojsonLayerInstance = this.leaflet?.geoJSON(this.obtainGeoJSON(), {
      ...this.options,
      pointToLayer: (_feature, latlng) =>
        new globalThis.L.CircleMarker(latlng, { radius: 10 }),
    });
    this.#geojsonLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#geojsonLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
  }

  private obtainGeoJSON() {
    if (typeof this.geojson === "string") {
      return JSON.parse(this.geojson);
    }
    if (typeof this.geojson === "object") {
      return this.geojson;
    }
  }
}
