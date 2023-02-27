import type { GWFVisPluginWithData, SharedStates } from "gwf-vis-host";
import { VariableWithDimensions } from "./data";

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
} & {
  "gwf-default.cache.availableVariablesDict"?: {
    [dataSource: string]: VariableWithDimensions[] | undefined;
  };
};

export type GWFVisDefaultPluginWithData = GWFVisPluginWithData<
  string,
  initSqlJs.QueryExecResult | undefined
>;

export type CallerPlugin = GWFVisDefaultPluginWithData &
  GWFVisDefaultPluginSharedStates;

export async function runAsyncWithLoading(
  callback: (() => Promise<void>) | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  const loadingEndDelegate = callerPlugin?.notifyLoadingDelegate?.();
  await new Promise<void>((resolve) =>
    setTimeout(async () => {
      await callback?.();
      loadingEndDelegate?.();
      resolve();
    })
  );
}
