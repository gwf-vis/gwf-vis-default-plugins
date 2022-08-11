import { Component, Host, h, ComponentInterface, Prop, Method, State } from '@stencil/core';
import { GloablInfo, GwfVisPlugin } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-plugin-metadata',
  styleUrl: 'gwf-vis-plugin-metadata.css',
  shadow: true,
})
export class GwfVisPluginMetadata implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-metadata';

  @State() metadata: any;

  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;

  @Method()
  async obtainHeader() {
    return 'Metadata';
  }

  async componentWillRender() {
    const [metadataWithWrapper] =
      (await this.delegateOfFetchingData?.({
        type: 'locations',
        from: this.globalInfo?.userSelection?.dataset,
        for: ['metadata'],
        with: {
          id: this.globalInfo?.userSelection?.location,
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
