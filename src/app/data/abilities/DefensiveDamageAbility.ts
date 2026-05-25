import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { BattleState } from "../battleState";
import { Ability } from "../tectonic/Ability";
import { PartyPokemon } from "../types/PartyPokemon";

type DefenseConditionFunction = (
    move: MoveData,
    user: PartyPokemon,
    target: PartyPokemon,
    battleState: BattleState,
    typeEffectMult: number
) => boolean;

interface DefensiveAbilityConfig {
    condition: DefenseConditionFunction;
    multiplier: number;
}

const defensiveAbilities: Record<string, DefensiveAbilityConfig> = {
    // Always-on reductions
    WHITEKNIGHT: { condition: () => true, multiplier: 0.85 },
    BURDENED: { condition: () => true, multiplier: 0.67 },
    // SE-conditional
    PRISMARMOR: { condition: (_m, _u, _t, _bs, te) => te > 1, multiplier: 0.75 },
    // Weather-conditional
    WEATHERED: { condition: (_m, _u, _t, bs) => bs.weather !== "None", multiplier: 0.8 },
    APPREHENSIVE: {
        condition: (_m, _u, _t, bs) => bs.weather === "Eclipse",
        multiplier: 0.65,
    },
    SANDSHROUD: { condition: (_m, _u, _t, bs) => bs.weather === "Sandstorm", multiplier: 0.7 },
    SNOWSHROUD: { condition: (_m, _u, _t, bs) => bs.weather === "Hail", multiplier: 0.7 },
    FERROFLUID: {
        condition: (_m, _u, _t, bs) => bs.weather === "Rainstorm" || bs.weather === "Heavy Rain",
        multiplier: 0.7,
    },
    MOONBLANKET: {
        condition: (_m, _u, _t, bs) => bs.weather === "Moonglow" || bs.weather === "Blood Moon",
        multiplier: 0.75,
    },
};

export class DefensiveDamageAbility extends Ability {
    private config: DefensiveAbilityConfig;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.config = defensiveAbilities[ability.key];
    }

    public defensiveMultiplier(
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon,
        battleState: BattleState,
        typeEffectMult: number
    ): number {
        return this.config.condition(move, user, target, battleState, typeEffectMult) ? this.config.multiplier : 1;
    }

    static abilityIds = Object.keys(defensiveAbilities);
}
