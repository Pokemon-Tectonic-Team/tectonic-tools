import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";

const itemBoosts: Record<string, number> = {
    LIFEORB: 1.3,
};

export class FlatDamageBoostItem extends Item {
    boostMult: number;

    constructor(item: LoadedItem) {
        super(item);
        this.boostMult = itemBoosts[item.key];
    }

    public offensiveMultiplier(multipliers: DamageMultipliers): DamageMultipliers {
        multipliers.final_damage_multiplier *= this.boostMult;
        return multipliers;
    }

    static itemIds = Object.keys(itemBoosts);
}
