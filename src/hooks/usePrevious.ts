import {useEffect, useRef} from "react";

const usePrevious = <T>(value: T, isUndefinedFirst = true) => {
  const ref = useRef(isUndefinedFirst ? undefined : value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current as T;
};
export default usePrevious;
