'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sql } from '@vercel/postgres';

const ZInvoice = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, {
    message: 'Please enter an amount greater than $0.',
  }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const ZCreateInvoice = ZInvoice.omit({ id: true, date: true });

// NOTE: This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // NOTE: prevState is not used in this action, but it's a required prop.
  // NOTE: validate form fields using zod
  const formCodexAssess = ZCreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // TEST: check formCodexAssess shape:
  // console.log(formCodexAssess);

  // NOTE: If form validation fails returns errors early. Otherwise, continue.
  if (!formCodexAssess.success) {
    return {
      errors: formCodexAssess.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create Invoice.',
    };
  }

  // NOTE: Prepare data for insertion into the database.
  const { customerId, status, amount } = formCodexAssess.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // NOTE: Insert data into the databse.
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    // NOTE: If a database error occurs, return a more specific massege.
    // console.error(error);
    return {
      message: 'Database error: Failed to Create Invoice.',
    };
  }
  // NOTE: Revalidate the catch for the invoices pages and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const ZUpdateInvoice = ZInvoice.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // HACK: In case your form has a lot of fields:
  // const rawFormData = Object.fromEntries(formData.entries())
  const formCodexAssess = ZUpdateInvoice.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!formCodexAssess.success) {
    return {
      errors: formCodexAssess.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create Invoice.',
    };
  }

  const { customerId, amount, status } = formCodexAssess.data;
  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    // console.error(error);
    return {
      message: 'Database error: Failed to Update Invoice.',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM  invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    // console.error(error);
    return {
      message: 'Database error: Failed to Delete Invoice.',
    };
  }
}
