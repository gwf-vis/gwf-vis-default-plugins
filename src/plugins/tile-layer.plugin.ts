import type { LayerType, leaflet } from "gwf-vis-host";
import { property } from "lit/decorators.js";
import { GWFVisMapLayerPluginBase } from "../utils/map-layer-base";

export default class GWFVisPluginTileLayer extends GWFVisMapLayerPluginBase {
  #tileLayerInstance?: leaflet.TileLayer;

  @property() displayName: string = "tile layer";
  @property() type: LayerType = "base-layer";
  @property() active: boolean = false;
  @property() urlTemplate: string =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  @property() options?: leaflet.TileLayerOptions = {
    attribution:
      "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  };

  obtainHeaderCallback = () => `Tile Layer - ${this.displayName}`;

  protected override initializeMapLayer() {
    this.#tileLayerInstance &&
      this.removeMapLayerDelegate?.(this.#tileLayerInstance);
    this.#tileLayerInstance = this.leaflet?.tileLayer(
      this.urlTemplate,
      this.options
    );
    this.#tileLayerInstance &&
      this.addMapLayerDelegate?.(
        this.#tileLayerInstance,
        this.displayName,
        this.type,
        this.active
      );
  }
}
