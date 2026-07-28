export function friendlyPostgresError(
  error: { code?: string; message: string },
  uniqueMessage?: string,
) {
  if (error.code === "23505") return uniqueMessage ?? "That value already exists.";
  return error.message;
}
