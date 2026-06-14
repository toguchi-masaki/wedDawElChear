interface Props {
  isOut: boolean;
  triggerKey: number | string;
}

export function ResultFlash({ isOut, triggerKey }: Props) {
  return (
    <div
      key={triggerKey}
      className={`result-flash ${isOut ? 'flash-out' : 'flash-safe'}`}
      aria-hidden
    />
  );
}
