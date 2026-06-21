import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { Side } from "@/app/damagecalc/damageCalc";
import { BattleState } from "@/app/data/battleState";
import { LoadedMove } from "@/app/data/loadedDataClasses";
import { MoveTypeChangeAbility } from "../abilities/MoveTypeChangeAbility";
import { StatusEffect } from "../conditions";
import { CategoryChangingHerbItem } from "../items/CategoryChangingHerbItem";
import { TectonicData } from "../tectonic/TectonicData";
import { PartyPokemon } from "../types/PartyPokemon";
import { isNull } from "../util";
import { Stat } from "./Pokemon";
import { PokemonType } from "./PokemonType";

export const moveCategories = ["Physical", "Special", "Status", "Adaptive"] as const;

export type MoveCategory = (typeof moveCategories)[number];

export type MoveTarget =
    | "FoeSide"
    | "NearFoe"
    | "ClosestNearFoe"
    | "AllBattlers"
    | "Ally"
    | "UserAndAllies"
    | "UserSide"
    | "AllNearFoes"
    | "AllNearOthers"
    | "NearAlly"
    | "None"
    | "NearOther"
    | "BothSides"
    | "User"
    | "UserOrNearOther";

const spreadTargets: MoveTarget[] = ["AllBattlers", "AllNearFoes", "AllNearOthers", "BothSides", "FoeSide"];

const displayableMoveFlags = new Set<string>();
displayableMoveFlags.add("Sound");
displayableMoveFlags.add("Punch");
displayableMoveFlags.add("Dance");
displayableMoveFlags.add("Blade");
// updated name for Blade tag on dev
displayableMoveFlags.add("Slice");
displayableMoveFlags.add("Biting");
displayableMoveFlags.add("Bite");
// kicking/kick has different tag names on live and dev
// this will expose inconsistencies on live but better than missing tags
displayableMoveFlags.add("Kicking");
displayableMoveFlags.add("Kick");
displayableMoveFlags.add("Pulse");
displayableMoveFlags.add("Wind");
displayableMoveFlags.add("Foretold");
displayableMoveFlags.add("Light");

export class Move {
    id: string = "";
    name: string = "";
    description: string = "";
    functionCode: string = "";
    type: PokemonType = TectonicData.types["NORMAL"];
    bp: number = 0;
    accuracy: number = 0;
    pp: number = 0;
    priority?: number;
    category: MoveCategory = "Status";
    target: MoveTarget = "User";
    customVarName?: string;
    customVarType?: string;
    needsInput: boolean = false;
    isSignature: boolean = false;
    flags: string[] = [];

    static NULL: Move = null!;

    constructor(loaded?: LoadedMove) {
        if (!loaded) return;

        this.id = loaded.key;
        this.name = loaded.name;
        this.description = loaded.description;
        this.functionCode = loaded.functionCode;
        this.type = TectonicData.types[loaded.type];
        this.bp = loaded.power;
        this.accuracy = loaded.accuracy;
        this.pp = loaded.pp;
        this.priority = loaded.priority;
        this.category = loaded.category as MoveCategory;
        this.target = loaded.target as MoveTarget;
        this.isSignature = loaded.isSignature;
        this.flags = loaded.flags;
    }

    public isAttackingMove() {
        return !isNull(this) && this.category !== "Status";
    }

    public isSpread(): boolean {
        return spreadTargets.indexOf(this.target) > -1;
    }

    public isRecoil(): boolean {
        // lazy hack
        return this.functionCode.includes("Recoil");
    }

    public isBind(): boolean {
        //  i think this is always BindTarget3
        return this.functionCode.includes("BindTarget");
    }

    bypassesProtect: boolean = false;
    hitsFliers: boolean = false;
    ignoresScreens: boolean = false;
    ignoresTargetAbility: boolean = false;
    criticalMultiplier: number = 1.5;

