import { camelCase, paramCase, pascalCase } from "change-case";
import { tIf, tImport, tImports } from "scripts/helpers";
import { ValorantEndpoint } from "@tqman/valorant-api-types";

const CLIENT_CLASS = "LocalApiClient";
const CLIENT_CLASS_PATH = "~/clients/local-api";
const ENDPOINT_CLASS_SUFFIX = "LocalApiEndpoint";
const ENDPOINTS_WRAPPER_CLASS = "LocalApiEndpoints";

type EndpointOptions = {
  importName: string;
  endpoint: ValorantEndpoint;
};

export const tLocalEndpoint = (o: EndpointOptions) => {
  const { importName, endpoint: e } = o;

  e.method = e.method ?? "GET";

  const hasBody = Boolean(e.body);
  const hasResponses = Object.keys(e.responses || {}).length > 0;
  const statusCode = Object.keys(e.responses || {})[0] ?? "200";

  return `
${tImports([
  { named: "z", from: "zod", if: hasBody || hasResponses },
  {
    named: "type AxiosResponse",
    from: "axios",
  },
  {
    default: "axios",
    from: "~/utils/axios",
  },
  {
    named: "type AxiosRequestConfig",
    from: "axios",
    if: !hasBody,
  },
  { named: importName, from: "@tqman/valorant-api-types" },
  { named: "parseResponseDataFor", from: "~/helpers/endpoints" },
  { named: "ensureArray", from: "~/utils/array" },
  {
    named: "AxiosRequestConfigWithData",
    from: "~/utils/lib/axios",
    if: hasBody,
  },
  { named: `type ${CLIENT_CLASS}`, from: CLIENT_CLASS_PATH },
  {
    named: "type CustomAxiosRequestConfig",
    from: "~/clients/common/types",
  },
])}

${tIf(
  hasBody,
  `type ${pascalCase(e.name)}BodyData = z.infer<typeof ${importName}.body>`,
)}

export interface ${pascalCase(e.name)}RequestConfig 
  extends ${
    hasBody
      ? `AxiosRequestConfigWithData<${pascalCase(e.name)}BodyData>`
      : "AxiosRequestConfig"
  }, CustomAxiosRequestConfig {};

export type ${pascalCase(
    e.name,
  )}Response = z.input<typeof ${importName}.responses["${statusCode}"]>

export type ${pascalCase(
    e.name,
  )}ParsedResponse = z.output<typeof ${importName}.responses["${statusCode}"]>

export class ${pascalCase(e.name)}${ENDPOINT_CLASS_SUFFIX} {
  /**
   * @description ${e.description.replaceAll("\n", "\n * ")}
   */
  ${camelCase(e.method + e.name)}<T = ${pascalCase(e.name)}ParsedResponse>(
    this: ${CLIENT_CLASS},
    ${`config: ${pascalCase(e.name)}RequestConfig & {parseResponseData: true},`}
  ): Promise<AxiosResponse<T>>
  ${camelCase(e.method + e.name)}<T = ${pascalCase(e.name)}Response>(
    this: ${CLIENT_CLASS},
    ${
      hasBody
        ? `config: ${pascalCase(e.name)}RequestConfig,`
        : `config?: ${pascalCase(e.name)}RequestConfig`
    }
  ): Promise<AxiosResponse<T>>
  ${camelCase(e.method + e.name)}<T = ${pascalCase(e.name)}Response>(
    this: ${CLIENT_CLASS},
    ${
      hasBody
        ? `config: ${pascalCase(e.name)}RequestConfig,`
        : `config: ${pascalCase(e.name)}RequestConfig = {},`
    }
  ) {
    const shouldParseResponse =
      config.parseResponseData ?? this.options.parseResponseData;

    return this.axiosInstance<T>({
      method: "${e.method}",
      url: ${importName}.suffix,
      ...config,
      transformRequest: [
        parseResponseDataFor(${importName}),
        ...ensureArray(axios.defaults.transformRequest),
      ],
      ...(shouldParseResponse
        ? {
            transformResponse: [
              ...ensureArray(axios.defaults.transformResponse),
              parseResponseDataFor(
                ${importName},
                config.customResponseParser,
              ),
            ],
          }
        : {}),
    });
  }
}`.trimStart();
};

type EndpointClassOptions = {
  endpointsList: string[];
};

export const tLocalEndpointsClass = (o: EndpointClassOptions) => {
  return `
${o.endpointsList
  .map(it =>
    tImport({
      named: `${pascalCase(it)}${ENDPOINT_CLASS_SUFFIX}`,
      from: `./${paramCase(it)}`,
    }),
  )
  .join("\n")}

${tImport({ named: "applyMixins", from: "~/utils/classes" })}

export class ${ENDPOINTS_WRAPPER_CLASS} {}

applyMixins(${ENDPOINTS_WRAPPER_CLASS} , [
  ${o.endpointsList
    .map(e => `${pascalCase(e)}${ENDPOINT_CLASS_SUFFIX}`)
    .join(",\n  ")}
])

export interface ${ENDPOINTS_WRAPPER_CLASS}  extends ${o.endpointsList
    .map(e => `${pascalCase(e)}${ENDPOINT_CLASS_SUFFIX}`)
    .join(",\n  ")} {}
  `.trimStart();
};

export const tLocalEndpointsTypings = (o: EndpointClassOptions) => {
  return `
${o.endpointsList
  .map(it =>
    tImport({
      default: "type *",
      from: `./${paramCase(it)}`,
    }).replace("import", "export"),
  )
  .join("\n")}
  `.trimStart();
};
