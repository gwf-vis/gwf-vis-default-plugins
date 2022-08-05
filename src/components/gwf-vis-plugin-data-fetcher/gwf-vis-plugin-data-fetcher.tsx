import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginData } from '../../utils/gwf-vis-plugin';
import { seededRandom } from './seededRandom';

@Component({
  tag: 'gwf-vis-plugin-data-fetcher',
  styleUrl: 'gwf-vis-plugin-data-fetcher.css',
  shadow: true,
})
export class GwfVisPluginDataFetcher implements ComponentInterface, GwfVisPluginData {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-data-fetcher';
  static readonly __PLUGIN_TYPE__ = 'data';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async fetchData(query: any) {
    switch (query?.type) {
      case 'shape':
        return {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  id: '1',
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-121.28906250000001, 53.12040528310657],
                      [-113.5546875, 53.12040528310657],
                      [-113.5546875, 57.89149735271034],
                      [-121.28906250000001, 57.89149735271034],
                      [-121.28906250000001, 53.12040528310657],
                    ],
                  ],
                },
              },
              {
                type: 'Feature',
                properties: {
                  id: '2',
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-110.390625, 57.136239319177434],
                      [-117.42187500000001, 54.36775852406841],
                      [-113.203125, 51.39920565355378],
                      [-108.6328125, 53.12040528310657],
                      [-105.1171875, 56.17002298293205],
                      [-110.390625, 57.136239319177434],
                    ],
                  ],
                },
              },
            ],
          },
        };
      case 'metadata':
        return {
          'Text': 'Something',
          'HTML Rich': '<img width="100%" src="https://gwf.usask.ca/images/logos/GWF_Globe.png"/>This is an icon.',
        };
      case 'values':
        let valid = false;
        for (const [key, value] of Object.entries(query?.for || {})) {
          if (Array.isArray(value) && key !== 'location') {
            return {};
          }
          if (Array.isArray(value) && key === 'location') {
            valid = true;
          }
        }
        if (valid) {
          return query.for.location.map(location => ({ location, value: seededRandom(location.toString()) * 360 }));
        }
        return {};
      default:
        return undefined;
    }
  }

  render() {
    return <Host></Host>;
  }
}