    public getTargetPositions(): boolean[][] {
        // Format is [[Foe, Foe], [User, Ally]]
        switch (this.target) {
            case "FoeSide":
            case "NearFoe":
            case "AllNearFoes":
            case "ClosestNearFoe":
            case "NearOther":
                return [
                    [true, true],
                    [false, false],
                ];
            case "UserSide":
            case "UserAndAllies":
                return [
                    [false, false],
                    [true, true],
                ];
            case "UserOrNearOther":
            case "AllNearOthers":
            case "AllBattlers":
            case "BothSides":
                return [
                    [true, true],
                    [true, true],
                ];
            case "Ally":
            case "NearAlly":
                return [
                    [false, false],
                    [false, true],
                ];
            case "User":
                return [
                    [false, false],
                    [true, false],
                ];
            case "None":
            default:
                return [
                    [false, false],
                    [false, false],
                ];
        }
    }

    public isSTAB(mon: PartyPokemon, battleState: BattleState): boolean {
        // bit of a hack but should always match the pokemon's type
        if (this.type?.id === "FLEX") return true;
        const moveType = this.getType(mon, battleState);
        return (
            moveType &&
            (mon.types.type1 === moveType ||
                mon.types.type2 === moveType ||
                mon.getActiveAbilities().some((a) => a.extraType?.id === moveType.id))
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getPower(user: PartyPokemon, target: PartyPokemon, battleState: BattleState, customVar: unknown): number {
        // TODO: Implement BP variance for relevant moves
        return this.bp;
    }

    // Override in subclasses to bypass the damage formula and return a fixed damage value
    public getFixedDamage(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        user: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        target: PartyPokemon,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        battleState: BattleState,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        customVar: unknown,
    ): number | null {
        return null;
    }

    // Override in subclasses to provide context-aware default values for customVar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getDefaultCustomVar(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): unknown {
        return undefined;
    }

    // to be extended by subclasses
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getType(user: PartyPokemon, battleState: BattleState): PokemonType {
        // Check all active abilities for type-changing effects (supports Fragile Locket)
        for (const ability of user.getActiveAbilities()) {
            if (ability instanceof MoveTypeChangeAbility && ability.shouldChangeType(this)) {
                return ability.moveType;
            }
        }
        const type = this.type;
        if (type.id === "FLEX") {
            return user.types.type1;
        }
        return type;
    }

    // to be extended by subclasses
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public ignoreStatus(effect: StatusEffect): boolean {
        return false;
    }

    public getAttackingStat(category: "Physical" | "Special"): Stat {
        return category === "Physical" ? "attack" : "spatk";
    }

    public getDefendingStat(category: "Physical" | "Special"): Stat {
        return category === "Physical" ? "defense" : "spdef";
    }

    // overridden by subclasses (e.g. SuperAdaptiveMove) that resolve category differently
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getTrueCategory(move: MoveData, user: PartyPokemon, target: PartyPokemon): "Physical" | "Special" {
        if (this.category === "Adaptive") {
            if (user.getStats(move, "player").attack >= user.getStats(move, "player").spatk) {
                return "Physical";
            }
            return "Special";
        }
        if (this.category === "Status") {
            // lazy typeguard
            throw new Error("Status moves shouldn't be selectable!");
        }
        return this.category;
    }

    // applies item-based category changes (e.g. Strength/Intellect Herb) on top of the true category
    public getDamageCategory(move: MoveData, user: PartyPokemon, target: PartyPokemon): "Physical" | "Special" {
        const trueCategory = this.getTrueCategory(move, user, target);
        const herb = user.items.find((i) => i instanceof CategoryChangingHerbItem);
        if (herb && trueCategory === herb.inputCategory) {
            return herb.outputCategory;
        }
        return trueCategory;
    }

    public getAttackStatSide(): Side {
        return "player";
    }

    public forceCrit(user: PartyPokemon, target: PartyPokemon, battleState: BattleState): boolean {
        return user.getActiveAbilities().some((a) => a.forceCrit(user, target, battleState));
    }

    public getCategoryImgSrc(): string {
        return Move.getMoveCategoryImgSrc(this.category);
    }

    public getDisplayFlags(sep: string = ","): string {
        return this.flags.filter((x) => displayableMoveFlags.has(x)).join(sep);
    }

    public static getMoveCategoryImgSrc(cat: MoveCategory): string {
        return `/move_categories/${cat}.png`;
    }

    static moveCodes: string[] = [];
}
