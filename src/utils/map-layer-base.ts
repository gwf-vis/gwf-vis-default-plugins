import {
  leaflet,
  VGAMapPlugin,
  VGAPlugin,
  LayerType,
} from "vga-core";
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators";

export abstract class GWFVisMapLayerPluginBase
  extends LitElement
  implements VGAPlugin, VGAMapPlugin {
  static styles = css`
    :host {
      display: block;
    }
  `;

  removeMapLayerDelegate?: (layer: leaflet.Layer) => void;
  notifyLoadingDelegate?: () => () => void;
  addMapLayerDelegate?: (
    layer: leaflet.Layer,
    name: string,
    type: LayerType,
    active?: boolean
  ) => void;

  @property() abstract displayName: string;
  @property() abstract type: LayerType;
  @property() abstract active: boolean;

  leaflet?: typeof import("leaflet");

  abstract obtainHeaderCallback: () => string;

  hostFirstLoadedCallback() {
    const loadingEndDelegate = this.notifyLoadingDelegate?.();
    this.initializeMapLayer();
    loadingEndDelegate?.();
  }

  render() {
    return html`${this.obtainHeaderCallback()}`;
  }

  protected abstract initializeMapLayer(): void;
}
