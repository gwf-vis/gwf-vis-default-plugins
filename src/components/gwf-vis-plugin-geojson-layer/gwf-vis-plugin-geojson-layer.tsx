import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginLayer } from '../../utils/gwf-vis-plugin';

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
  @Prop() fetchingDataDelegate: (query: any) => any;
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
    const shape = this.fetchingDataDelegate?.({
      type: 'shape',
      for: {
        dataset: this.datasetName,
      },
    });
    if (shape?.type === 'geojson') {
      const locationIds: string[] = [];
      this.geojsonLayerInstance = this.leaflet.geoJSON(shape.data, {
        ...this.options,
        onEachFeature: ({ properties }, layer) => {
          locationIds.push(properties.id.toString());
          layer.on('click', () =>
            this.updateGlobalInfoDelegate?.({
              ...this.globalInfoDict,
              userSelectionDict: { dataset: this.datasetName, location: properties.id, variable: this.variableName },
            }),
          );
        },
      });
      this.addToMapDelegate(this.geojsonLayerInstance, this.name, this.type, this.active);
      const values: { location: string; value: number }[] = this.fetchingDataDelegate?.({
        type: 'values',
        for: {
          dataset: this.datasetName,
          location: locationIds,
          variable: this.variableName,
          dimensions: this.globalInfoDict?.dimensionDict,
        },
      });
      this.geojsonLayerInstance.setStyle(({ properties }) => {
        const fillColor = `hsl(${values.find(({ location }) => location === properties.id.toString())?.value}, 100%, 50%)`;
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
