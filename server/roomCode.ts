const DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function generateCode(): string {
    let code = "";
    for (let i = 0; i < 4; i++) {
        const index = Math.floor(Math.random() * DIGITS.length);
        code += DIGITS[index];
    }
    return code;
}