export const useAppSelector = <TSelected>(
  selector: (state: any) => TSelected,
): TSelected => {
  return selector({});
};
