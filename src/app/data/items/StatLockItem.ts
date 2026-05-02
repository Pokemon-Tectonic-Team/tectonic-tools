import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";
import { Stat, Stats } from "../tectonic/Pokemon";

const statLockItems: Record<string, Stat> = {
    POWERLOCK: "attack",
    ENERGYLOCK: "spatk",
};

// type is stored in state of relevant pages
export class StatLockItem extends Item {
    lockedStat: Stat;
    constructor(item: LoadedItem) {
        super(item);
        this.lockedStat = statLockItems[item.key];
    }

    public baseStats(stats: Stats): Stats {
        // don't modify base data
        const newStats = { ...stats };
        newStats[this.lockedStat] = 120;
        return newStats;
    }

    static itemIds = Object.keys(statLockItems);
}
