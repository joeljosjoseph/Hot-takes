export const PROMPTS: string[] = [
    "The worst thing to say on a first date",
    "A terrible name for a pet goldfish",
    "The most suspicious thing to find in your fridge",
    "What your cat is really thinking when it stares at you",
    "A bad slogan for a funeral home",
    "The worst superpower to have on a Monday morning",
    "Something you should never say to an airline pilot",
    "A rejected flavour of ice cream",
    "The real reason you were late",
    "A terrible thing to yell in a library",
    "The worst possible name for a boat",
    "What the pigeons are plotting",
    "A bad idea for a theme park ride",
    "The least reassuring thing a doctor can say",
    "Something you'd regret putting on a resume",
];

export const generatePrompt = () => {
    const index = Math.floor(Math.random() * PROMPTS.length);
    return PROMPTS[index] ?? "Worst date you've ever had";
}