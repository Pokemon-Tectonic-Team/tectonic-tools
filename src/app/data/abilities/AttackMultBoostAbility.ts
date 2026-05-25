import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/app/data/loadedDataClasses";
import { BattleState } from "../battleState";
import { Ability } from "../tectonic/Ability";
import { PartyPokemon } from "../types/PartyPokemon";

type damageBoostConditionFunction = (move: MoveData, user: PartyPokemon, battleState: BattleState) => boolean;

function isTypeCheck(typeId: string): damageBoostConditionFunction {
    return (move: MoveData, user: PartyPokemon, battleState: BattleState) =>
        move.move.getType(user, battleState).id === typeId;
}

const attackMultBoostCondition: Record<string, damageBoostConditionFunction> = {
    PALEOLITHIC: isTypeCheck("ROCK"),
    HUSTLE: () => true,
    TUNNELMAKER: isTypeCheck("GROUND"),
    STRATAGEM: isTypeCheck("ROCK"),
    TOXICATTITUDE: isTypeCheck("POISON"),
    STEELWORKER: isTypeCheck("STEEL"),
    STEELYSPIRIT: isTypeCheck("STEEL"),
    SURFSUP: isTypeCheck("WATER"),
    ERUDITE: isTypeCheck("PSYCHIC"),
    SCALDINGSMOKE: isTypeCheck("POISON"),
    VERDANT: isTypeCheck("GRASS"),
    SUPERALLOY: isTypeCheck("STEEL"),
    TRANSISTOR: isTypeCheck("ELECTRIC"),
    DRAGONSMAW: isTypeCheck("DRAGON"),
};

const attackMultBoostValues: Record<string, number> = {
    PALEOLITHIC: 1.5,
    HUSTLE: 1.5,
    TUNNELMAKER: 1.5,
    STRATAGEM: 1.5,
    TOXICATTITUDE: 1.5,
    STEELWORKER: 1.5,
    STEELYSPIRIT: 1.5,
    SURFSUP: 1.5,
    ERUDITE: 1.5,
    SCALDINGSMOKE: 1.5,
    VERDANT: 1.5,
    SUPERALLOY: 1.5,
    TRANSISTOR: 1.5,
    DRAGONSMAW: 1.5,
};

export class AttackMultBoostAbility extends Ability {
    private condition: damageBoostConditionFunction;
    private boostValue: number;
    constructor(ability: LoadedAbility) {
        super(ability);
        this.condition = attackMultBoostCondition[ability.key];
        this.boostValue = attackMultBoostValues[ability.key];
    }

    public attackMultiplier(move: MoveData, user: PartyPokemon, battleState: BattleState) {
        return this.condition(move, user, battleState) ? this.boostValue : 1;
    }

    static abilityIds = Object.keys(attackMultBoostCondition);
}
