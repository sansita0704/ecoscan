import { useCallback, useState } from "react";
import { createDisposalToken } from "../services/disposalService";

/**
 * Issues a QR disposal token. `issue(detection)` takes the item at call time
 * rather than the hook being bound to one detection, so with several items on
 * screen at once, any item's card can trigger this for itself.
 * status: idle | loading | ready | error
 */
export function useDisposalToken() {
  const [state, setState] = useState({ status: "idle", token: null, error: null });

  const issue = useCallback(async (detection) => {
    if (!detection) return;
    setState({ status: "loading", token: null, error: null });
    try {
      const token = await createDisposalToken(detection);
      setState({ status: "ready", token, error: null });
    } catch (error) {
      setState({ status: "error", token: null, error });
    }
  }, []);

  const clear = useCallback(() => setState({ status: "idle", token: null, error: null }), []);

  return { ...state, issue, clear };
}
