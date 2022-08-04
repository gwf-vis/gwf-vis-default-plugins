import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginLayer } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-tile-layer',
  styleUrl: 'gwf-vis-plugin-tile-layer.css',
  shadow: true,
})
export class GwfVisPluginTileLayer implements ComponentInterface, GwfVisPluginLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-tile-layer';
  static readonly __PLUGIN_FOR__ = 'layer';

  private tileLayerInstance: L.TileLayer;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() addingToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() removingFromMapDelegate: (layer: L.Layer) => void;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'base-layer';
  @Prop() active: boolean = true;
  @Prop() urlTemplate: string;
  @Prop() options?: L.TileLayerOptions;

  async componentWillRender() {
    this.removingFromMapDelegate(this.tileLayerInstance);
    if (this.urlTemplate) {
      this.tileLayerInstance = this.leaflet.tileLayer(this.urlTemplate, this.options);
      this.addingToMapDelegate(this.tileLayerInstance, this.name, this.type, this.active);
    }
  }

  async disconnectedCallback() {
    this.tileLayerInstance?.remove();
  }

  render() {
    return <Host></Host>;
  }
}
