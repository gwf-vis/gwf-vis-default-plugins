import type { GWFVisPluginWithData, SharedStates } from "gwf-vis-host";

export type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

export type Dimension = {
  id: number;
  name: string;
  size: number;
  description?: string;
  value_labels?: string[];
};

export type VariableWithDimensions = Variable & {
  dimensions?: Dimension[];
};

export type DimensionValueDict = {
  [dataSource: string]: {
    [variableId: number]: {
      [dimensionId: number]: number | undefined;
    };
  };
};

export type GWFVisDefaultPluginSharedStates = SharedStates & {
  "gwf-default.currentDataSource"?: string;
  "gwf-default.currentVariableId"?: number;
  "gwf-default.dimensionValueDict"?: DimensionValueDict;
};

export type GWFVisDefaultPluginWithData = GWFVisPluginWithData<
  string,
  initSqlJs.QueryExecResult | undefined
>;
