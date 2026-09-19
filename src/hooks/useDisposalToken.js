import { useCallback, useState } from "react";
import { createDisposalToken } from "../services/disposalService";

/** Issues a QR disposal token for the current detection. status: idle | loading | ready | error */
export function useDisposalToken(detection) {
  const [state, setState] = useState({ status: "idle", token: null, error: null });

  const issue = useCallback(async () => {
    if (!detection) return;
    setState({ status: "loading", token: null, error: null });
    try {
      const token = await createDisposalToken(detection);
      setState({ status: "ready", token, error: null });
    } catch (error) {
      setState({ status: "error", token: null, error });
    }
  }, [detection]);

  const clear = useCallback(() => setState({ status: "idle", token: null, error: null }), []);

  return { ...state, issue, clear };
}
