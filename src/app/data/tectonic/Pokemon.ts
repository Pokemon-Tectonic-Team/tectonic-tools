import { LoadedPokemon, PokemonEvolutionTerms } from "@/app/data/loadedDataClasses";
import { calculateHP, calculateStat } from "../stats";
import { TectonicData } from "../tectonic/TectonicData";
import { NTreeArrayNode, NTreeNode } from "../types/NTreeNode";
import { uniq } from "../util";
import { Ability } from "./Ability";
import { Item } from "./Item";
import { Move } from "./Move";
import { PokemonType } from "./PokemonType";
import { Tribe } from "./Tribe";

export interface Stats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spatk: number;
    spdef: number;
}

export type Stat = keyof Stats;

export const blankStats: Stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    spatk: 0,
    spdef: 0,
};

export interface StylePoints {
    hp: number;
    attacks: number;
    defense: number;
    spdef: number;
    speed: number;
}

export const defaultStylePoints: StylePoints = {
    hp: 10,
    attacks: 10,
    defense: 10,
    spdef: 10,
    speed: 10,
};

export const zeroStylePoints: StylePoints = {
    hp: 0,
    attacks: 0,
    defense: 0,
    spdef: 0,
    speed: 0,
};

function getterFactory<T extends keyof Pokemon, R>(
    mon: Pokemon,
    key: T,
    isNull: (value: R) => boolean,
): (form: number) => R {
    return function (form: number = 0): R {
        if (
            form !== 0 &&
            form in mon.forms &&
            mon.forms[form][key] !== undefined &&
            !isNull(mon.forms[form][key] as R)
        ) {
            return mon.forms[form][key] as R;
        }
        return mon[key] as R;
    };
}

const EHP_LEVEL = 50;
const DEFAULT_STYLE_VALUE = 10;

export class Pokemon {
    id: string = "";
    dex: number = 0;
    name: string = "";
    formId: number = 0;
    formName?: string;
    type1: PokemonType = TectonicData.types["NORMAL"];
    type2?: PokemonType;
    stats: Stats = blankStats;
    abilities: Ability[] = [];
    levelMoves: [number, Move][] = [];
    lineMoves: Move[] = [];
    tutorMoves: Move[] = [];
    tribes: Tribe[] = [];
    height: number = 0;
    weight: number = 0;
    kind: string = "";
    pokedex: string = "";
    forms: Pokemon[] = [];
    items: [Item, number][] = [];
    uniqueItems: Item[] = [];
    flags: string[] = [];
    evolutionTree: NTreeNode<PokemonEvolutionTerms> = null!;

    static NULL: Pokemon = null!;

    constructor(loaded?: LoadedPokemon) {
        if (!loaded) return;

        this.id = loaded.key;
        this.dex = loaded.dexNum;
        this.name = loaded.name;
        this.formName = loaded.formName;
        this.type1 = TectonicData.types[loaded.type1];
        this.type2 = loaded.type2 ? TectonicData.types[loaded.type2] : undefined;
        this.stats = {
            hp: loaded.hp,
            attack: loaded.attack,
            spatk: loaded.spAttack,
            speed: loaded.speed,
            defense: loaded.defense,
            spdef: loaded.spDefense,
        };
        this.abilities = loaded.abilities.map((a) => TectonicData.abilities[a]);
        this.levelMoves = loaded.levelMoves.map((levelMove) => [levelMove.level, TectonicData.moves[levelMove.move]]);
        this.lineMoves = loaded.lineMoves.map((m) => TectonicData.moves[m]);
        this.tutorMoves = loaded.tutorMoves.map((m) => TectonicData.moves[m]);
        this.tribes = loaded.tribes.map((t) => TectonicData.tribes[t]);
        this.height = loaded.height;
        this.weight = loaded.weight;
        this.kind = loaded.kind;
        this.pokedex = loaded.pokedex;
        this.items = loaded.wildItems.map((i) => [TectonicData.items[i.item], i.chance]);
        this.uniqueItems = uniq(this.items.map((x) => x[0]));
        this.flags = loaded.flags;
        this.evolutionTree = NTreeArrayNode.buildTree(loaded.evolutionTreeArray!);
    }

