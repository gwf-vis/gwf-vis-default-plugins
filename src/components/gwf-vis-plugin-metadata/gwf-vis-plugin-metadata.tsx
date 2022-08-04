import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPlugin, ObtainDataDelegateDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-metadata',
  styleUrl: 'gwf-vis-plugin-metadata.css',
  shadow: true,
})
export class GwfVisPluginMetadata implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-metadata';
  static readonly __PLUGIN_FOR__ = 'sidebar';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() obtainDataDelegateDict: ObtainDataDelegateDict;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() datasetName: string;

  render() {
    return (
      <Host>
        <slot>
          <h1>{`${this.globalInfoDict?.locationSelection?.datasetName} - ${this.globalInfoDict?.locationSelection?.locationId}`}</h1>
          <div>
            {Object.entries(
              this.obtainDataDelegateDict?.obtainMetadata(this.globalInfoDict?.locationSelection?.datasetName, this.globalInfoDict?.locationSelection?.locationId) || {},
            )?.map(([key, value]) => (
              <div>
                <span>
                  <b>{key.toString()}</b>
                </span>
                <div innerHTML={value.toString()} style={{ display: 'inline-block' }}></div>
              </div>
            ))}
          </div>
        </slot>
      </Host>
    );
  }
}
