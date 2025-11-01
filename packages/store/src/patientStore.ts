import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface PatientState {
  // Patient data
  patients: any[];
  currentPatient: any | null;
  isLoadingPatients: boolean;
  isLoadingPatient: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setPatients: (patients: any[]) => void;
  setCurrentPatient: (patient: any | null) => void;
  setLoadingPatients: (isLoading: boolean) => void;
  setLoadingPatient: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchPatients: (filters?: any) => Promise<{ data: any[] | null; error: any }>;
  fetchPatientById: (
    patientId: string,
  ) => Promise<{ data: any | null; error: any }>;
  fetchPatientByPhone: (
    phoneNumber: string,
  ) => Promise<{ data: any | null; error: any }>;
  createPatient: (
    patientData: any,
  ) => Promise<{ data: any | null; error: any }>;
  updatePatient: (
    patientId: string,
    updates: any,
  ) => Promise<{ data: any | null; error: any }>;
  deletePatient: (patientId: string) => Promise<{ error: any }>;
  fetchVIPPatients: (
    minPoints?: number,
  ) => Promise<{ data: any[] | null; error: any }>;
  updateLoyaltyPoints: (
    patientId: string,
    pointsToAdd: number,
  ) => Promise<{ data: any | null; error: any }>;
  updatePatientNotes: (
    patientId: string,
    notes: string,
  ) => Promise<{ error: any }>;

  // Utility
  clearCurrentPatient: () => void;
  clearError: () => void;
}

// Create store
export const usePatientStore = create<PatientState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      patients: [],
      currentPatient: null,
      isLoadingPatients: false,
      isLoadingPatient: false,
      isSaving: false,
      error: null,

      // Simple setters
      setPatients: (patients) =>
        set(
          (state) => {
            state.patients = patients;
          },
          false,
          "setPatients",
        ),

      setCurrentPatient: (patient) =>
        set(
          (state) => {
            state.currentPatient = patient;
          },
          false,
          "setCurrentPatient",
        ),

      setLoadingPatients: (isLoading) =>
        set(
          (state) => {
            state.isLoadingPatients = isLoading;
          },
          false,
          "setLoadingPatients",
        ),

      setLoadingPatient: (isLoading) =>
        set(
          (state) => {
            state.isLoadingPatient = isLoading;
          },
          false,
          "setLoadingPatient",
        ),

      setSaving: (isSaving) =>
        set(
          (state) => {
            state.isSaving = isSaving;
          },
          false,
          "setSaving",
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error;
          },
          false,
          "setError",
        ),

      // API Actions
      fetchPatients: async (filters?: any) => {
        const { setLoadingPatients, setPatients, setError } = get();

        setLoadingPatients(true);
        setError(null);

        try {
          const { getPatients } = await import("@nam-viet-erp/services");
          const { data, error } = await getPatients(filters);

          if (error) {
            setError(error.message || "Failed to fetch patients");
            setPatients([]);
            return { data: null, error };
          }

          setPatients(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch patients";
          setError(errorMsg);
          setPatients([]);
          return { data: null, error };
        } finally {
          setLoadingPatients(false);
        }
      },

      fetchPatientById: async (patientId: string) => {
        const { setLoadingPatient, setCurrentPatient, setError } = get();

        setLoadingPatient(true);
        setError(null);

        try {
          const { getPatientById } = await import("@nam-viet-erp/services");
          const { data, error } = await getPatientById(patientId);

          if (error) {
            setError(error.message || "Failed to fetch patient");
            setCurrentPatient(null);
            return { data: null, error };
          }

          setCurrentPatient(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch patient";
          setError(errorMsg);
          setCurrentPatient(null);
          return { data: null, error };
        } finally {
          setLoadingPatient(false);
        }
      },

      fetchPatientByPhone: async (phoneNumber: string) => {
        const { setLoadingPatient, setCurrentPatient, setError } = get();

        setLoadingPatient(true);
        setError(null);

        try {
          const { getPatientByPhone } = await import("@nam-viet-erp/services");
          const { data, error } = await getPatientByPhone(phoneNumber);

          if (error) {
            setError(error.message || "Failed to fetch patient by phone");
            setCurrentPatient(null);
            return { data: null, error };
          }

          setCurrentPatient(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch patient by phone";
          setError(errorMsg);
          setCurrentPatient(null);
          return { data: null, error };
        } finally {
          setLoadingPatient(false);
        }
      },

      createPatient: async (patientData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createPatient } = await import("@nam-viet-erp/services");
          const { data, error } = await createPatient(patientData);

          if (error) {
            setError(error.message || "Failed to create patient");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create patient";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updatePatient: async (patientId: string, updates: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updatePatient } = await import("@nam-viet-erp/services");
          const { data, error } = await updatePatient(patientId, updates);

          if (error) {
            setError(error.message || "Failed to update patient");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update patient";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deletePatient: async (patientId: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deletePatient } = await import("@nam-viet-erp/services");
          const { error } = await deletePatient(patientId);

          if (error) {
            setError(error.message || "Failed to delete patient");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete patient";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      fetchVIPPatients: async (minPoints: number = 100) => {
        const { setError } = get();

        setError(null);

        try {
          const { getVIPPatients } = await import("@nam-viet-erp/services");
          const { data, error } = await getVIPPatients(minPoints);

          if (error) {
            setError(error.message || "Failed to fetch VIP patients");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch VIP patients";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      updateLoyaltyPoints: async (patientId: string, pointsToAdd: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateLoyaltyPoints } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await updateLoyaltyPoints(
            patientId,
            pointsToAdd,
          );

          if (error) {
            setError(error.message || "Failed to update loyalty points");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update loyalty points";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updatePatientNotes: async (patientId: string, notes: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updatePatientNotes } = await import("@nam-viet-erp/services");
          const { error } = await updatePatientNotes(patientId, notes);

          if (error) {
            setError(error.message || "Failed to update patient notes");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update patient notes";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      // Utility
      clearCurrentPatient: () =>
        set(
          (state) => {
            state.currentPatient = null;
          },
          false,
          "clearCurrentPatient",
        ),

      clearError: () =>
        set(
          (state) => {
            state.error = null;
          },
          false,
          "clearError",
        ),
    })),
    {
      name: "PatientStore",
    },
  ),
);

// Selectors - Use these to access store state directly (without fetching)
// For fetching data, use hooks from usePatient.ts instead
export const usePatientsFromStore = () =>
  usePatientStore((state) => state.patients);
export const useCurrentPatientFromStore = () =>
  usePatientStore((state) => state.currentPatient);
export const useIsLoadingPatientsFromStore = () =>
  usePatientStore((state) => state.isLoadingPatients);
export const useIsLoadingPatientFromStore = () =>
  usePatientStore((state) => state.isLoadingPatient);
export const useIsSavingPatientFromStore = () =>
  usePatientStore((state) => state.isSaving);
export const usePatientErrorFromStore = () =>
  usePatientStore((state) => state.error);
