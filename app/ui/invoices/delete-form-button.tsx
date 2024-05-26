// NOTE: Outsourced from the button module to be a client component
// In order to call confirm() browser function within onSubmit event handler
'use client';

import { deleteInvoice } from "@/app/lib/actions";
import { TrashIcon } from "@heroicons/react/24/outline";

export function DeleteInvoice({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);

  return (
    <form
      onSubmit={(e) => {
        const isOk = confirm('Do you confirm deletion?');
        if (!isOk) e.preventDefault();
      }}
      action={deleteInvoiceWithId}
    >
      <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}

