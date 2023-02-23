import {
  GWFVisPlugin,
  GWFVisMapPlugin,
  LayerType,
  leaflet,
} from "gwf-vis-host";
import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export default class GWFVisPluginTileLayer
  extends LitElement
  implements GWFVisPlugin, GWFVisMapPlugin
{
  static styles = css`
    :host {
      display: block;
    }
  `;

  #tileLayerInstance?: leaflet.TileLayer;

  leaflet?: typeof leaflet;
  mapInstance?: leaflet.Map;
  addMapLayerCallback?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean | undefined
  ) => void;
  removeMapLayerCallback?: (layer: leaflet.Layer) => void;
  notifyLoadingCallback?: () => () => void;

  @property() displayedName: string = "tile layer";
  @property() type: LayerType = "base-layer";
  @property() active: boolean = false;
  @property() urlTemplate: string =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  @property() options?: leaflet.TileLayerOptions = {
    attribution:
      "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  };

  obtainHeader = () => `Tile Layer - ${this.displayedName}`;

  hostFirstLoadedHandler() {
    const loadingEndCallback = this.notifyLoadingCallback?.();
    this.initializeMapLayer();
    loadingEndCallback?.();
  }

  render() {
    return html`${this.obtainHeader()}`;
  }

  private initializeMapLayer() {
    this.#tileLayerInstance &&
      this.removeMapLayerCallback?.(this.#tileLayerInstance);
    this.#tileLayerInstance = this.leaflet?.tileLayer(
      this.urlTemplate,
      this.options
    );
    this.#tileLayerInstance &&
      this.addMapLayerCallback?.(
        this.#tileLayerInstance,
        this.displayedName,
        this.type,
        this.active
      );
  }
}
