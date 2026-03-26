"use client";

import type { ReactNode } from "react";

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
};

export function ConfirmActionForm({
  action,
  confirmMessage,
  className,
  children,
}: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}

