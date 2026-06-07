import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/app/data/loadedDataClasses";
import { BattleState } from "../battleState";
import { PartyPokemon } from "../types/PartyPokemon";
import { Stats } from "./Pokemon";
import { TectonicData } from "./TectonicData";

export class Item {
    id: string = "";
    name: string = "";
    description: string = "";
    pocket: number = 0;
    flags: string[] = [];
    move?: string; // Used by TMs
    image: string = "";

    get isHeldItem() {
        return this.pocket >= 9 && this.pocket <= 13;
    }

    get isTM() {
        // probably also needs updating for dev
        return this.pocket == 4;
    }

    static NULL: Item = null!;

    constructor(loaded?: LoadedItem) {
        if (!loaded) return;

        this.id = loaded.key;
        this.name = loaded.name;
        this.description = loaded.description;
        this.pocket = loaded.pocket;
        this.flags = loaded.flags;
        this.move = loaded.move;
        this.image = `/Items/${this.id}.png`;

        if (this.move && TectonicData.moves[this.move]) {
            const moveData = TectonicData.moves[this.move];
            this.name = `TM: ${moveData.name}`;
            this.description = moveData.description;
            this.image = this.image.replace(this.id, `${moveData.type.id}MEMORY`);
        }
    }

    // to be modified by subclasses
    // function signature will be updated as necessary to implement items
    public offensiveMultiplier(
        multipliers: DamageMultipliers,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        move: MoveData,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        user: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        target: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        battleState: BattleState,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        typeEffectMult: number,
    ): DamageMultipliers {
        return multipliers;
    }

    // note that because of the context in which this is called, "target" is the mon holding the item
    public defensiveMultiplier(
        multipliers: DamageMultipliers,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        move: MoveData,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        user: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        target: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        battleState: BattleState,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        typeEffectMult: number,
    ): DamageMultipliers {
        return multipliers;
    }

    public baseStats(stats: Stats): Stats {
        return stats;
    }

    public modifyStats(stats: Stats): Stats {
        return stats;
    }

    static itemIds: string[] = [];
}
