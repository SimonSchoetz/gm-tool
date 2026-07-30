export {};

// `export {}` above makes this file a module, which is what turns `declare module` into an augmentation of @tanstack/history's own declarations rather than an ambient redeclaration that would replace them.
declare module '@tanstack/history' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging into HistoryState requires `interface`; a type alias cannot augment an existing interface
  interface HistoryState {
    focusNameInput?: boolean;
  }
}
