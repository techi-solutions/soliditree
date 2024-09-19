import { v4 as uuidv4 } from "uuid";

export const generateRandomString = (length: number = 8): string => {
  return uuidv4().replace(/-/g, "").substring(0, length);
};
