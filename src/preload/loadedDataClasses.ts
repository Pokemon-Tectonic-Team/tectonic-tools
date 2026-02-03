import { NTreeArrayNode, NTreeNode } from "@/app/data/types/NTreeNode";
import { uniq } from "@/app/data/util";

// Note that the extending classes use statics in order to avoid fields from showing up in the output JSON
export abstract class LoadedData<SubClass extends LoadedData<SubClass>> {
    static bracketKeyName: string = "Bracketvalue";
    static commaDeliminatedLine: string = "CommaLine";
    static completedLoading: string = "completedLoading";

    key: string = "";

    static populate<T extends LoadedData<T>>(
        version: string,
        self: T,
        populateMap: Record<string, (version: string, self: T, value: string) => void>,
        pairs: KVPair[]
    ): T {
        pairs.forEach((pair) => {
            if (pair.key in populateMap) {
                populateMap[pair.key](version, self, pair.value);
            }
        });

        if (LoadedData.completedLoading in populateMap) {
            populateMap[LoadedData.completedLoading](version, self, "");
        }
        return self;
    }
}

export class PokemonEvolutionTerms {
    pokemon: string;
    method: string;
    condition: string;

    constructor(pokemon: string, method: string, condition: string) {
        this.pokemon = pokemon;
        this.method = method;
        this.condition = condition;
    }
}

export class LoadedWildHeldItem {
    item: string;
    chance: number;

    constructor(item: string, chance: number) {
        this.item = item;
        this.chance = chance;
    }
}

export class LoadedPokemonLevelMove {
    level: number;
    move: string;

    constructor(level: number, move: string) {
        this.level = level;
        this.move = move;
    }
}

export class LoadedType extends LoadedData<LoadedType> {
    index: number = -1;
    name: string = "";
    weaknesses: string = "";
    resistances: string = "";
    immunities: string = "";
    isRealType: boolean = true;

    static populateMap: Record<string, (version: string, self: LoadedType, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => (self.index = parseInt(value));
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["InternalName"] = (_, self, value) => (self.key = value);
        this.populateMap["Weaknesses"] = (_, self, value) => (self.weaknesses = value);
        this.populateMap["Resistances"] = (_, self, value) => (self.resistances = value);
        this.populateMap["Immunities"] = (_, self, value) => (self.immunities = value);
        this.populateMap["IsPseudoType"] = (_, self) => (self.isRealType = false);
    }
}

export class LoadedTribe extends LoadedData<LoadedTribe> {
    activationCount: number = 5;
    name: string = "";
    description: string = "";

    static populateMap: Record<string, (version: string, self: LoadedTribe, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.commaDeliminatedLine] = (version, self, value) => {
            function getDesc(startIndex: number): string {
                // The description may have commas, but is at the end. So join the whole thing
                return split
                    .slice(startIndex)
                    .join()
                    .replaceAll('"', "")
                    .replaceAll(" and is currently {b}", "")
                    .replaceAll(" and is currently {b1}", "");
            }

            const split = value.split(",");
            self.key = split[0];
            self.activationCount = parseInt(split[1]);

            if (version.startsWith("3.2")) {
                self.name = self.key[0] + self.key.substring(1).toLowerCase();
                self.description = getDesc(2);
            } else {
                self.name = split[2];
                self.description = getDesc(3);
            }
        };
    }
}

export class LoadedAbility extends LoadedData<LoadedAbility> {
    name: string = "";
    description: string = "";
    flags: string[] = [];
    isSignature: boolean = false;

    static populateMap: Record<string, (version: string, self: LoadedAbility, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => (self.key = value);
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["Description"] = (_, self, value) => (self.description = value);
        this.populateMap["Flags"] = (_, self, value) => (self.flags = value.split(","));
    }
}

export class LoadedMove extends LoadedData<LoadedMove> {
    name: string = "";
    description: string = "";
    type: string = "";
    category: string = "";
    power: number = 0;
    accuracy: number = 0;
    pp: number = 0;
    target: string = "";
    functionCode: string = "";
    effectChance?: number;
    priority?: number;
    flags: string[] = [];
    isSignature: boolean = false;

    static populateMap: Record<string, (version: string, self: LoadedMove, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => (self.key = value);
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["Description"] = (_, self, value) => (self.description = value);
        this.populateMap["Type"] = (_, self, value) => (self.type = value);
        this.populateMap["Category"] = (_, self, value) => (self.category = value);
        this.populateMap["Power"] = (_, self, value) => (self.power = parseInt(value));
        this.populateMap["Accuracy"] = (_, self, value) => (self.accuracy = parseInt(value));
        this.populateMap["TotalPP"] = (_, self, value) => (self.pp = parseInt(value));
        this.populateMap["Target"] = (_, self, value) => (self.target = value);
        this.populateMap["FunctionCode"] = (_, self, value) => (self.functionCode = value);
        this.populateMap["EffectChance"] = (_, self, value) => (self.effectChance = parseInt(value));
        this.populateMap["Priority"] = (_, self, value) => (self.priority = parseInt(value));
        this.populateMap["Flags"] = (_, self, value) => (self.flags = value.split(","));
    }
}

