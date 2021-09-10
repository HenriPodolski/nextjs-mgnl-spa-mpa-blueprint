import React from 'react';
import Head from 'next/head';
import styles from './index.module.scss';
import pageConfig from '../magnolia.config';
import { EditablePage, EditorContextHelper } from '@magnolia/react-editor';
import { useEffect, useState } from 'react';
import AppContext from '../utils/hooks/context';
import {
  buildMagnoliaDataPath,
  getMagnoliaData,
} from '../utils/magnolia-data-requests';
import useSWR from 'swr';

const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

export default function Slug(props: any) {
  const {
    host,
    currentPathname,
    preview,
    previewFetchInterval,
    fetchInterval,
  } = props;
  const [pathname] = useState(
    typeof window !== 'undefined' && window.location
      ? window.location.pathname
      : currentPathname
  );
  const { data, error } = useSWR(`${host}/api${pathname}`, fetcher, {
    initialData: props,
    refreshInterval: preview ? previewFetchInterval : fetchInterval,
  });
  const [state, setState] = useState({
    ...props,
    pageConfig,
  });

  useEffect(() => {
    setState({
      ...data,
      pageConfig,
    });
  }, [data]);

  useEffect(() => {
    console.log(
      'EditorContextHelper.inEditorPreview()',
      EditorContextHelper.inEditorPreview(),
      EditorContextHelper.inEditor()
    );
    window.addEventListener('message', (event) => {
      if (!event.data || !(event.data && event.data.startsWith('{'))) return;
      console.log(event);
    });
  }, []);

  return (
    <AppContext.Provider value={[state, setState]}>
      <div className={styles.container}>
        <Head>
          <title>Create Next App</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {state.preview && state.pageJson && (
          <EditablePage
            content={state.pageJson}
            config={state.pageConfig}
            templateDefinitions={state.templateDefinitions}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}

export async function getStaticProps({
  preview = process.env.MGNL_PREVIEW,
  params,
}: any) {
  const {
    NEXTJS_HOST,
    NEXTJS_PUBLIC_FETCH_INTERVAL,
    NEXTJS_PREVIEW_PUBLIC_INTERVAL,
  } = process.env;

  const {
    apiBase,
    currentPathname,
    pageJsonPath,
    pageTemplateDefinitionsPath,
  } = buildMagnoliaDataPath(params && params.slug ? params.slug : null);

  const { pageJson, templateDefinitions } = await getMagnoliaData({
    apiBase,
    pageJsonPath,
    pageTemplateDefinitionsPath,
  });

  return {
    props: {
      host: NEXTJS_HOST,
      pageJson,
      templateDefinitions,
      preview,
      apiBase,
      pageJsonPath,
      pageTemplateDefinitionsPath,
      currentPathname,
      previewFetchInterval: parseInt(NEXTJS_PREVIEW_PUBLIC_INTERVAL || '0', 10),
      fetchInterval: parseInt(NEXTJS_PUBLIC_FETCH_INTERVAL || '0', 10),
    },
    revalidate: 10,
  };
}

export async function getStaticPaths({ locales, defaultLocale }: any) {
  // TODO: Get all existing pages and replace hard coded
  const hardCodedPaths = [{ params: { slug: ['Home'] } }];

  return { paths: [...hardCodedPaths], fallback: false };
}
