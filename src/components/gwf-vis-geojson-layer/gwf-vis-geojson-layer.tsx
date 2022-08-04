import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GwfVisPluginLayer } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-geojson-layer',
  styleUrl: 'gwf-vis-geojson-layer.css',
  shadow: true,
})
export class GwfVisGeojsonLayer implements ComponentInterface, GwfVisPluginLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-geojson-layer';
  static readonly __PLUGIN_FOR__ = 'layer';

  private geojsonLayerInstance: L.GeoJSON;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() addToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() geojson: GeoJSON.GeoJsonObject;
  @Prop() options?: L.GeoJSONOptions;

  async componentWillRender() {
    this.geojsonLayerInstance?.remove();
    if (this.geojson) {
      this.geojsonLayerInstance = this.leaflet.geoJSON(this.geojson, this.options);
      this.addToMapDelegate(this.geojsonLayerInstance, this.name, this.type, this.active);
    }
  }

  async disconnectedCallback() {
    this.geojsonLayerInstance?.remove();
  }

  render() {
    return <Host></Host>;
  }
}
