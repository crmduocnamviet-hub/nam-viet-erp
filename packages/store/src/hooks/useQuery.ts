import React from "react";
import useFetchStore, { fetchStore } from "../fetchStore";
type Updater<T = any> = (data?: T) => T;

export const getQueryKey = (key: any[]) => key.join("%2s");

/**
 * @name useQuery
 * @param key string
 * @param disableCache boolean
 * @param queryFn Promise function
 * @param gcTime ms - default 5 minutes
 */
const useQuery = <T = any>({
  key,
  queryFn,
  disableCache,
  gcTime = 300000,
  delayTime = 0,
}: {
  key: any[];
  queryFn?: () => Promise<T>;
  disableCache?: boolean;
  gcTime?: number;
  delayTime?: number;
}) => {
  const _key = getQueryKey(key);
  const fetch = useFetchStore((state) => state.fetch);
  const refetch = useFetchStore(
    (state) => state.fetchData?.[_key]?.fetch ?? null,
  );
  const data = useFetchStore((state) => state.fetchData?.[_key]?.data ?? null);
  const isError = useFetchStore(
    (state) => state.fetchData?.[_key]?.isError ?? false,
  );
  const isLoading = useFetchStore(
    (state) => state.fetchData?.[_key]?.isLoading ?? false,
  );
  const isRefreshing = useFetchStore(
    (state) => state.fetchData?.[_key]?.isRefreshing ?? false,
  );
  const error = useFetchStore(
    (state) => state.fetchData?.[_key]?.error ?? null,
  );
  const lastFetch = useFetchStore(
    (state) => state.fetchData?.[_key]?.lastFetch ?? null,
  );

  const fetchData = async () => {
    if (
      (!data ||
        disableCache ||
        (lastFetch !== null && Date.now() - lastFetch.getTime() > gcTime)) &&
      !!queryFn
    ) {
      fetch(_key, queryFn);
    }
  };

  const refetchData = async () => {
    if (
      !data ||
      disableCache ||
      (lastFetch !== null && Date.now() - lastFetch.getTime() > gcTime)
    ) {
      const _refetch = !!queryFn ? queryFn : refetch;
      if (!!_refetch) {
        fetch(_key, _refetch);
      }
    }
  };

  React.useEffect(() => {
    if (delayTime) {
      setTimeout(() => {
        fetchData();
      }, delayTime);
    } else {
      fetchData();
    }
  }, [_key]);

  return {
    data: data as T,
    isLoading,
    isError,
    isRefreshing,
    error,
    refetch: refetchData,
  };
};

export const refreshQuery = async (key: any[]) => {
  const fetch = fetchStore.getState().fetchData[getQueryKey(key)]?.fetch;
  return fetch();
};

export const setQueryData = async <T = any>(
  key: string,
  updater?: T | Updater<T | undefined>,
  validator?: (data: T | undefined) => Promise<boolean>,
) => {
  const setData = fetchStore.getState().setData;
  const oldData = fetchStore.getState().fetchData[key]?.data;
  let newData: T | undefined;
  if (typeof updater === "function") {
    newData = (updater as Updater<T>)(oldData as T);
  } else {
    newData = updater;
  }
  if (validator && !(await validator(newData))) {
    return;
  }
  setData(key, newData);
  return newData;
};

export const getQueryData = <T = any>(key: string) => {
  const data = fetchStore.getState().fetchData[key]?.data;
  return data as T | undefined | null;
};

export default useQuery;
