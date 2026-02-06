import { MoveData } from "@/app/damagecalc/components/MoveCard";
import { Side } from "@/app/damagecalc/damageCalc";
import { TwoItemAbility } from "../abilities/TwoItemAbility";
import { StatusEffect, VolatileStatusEffect, volatileStatusEffects } from "../conditions";
import { FragileLocketItem } from "../items/FragileLocketItem";
import { TypeChangingItem } from "../items/TypeChangingItem";
import { IgnoreStatMove } from "../moves/IgnoreStatMove";
import { calculateHP, calculateStat } from "../stats";
import { MAX_LEVEL } from "../teamExport";
import { Ability } from "../tectonic/Ability";
import { Item } from "../tectonic/Item";
import { Move } from "../tectonic/Move";
import { Pokemon, Stats, StylePoints, blankStats, defaultStylePoints } from "../tectonic/Pokemon";
import { PokemonType } from "../tectonic/PokemonType";
import { TectonicData } from "../tectonic/TectonicData";
import { isNull } from "../util";

export class PartyPokemon {
    species: Pokemon;
    moves: Move[];
    ability: Ability;
    items: Item[];
    itemType: PokemonType;
    form: number;
    level: number;
    stylePoints: StylePoints;
    nickname: string | undefined = undefined;
    statSteps: Stats;
    statusEffect: StatusEffect;
    volatileStatusEffects: Record<VolatileStatusEffect, boolean>;

    constructor(data?: Partial<PartyPokemon>) {
        this.species = data?.species || Pokemon.NULL;
        this.moves = data?.moves || Array(4).fill(Move.NULL);
        this.ability = data?.ability || data?.species?.abilities?.find((a) => a && a != Ability.NULL) || Ability.NULL;
        this.items = data?.items || Array(2).fill(Item.NULL);
        this.itemType = data?.itemType || TectonicData.types["NORMAL"];
        this.form = data?.form || Pokemon.NULL.formId;
        this.level = data?.level == 0 ? 0 : data?.level || MAX_LEVEL;
        this.stylePoints = data?.stylePoints || defaultStylePoints;
        this.nickname = data?.nickname;
        this.statSteps = data?.statSteps || blankStats;
        this.statusEffect = data?.statusEffect ?? "None";
        this.volatileStatusEffects =
            data?.volatileStatusEffects ||
            (Object.fromEntries(volatileStatusEffects.map((e) => [e, false])) as Record<VolatileStatusEffect, boolean>);
    }

    public hasFragileLocket(): boolean {
        return this.items.some((i) => i instanceof FragileLocketItem);
    }

    public getSecondaryAbility(): Ability | null {
        const abilities = this.species?.getAbilities?.(this.form) || [];
        const other = abilities.find((a) => a && a != Ability.NULL && a.id !== this.ability.id);
        return other || null;
    }

    public getActiveAbilities(): Ability[] {
        if (this.statusEffect === "Dizzy") {
            return [];
        }
        if (this.hasFragileLocket()) {
            const secondary = this.getSecondaryAbility();
            if (secondary) {
                return [this.ability, secondary];
            }
        }
        return [this.ability];
    }

    // modify base stats separately so they can be shown on the UI
    public getBaseStats(): Stats {
        let stats = this.species.getStats(this.form);
        for (const item of this.items) {
            stats = item.baseStats(stats);
        }
        return stats;
    }

    public getStats(move?: MoveData, side?: Side): Stats {
        const activeAbilities = this.getActiveAbilities();
        const stylish = activeAbilities.some((a) => a.id === "STYLISH");
        const accumulation = activeAbilities.some((a) => a.id === "ACCUMULATION");
        const steps = { ...this.statSteps };
        if (move?.criticalHit) {
            // crits ignore player attack drops
            if (side === "player") {
                steps.attack = Math.max(0, steps.attack);
                steps.spatk = Math.max(0, steps.spatk);
            }
            // crits ignore defender defense ups
            if (side === "opponent") {
                steps.defense = Math.min(0, steps.defense);
                steps.spdef = Math.min(0, steps.defense);
            }
        }
        if (move?.move instanceof IgnoreStatMove && side === "opponent") {
            for (const stat of move.move.ignoreStats) {
                steps[stat] = Math.min(0, steps[stat]);
            }
        }

        const stats = this.getBaseStats();

        let speed = calculateStat(stats.speed, this.level, this.stylePoints.speed, steps.speed, stylish, accumulation);
        // TODO: abilities probably can sometimes affect this
        if (this.statusEffect === "Numb") {
            speed = speed / 2;
        }

        let calculatedStats: Stats = {
            hp: calculateHP(stats.hp, this.level, this.stylePoints.hp, stylish, accumulation),
            attack: calculateStat(
                stats.attack,
                this.level,
                this.stylePoints.attacks,
                steps.attack,
                stylish,
                accumulation,
            ),
            defense: calculateStat(
                stats.defense,
                this.level,
                this.stylePoints.defense,
                steps.defense,
                stylish,
                accumulation,
            ),
            spatk: calculateStat(stats.spatk, this.level, this.stylePoints.attacks, steps.spatk, stylish, accumulation),
            spdef: calculateStat(stats.spdef, this.level, this.stylePoints.spdef, steps.spdef, stylish, accumulation),
            speed,
        };

        for (const item of this.items) {
            calculatedStats = item.modifyStats(calculatedStats);
        }

        for (const ability of this.getActiveAbilities()) {
            calculatedStats = ability.modifyStats(calculatedStats);
        }

        return calculatedStats;
    }

    hasTypeChangingItemAndCanChangeType(): boolean {
        return this.items.some((i) => i instanceof TypeChangingItem && i.canChangeType(this)) && !isNull(this.itemType);
    }

    get types(): { type1: PokemonType; type2?: PokemonType } {
        if (this.hasTypeChangingItemAndCanChangeType()) {
            return { type1: this.itemType };
        }
        return { type1: this.species.getType1(this.form), type2: this.species.getType2(this.form) };
    }

    // Only allow selecting items that maintain the legality constraint
    public legalItems(index: number): Item[] {
        if (this.ability instanceof TwoItemAbility) {
            return TectonicData.heldItems.filter((i) => {
                const newItems = [...this.items];
                newItems[index] = i;
                return (this.ability as TwoItemAbility).validateItems(newItems);
            });
        }
        return TectonicData.heldItems;
    }
}