export class LoadedItem extends LoadedData<LoadedItem> {
    name: string = "";
    description: string = "";
    pocket: number = 0; // 5 = held items, 4 = tms
    flags: string[] = [];
    move?: string; // Used by Tms

    static populateMap: Record<string, (version: string, self: LoadedItem, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => (self.key = value);
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["Description"] = (_, self, value) => (self.description = value);
        this.populateMap["Pocket"] = (_, self, value) => (self.pocket = parseInt(value));
        this.populateMap["Flags"] = (_, self, value) => (self.flags = value.split(","));
        this.populateMap["Move"] = (_, self, value) => (self.move = value);
    }
}

export class LoadedPokemon extends LoadedData<LoadedPokemon> {
    static WILD_ITEM_CHANCE_COMMON = 35;
    static WILD_ITEM_CHANCE_UNCOMMON = 10;
    static WILD_ITEM_CHANCE_RARE = 2;

    static formMoves: Record<string, (string | undefined)[]> = {
        ROTOM: [undefined, "OVERHEAT", "HYDROPUMP", "BLIZZARD", "AIRSLASH", "LEAFSTORM"],
        URSHIFU: ["WICKEDBLOW", "SURGINGSTRIKES"],
        NECROZMA: [undefined, "SUNSTEELSTRIKE", "MOONGEISTBEAM"],
    };

    name: string = "";
    dexNum: number = 0;
    formId: number = 0;
    formName?: string;
    type1: string = "";
    type2?: string;
    height: number = 0;
    weight: number = 0;
    hp: number = 0;
    attack: number = 0;
    defense: number = 0;
    speed: number = 0;
    spAttack: number = 0;
    spDefense: number = 0;
    bst: number = 0;
    abilities: string[] = [];
    levelMoves: LoadedPokemonLevelMove[] = [];
    lineMoves: string[] = [];
    tutorMoves: string[] = [];
    formSpecificMoves: (string | undefined)[] = [];
    tribes: string[] = [];
    wildItems: LoadedWildHeldItem[] = [];
    kind: string = "";
    pokedex: string = "";
    flags: string[] = [];
    evolutions: PokemonEvolutionTerms[] = [];
    evolutionTree?: NTreeNode<PokemonEvolutionTerms>; // Requires post-load propagation
    evolutionTreeArray?: NTreeArrayNode<PokemonEvolutionTerms>[]; // Pre-write

    static populateMap: Record<string, (version: string, self: LoadedPokemon, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (version, self, value) => {
            if (version.startsWith("3.2") && !value.includes(",")) self.dexNum = parseInt(value);
            else self.key = value;
        };
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["FormName"] = (_, self, value) => (self.formName = value);
        this.populateMap["InternalName"] = (version, self, value) => {
            if (version.startsWith("3.2")) self.key = value;
        };
        this.populateMap["Type1"] = (_, self, value) => (self.type1 = value);
        this.populateMap["Type2"] = (_, self, value) => (self.type2 = value);
        this.populateMap["Height"] = (_, self, value) => (self.height = parseFloat(value));
        this.populateMap["Weight"] = (_, self, value) => (self.weight = parseFloat(value));
        this.populateMap["BaseStats"] = (_, self, value) => {
            const stats = value.split(",");
            self.hp = parseInt(stats[0]);
            self.attack = parseInt(stats[1]);
            self.defense = parseInt(stats[2]);
            self.speed = parseInt(stats[3]);
            self.spAttack = parseInt(stats[4]);
            self.spDefense = parseInt(stats[5]);
            self.bst = self.hp + self.attack + self.defense + self.speed + self.spAttack + self.spDefense;
        };
        this.populateMap["Abilities"] = (_, self, value) => (self.abilities = value.split(","));
        this.populateMap["Moves"] = (_, self, value) => {
            const moveSplit = value.split(",");
            for (let i = 0; i < moveSplit.length; i += 2) {
                self.levelMoves.push(new LoadedPokemonLevelMove(parseInt(moveSplit[i]), moveSplit[i + 1]));
            }
        };
        this.populateMap["LineMoves"] = (_, self, value) => (self.lineMoves = value.split(","));
        this.populateMap["TutorMoves"] = (_, self, value) => (self.tutorMoves = value.split(","));
        this.populateMap["Tribes"] = (_, self, value) => (self.tribes = value.split(","));
        this.populateMap["WildItemCommon"] = (_, self, value) =>
            self.wildItems.push(new LoadedWildHeldItem(value, LoadedPokemon.WILD_ITEM_CHANCE_COMMON));
        this.populateMap["WildItemUncommon"] = (_, self, value) =>
            self.wildItems.push(new LoadedWildHeldItem(value, LoadedPokemon.WILD_ITEM_CHANCE_UNCOMMON));
        this.populateMap["WildItemRare"] = (_, self, value) =>
            self.wildItems.push(new LoadedWildHeldItem(value, LoadedPokemon.WILD_ITEM_CHANCE_RARE));
        this.populateMap["Kind"] = (_, self, value) => (self.kind = value);
        this.populateMap["Pokedex"] = (_, self, value) => (self.pokedex = value);
        this.populateMap["Flags"] = (_, self, value) => (self.flags = value.split(","));
        this.populateMap["Evolutions"] = (_, self, value) => {
            const evoSplit = value.split(",");
            for (let i = 0; i < evoSplit.length; i += 3) {
                self.evolutions.push(new PokemonEvolutionTerms(evoSplit[i], evoSplit[i + 1], evoSplit[i + 2]));
            }
        };
        this.populateMap[LoadedData.completedLoading] = (_, self) =>
            (self.formSpecificMoves = self.key in LoadedPokemon.formMoves ? LoadedPokemon.formMoves[self.key] : []);
    }

