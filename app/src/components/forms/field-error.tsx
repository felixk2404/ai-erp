export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="text-sm text-led-red mt-1">
      {msg}
    </p>
  );
}
