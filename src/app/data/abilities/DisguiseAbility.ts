import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { Ability } from "../tectonic/Ability";
import { PartyPokemon } from "../types/PartyPokemon";

export class DisguiseAbility extends Ability {
    needsInput = true;
    customVarName = "Disguise Active";

    constructor(ability: LoadedAbility) {
        super(ability);
    }

    public defensiveMultiplier(
        move: MoveData, user: PartyPokemon, target: PartyPokemon, battleState: BattleState, typeEffectMult: number // eslint-disable-line @typescript-eslint/no-unused-vars
    ): number {
        return target.abilityCustomVar ? 0 : 1;
    }

    static abilityIds = ["DISGUISE"];
}