    static postProcessKeyForFormEntry(self: LoadedPokemon) {
        const terms = self.key.split(",");
        self.key = terms[0];
        self.formId = parseInt(terms[1]);
    }

    static getAllMoves(self: LoadedPokemon, stapleMoves: string[]): string[] {
        let moves: Array<string | undefined> = [];
        // on dev, we push staple moves first if appropriate. outside of dev, no moves will be staple so this is fine
        moves = moves.concat(stapleMoves);
        // in Tectonic, we first push egg moves here, but that is a leftover from Pokemon Essentials defaults I think

        // TODO: Double check how this worked before the removal of tutormoves. Currently assuming.
        // On dev, when it's empty, this will do nothing and be fine
        moves = moves.concat(self.tutorMoves);
        moves = moves.concat(self.lineMoves);
        moves = moves.concat(self.formSpecificMoves);
        moves = moves.concat(self.levelMoves.map((m) => m.move));
        moves = uniq(moves);
        const finalMoves: string[] = moves.filter((m) => m !== undefined);
        return finalMoves;
    }
}

export class LoadedTrainerType extends LoadedData<LoadedTrainerType> {
    name: string = "";
    gender: string = "";
    baseMoney: number = 0;
    introBGM?: string;
    battleBGM?: string;

    static populateMap: Record<string, (version: string, self: LoadedTrainerType, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => (self.key = value);
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["BaseMoney"] = (_, self, value) => (self.baseMoney = parseInt(value));
        this.populateMap["IntroBGM"] = (_, self, value) => (self.introBGM = value);
        this.populateMap["BattleBGM"] = (_, self, value) => (self.battleBGM = value);
    }
}

export class LoadedTrainerPokemon {
    id: string = "";
    level: number = 0;
    name?: string;
    gender?: string;
    moves: string[] = [];
    abilityIndex?: number;
    items: string[] = [];
    itemType?: string;
    sp: number[] = [];
}

export class LoadedTrainer extends LoadedData<LoadedTrainer> {
    class: string = "";
    name: string = "";
    version?: number;
    nameForHashing?: string;
    typeLabel?: string;
    extendsVersion?: number;
    policies: string[] = [];
    flags: string[] = [];
    pokemon: LoadedTrainerPokemon[] = [];
    currentPokemon: LoadedTrainerPokemon = new LoadedTrainerPokemon(); //Processing only

