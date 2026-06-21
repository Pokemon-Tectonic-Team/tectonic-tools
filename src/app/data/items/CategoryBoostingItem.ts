import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";
import { PartyPokemon } from "../types/PartyPokemon";

const itemCategories: Record<string, ["Physical" | "Special", number]> = {
    MUSCLEBAND: ["Physical", 1.1],
    WISEGLASSES: ["Special", 1.1],
};

export class CategoryBoostingItem extends Item {
    boostedCategory: "Physical" | "Special";
    boostMult: number;

    constructor(item: LoadedItem) {
        super(item);
        const boostInfo = itemCategories[item.key];
        this.boostedCategory = boostInfo[0];
        this.boostMult = boostInfo[1];
    }

    public offensiveMultiplier(
        multipliers: DamageMultipliers,
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon
    ): DamageMultipliers {
        if (move.move.getDamageCategory(move, user, target) === this.boostedCategory) {
            multipliers.final_damage_multiplier *= this.boostMult;
        }
        return multipliers;
    }

    static itemIds = Object.keys(itemCategories);
}
