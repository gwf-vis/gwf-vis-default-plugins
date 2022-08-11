import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-tile-layer',
  styleUrl: 'gwf-vis-plugin-tile-layer.css',
  shadow: true,
})
export class GwfVisPluginTileLayer implements ComponentInterface, GwfVisPluginMapLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-tile-layer';

  private tileLayerInstance: L.TileLayer;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() delegateOfRemovingFromMap: (layer: L.Layer) => void;
  @Prop() globalInfo: GloablInfo;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'base-layer';
  @Prop() active: boolean = true;
  @Prop() urlTemplate: string;
  @Prop() options?: L.TileLayerOptions;

  async connectedCallback() {
    this.delegateOfRemovingFromMap?.(this.tileLayerInstance);
    if (this.urlTemplate) {
      this.tileLayerInstance = this.leaflet.tileLayer(this.urlTemplate, this.options);
      this.delegateOfAddingToMap(this.tileLayerInstance, this.name, this.type, this.active);
    }
  }

  async disconnectedCallback() {
    this.delegateOfRemovingFromMap?.(this.tileLayerInstance);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (propName === 'globalInfoDict') {
      return false;
    }
  }

  @Method()
  async obtainHeader() {
    return 'GeoJSON Map Layer';
  }

  render() {
    return <Host></Host>;
  }
}
