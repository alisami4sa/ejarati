"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  label?: string;
  confirmMessage: string;
};

export function DeleteButton({
  action,
  label = "حذف",
  confirmMessage,
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
      <button type="submit" className="btn btn-danger btn-sm">
        {label}
      </button>
    </form>
  );
}
