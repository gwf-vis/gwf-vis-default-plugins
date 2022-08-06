import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginLayer } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-geojson-layer',
  styleUrl: 'gwf-vis-plugin-geojson-layer.css',
  shadow: true,
})
export class GwfVisPluginGeojsonLayer implements ComponentInterface, GwfVisPluginLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-geojson-layer';
  static readonly __PLUGIN_TYPE__ = 'layer';

  private geojsonLayerInstance: L.GeoJSON;

  @Prop() leaflet: typeof globalThis.L;
  @Prop() addingToMapDelegate: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() removingFromMapDelegate: (layer: L.Layer) => void;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() name: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() options?: L.GeoJSONOptions;
  @Prop() datasetId: string;
  @Prop() variableName?: string;
  @Prop({ mutable: true }) dimensions?: { [dimension: string]: number };

  async connectedCallback() {
    this.removingFromMapDelegate?.(this.geojsonLayerInstance);
    await this.drawShape();
    await this.applyData();
    await this.applyHighlighs();
    this.addingToMapDelegate(this.geojsonLayerInstance, this.name, this.type, this.active);
  }

  async disconnectedCallback() {
    this.removingFromMapDelegate?.(this.geojsonLayerInstance);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (propName === 'datasetId') {
      this.drawShape().then(() => this.applyData().then(() => this.applyHighlighs()));
    } else if (propName === 'globalInfoDict') {
      if (_newValue?.variableName !== _oldValue?.variableName || _newValue?.dimensionDict !== _oldValue?.dimensionDict) {
        this.applyData();
      }
      if (_newValue?.userSelectionDict !== _oldValue?.userSelectionDict || _newValue?.pinnedSelections !== _oldValue?.pinnedSelections) {
        this.applyHighlighs();
      }
    } else {
      this.applyData();
    }
  }

  render() {
    return <Host></Host>;
  }

  private async applyData() {
    const variableName = this.variableName || this.globalInfoDict?.variableName;
    const dimensions = this.dimensions || this.globalInfoDict?.dimensionDict;
    let values, maxValue, minValue;
    if (variableName && dimensions) {
      values = await this.fetchingDataDelegate?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variableName,
          dimensions,
        },
        for: ['location', 'value'],
      });
      [{ 'max(value)': maxValue }] = (await this.fetchingDataDelegate?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variableName,
        },
        for: ['max(value)'],
      })) || [{ 'max(value)': undefined }];
      [{ 'min(value)': minValue }] = (await this.fetchingDataDelegate?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variableName,
        },
        for: ['min(value)'],
      })) || [{ 'min(value)': undefined }];
    }

    this.geojsonLayerInstance.setStyle(feature => {
      const { properties } = feature;
      const valueScale = value => ((value - minValue) / (maxValue - minValue)) * (1 - 0);
      const value = values?.find(({ location }) => location === properties.id)?.value;
      const fillColor = `hsl(${valueScale(value) + 240}, 100%, 50%)`;
      const style = {
        fillColor,
      };
      return style;
    });
  }

  private async applyHighlighs() {
    this.geojsonLayerInstance.setStyle(feature => {
      const { properties } = feature;
      const style = {
        color: 'hsl(0, 0%, 70%)',
        weight: 3,
      };
      if (this.globalInfoDict?.userSelectionDict?.dataset === this.datasetId && this.globalInfoDict?.userSelectionDict?.location === properties?.id) {
        style['weight'] = 6;
        this.geojsonLayerInstance
          .getLayers()
          ?.find(layer => layer['feature'] === feature)
          ?.['bringToFront']();
      }
      const matchedPin = this.globalInfoDict?.pinnedSelections?.find(pin => pin.dataset === this.datasetId && pin.location === properties.id);
      if (matchedPin) {
        style['color'] = matchedPin.color;
      }
      return style;
    });
  }

  private async drawShape() {
    const locations = await this.fetchingDataDelegate?.({
      type: 'locations',
      from: this.datasetId,
      for: ['id', 'geometry'],
    });
    const geojson = {
      type: 'FeatureCollection',
      features:
        locations?.map((location: any) => ({
          type: 'Feature',
          properties: {
            id: location.id,
          },
          geometry: location.geometry,
        })) || [],
    } as any;
    const locationIds: string[] = [];
    this.geojsonLayerInstance = this.leaflet.geoJSON(geojson, {
      ...this.options,
      onEachFeature: ({ properties }, layer) => {
        locationIds.push(properties.id.toString());
        layer.on('click', () =>
          this.updatingGlobalInfoDelegate?.({
            ...this.globalInfoDict,
            userSelectionDict: { dataset: this.datasetId, location: properties.id },
          }),
        );
      },
    });
  }
}
