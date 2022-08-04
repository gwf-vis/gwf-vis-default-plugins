import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GwfVisPlugin } from '../../utils/gwf-vis-plugin';

@Component({
  tag: 'gwf-vis-metadata',
  styleUrl: 'gwf-vis-metadata.css',
  shadow: true,
})
export class GwfVisMetadata implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-metadata';
  static readonly __PLUGIN_FOR__ = 'sidebar';

  @Prop() leaflet: typeof globalThis.L;

  render() {
    return (
      <Host>
        <slot>
          <h1>Metadata</h1>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate ullam porro, provident explicabo dolor repudiandae veniam magnam quas! Aliquid nulla deserunt
            delectus dignissimos nam! Nemo dolorum quibusdam harum asperiores quo.
          </p>
        </slot>
      </Host>
    );
  }
}
