import { Component, Host, h, ComponentInterface, Prop, Method, State, Watch } from '@stencil/core';
import { GwfVisPluginControl, GloablInfoDict } from '../../utils/gwf-vis-plugin';

export type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

@Component({
  tag: 'gwf-vis-plugin-variable-control',
  styleUrl: 'gwf-vis-plugin-variable-control.css',
  shadow: true,
})
export class GwfVisPluginVariableControl implements ComponentInterface, GwfVisPluginControl {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-variable-control';
  static readonly __PLUGIN_TYPE__ = 'control';

  @State() variables: Variable[];

  @State() variable: Variable;

  @Watch('variable')
  handleValueChange(value: Variable) {
    const updatedGlobalInfo = { ...this.globalInfoDict };
    updatedGlobalInfo.variableName = value.name;
    this.updatingGlobalInfoDelegate(updatedGlobalInfo);
  }

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() datasetId: string;

  async componentWillLoad() {
    this.variables = await this.fetchingDataDelegate({
      type: 'variables',
      from: this.datasetId,
    });
    this.variable = this.variables?.[0];
  }

  @Method()
  async obtainHeader() {
    return 'Variable Control';
  }

  render() {
    return (
      <Host>
        <div part="content">
          <select style={{ width: '100%' }} onChange={({ currentTarget }) => (this.variable = this.variables?.find(v => v.id === +(currentTarget as HTMLSelectElement).value))}>
            {this.variables?.map(variable => {
              return (
                <option value={variable.id} title={variable.description} selected={this.variable === variable}>
                  {variable.name}
                </option>
              );
            })}
          </select>
        </div>
      </Host>
    );
  }
}