    static loadForm(loaded: LoadedPokemon): Pokemon {
        const form = new Pokemon();

        form.id = loaded.key;
        form.dex = loaded.dexNum;
        form.name = loaded.name;
        form.formId = loaded.formId;
        form.formName = loaded.formName;
        form.type1 = loaded.type1 !== "" ? TectonicData.types[loaded.type1] : PokemonType.NULL;
        form.type2 = loaded.type2 ? TectonicData.types[loaded.type2] : undefined;
        form.abilities = loaded.abilities.map((a) => TectonicData.abilities[a]);
        form.levelMoves = loaded.levelMoves.map((levelMove) => [levelMove.level, TectonicData.moves[levelMove.move]]);
        form.stats = {
            hp: loaded.hp,
            attack: loaded.attack,
            spatk: loaded.spAttack,
            speed: loaded.speed,
            defense: loaded.defense,
            spdef: loaded.spDefense,
        };
        form.tribes = loaded.tribes.map((t) => TectonicData.tribes[t]);
        form.height = loaded.height;
        form.weight = loaded.weight;
        form.kind = loaded.kind;
        form.pokedex = loaded.pokedex;

        return form;
    }

    public addForms(forms: Pokemon[]) {
        this.forms = this.forms.concat(forms);
    }

    get tutorableMoves(): Move[] {
        const moveList = [];
        if (this.flags.includes("TutorAny")) {
            moveList.push(...TectonicData.moveFilterCaches.nonSignatureMoves);
        } else {
            if (!this.flags.includes("NoStaples")) {
                moveList.push(...TectonicData.moveFilterCaches.stapleMoves);
            }
            moveList.push(...this.lineMoves);
            moveList.push(...this.tutorMoves);
        }
        return uniq(moveList);
    }

    public allMoves(currentForm: number = 0): Move[] {
        const moveList = this.getLevelMoves(currentForm).map((m) => m[1]);
        moveList.push(...this.tutorableMoves);
        return uniq(moveList);
    }

    public hasType(type: PokemonType): boolean {
        return this.type1 === type || this.type2 === type;
    }

    public BST(currentForm: number = 0): number {
        const stats = this.getStats(currentForm);
        return stats.hp + stats.attack + stats.defense + stats.spatk + stats.spdef + stats.speed;
    }

    public getEvoNode(): NTreeNode<PokemonEvolutionTerms> {
        return this.evolutionTree.findDepthFirst((node) => node.getData().pokemon == this.id)!;
    }

    public getFormName = getterFactory(this, "formName", (value: string) => value === "");
    public getType1 = getterFactory(this, "type1", (value: PokemonType) => value === PokemonType.NULL);
    public getType2 = getterFactory(this, "type2", (value: PokemonType) => value === PokemonType.NULL);
    public getAbilities = getterFactory(this, "abilities", (value: Ability[]) => value.length === 0);
    public getStats = getterFactory(this, "stats", (value: Stats) => value.hp === blankStats.hp); // Nothing should have 0 hp, so if it is 0 then it must not have been set
    public getPokedex = getterFactory(this, "pokedex", (value: string) => value === "");
    public getLevelMoves = getterFactory(this, "levelMoves", (value: [number, Move][]) => value.length === 0);

    public getPEHP(currentForm: number = 0) {
        const stats = this.getStats(currentForm);
        const defStat = stats.defense;
        const hpValue = calculateHP(stats.hp, EHP_LEVEL, DEFAULT_STYLE_VALUE);
        const defValue = calculateStat(defStat, EHP_LEVEL, DEFAULT_STYLE_VALUE);
        return Math.max(Math.round((hpValue * defValue) / 100), 1);
    }

    public getSEHP(currentForm: number = 0) {
        const stats = this.getStats(currentForm);
        const defStat = stats.spdef;
        const hpValue = calculateHP(stats.hp, EHP_LEVEL, DEFAULT_STYLE_VALUE);
        const defValue = calculateStat(defStat, EHP_LEVEL, DEFAULT_STYLE_VALUE);
        return Math.max(Math.round((hpValue * defValue) / 100), 1);
    }

    public getImage(currentForm: number = 0) {
        return "/Pokemon/" + this.id + (currentForm > 0 ? "_" + this.forms[currentForm].formId : "") + ".png";
    }

    public getIcon(currentForm: number = 0) {
        return "/PokemonIcons/" + this.id + (currentForm > 0 ? "_" + this.forms[currentForm].formId : "") + ".png";
    }
}
