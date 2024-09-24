export const extractFunctionNameFromId = (id: string) => {
  return id.split("(")[0];
};
