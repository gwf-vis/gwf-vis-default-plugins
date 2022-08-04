import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginSidebar, ObtainDataDelegateDict } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-metadata',
  styleUrl: 'gwf-vis-plugin-metadata.css',
  shadow: true,
})
export class GwfVisPluginMetadata implements ComponentInterface, GwfVisPluginSidebar {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-metadata';
  static readonly __PLUGIN_FOR__ = 'sidebar';

  @Prop() leaflet: typeof globalThis.L;
  @Prop() obtainDataDelegateDict: ObtainDataDelegateDict;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updateGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() injectedCss: string;
  @Prop() pluginSlot: '' | 'top';

  render() {
    return (
      <Host slot={this.pluginSlot}>
        <style innerHTML={this.injectedCss}></style>
        <div part="header">Metadata</div>
        <div part="content">
          {Object.entries(
            this.obtainDataDelegateDict?.obtainMetadata(this.globalInfoDict?.userSelectionDict?.dataset, this.globalInfoDict?.userSelectionDict?.location) || {},
          )?.map(([key, value]) => (
            <div>
              <span>
                <b>{key.toString()}</b>
              </span>
              <div innerHTML={value.toString()} style={{ display: 'inline-block' }}></div>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
