export interface MagnoliaDataRequestParams {
  apiBase: string;
  pageJsonPath: string;
  acceptLanguage: string;
  pageTemplateDefinitionsPath?: string;
}

export interface MagnoliaDataResponse<TPageJSON, TTemplateDef> {
  pageJson: TPageJSON;
  templateDefinitions?: TTemplateDef;
}

export function getCleanCurrentPathParts(
  currentPathname: string,
  authorPathPart: string,
  languages: string[]
): { pathname: string; language: string } {
  console.log('languages', languages);
  let language = languages[0];
  authorPathPart = (authorPathPart ? authorPathPart : '').replace(/^\//, '');
  const cleanRegex = new RegExp(
    `(?:(^\/)|(${authorPathPart})(\/)(.+)(\.html))`,
    'gi'
  );
  const languageParamRegex = new RegExp(`^(${languages.join('|')})(\/)(.+)$`);

  currentPathname = currentPathname.replace(cleanRegex, '$4');
  const languageRegExpResult = languageParamRegex.exec(currentPathname);

  if (
    languageRegExpResult &&
    languageRegExpResult[1] &&
    languages.includes(languageRegExpResult[1])
  ) {
    currentPathname =
      languageRegExpResult[2] === '/' && languageRegExpResult[3]
        ? languageRegExpResult[3]
        : '';
    language = languageRegExpResult[1];
  }

  return {
    pathname: currentPathname,
    language,
  };
}

export function getAcceptLang(lang: string): string {
  const locales: { [key: string]: string } = {
    de: 'de-DE',
    en: 'en-GB',
  };

  return locales[lang] ? locales[lang] : locales.en;
}

export function buildMagnoliaDataPath(
  slug: string[],
  preview: boolean,
  languages: string[]
) {
  const { MGNL_HOST, MGNL_PATH_AUTHOR, MGNL_API_TEMPLATES, MGNL_API_PAGES } =
    process.env;
  const apiBase = `${MGNL_HOST}${preview ? MGNL_PATH_AUTHOR : ''}`;
  let currentPathname = slug ? slug.join('/') : '';
  const pathParts = getCleanCurrentPathParts(
    currentPathname,
    MGNL_PATH_AUTHOR || '',
    languages
  );

  currentPathname = pathParts.pathname;
  const language = pathParts.language;

  const pageJsonPath = `${MGNL_API_PAGES}/${currentPathname}`;
  let pageTemplateDefinitionsPath;

  if (preview) {
    pageTemplateDefinitionsPath = MGNL_API_TEMPLATES;
  }

  return {
    apiBase,
    currentPathname,
    language,
    pageJsonPath,
    pageTemplateDefinitionsPath,
  };
}

export async function getMagnoliaData<TPageJSON, TTemplateDef>({
  apiBase,
  pageJsonPath,
  pageTemplateDefinitionsPath,
  acceptLanguage,
}: MagnoliaDataRequestParams): Promise<
  MagnoliaDataResponse<TPageJSON, TTemplateDef>
> {
  const pageJsonEndpoint = `${apiBase}${pageJsonPath}`;

  console.log(
    'getMagnoliaData pageJsonPath, lang',
    pageJsonPath,
    'Accept-Language:',
    acceptLanguage
  );

  let response = await fetch(pageJsonEndpoint, {
    headers: {
      'accept-language': acceptLanguage,
    },
    credentials: 'include',
  });
  let templateDefinitions;
  const pageJson = await response.json();

  if (pageTemplateDefinitionsPath && pageJson['mgnl:template']) {
    response = await fetch(
      `${apiBase}${pageTemplateDefinitionsPath}` +
        '/' +
        pageJson['mgnl:template'],
      {
        credentials: 'include',
      }
    );
    templateDefinitions = await response.json();
  }

  return { pageJson, templateDefinitions };
}
