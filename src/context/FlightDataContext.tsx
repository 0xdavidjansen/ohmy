import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Flight,
  NonFlightDay,
  PersonalInfo,
  ReimbursementData,
  UploadedFile,
  DataWarning,
} from '../types';

interface FlightDataState {
  personalInfo: PersonalInfo | null;
  flights: Flight[];
  nonFlightDays: NonFlightDay[];
  reimbursementData: ReimbursementData[];
  uploadedFiles: UploadedFile[];
  warnings: DataWarning[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FlightDataState = {
  personalInfo: null,
  flights: [],
  nonFlightDays: [],
  reimbursementData: [],
  uploadedFiles: [],
  warnings: [],
  isLoading: false,
  error: null,
};

type FlightDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PERSONAL_INFO'; payload: PersonalInfo | null }
  | { type: 'ADD_FLIGHTS'; payload: Flight[] }
  | { type: 'ADD_NON_FLIGHT_DAYS'; payload: NonFlightDay[] }
  | { type: 'ADD_REIMBURSEMENT_DATA'; payload: ReimbursementData }
  | { type: 'ADD_UPLOADED_FILE'; payload: UploadedFile }
  | { type: 'ADD_WARNINGS'; payload: DataWarning[] }
  | { type: 'DISMISS_WARNING'; payload: string }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'REMOVE_FILE'; payload: string };

function flightDataReducer(state: FlightDataState, action: FlightDataAction): FlightDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload };
    case 'ADD_FLIGHTS': {
      const existingFlightIds = new Set(state.flights.map((f) => f.id));
      const newFlights = action.payload.filter((f) => !existingFlightIds.has(f.id));
      return { ...state, flights: [...state.flights, ...newFlights] };
    }
    case 'ADD_NON_FLIGHT_DAYS': {
      const existingDayIds = new Set(state.nonFlightDays.map((d) => d.id));
      const newDays = action.payload.filter((d) => !existingDayIds.has(d.id));
      return { ...state, nonFlightDays: [...state.nonFlightDays, ...newDays] };
    }
    case 'ADD_REIMBURSEMENT_DATA': {
      const filtered = state.reimbursementData.filter(
        (r) => !(r.month === action.payload.month && r.year === action.payload.year)
      );
      return { ...state, reimbursementData: [...filtered, action.payload] };
    }
    case 'ADD_UPLOADED_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] };
    case 'ADD_WARNINGS': {
      const existingWarningIds = new Set(state.warnings.map((w) => w.id));
      const newWarnings = action.payload.filter((w) => !existingWarningIds.has(w.id));
      return { ...state, warnings: [...state.warnings, ...newWarnings] };
    }
    case 'DISMISS_WARNING':
      return {
        ...state,
        warnings: state.warnings.filter((w) => w.id !== action.payload),
      };
    case 'CLEAR_ALL_DATA':
      return initialState;
    case 'REMOVE_FILE': {
      const fileToRemove = state.uploadedFiles.find((f) => f.id === action.payload);
      if (!fileToRemove) return state;

      const newState: FlightDataState = {
        ...state,
        uploadedFiles: state.uploadedFiles.filter((f) => f.id !== action.payload),
      };

      if (fileToRemove.type === 'flugstunden' && fileToRemove.month && fileToRemove.year) {
        newState.flights = state.flights.filter(
          (f) => !(f.month === fileToRemove.month && f.year === fileToRemove.year)
        );
        newState.nonFlightDays = state.nonFlightDays.filter(
          (d) => !(d.month === fileToRemove.month && d.year === fileToRemove.year)
        );
      } else if (fileToRemove.type === 'streckeneinsatz' && fileToRemove.month && fileToRemove.year) {
        newState.reimbursementData = state.reimbursementData.filter(
          (r) => !(r.month === fileToRemove.month && r.year === fileToRemove.year)
        );
      }

      return newState;
    }
    default:
      return state;
  }
}

interface FlightDataContextType {
  state: FlightDataState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPersonalInfo: (info: PersonalInfo | null) => void;
  addFlights: (flights: Flight[]) => void;
  addNonFlightDays: (days: NonFlightDay[]) => void;
  addReimbursementData: (data: ReimbursementData) => void;
  addUploadedFile: (file: UploadedFile) => void;
  addWarnings: (warnings: DataWarning[]) => void;
  dismissWarning: (warningId: string) => void;
  clearAllData: () => void;
  removeFile: (fileId: string) => void;
}

const FlightDataContext = createContext<FlightDataContextType | null>(null);

export function FlightDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(flightDataReducer, initialState);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setPersonalInfo = useCallback((info: PersonalInfo | null) => {
    dispatch({ type: 'SET_PERSONAL_INFO', payload: info });
  }, []);

  const addFlights = useCallback((flights: Flight[]) => {
    dispatch({ type: 'ADD_FLIGHTS', payload: flights });
  }, []);

  const addNonFlightDays = useCallback((days: NonFlightDay[]) => {
    dispatch({ type: 'ADD_NON_FLIGHT_DAYS', payload: days });
  }, []);

  const addReimbursementData = useCallback((data: ReimbursementData) => {
    dispatch({ type: 'ADD_REIMBURSEMENT_DATA', payload: data });
  }, []);

  const addUploadedFile = useCallback((file: UploadedFile) => {
    dispatch({ type: 'ADD_UPLOADED_FILE', payload: file });
  }, []);

  const addWarnings = useCallback((warnings: DataWarning[]) => {
    dispatch({ type: 'ADD_WARNINGS', payload: warnings });
  }, []);

  const dismissWarning = useCallback((warningId: string) => {
    dispatch({ type: 'DISMISS_WARNING', payload: warningId });
  }, []);

  const clearAllData = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  }, []);

  return (
    <FlightDataContext.Provider
      value={{
        state,
        setLoading,
        setError,
        setPersonalInfo,
        addFlights,
        addNonFlightDays,
        addReimbursementData,
        addUploadedFile,
        addWarnings,
        dismissWarning,
        clearAllData,
        removeFile,
      }}
    >
      {children}
    </FlightDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlightData() {
  const context = useContext(FlightDataContext);
  if (!context) {
    throw new Error('useFlightData must be used within a FlightDataProvider');
  }
  return context;
}
