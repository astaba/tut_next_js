'use server';

export async function createInvoice(formData: FormData) {
  // HACK: In case your form has a lot of fields:
  // const rawFormData = Object.fromEntries(formData.entries())

  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  // Test it out
  console.log(rawFormData);
  console.log(typeof rawFormData.amount);
}
