"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirmMessage: string;
  className?: string;
};

export function ConfirmActionButton({
  action,
  label,
  confirmMessage,
  className = "btn btn-primary btn-sm",
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
