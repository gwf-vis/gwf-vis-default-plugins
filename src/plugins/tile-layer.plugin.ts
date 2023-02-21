import {
  GwfVisPlugin,
  GwfVisMapPlugin,
  LayerType,
  leaflet,
} from "gwf-vis-host";
import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export default class GwfVisPluginTileLayer
  extends LitElement
  implements GwfVisPlugin, GwfVisMapPlugin
{
  static styles = css`
    :host {
      display: block;
    }
  `;

  #tileLayerInstance?: leaflet.TileLayer;

  leaflet!: typeof leaflet;
  mapInstance!: leaflet.Map;
  addMapLayerCallback!: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean | undefined
  ) => void;
  removeMapLayerCallback!: (layer: leaflet.Layer) => void;
  notifyLoadingCallback!: () => () => void;

  @property() layerName: string = "tile layer";
  @property() layerType: LayerType = "base-layer";
  @property() active: boolean = false;
  @property() urlTemplate: string =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  @property() options?: leaflet.TileLayerOptions = {
    attribution:
      "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  };

  obtainHeader = () => `Tile Layer - ${this.layerName}`;

  updated() {
    this.initializeMapLayer();
  }

  render() {
    return html`${this.obtainHeader()}`;
  }

  private initializeMapLayer() {
    this.#tileLayerInstance &&
      this.removeMapLayerCallback(this.#tileLayerInstance);
    this.#tileLayerInstance = this.leaflet.tileLayer(
      this.urlTemplate,
      this.options
    );
    this.#tileLayerInstance &&
      this.addMapLayerCallback(
        this.#tileLayerInstance,
        this.layerName,
        this.layerType,
        this.active
      );
  }
}
