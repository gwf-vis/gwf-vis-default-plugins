import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginLayer, ObtainDataDelegateDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-geojson-layer',
  styleUrl: 'gwf-vis-plugin-geojson-layer.css',
  shadow: true,
})
export class GwfVisPluginGeojsonLayer implements ComponentInterface, GwfVisPluginLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-geojson-layer';
  static readonly __PLUGIN_FOR__ = 'layer';

  private geojsonLayerInstance: L.GeoJSON;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() addToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() removeFromMapDelegate: (layer: L.Layer) => void;
  @Prop() obtainDataDelegateDict: ObtainDataDelegateDict;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() options?: L.GeoJSONOptions;
  @Prop() datasetName: string;
  @Prop() variableName: string;

  async componentWillRender() {
    this.removeFromMapDelegate(this.geojsonLayerInstance);
    const shape = this.obtainDataDelegateDict?.obtainShape(this.datasetName);
    if (shape?.type === 'geojson') {
      this.geojsonLayerInstance = this.leaflet.geoJSON(shape.data, {
        ...this.options,
        onEachFeature: ({ properties }, layer) => {
          layer.on('click', () =>
            this.updateGlobalInfoDelegate?.({
              ...this.globalInfoDict,
              userSelectionDict: { dataset: this.datasetName, location: properties.id, variable: this.variableName },
            }),
          );
        },
      });
      this.addToMapDelegate(this.geojsonLayerInstance, this.name, this.type, this.active);
      this.geojsonLayerInstance.setStyle(({ properties }) => {
        const fillColor = `hsl(${this.obtainDataDelegateDict?.obtainValue(this.datasetName, properties.id, this.variableName, this.globalInfoDict?.dimensionDict)}, 100%, 50%)`;
        const style = {
          fillColor,
        };
        if (
          this.globalInfoDict?.userSelectionDict?.dataset === this.datasetName &&
          this.globalInfoDict?.userSelectionDict?.location === properties?.id &&
          this.globalInfoDict?.userSelectionDict?.variable === this.variableName
        ) {
          style['dashArray'] = '5,10';
        }
        return style;
      });
    }
  }

  async disconnectedCallback() {
    this.geojsonLayerInstance?.remove();
  }

  render() {
    return <Host></Host>;
  }
}
