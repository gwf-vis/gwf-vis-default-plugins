import type { GWFVisPluginWithData } from "gwf-vis-host";
import type { GWFVisDefaultPluginSharedStates } from "./state";

export type LocationSelection = {
  dataSource: string;
  locationId: number;
};

export type DimensionValueDict = {
  [dataSource: string]: {
    [variableId: number]: {
      [dimensionId: number]: number | undefined;
    };
  };
};

export type GWFVisDefaultPluginWithData = GWFVisPluginWithData<
  string,
  initSqlJs.QueryExecResult | undefined
>;

export type CallerPlugin = GWFVisDefaultPluginWithData &
  GWFVisDefaultPluginSharedStates;

export async function runAsyncWithLoading<T = any>(
  callback: (() => Promise<T>) | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  const loadingEndDelegate = callerPlugin?.notifyLoadingDelegate?.();
  return await new Promise<T>((resolve) =>
    setTimeout(async () => {
      const result = (await callback?.()) as T;
      loadingEndDelegate?.();
      resolve(result);
    })
  );
}
