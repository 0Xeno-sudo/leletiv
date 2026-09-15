/** Never silently clip clinical narrative at the storage boundary. */
export function textFieldsError(
  body: Record<string, unknown>,
  limits: Record<string, number>,
): string | null {
  for (const [field, max] of Object.entries(limits)) {
    const value = body[field];
    if (
      value !== undefined &&
      (typeof value !== "string" || value.length > max)
    )
      return "One or more text fields exceed the permitted length or have an invalid type. Nothing was saved.";
  }
  return null;
}
