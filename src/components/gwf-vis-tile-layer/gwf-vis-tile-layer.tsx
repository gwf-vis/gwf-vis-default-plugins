import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginLayer, ObtainDataDelegateDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-tile-layer',
  styleUrl: 'gwf-vis-tile-layer.css',
  shadow: true,
})
export class GwfVisTileLayer implements ComponentInterface, GwfVisPluginLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-tile-layer';
  static readonly __PLUGIN_FOR__ = 'layer';

  private tileLayerInstance: L.TileLayer;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() addToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() obtainDataDelegateDict: ObtainDataDelegateDict;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'base-layer';
  @Prop() active: boolean = true;
  @Prop() urlTemplate: string;
  @Prop() options?: L.TileLayerOptions;

  async componentWillRender() {
    this.tileLayerInstance?.remove();
    if (this.urlTemplate) {
      this.tileLayerInstance = this.leaflet.tileLayer(this.urlTemplate, this.options);
      this.addToMapDelegate(this.tileLayerInstance, this.name, this.type, this.active);
    }
  }

  async disconnectedCallback() {
    this.tileLayerInstance?.remove();
  }

  render() {
    return <Host></Host>;
  }
}
