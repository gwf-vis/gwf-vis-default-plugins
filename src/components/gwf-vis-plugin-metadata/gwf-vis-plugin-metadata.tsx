import { Component, Host, h, ComponentInterface, Prop, Method, State } from '@stencil/core';
import { GloablInfoDict, GwfVisPlugin } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-metadata',
  styleUrl: 'gwf-vis-plugin-metadata.css',
  shadow: true,
})
export class GwfVisPluginMetadata implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-metadata';

  @State() metadata: any;

  @Prop() fetchingDataDelegate: (query: any) => any;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;

  @Method()
  async obtainHeader() {
    return 'Metadata';
  }

  async componentWillRender() {
    const [metadataWithWrapper] =
      (await this.fetchingDataDelegate?.({
        type: 'locations',
        from: this.globalInfoDict?.userSelectionDict?.dataset,
        for: ['metadata'],
        with: {
          id: this.globalInfoDict?.userSelectionDict?.location,
        },
      })) || [];
    if (metadataWithWrapper) {
      this.metadata = metadataWithWrapper.metadata;
    }
  }

  render() {
    return (
      <Host>
        <div part="content">
          {Object.entries(this.metadata || {})?.map(([key, value]) => (
            <div>
              <span>
                <b>{key.toString()}</b>
              </span>
              <div innerHTML={value?.toString()}></div>
              <hr
                style={{
                  height: '2px',
                  border: 'none',
                  outline: 'none',
                  background: 'hsl(0, 0%, 70%)',
                }}
              />
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
