import { BattleState } from "@/app/data/battleState";
import { Move } from "../tectonic/Move";
import { PartyPokemon } from "../types/PartyPokemon";

export class WeightTargetScalingMove extends Move {
    public getPower(_: PartyPokemon, target: PartyPokemon, battleState: BattleState): number {
        let ret = 15;
        // Formula differs from Tectonic - they store weight in kg/10ths
        // we store kg directly
        const baseWeight = target.species.weight * (battleState.gravity ? 2 : 1);
        const weight = Math.min(baseWeight, 2000);
        ret += Math.floor((4 * Math.sqrt(weight)) / 5) * 5;
        return ret;
    }

    static moveCodes = ["ScalesTargetsWeight"];
}
