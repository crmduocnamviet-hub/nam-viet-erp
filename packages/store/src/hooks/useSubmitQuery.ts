import { useEffect } from "react";
import useFetchSubmitStore from "../fetchSubmitStore";

const useSubmitQuery = <TParams = any, TResponse = any>(params: {
  key: any[];
  onSuccess?: (data?: TResponse) => any;
  onSubmit?: (data?: TParams) => Promise<TResponse>;
  onError?: (e: any) => any;
}) => {
  const _key = params.key.join("%2s");

  const data = useFetchSubmitStore(
    (state) => state.fetchData?.[_key]?.data ?? null,
  );

  const isError = useFetchSubmitStore(
    (state) => state.fetchData?.[_key]?.isError ?? false,
  );

  const isLoading = useFetchSubmitStore(
    (state) => state.fetchData?.[_key]?.isLoading ?? false,
  );

  const error = useFetchSubmitStore(
    (state) => state.fetchData?.[_key]?.error ?? null,
  );

  const lastFetch = useFetchSubmitStore(
    (state) => state.fetchData?.[_key]?.lastFetch ?? null,
  );

  const register = useFetchSubmitStore((state) => state.register);

  const sendRequest = useFetchSubmitStore((state) => state.sendRequest);

  useEffect(() => {
    register({
      key: _key,
      onError: params.onError,
      onSubmit: params.onSubmit,
      onSuccess: params.onSuccess,
    });
  }, [params]);

  return {
    data,
    isError,
    error,
    isLoading,
    lastFetch,
    submit: (data?: TParams) => sendRequest(_key, data),
  };
};

export default useSubmitQuery;
