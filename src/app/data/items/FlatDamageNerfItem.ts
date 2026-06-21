import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";

const itemNerfs: Record<string, number> = {
    COVERTCLOAK: 0.9,
};

export class FlatDamageNerfItem extends Item {
    nerfMult: number;

    constructor(item: LoadedItem) {
        super(item);
        this.nerfMult = itemNerfs[item.key];
    }

    public defensiveMultiplier(multipliers: DamageMultipliers): DamageMultipliers {
        multipliers.final_damage_multiplier *= this.nerfMult;
        return multipliers;
    }

    static itemIds = Object.keys(itemNerfs);
}
