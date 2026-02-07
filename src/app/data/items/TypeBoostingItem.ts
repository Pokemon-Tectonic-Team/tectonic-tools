import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { DamageMultipliers } from "@/app/damagecalc/damageCalc";
import { LoadedItem } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { Item } from "../tectonic/Item";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";
import { PartyPokemon } from "../types/PartyPokemon";

const itemTypes: Record<string, string[]> = {
    CHARCOAL: ["FIRE"],
    MYSTICWATER: ["WATER"],
    MAGNET: ["ELECTRIC"],
    MIRACLESEED: ["GRASS"],
    NEVERMELTICE: ["ICE"],
    BLACKBELT: ["FIGHTING"],
    POISONBARB: ["POISON"],
    SOFTSAND: ["GROUND"],
    SHARPBEAK: ["FLYING"],
    TWISTEDSPOON: ["PSYCHIC"],
    SILVERPOWDER: ["BUG"],
    HARDSTONE: ["ROCK"],
    SPELLTAG: ["GHOST"],
    DRAGONFANG: ["DRAGON"],
    BLACKGLASSES: ["DARK"],
    METALCOAT: ["STEEL"],
    SILKSCARF: ["NORMAL"],
    FAIRYFEATHER: ["FAIRY"],
    FIREGEM: ["FIRE"],
    WATERGEM: ["WATER"],
    ELECTRICGEM: ["ELECTRIC"],
    GRASSGEM: ["GRASS"],
    ICEGEM: ["ICE"],
    FIGHTINGGEM: ["FIGHTING"],
    POISONGEM: ["POISON"],
    GROUNDGEM: ["GROUND"],
    FLYINGGEM: ["FLYING"],
    PSYCHICGEM: ["PSYCHIC"],
    BUGGEM: ["BUG"],
    ROCKGEM: ["ROCK"],
    GHOSTGEM: ["GHOST"],
    DRAGONGEM: ["DRAGON"],
    DARKGEM: ["DARK"],
    STEELGEM: ["STEEL"],
    NORMALGEM: ["NORMAL"],
    FAIRYGEM: ["FAIRY"],
    ADAMANTORB: ["DRAGON", "STEEL"],
    LUSTROUSORB: ["DRAGON", "WATER"],
    GRISEOUSORB: ["DRAGON", "GHOST"],
};

const itemBoosts: Record<string, number> = {};

export class TypeBoostingItem extends Item {
    boostedTypes: PokemonType[];
    boostMult: number;
    constructor(item: LoadedItem) {
        super(item);
        this.boostedTypes = itemTypes[item.key].map((t) => TectonicData.types[t]);
        // lazy hardcode to avoid writing out each gem individually
        if (item.key.includes("GEM")) {
            this.boostMult = 1.5;
        } else {
            // default to 20% for general type boosters
            this.boostMult = itemBoosts[item.key] || 1.2;
        }
    }

    public offensiveMultiplier(
        multipliers: DamageMultipliers,
        move: MoveData,
        user: PartyPokemon,
        target: PartyPokemon,
        battleState: BattleState
    ): DamageMultipliers {
        if (this.boostedTypes.some((t) => move.move.getType(user, battleState).id === t.id)) {
            multipliers.base_damage_multiplier *= this.boostMult;
        }
        return multipliers;
    }

    static itemIds = Object.keys(itemTypes);
}
