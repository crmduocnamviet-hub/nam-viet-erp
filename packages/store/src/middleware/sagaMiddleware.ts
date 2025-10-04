import { StateCreator, StoreMutatorIdentifier } from "zustand";

// Saga action types
export type SagaEffect<T = any> = {
  type: "call" | "put" | "select";
  payload: T;
};

export type SagaGenerator = Generator<SagaEffect, void, any>;

export interface SagaMiddleware {
  sagas: Map<string, (payload?: any) => SagaGenerator>;
  registerSaga: (
    actionType: string,
    saga: (payload?: any) => SagaGenerator
  ) => void;
  runSaga: (actionType: string, payload?: any) => Promise<void>;
}

// Saga middleware implementation
export const sagaMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T & SagaMiddleware, Mps, Mcs>
): StateCreator<T & SagaMiddleware, Mps, Mcs> => {
  return (set, get, api) => {
    const sagas = new Map<string, (payload?: any) => SagaGenerator>();

    const registerSaga = (
      actionType: string,
      saga: (payload?: any) => SagaGenerator
    ) => {
      sagas.set(actionType, saga);
    };

    const runSaga = async (actionType: string, payload?: any) => {
      const saga = sagas.get(actionType);
      if (!saga) {
        console.warn(`No saga registered for action: ${actionType}`);
        return;
      }

      const generator = saga(payload);
      let result = generator.next();

      while (!result.done) {
        const effect = result.value;

        // Type guard to ensure effect is not void
        if (!effect || typeof effect !== 'object' || !('type' in effect)) {
          console.warn('Invalid saga effect:', effect);
          break;
        }

        try {
          let effectResult: any;

          switch (effect.type) {
            case "call":
              // Call a function (usually an API call)
              effectResult = await effect.payload();
              break;

            case "put":
              // Dispatch an action (update state)
              const action = effect.payload;
              if (typeof action === "function") {
                // For Immer middleware compatibility, pass the action function directly
                // Immer will provide a mutable draft state to the function
                set(action);
              } else {
                // Direct state update
                set(action);
              }
              effectResult = undefined;
              break;

            case "select":
              // Select state
              effectResult = effect.payload(get());
              break;

            default:
              console.warn(`Unknown effect type: ${(effect as any).type}`);
          }

          result = generator.next(effectResult);
        } catch (error) {
          // Send error to saga
          result = generator.throw?.(error) ?? { done: true, value: undefined };
        }
      }
    };

    return {
      ...f(set, get, api),
      sagas,
      registerSaga,
      runSaga,
    };
  };
};

// Helper functions to create saga effects
export const call = <T = any>(
  fn: () => Promise<T> | T
): SagaEffect<() => Promise<T> | T> => ({
  type: "call",
  payload: fn,
});

export const put = <T = any>(action: T): SagaEffect<T> => ({
  type: "put",
  payload: action,
});

export const select = <T = any>(
  selector: (state: any) => T
): SagaEffect<(state: any) => T> => ({
  type: "select",
  payload: selector,
});
