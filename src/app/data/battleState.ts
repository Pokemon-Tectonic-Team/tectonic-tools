import { WeatherCondition } from "./conditions";

export interface SideState {
    protecting: boolean;
    reflect: boolean;
    lightScreen: boolean;
    auroraVeil: boolean;
    customDamageMultiplier: number;
}

export const nullSideState: SideState = {
    protecting: false,
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    customDamageMultiplier: 1,
};

export interface BattleState {
    multiBattle: boolean;
    gravity: boolean;
    weather: WeatherCondition;
    sideState: SideState;
}

export const nullBattleState: BattleState = {
    multiBattle: false,
    gravity: false,
    weather: "None",
    sideState: nullSideState,
};
