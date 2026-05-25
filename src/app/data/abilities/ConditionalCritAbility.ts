import { LoadedAbility } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { StatusEffect } from "../conditions";
import { Ability } from "../tectonic/Ability";
import { PartyPokemon } from "../types/PartyPokemon";

type CritConditionFunction = (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) => boolean;

function statusCheck(status: StatusEffect): CritConditionFunction {
    return (_u, target) => target.statusEffect === status;
}

const critConditions: Record<string, CritConditionFunction> = {
    HARSH: statusCheck("Burn"),
    MERCILESS: statusCheck("Poison"),
    BITTER: statusCheck("Frostbite"),
    SEVERE: statusCheck("Numb"),
    PERFECTLUCK: () => true,
};

export class ConditionalCritAbility extends Ability {
    private condition: CritConditionFunction;

    constructor(ability: LoadedAbility) {
        super(ability);
        this.condition = critConditions[ability.key];
    }

    public forceCrit(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): boolean {
        return this.condition(user, target, battleState);
    }

    static abilityIds = Object.keys(critConditions);
}
