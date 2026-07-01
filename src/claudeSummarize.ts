import { execFile } from 'child_process';

export function summarize(
    freeFormContent: string,
    claudePath: string,
    prompt: string
): Promise<string | null> {
    const fullPrompt = `${prompt}\n\n${freeFormContent}`;

    return new Promise((resolve) => {
        execFile(
            claudePath,
            ['-p', fullPrompt],
            { timeout: 30000 },
            (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve(null);
                } else {
                    resolve(stdout.trim());
                }
            }
        );
    });
}
