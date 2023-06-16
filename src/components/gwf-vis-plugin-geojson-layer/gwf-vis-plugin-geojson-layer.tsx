import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfo, GwfVisPluginMapLayer } from '../../utils/gwf-vis-plugin';
import { ColorSchemeDefinition, generateColorScale, obtainVariableColorSchemeDefinition } from '../../utils/color';

@Component({
  tag: 'gwf-vis-plugin-geojson-layer',
  styleUrl: 'gwf-vis-plugin-geojson-layer.css',
  shadow: true,
})
export class GwfVisPluginGeojsonLayer implements ComponentInterface, GwfVisPluginMapLayer {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-geojson-layer';

  private readonly PUSH_PIN_ICON = globalThis.L.icon({
    iconUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=',
  });

  private _geojsonLayerInstance?: L.GeoJSON;
  private get geojsonLayerInstance() {
    return this._geojsonLayerInstance;
  }
  private set geojsonLayerInstance(value: L.GeoJSON | undefined) {
    this.delegateOfRemovingFromMap?.(this.geojsonLayerInstance);
    this._geojsonLayerInstance = value;
    this.delegateOfAddingToMap(this.geojsonLayerInstance, this.layerName, this.type, this.active);
  }

  @Prop() leaflet: typeof globalThis.L;
  @Prop() delegateOfAddingToMap: (layer: L.Layer, name: string, type: 'base-layer' | 'overlay', active?: boolean) => void;
  @Prop() delegateOfRemovingFromMap: (layer: L.Layer) => void;
  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() layerName: string;
  @Prop() type: 'base-layer' | 'overlay' = 'overlay';
  @Prop() active: boolean = true;
  @Prop() options?: L.GeoJSONOptions;
  @Prop() dataSource: string;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() colorScheme?: { [variableName: string]: ColorSchemeDefinition };
  @Prop() usePushPins?: boolean = false;

  async connectedCallback() {
    await this.drawShape();
    await this.applyData();
    await this.applyHighlighs();
  }

  async disconnectedCallback() {
    this.delegateOfRemovingFromMap?.(this.geojsonLayerInstance);
  }

  componentShouldUpdate(_newValue: any, _oldValue: any, propName: string) {
    if (!this.geojsonLayerInstance) {
      this.connectedCallback();
      return;
    }
    if (propName === 'dataSource') {
      this.drawShape().then(() => this.applyData().then(() => this.applyHighlighs()));
    } else if (propName === 'globalInfo') {
      if (_newValue?.variableName !== _oldValue?.variableName || _newValue?.dimensionDict !== _oldValue?.dimensionDict) {
        this.applyData();
      }
      if (_newValue?.userSelection !== _oldValue?.userSelection || _newValue?.pinnedSelections !== _oldValue?.pinnedSelections) {
        this.applyHighlighs();
      }
    } else {
      this.applyData();
    }
  }

  @Method()
  async obtainHeader() {
    return 'GeoJSON Map Layer';
  }

  render() {
    return <Host></Host>;
  }

  private async applyData() {
    const variableName = this.variableName || this.globalInfo?.variableName;
    const dimensions = this.dimensions || this.globalInfo?.dimensionDict;
    let values,
      allValues = [],
      maxValue,
      minValue;
    const colorSchemeDefinition = obtainVariableColorSchemeDefinition(this.colorScheme, variableName);
    if (variableName && dimensions) {
      values = await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.dataSource,
        with: {
          variable: variableName,
          dimensions,
        },
        for: ['location', 'value'],
      });
      if (colorSchemeDefinition?.type === 'quantile') {
        allValues =
          (
            await this.delegateOfFetchingData?.({
              type: 'values',
              from: this.dataSource,
              with: {
                variable: variableName,
              },
              for: ['value'],
            })
          )?.map(d => d.value) || [];
      } else {
        [{ 'min(value)': minValue, 'max(value)': maxValue }] = (await this.delegateOfFetchingData?.({
          type: 'values',
          from: this.dataSource,
          with: {
            variable: variableName,
          },
          for: ['min(value)', 'max(value)'],
        })) || [{ 'min(value)': undefined, 'max(value)': undefined }];
      }
    }
    const scaleColor = generateColorScale(colorSchemeDefinition);
    if (colorSchemeDefinition?.type === 'quantile') {
      scaleColor?.domain(allValues);
    } else {
      scaleColor?.domain([minValue, maxValue]);
    }
    this.geojsonLayerInstance?.bindTooltip(({ feature }: any) => {
      const locationId = feature?.properties?.id;
      const value = values?.find(({ location }) => location === locationId)?.value;
      return `Location ID: ${locationId}<br/>Value: ${value ?? 'N/A'}`;
    });
    this.geojsonLayerInstance?.setStyle(feature => {
      const { properties } = feature;
      const value = values?.find(({ location }) => location === properties?.id)?.value;
      const fillColor = (scaleColor(value) as any) || 'transparent';
      const style = {
        fillColor,
        fillOpacity: 0.5,
      };
      return style;
    });
  }

  private async applyHighlighs() {
    this.geojsonLayerInstance.setStyle(feature => {
      const { properties } = feature;
      const style = {
        color: 'hsl(0, 0%, 70%)',
        weight: 1,
      };
      const matchedPin = this.globalInfo?.pinnedSelections?.find(pin => pin.dataset === this.dataSource && pin.location === properties?.id);
      if (matchedPin) {
        style['color'] = matchedPin.color;
        style['weight'] = 3;
      }
      if (this.globalInfo?.userSelection?.dataset === this.dataSource && this.globalInfo?.userSelection?.location === properties?.id) {
        style['weight'] = 5;
        this.geojsonLayerInstance
          .getLayers()
          ?.find(layer => layer['feature'] === feature)
          ?.['bringToFront']();
      }
      return style;
    });
  }

  private async drawShape() {
    const locations = await this.delegateOfFetchingData?.({
      type: 'locations',
      from: this.dataSource,
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
          this.delegateOfUpdatingGlobalInfo?.({
            ...this.globalInfo,
            userSelection: { dataset: this.dataSource, location: properties.id },
          }),
        );
      },
      pointToLayer: (_feature, latlng) =>
        this.usePushPins ? new globalThis.L.Marker(latlng, { icon: this.PUSH_PIN_ICON }) : new globalThis.L.CircleMarker(latlng, { radius: 10 }),
    });
  }
}
