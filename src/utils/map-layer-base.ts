import { leaflet } from "gwf-vis-host";
import {
  GWFVisMapPlugin,
  GWFVisPlugin,
  LayerType,
} from "gwf-vis-host/types/utils/plugin";
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators";

export abstract class GWFVisMapLayerPluginBase
  extends LitElement
  implements GWFVisPlugin, GWFVisMapPlugin
{
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property() abstract displayName: string;
  @property() abstract type: LayerType;
  @property() abstract active: boolean;

  leaflet?: typeof import("leaflet");
  addMapLayerCallback?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;
  removeMapLayerCallback?: (layer: leaflet.Layer) => void;
  notifyLoadingCallback?: () => () => void;

  abstract obtainHeader: () => string;

  hostFirstLoadedHandler() {
    const loadingEndCallback = this.notifyLoadingCallback?.();
    this.initializeMapLayer();
    loadingEndCallback?.();
  }

  render() {
    return html`${this.obtainHeader()}`;
  }

  protected abstract initializeMapLayer(): void;
}
