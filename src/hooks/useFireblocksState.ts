import useWeb3Context from "./useWeb3Context";

const useFireblocksState = (
  initWithPersistence?: boolean,
): [
  Record<string, Record<string, string>>,
  (state: Record<string, Record<string, string>>) => void,
] => {
  // retrieve state from web3 context
  const {
    sessionKeyState,
    setSessionKeyState,
    persistentKeyState,
    setPersistentKeyState,
  } = useWeb3Context();

  // validate state initialization
  if (
    !sessionKeyState ||
    !setSessionKeyState ||
    !persistentKeyState ||
    !setPersistentKeyState
  ) {
    throw new Error(
      "Expected useFireblocksState to be called within <Web3ContextProvider />",
    );
  }

  // if a session state is already established, return the existing state
  // values to maintain the session
  if (Object.keys(sessionKeyState).length > 0) {
    return [sessionKeyState, setSessionKeyState];
  }

  // if persistent state is already established, return the existing state
  // values to maintain the persistent state
  if (Object.keys(persistentKeyState).length > 0) {
    return [persistentKeyState, setPersistentKeyState];
  }

  // if no state is found, initialize a new store with the requested level
  // of persistence
  return initWithPersistence
    ? [persistentKeyState, setPersistentKeyState]
    : [sessionKeyState, setSessionKeyState];
};

export default useFireblocksState;
