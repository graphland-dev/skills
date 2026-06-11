import { useRouteContext } from "@tanstack/react-router";

const useAppContext = () => {
  return useRouteContext({
    from: "__root__",
    select: (context) => context,
  });
};

export default useAppContext;
