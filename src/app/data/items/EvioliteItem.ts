import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { Item } from "../tectonic/Item";
import { PartyPokemon } from "../types/PartyPokemon";

export class EvioliteItem extends Item {
    public defensiveMultiplier(
        multipliers: DamageMultipliers,
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon,
    ): DamageMultipliers {
        if (!target.species.getEvoNode().isLeaf()) {
            multipliers.defense_multiplier *= 1.5;
        }
        return multipliers;
    }
    static itemIds = ["EVIOLITE"];
}
