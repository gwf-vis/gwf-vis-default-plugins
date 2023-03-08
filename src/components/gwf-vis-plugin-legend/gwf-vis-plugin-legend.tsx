import { Component, Host, h, ComponentInterface, Method, Prop, State } from '@stencil/core';
import { GwfVisPlugin, GloablInfo } from '../../utils/gwf-vis-plugin';
import { ColorSchemeDefinition, generateColorScale, generateGradientCSSString, obtainVariableColorSchemeDefinition } from '../../utils/color';
import { ScaleQuantile, ScaleQuantize, ScaleSequential } from 'd3';

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
  @State() currentAllValues: number[] = [];
  @State() currentColorDefiniton: ColorSchemeDefinition;
  @State() currentColorScale: ScaleQuantize<any, never> | ScaleQuantile<any, never> | ScaleSequential<any, never>;
  @State() currentDimensions: { [dimension: string]: number };

  @Prop() delegateOfFetchingData: (query: any) => any;
  @Prop() globalInfo: GloablInfo;
  @Prop() delegateOfUpdatingGlobalInfo: (gloablInfoDict: GloablInfo) => void;
  @Prop() dataSource: string;
  @Prop() variableName?: string;
  @Prop() dimensions?: { [dimension: string]: number };
  @Prop() colorScheme?: { [variableName: string]: ColorSchemeDefinition };
  @Prop() fractionDigits: number = 2;

  async componentWillRender() {
    this.currentVaribaleName = this.variableName || this.globalInfo?.variableName;
    this.currentDimensions = this.dimensions || this.globalInfo?.dimensionDict;
    this.currentColorDefiniton = obtainVariableColorSchemeDefinition(this.colorScheme, this.currentVaribaleName);
    if (this.currentVaribaleName && this.currentDimensions) {
      if (this.currentColorDefiniton.type === 'quantile') {
        this.currentAllValues =
          (
            await this.delegateOfFetchingData?.({
              type: 'values',
              from: this.dataSource,
              with: {
                variable: this.currentVaribaleName,
              },
              for: ['value'],
            })
          )?.map(d => d.value) || [];
      } else {
        [{ 'min(value)': this.currentMinValue, 'max(value)': this.currentMaxValue }] = (await this.delegateOfFetchingData?.({
          type: 'values',
          from: this.dataSource,
          with: {
            variable: this.currentVaribaleName,
          },
          for: ['min(value)', 'max(value)'],
        })) || [{ 'min(value)': undefined, 'max(value)': undefined }];
      }
    }
    this.currentColorScale = generateColorScale(this.currentColorDefiniton);
    if (this.currentColorDefiniton.type === 'quantile') {
      this.currentColorScale.domain(this.currentAllValues);
    }
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
          {this.currentColorDefiniton?.type === 'sequential' ? this.renderSequential() : this.renderQuantileOrQuantize()}
        </div>
      </Host>
    );
  }

  private renderQuantileOrQuantize() {
    const colorScale = this.currentColorScale as ScaleQuantize<any> | ScaleQuantile<any, never> | undefined;
    if (!colorScale) {
      return;
    }
    const extents = colorScale.range().map(color => colorScale.invertExtent(color));
    const ticks = extents?.length > 0 ? [extents[0][0], ...extents.map(extent => extent[1])] : undefined;
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', height: '1em', margin: `0 ${(0.5 / (ticks?.length ?? 1)) * 100}%` }}>
          {colorScale?.range()?.map(color => (
            <div style={{ flex: '1', height: '100%', background: color ?? '' }}></div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
          {ticks?.map(tick => (
            <div style={{ flex: '1', height: '100%', margin: '0 0.5em', textAlign: 'center' }}>{tick?.toFixed(this.fractionDigits)}</div>
          ))}
        </div>
      </div>
    );
  }

  private renderSequential() {
    return (
      <div>
        <div
          style={{
            height: '1rem',
            background: generateGradientCSSString(this.currentColorScale),
          }}
        ></div>
        <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
          <div style={{ flex: '1', whiteSpace: 'nowrap' }}>{this.currentMinValue?.toFixed(this.fractionDigits) ?? 'N/A'}</div>
          <div style={{ flex: 'auto', width: '1rem' }}></div>
          <div style={{ flex: '1', whiteSpace: 'nowrap' }}>{this.currentMaxValue?.toFixed(this.fractionDigits) ?? 'N/A'}</div>
        </div>
      </div>
    );
  }
}
