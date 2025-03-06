import { z } from 'zod';

// define a schema for the notifications
export const commentSchema = z.object({
    comments: z.array(
        z.object({
            os: z.string().describe('The original sentence from the user'),
            is: z.string().describe('Your improved sentence suggestion'),
            rsn: z.string().describe('Reason for the improvement, referencing guidelines'),
        }),
    ),
});