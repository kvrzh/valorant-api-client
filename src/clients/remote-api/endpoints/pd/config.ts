/* THIS IS AN AUTOGENERATED FILE - DO NOT EDIT */

import { z } from "zod";
import axios from "axios";
import { configEndpoint } from "valorant-api-types";
import { parseResponseDataFor, buildSuffix } from "~/helpers/endpoints";
import { ensureArray } from "~/utils/array";
import { AxiosRequestConfigWithData } from "~/utils/lib/axios";
import { type CustomAxiosRequestConfig } from "~/clients/common/types";
import { type RemoteApiClient } from "~/clients/remote-api";

type ConfigSuffixData = { region: string };

export interface ConfigRequestConfig
  extends AxiosRequestConfigWithData<ConfigSuffixData>,
    CustomAxiosRequestConfig {}

export type ConfigResponse = z.infer<(typeof configEndpoint.responses)["200"]>;

export class ConfigRemoteApiEndpoint {
  /**
   * @description Get the config for the given player
   */
  getConfig<T = ConfigResponse>(
    this: RemoteApiClient,
    config: ConfigRequestConfig,
  ) {
    const shouldParseResponse =
      config.parseResponseData ?? this.options.parseResponseData;

    return this.axiosInstance<T>({
      method: "GET",
      baseURL: this.getServerUrl(configEndpoint.type),
      url: buildSuffix(configEndpoint.suffix, config.data),
      ...config,
      transformRequest: [
        parseResponseDataFor(configEndpoint),
        ...ensureArray(axios.defaults.transformRequest),
      ],
      ...(shouldParseResponse
        ? {
            transformResponse: [
              ...ensureArray(axios.defaults.transformResponse),
              parseResponseDataFor(configEndpoint, config.customResponseParser),
            ],
          }
        : {}),
    });
  }
}