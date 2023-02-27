import type { GWFVisPluginWithData } from "gwf-vis-host";
import type { GWFVisDefaultPluginSharedStates } from "./state";

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
