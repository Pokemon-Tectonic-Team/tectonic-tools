export const statusEffects = ["Poison", "Burn", "Frostbite", "Numb", "Dizzy", "Leech", "Waterlog", "Sleep"] as const;

export type StatusEffect = (typeof statusEffects)[number] | "None";

export const volatileStatusEffects = ["Jinx", "Fracture"] as const; // others exist but are not? relevant to damage calculation

export type VolatileStatusEffect = (typeof volatileStatusEffects)[number];

export const weatherConditions = [
    "Sunshine",
    "Rainstorm",
    "Hail",
    "Sandstorm",
    "Eclipse",
    "Moonglow",
    "Harsh Sunlight",
    "Heavy Rain",
    "Delta Stream",
    "Ring Eclipse",
    "Blood Moon",
] as const;

export type WeatherCondition = (typeof weatherConditions)[number] | "None";

export const sunWeathers: WeatherCondition[] = ["Sunshine", "Harsh Sunlight"];
export const rainWeathers: WeatherCondition[] = ["Rainstorm", "Heavy Rain"];
export const sandWeathers: WeatherCondition[] = ["Sandstorm"];
export const hailWeathers: WeatherCondition[] = ["Hail"];
export const eclipseWeathers: WeatherCondition[] = ["Eclipse", "Ring Eclipse"];
export const moonWeathers: WeatherCondition[] = ["Moonglow", "Blood Moon"];
