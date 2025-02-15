import { VapicProvider } from "~/clients";
import { getRegionAndShardFromGlzServer } from "~/helpers";
import { getLockFileData, getLogFileData } from "~/file-parsers";

/**
 * @client local
 * @provides user, password, port, pid, protocol
 */
export function provideLockFile(lockfilePath?: string) {
  return (async () => {
    const lockfile = await getLockFileData(lockfilePath);
    if (!lockfile) {
      throw Error("Unable to get lockfile data");
    }
    return { ...lockfile } as const;
  }) satisfies VapicProvider;
}

/**
 * @client remote
 * @provides shard, region, client-version
 */
export function provideLogFile(logfilePath?: string) {
  return (async () => {
    const logfile = await getLogFileData(logfilePath);
    if (!logfile) {
      throw Error("Unable to get logfile data");
    }
    return {
      ...logfile,
      ...getRegionAndShardFromGlzServer(logfile.servers.glz),
    } as const;
  }) satisfies VapicProvider;
}