    static populateMap: Record<string, (version: string, self: LoadedTrainer, value: string) => void> = {};
    static {
        this.populateMap[LoadedData.bracketKeyName] = (_, self, value) => {
            const bracketTerms = value.split(",");
            self.key = value;
            self.class = bracketTerms[0];
            self.name = bracketTerms[1];
            if (bracketTerms.length > 2) {
                self.version = parseInt(bracketTerms[2]);
            }
        };
        this.populateMap["Name"] = (_, self, value) => (self.name = value);
        this.populateMap["NameForHashing"] = (_, self, value) => (self.nameForHashing = value);
        this.populateMap["TrainerTypeLabel"] = (_, self, value) => (self.typeLabel = value);
        this.populateMap["ExtendsVersion"] = (_, self, value) => (self.extendsVersion = parseInt(value));
        this.populateMap["Policies"] = (_, self, value) => (self.policies = value.split(","));
        this.populateMap["Flags"] = (_, self, value) => (self.flags = value.split(","));
        this.populateMap["Pokemon"] = (_, self, value) => {
            if (self.currentPokemon.id !== "") {
                self.pokemon.push({ ...self.currentPokemon });
                self.currentPokemon = new LoadedTrainerPokemon();
            }
            const monTerms = value.split(",");
            self.currentPokemon.id = monTerms[0];
            self.currentPokemon.level = parseInt(monTerms[1]);
        };
        this.populateMap["Name"] = (_, self, value) => (self.currentPokemon.name = value);
        this.populateMap["Gender"] = (_, self, value) => (self.currentPokemon.gender = value);
        this.populateMap["Moves"] = (_, self, value) => (self.currentPokemon.moves = value.split(","));
        this.populateMap["AbilityIndex"] = (_, self, value) => (self.currentPokemon.abilityIndex = parseInt(value));
        this.populateMap["Item"] = (_, self, value) =>
            (self.currentPokemon.items = self.currentPokemon.items.concat(value.split(",")));
        this.populateMap["ExtraItems"] = (_, self, value) =>
            (self.currentPokemon.items = self.currentPokemon.items.concat(value.split(",")));
        this.populateMap["ItemType"] = (_, self, value) => (self.currentPokemon.itemType = value);
        this.populateMap["EV"] = (_, self, value) =>
            (self.currentPokemon.sp = value.split(",").map((v) => parseInt(v)));
        this.populateMap[LoadedData.completedLoading] = (_, self) => {
            // Add last pokemon to array after processing completes
            if (self.currentPokemon.id !== "") {
                self.pokemon.push({ ...self.currentPokemon });
            }
        };
    }
}

export class KVPair {
    key: string;
    value: string;

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

export class RawEncounterTable {
    tableLine: string;
    encounterSplits: string[][] = [];

    constructor(tableLine: string = "") {
        this.tableLine = tableLine;
    }
}

export class RawEncounterMap {
    mapLine: string;
    tables: RawEncounterTable[] = [];

    constructor(mapLine: string = "") {
        this.mapLine = mapLine;
    }
}

export class LoadedEncounter {
    weight: number;
    pokemon: string;
    form?: number;
    minLevel: number; // Exact level for static encounters
    maxLevel?: number;

    constructor(raw: string[]) {
        const monFormSplit = raw[1].split("_"); // Forms are appended as _FORMID

        this.weight = parseInt(raw[0].trim());
        this.pokemon = monFormSplit[0];
        this.form = monFormSplit.length > 1 ? parseInt(monFormSplit[1]) : undefined;
        this.minLevel = parseInt(raw[2]);
        if (raw.length > 3) this.maxLevel = parseInt(raw[3]);
    }
}

export class LoadedEncounterTable {
    type: string;
    encounterRate?: number;
    levelCap: number = 0;
    encounters: LoadedEncounter[];

    constructor(raw: RawEncounterTable) {
        const tableTerms = raw.tableLine.split(",");

        this.type = tableTerms[0];
        if (tableTerms.length > 2) {
            this.encounterRate = parseInt(tableTerms[1]);
            this.levelCap = parseInt(tableTerms[2]);
        } else if (tableTerms.length > 1) {
            // Special encounters only have the level cap
            this.levelCap = parseInt(tableTerms[1]);
        }
        this.encounters = raw.encounterSplits.map((x) => new LoadedEncounter(x));
    }
}

export class LoadedEncounterMap {
    key: number;
    name: string;
    tables: LoadedEncounterTable[];

    constructor(raw: RawEncounterMap) {
        this.key = parseInt(raw.mapLine.split("]")[0].slice(1));
        this.name = raw.mapLine.split("#")[1].trim();
        this.tables = raw.tables.map((x) => new LoadedEncounterTable(x));
    }
}

export type LoadedDataJson = {
    version: string;
    types: Record<string, LoadedType>;
    tribes: Record<string, LoadedTribe>;
    abilities: Record<string, LoadedAbility>;
    moves: Record<string, LoadedMove>;
    items: Record<string, LoadedItem>;
    pokemon: Record<string, LoadedPokemon>;
    forms: Record<string, LoadedPokemon[]>;
    trainerTypes: Record<string, LoadedTrainerType>;
    trainers: Record<string, LoadedTrainer>;
    encounters: Record<string, LoadedEncounterMap>;
    typeChart: number[][];
};
