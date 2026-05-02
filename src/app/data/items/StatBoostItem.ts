import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";
import { Stat, Stats } from "../tectonic/Pokemon";

const statBoostItems: Record<string, [Stat, number]> = {
    ASSAULTVEST: ["spdef", 1.5],
    STRIKEVEST: ["defense", 1.5],
    CHOICEBAND: ["attack", 1.4],
    CHOICESPECS: ["spatk", 1.4],
    CHOICESCARF: ["speed", 1.4],
    SEVENLEAGUEBOOTS: ["speed", 1.1],
};

// type is stored in state of relevant pages
export class StatBoostItem extends Item {
    boostedStat: Stat;
    boostAmount: number;

    constructor(item: LoadedItem) {
        super(item);
        const boostInfo = statBoostItems[item.key];
        this.boostedStat = boostInfo[0];
        this.boostAmount = boostInfo[1];
    }

    public modifyStats(stats: Stats): Stats {
        const newStats = { ...stats };
        newStats[this.boostedStat] = Math.floor(newStats[this.boostedStat] * this.boostAmount);
        return newStats;
    }

    static itemIds = Object.keys(statBoostItems);
}
