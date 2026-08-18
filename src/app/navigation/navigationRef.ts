export const navigationRef = {
  current: null as any,
  navigate(name: string, params?: any) {
    if (this.current) {
      this.current.navigate(name, params);
    }
  },
  goBack() {
    if (this.current) {
      this.current.goBack();
    }
  },
};
