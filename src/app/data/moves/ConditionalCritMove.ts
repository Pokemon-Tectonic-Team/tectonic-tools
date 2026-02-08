import { LoadedMove } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { Move } from "../tectonic/Move";
import { PartyPokemon } from "../types/PartyPokemon";

type CritConditionFunction = (user: PartyPokemon, target: PartyPokemon, battleState: BattleState) => boolean;

const critConditions: Record<string, CritConditionFunction> = {
    AlwaysCriticalHit: () => true,
    AlwaysCritialLowerUserSpeed1: () => true,
    CritsAgainstRaisedStats: (_user, target) => Object.values(target.statSteps).some((s) => s > 0),
};

export class ConditionalCritMove extends Move {
    private condition: CritConditionFunction;

    constructor(move: LoadedMove) {
        super(move);
        this.condition = critConditions[move.functionCode];
    }

    public forceCrit(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): boolean {
        return this.condition(user, target, battleState);
    }

    static moveCodes = Object.keys(critConditions);
}
