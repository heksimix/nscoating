'use server';

/**
 * @fileOverview Generates a concise summary of an order, including total cost, items, and customer details.
 *
 * - generateOrderSummary - A function that generates a summary for the order.
 * - GenerateOrderSummaryInput - The input type for the generateOrderSummary function.
 * - GenerateOrderSummaryOutput - The return type for the generateOrderSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOrderSummaryInputSchema = z.object({
  orderId: z.string().describe('The unique identifier for the order.'),
  customerName: z.string().describe('The name of the customer who placed the order.'),
  orderDate: z.string().describe('The date when the order was placed (YYYY-MM-DD).'),
  items: z
    .array(
      z.object({
        name: z.string().describe('The name of the item.'),
        quantity: z.number().describe('The quantity of the item ordered.'),
        price: z.number().describe('The price of the item.'),
      })
    )
    .describe('A list of items included in the order.'),
  totalCost: z.number().describe('The total cost of the order.'),
});
export type GenerateOrderSummaryInput = z.infer<typeof GenerateOrderSummaryInputSchema>;

const GenerateOrderSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the order.'),
});
export type GenerateOrderSummaryOutput = z.infer<typeof GenerateOrderSummaryOutputSchema>;

export async function generateOrderSummary(input: GenerateOrderSummaryInput): Promise<GenerateOrderSummaryOutput> {
  return generateOrderSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOrderSummaryPrompt',
  input: {schema: GenerateOrderSummaryInputSchema},
  output: {schema: GenerateOrderSummaryOutputSchema},
  prompt: `You are an order management assistant. Generate a concise summary of the order with the following details:

Order ID: {{{orderId}}}
Customer Name: {{{customerName}}}
Order Date: {{{orderDate}}}
Items:{{#each items}} \n  - {{name}} (Quantity: {{quantity}}, Price: {{price}}) {{/each}}
Total Cost: {{{totalCost}}}

Summary:`,
});

const generateOrderSummaryFlow = ai.defineFlow(
  {
    name: 'generateOrderSummaryFlow',
    inputSchema: GenerateOrderSummaryInputSchema,
    outputSchema: GenerateOrderSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
