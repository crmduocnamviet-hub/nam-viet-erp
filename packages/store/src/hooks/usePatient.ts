import { useQuery } from "..";
import { FETCH_QUERY_KEY } from "../constants";
import {
  getPatients,
  getPatientById,
  getPatientByPhone,
} from "@nam-viet-erp/services";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";
import { usePatientStore } from "../patientStore";

// Hook to fetch all patients
export const usePatients = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.PATIENTS, filters],
    queryFn: async () => {
      const { data } = await getPatients(filters);
      if (data) {
        usePatientStore.getState().setPatients(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single patient by ID
export const usePatientById = (patientId: string) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.PATIENT, patientId],
    queryFn: async () => {
      const { data } = await getPatientById(patientId);
      if (data) {
        usePatientStore.getState().setCurrentPatient(data);
      }
      return data;
    },
  });
};

// Hook to fetch patient by phone
export const usePatientByPhone = (phoneNumber: string) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.PATIENT, "phone", phoneNumber],
    queryFn: async () => {
      const { data } = await getPatientByPhone(phoneNumber);
      if (data) {
        usePatientStore.getState().setCurrentPatient(data);
      }
      return data;
    },
  });
};

// Hook to create patient
export const useCreatePatient = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PATIENTS])]?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_PATIENT],
    onSubmit: async (patientData: any) => {
      const result = await usePatientStore
        .getState()
        .createPatient(patientData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetch?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { createPatient: submit, isLoading };
};

// Hook to update patient
export const useUpdatePatient = ({
  patientId,
  onSuccess,
  onError,
}: {
  patientId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PATIENTS])]?.fetch ?? null,
  );
  const refetchPatient = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PATIENT, patientId])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_PATIENT, patientId],
    onSubmit: async (updates: any) => {
      const result = await usePatientStore
        .getState()
        .updatePatient(patientId, updates);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetch?.();
      refetchPatient?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { updatePatient: submit, isLoading };
};

// Hook to delete patient
export const useDeletePatient = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PATIENTS])]?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_PATIENT],
    onSubmit: async (patientId: string) => {
      const result = await usePatientStore.getState().deletePatient(patientId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      refetch?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { deletePatient: submit, isLoading };
};
