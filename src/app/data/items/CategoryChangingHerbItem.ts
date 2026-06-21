import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";
import { PartyPokemon } from "../types/PartyPokemon";

const inputCategories: Record<string, "Physical" | "Special"> = {
    STRENGTHHERB: "Special",
    INTELLECTHERB: "Physical",
};

const outputCategories: Record<string, "Physical" | "Special"> = {
    STRENGTHHERB: "Physical",
    INTELLECTHERB: "Special",
};

export class CategoryChangingHerbItem extends Item {
    inputCategory: "Physical" | "Special";
    outputCategory: "Physical" | "Special";

    constructor(item: LoadedItem) {
        super(item);
        this.inputCategory = inputCategories[item.key];
        this.outputCategory = outputCategories[item.key];
    }

    public offensiveMultiplier(
        multipliers: DamageMultipliers,
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon,
    ): DamageMultipliers {
        if (move.move.getDamageCategory(move, user, target) === this.inputCategory) {
            multipliers.final_damage_multiplier *= 1.15;
        }
        return multipliers;
    }

    static itemIds = Object.keys(inputCategories);
}
