import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { LoadedAbility } from "@/preload/loadedDataClasses";
import { BattleState } from "../battleState";
import { PartyPokemon } from "../types/PartyPokemon";
import { Stats } from "./Pokemon";
import { PokemonType } from "./PokemonType";

export class Ability {
    id: string = "";
    name: string = "";
    description: string = "";
    flags: string[] = [];
    isSignature: boolean = false;

    static NULL: Ability = null!;

    constructor(loaded?: LoadedAbility) {
        if (!loaded) return;

        this.id = loaded.key;
        this.name = loaded.name;
        this.description = loaded.description;
        this.flags = loaded.flags;
        this.isSignature = loaded.isSignature;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public modifiedMatchup(type: PokemonType) {
        return 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public modifyStats(stats: Stats, battleState?: BattleState) {
        return stats;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public movePowerMultiplier(move: MoveData, user: PartyPokemon, target: PartyPokemon, battleState: BattleState): number {
        return 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public attackMultiplier(move: MoveData, user: PartyPokemon, battleState: BattleState): number {
        return 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public defensiveMultiplier(move: MoveData, user: PartyPokemon, target: PartyPokemon, battleState: BattleState, typeEffectMult: number): number {
        return 1;
    }

    public hasSunSynergy() {
        return this.flags.includes("SunshineSynergy");
    }

    public hasRainSynergy() {
        return this.flags.includes("RainstormSynergy");
    }

    public hasHailSynergy() {
        return this.flags.includes("HailSynergy");
    }

    public hasSandSynergy() {
        return this.flags.includes("SandstormSynergy");
    }

    public hasEclipseSynergy() {
        return this.flags.includes("EclipseSynergy");
    }

    public hasMoonglowSynergy() {
        return this.flags.includes("MoonglowSynergy");
    }

    public hasAllWeatherSynergy() {
        return this.flags.includes("AllWeatherSynergy");
    }

    static abilityIds: string[] = [];
}
