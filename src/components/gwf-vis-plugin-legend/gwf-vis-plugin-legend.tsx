import { Component, Host, h, ComponentInterface, Method, Prop, State } from '@stencil/core';
import { GwfVisPlugin, GloablInfo } from '../../utils/gwf-vis-plugin';
import { ColorSchemeDefinition, obtainVariableColorScheme } from '../../utils/variable-color-scheme';

@Component({
  tag: 'gwf-vis-plugin-legend',
  styleUrl: 'gwf-vis-plugin-legend.css',
  shadow: true,
})
export class GwfVisPluginLegend implements ComponentInterface, GwfVisPlugin {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-legend';

  @State() currentVaribaleName: string;
  @State() currentMinValue: number;
  @State() currentMaxValue: number;
  @State() currentColorScheme: string[];
  @State() currentDimensions: { [dimension: string]: number };

  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() datasetId: string;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() colorScheme?: { [variableName: string]: ColorSchemeDefinition };

  async componentWillRender() {
    this.currentVaribaleName = this.variableName || this.globalInfo?.variableName;
    this.currentDimensions = this.dimensions || this.globalInfo?.dimensionDict;
    if (this.currentVaribaleName && this.currentDimensions) {
      [{ 'min(value)': this.currentMinValue, 'max(value)': this.currentMaxValue }] = (await this.delegateOfFetchingData?.({
        type: 'values',
        from: this.datasetId,
        with: {
          variable: this.currentVaribaleName,
        },
        for: ['min(value)', 'max(value)'],
      })) || [{ 'min(value)': undefined, 'max(value)': undefined }];
    }
    this.currentColorScheme = obtainVariableColorScheme(this.colorScheme, this.currentVaribaleName);
  }

  @Method()
  async obtainHeader() {
    return 'Legend';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <div>
            <b>Variable: </b>
            {this.currentVaribaleName ?? 'N/A'}
          </div>
          <div style={{ height: '1rem', background: `linear-gradient(to right, ${this.currentColorScheme?.map(color => color).join(', ')})` }}></div>
          <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
            <div style={{ flex: '1', whiteSpace: 'nowrap' }}>{this.currentMinValue ?? 'N/A'}</div>
            <div style={{ flex: 'auto', width: '1rem' }}></div>
            <div style={{ flex: '1', whiteSpace: 'nowrap' }}>{this.currentMaxValue ?? 'N/A'}</div>
          </div>
        </div>
      </Host>
    );
  }
}
