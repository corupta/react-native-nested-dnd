import React, { useRef, useEffect } from 'react';

const useRefMemo = (effect, dependencies) => {
  const prevDeps = useRef();
  const result = useRef();

  if (
    !prevDeps.current ||
    prevDeps.current.reduce((acc, d, i) => acc || d !== dependencies[i], false)
  ) {
    prevDeps.current = dependencies;
    result.current = effect(result.current);
  }

  return result.current;
};

export default useRefMemo;
