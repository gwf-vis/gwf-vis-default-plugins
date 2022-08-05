import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginSidebar } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-metadata',
  styleUrl: 'gwf-vis-plugin-metadata.css',
  shadow: true,
})
export class GwfVisPluginMetadata implements ComponentInterface, GwfVisPluginSidebar {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-metadata';
  static readonly __PLUGIN_FOR__ = 'sidebar';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async obtainHeader() {
    return 'Metadata';
  }

  render() {
    return (
      <Host>
        <div part="content">
          {Object.entries(
            this.fetchingDataDelegate?.({
              type: 'metadata',
              for: {
                dataset: this.globalInfoDict?.userSelectionDict?.dataset,
                location: this.globalInfoDict?.userSelectionDict?.location,
              },
            }) || {},
          )?.map(([key, value]) => (
            <div>
              <span>
                <b>{key.toString()}</b>
              </span>
              <div innerHTML={value.toString()}></div>
              <hr />
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
