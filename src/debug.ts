export function TODO(msg?: string){
  const stack = (new Error()).stack as string;
  const fn = stack.split("\n")[2].split(/ +/)[2];
  const error = new Error("TODO " + fn + "()" + (msg ? ": " + msg : ""));
  Error.captureStackTrace(error, TODO);
  throw error;
}
