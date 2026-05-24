import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { eclipseWeathers, rainWeathers, sandWeathers, sunWeathers, WeatherCondition } from "../conditions";
import { Ability } from "../tectonic/Ability";
import { PartyPokemon } from "../types/PartyPokemon";

type OffensiveConditionFunction = (
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState
) => boolean;

function weatherCheck(weathers: WeatherCondition[]): OffensiveConditionFunction {
    return (_m, _u, _t, bs) => weathers.includes(bs.weather);
}

function weatherAndTypeCheck(weathers: WeatherCondition[], typeId: string): OffensiveConditionFunction {
    return (m, u, _t, bs) => weathers.includes(bs.weather) && m.move.getType(u, bs).id === typeId;
}

interface OffensiveAbilityConfig {
    condition: OffensiveConditionFunction;
    multiplier: number;
}

const offensiveAbilities: Record<string, OffensiveAbilityConfig> = {
    // Weather-only (no type check)
    SCATHINGSYZYGY: { condition: weatherCheck(eclipseWeathers), multiplier: 1.25 },
    TERRITORIAL: { condition: (_m, _u, _t, bs) => bs.weather !== "None", multiplier: 1.2 },
    // Weather + type
    DARKENEDSKIES: { condition: weatherAndTypeCheck(sandWeathers, "DARK"), multiplier: 1.5 },
    MIDNIGHTSUN: { condition: weatherAndTypeCheck(sunWeathers, "DARK"), multiplier: 1.5 },
    RAINPRISM: { condition: weatherAndTypeCheck(rainWeathers, "FAIRY"), multiplier: 1.5 },
    WORLDQUAKE: { condition: weatherAndTypeCheck(eclipseWeathers, "GROUND"), multiplier: 1.5 },
};

export class OffensiveDamageBoostAbility extends Ability {
    private config: OffensiveAbilityConfig;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.config = offensiveAbilities[ability.key];
    }

    public movePowerMultiplier(
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon,
        battleState: BattleState
    ): number {
        return this.config.condition(move, user, target, battleState) ? this.config.multiplier : 1;
    }

    static abilityIds = Object.keys(offensiveAbilities);
}
