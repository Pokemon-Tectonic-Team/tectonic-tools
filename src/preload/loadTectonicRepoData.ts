import { NTreeNode } from "@/app/data/types/NTreeNode";
import { uniq } from "@/app/data/util";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
    LoadedAbility,
    LoadedDataJson,
    LoadedEncounterMap,
    LoadedItem,
    LoadedMove,
    LoadedPokemon,
    LoadedPokemonLevelMove,
    LoadedTrainer,
    LoadedTrainerType,
    LoadedTribe,
    LoadedType,
    PokemonEvolutionTerms,
} from "./loadedDataClasses";
import { parseEncounterFile, parseNewLineCommaFile, parseStandardFile, parseVersionFile } from "./tectonicFileParsers";

const PUBLIC_VERSION_COMMIT = "42cfc1eec6b52d2501376bc62ac85983f1ee8c03";

async function dataRead(filePath: string) {
    const basePath = path.join(__dirname, "../../public/data/");
    const fullPath = basePath + filePath;

    const fileData = await readFile(fullPath, "utf-8");
    return JSON.parse(fileData);
}

async function dataWrite<T>(filePath: string, contents: Record<string, T> | number[][] | string) {
    const basePath = path.join(__dirname, "../../public/data/");
    const fullPath = basePath + filePath;

    const output = typeof contents === "string" ? contents : JSON.stringify(contents);
    await writeFile(fullPath, output);
}

async function handleFiles<T>(paths: string[], processor: (files: string[]) => T, dev: boolean): Promise<T> {
    const baseUrl = dev
        ? "https://raw.githubusercontent.com/Pokemon-Tectonic-Team/Pokemon-Tectonic-Content/refs/heads/main/"
        : `https://raw.githubusercontent.com/Pokemon-Tectonic-Team/Pokemon-Tectonic/${PUBLIC_VERSION_COMMIT}/`;

    const responses = await Promise.all(paths.map((path) => fetch(baseUrl + path)));
    const files: string[] = [];
    for (const response of responses) {
        if (!response.ok) {
            throw new Error(`Fetching ${response.url} status: ${response.status}`);
        }

        files.push(await response.text());
    }

    return processor(files);
}

function propgatePokemonData(
    version: string,
    loadData: Record<string, LoadedPokemon>,
    formData: Record<string, LoadedPokemon[]>,
): void {
    // Propagate data not requiring the evo tree to be built
    Object.values(loadData).forEach((loadMon, index) => {
        function buildEvoTree(curNode: NTreeNode<PokemonEvolutionTerms>, cur: LoadedPokemon) {
            cur.evolutionTree = loadMon.evolutionTree;
            for (const evo of cur.evolutions) {
                buildEvoTree(curNode.addChild(evo), loadData[evo.pokemon]);
            }
        }

        loadMon.dexNum = index + 1;
        if (loadMon.evolutionTree) return;

        loadMon.evolutionTree = new NTreeNode(new PokemonEvolutionTerms(loadMon.key, "", ""));
        buildEvoTree(loadMon.evolutionTree, loadMon);
    });

    // Helper function to get the appropriate pre-evolution Pokemon or form
    function getPrevoForInheritance(currentMon: LoadedPokemon, prevoSpecies: string): LoadedPokemon {
        // If the current Pokemon is a form, try to find the corresponding form in the pre-evolution
        if (currentMon.formId > 0 && prevoSpecies in formData) {
            const prevoForms = formData[prevoSpecies];
            // Look for a matching formId in the pre-evolution's forms
            const matchingForm = prevoForms.find((f) => f.formId === currentMon.formId);
            // Only use the matching form if it has its own learnset (non-empty levelMoves)
            if (matchingForm && matchingForm.levelMoves.length > 0) {
                return matchingForm;
            }
        }
        // Otherwise, use the base form
        return loadData[prevoSpecies];
    }

    // Store original moves before propagation for forms to use
    const originalMoves = new Map<string, { levelMoves: LoadedPokemonLevelMove[]; lineMoves: string[] }>();
    Object.entries(loadData).forEach(([key, mon]) => {
        originalMoves.set(key, {
            levelMoves: [...mon.levelMoves],
            lineMoves: [...mon.lineMoves],
        });
    });

    // Propagate data requiring the evolution tree
    Object.values(loadData).forEach((loadMon) => {
        const evoNode = loadMon.evolutionTree?.findDepthFirst((x) => x.getData().pokemon == loadMon.key);
        if (!evoNode) return;

        const nodeWithTribes = evoNode.findBySelfAndParents((x) => loadData[x.getData().pokemon].tribes.length > 0);
        if (nodeWithTribes) {
            const tribes: string[] = [];
            nodeWithTribes.callSelfAndParents((x) => tribes.push(...loadData[x.getData().pokemon].tribes));
            loadMon.tribes = [...new Set(tribes)];
        }

        if (version.startsWith("3.2")) {
            const nodeWithMoves = evoNode.findBySelfAndParents(
                (x) => loadData[x.getData().pokemon].lineMoves.length > 0,
            );
            if (nodeWithMoves) {
                loadMon.lineMoves = loadData[nodeWithMoves.getData().pokemon].lineMoves;
            }
        } else if (!evoNode.isRoot()) {
            // Propogate moves when not the first evolution
            const prevoSpecies = evoNode.getParent()!.getData().pokemon;
            const prevo = getPrevoForInheritance(loadMon, prevoSpecies);
            loadMon.lineMoves = prevo.lineMoves.concat(loadMon.lineMoves);
            // Convert evolution-only moves (level 0) to level 1 when propagating from pre-evolution
            const prevoLevelMoves = prevo.levelMoves.map((m) =>
                m.level === 0 ? new LoadedPokemonLevelMove(1, m.move) : m,
            );
            loadMon.levelMoves = uniq(loadMon.levelMoves.concat(prevoLevelMoves)).sort((a, b) => a.level - b.level);
        }
    });

    // Propagate data for forms
    Object.entries(formData).forEach(([speciesKey, forms]) => {
        const baseSpecies = loadData[speciesKey];
        if (!baseSpecies || !baseSpecies.evolutionTree) return;

        forms.forEach((formMon) => {
            // Share the evolution tree with the base species
            formMon.evolutionTree = baseSpecies.evolutionTree;
            formMon.dexNum = baseSpecies.dexNum;

            if (!formMon.evolutionTree) return;
            const evoNode = formMon.evolutionTree.findDepthFirst((x) => x.getData().pokemon == formMon.key);
            if (!evoNode) return;

            // Propagate tribes
            const nodeWithTribes = evoNode.findBySelfAndParents((x) => loadData[x.getData().pokemon].tribes.length > 0);
            if (nodeWithTribes) {
                const tribes: string[] = [];
                nodeWithTribes.callSelfAndParents((x) => tribes.push(...loadData[x.getData().pokemon].tribes));
                formMon.tribes = [...new Set(tribes)];
            }

            // Propagate moves from pre-evolution
            if (!evoNode.isRoot()) {
                const prevoSpecies = evoNode.getParent()!.getData().pokemon;
                const prevo = getPrevoForInheritance(formMon, prevoSpecies);

                // Use ORIGINAL moves from base species (before it inherited from its pre-evolution)
                const originalBaseMoves = originalMoves.get(speciesKey);
                if (!originalBaseMoves) return;

                const baseMoves = originalBaseMoves.levelMoves;
                const baseLineMoves = originalBaseMoves.lineMoves;

                // Combine: original base moves + pre-evolution form moves + form-specific moves
                formMon.lineMoves = baseLineMoves.concat(prevo.lineMoves).concat(formMon.lineMoves);
                const prevoLevelMoves = prevo.levelMoves.map((m) =>
                    m.level === 0 ? new LoadedPokemonLevelMove(1, m.move) : m,
                );
                formMon.levelMoves = uniq(baseMoves.concat(prevoLevelMoves).concat(formMon.levelMoves)).sort(
                    (a, b) => a.level - b.level,
                );
            }
        });
    });
}

function propagateTrainerData(trainers: Record<string, LoadedTrainer>): void {
    for (const trainerId in trainers) {
        if (trainers[trainerId].extendsVersion !== undefined) {
            const key =
                trainers[trainerId].class +
                "," +
                trainers[trainerId].name +
                (trainers[trainerId].extendsVersion ? "," + trainers[trainerId].extendsVersion : "");
            const extendedTrainer = trainers[key];
            if (!extendedTrainer) {
                throw new Error("Undefined extended trainer " + key + "!");
            }
            trainers[trainerId].flags = extendedTrainer.flags.concat(trainers[trainerId].flags);

            // Build set of pokemon to remove (format: "SPECIES,LEVEL")
            const removeSet = new Set(trainers[trainerId].removePokemon ?? []);

            // Start with extended trainer's pokemon, filtering out any that should be removed
            const updatedPokemon = extendedTrainer.pokemon.filter(
                (p) => !removeSet.has(`${p.id},${p.level}`),
            );

            for (const pokemon of trainers[trainerId].pokemon) {
                const extendedPokemonIndex = updatedPokemon.findIndex((p) => p.id === pokemon.id);
                if (extendedPokemonIndex === -1) {
                    updatedPokemon.push(pokemon);
                } else {
                    const newPokemon = { ...updatedPokemon[extendedPokemonIndex] };
                    if (pokemon.abilityIndex) {
                        newPokemon.abilityIndex = pokemon.abilityIndex;
                    }
                    if (pokemon.itemType) {
                        newPokemon.itemType = pokemon.itemType;
                    }
                    if (pokemon.items.length > 0) {
                        newPokemon.items = pokemon.items;
                    }
                    if (pokemon.moves.length > 0) {
                        newPokemon.moves = pokemon.moves;
                    }
                    if (pokemon.sp.length > 0) {
                        newPokemon.sp = pokemon.sp;
                    }
                    updatedPokemon[extendedPokemonIndex] = newPokemon;
                }
            }
            trainers[trainerId].pokemon = updatedPokemon;
        }
    }
}

function propagateSignatures(data: LoadedDataJson, stapleMoves: string[]): void {
    const abilityCounts = Object.fromEntries(Object.keys(data.abilities).map((k) => [k, 0]));
    const moveCounts = Object.fromEntries(Object.keys(data.moves).map((k) => [k, 0]));

    // Count only values of final evolutions
    Object.values(data.pokemon)
        .filter((x) => x.evolutionTree!.findDepthFirst((e) => e.getData().pokemon == x.key)?.isLeaf())
        .forEach((x) => {
            x.abilities.forEach((a) => abilityCounts[a]++);
            LoadedPokemon.getAllMoves(x, stapleMoves).forEach((m) => moveCounts[m]++);
        });

    Object.entries(abilityCounts).forEach(([k, v]) => (data.abilities[k].isSignature = v <= 1));
    Object.entries(moveCounts).forEach(
        ([k, v]) => (data.moves[k].isSignature = v <= 1 || data.moves[k].flags.includes("ForceSignature")),
    );
}

function buildTypeChart(types: Record<string, LoadedType>): number[][] {
    const size = Object.keys(types).length;
    const typeChart: number[][] = [];
    for (let i = 0; i < size; i++) {
        typeChart[i] = Array(size).fill(1.0);
    }

    for (const atkType in types) {
        const attacker = types[atkType];
        for (const defType in types) {
            const defender = types[defType];
            if (defender.weaknesses.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 2.0;
            } else if (defender.resistances.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 0.5;
            } else if (defender.immunities.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 0.0;
            }
        }
    }

    return typeChart;
}

function setupPokemonDataForWrite(loadData: Record<string, LoadedPokemon>, formData: Record<string, LoadedPokemon[]>) {
    Object.values(loadData).forEach((loadMon) => {
        loadMon.evolutionTreeArray = loadMon.evolutionTree?.toArray();
        loadMon.evolutionTree = undefined;
    });

    // Also process forms
    Object.values(formData).forEach((forms) => {
        forms.forEach((formMon) => {
            formMon.evolutionTreeArray = formMon.evolutionTree?.toArray();
            formMon.evolutionTree = undefined;
        });
    });
}

async function loadData(dev: boolean = false): Promise<void> {
    // Fetch the data and load it into a usable format
    const version: string = await handleFiles(
        ["Plugins/_Settings/GameSettings.rb"],
        (f: string[]) => parseVersionFile(f[0]),
        dev,
    );
    const loadedData: LoadedDataJson = {
        version: version,
        types: {},
        tribes: {},
        abilities: {},
        moves: {},
        items: {},
        pokemon: {},
        forms: {},
        trainerTypes: {},
        trainers: {},
        encounters: {},
        typeChart: [],
    };

    await Promise.all([
        await handleFiles(
            ["PBS/types.txt"],
            (f: string[]) => (loadedData.types = parseStandardFile(version, LoadedType, LoadedType.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/tribes.txt"],
            (f: string[]) =>
                (loadedData.tribes = parseNewLineCommaFile(version, LoadedTribe, LoadedTribe.populateMap, f[0])),
            dev,
        ),
        await handleFiles(
            ["PBS/abilities.txt", "PBS/abilities_new.txt"],
            (f: string[]) =>
                (loadedData.abilities = parseStandardFile(version, LoadedAbility, LoadedAbility.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/moves.txt", "PBS/moves_new.txt", "PBS/moves_primeval.txt"],
            (f: string[]) => (loadedData.moves = parseStandardFile(version, LoadedMove, LoadedMove.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/items.txt", "PBS/items_machine.txt"],
            (f: string[]) => (loadedData.items = parseStandardFile(version, LoadedItem, LoadedItem.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/pokemon.txt"],
            (f: string[]) =>
                (loadedData.pokemon = parseStandardFile(version, LoadedPokemon, LoadedPokemon.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/pokemonforms.txt"],
            (f: string[]) => {
                const loadedForms: Record<string, LoadedPokemon[]> = {};
                Object.values(parseStandardFile(version, LoadedPokemon, LoadedPokemon.populateMap, f)).forEach((v) => {
                    LoadedPokemon.postProcessKeyForFormEntry(v);

                    if (!(v.key in loadedForms)) loadedForms[v.key] = [];
                    loadedForms[v.key].push(v);
                });

                return (loadedData.forms = loadedForms);
            },
            dev,
        ),
        await handleFiles(
            ["PBS/trainertypes.txt"],
            (f: string[]) =>
                (loadedData.trainerTypes = parseStandardFile(
                    version,
                    LoadedTrainerType,
                    LoadedTrainerType.populateMap,
                    f,
                )),
            dev,
        ),
        await handleFiles(
            ["PBS/trainers.txt"],
            (f: string[]) =>
                (loadedData.trainers = parseStandardFile(version, LoadedTrainer, LoadedTrainer.populateMap, f)),
            dev,
        ),
        await handleFiles(
            ["PBS/encounters.txt"],
            (f: string[]) => {
                const record: Record<string, LoadedEncounterMap> = {};
                parseEncounterFile(f[0]).forEach((x) => {
                    const map = new LoadedEncounterMap(x, dev);
                    record[map.key] = map;
                });

                return (loadedData.encounters = record);
            },
            dev,
        ),
    ]);

    // caching a filter we need for getAllMoves
    const stapleMoves = Object.values(loadedData.moves)
        .filter((m) => m.flags.includes("Staple"))
        .map((m) => m.key);

    // Data propogation
    loadedData.typeChart = buildTypeChart(loadedData.types);
    propgatePokemonData(version, loadedData.pokemon, loadedData.forms);
    propagateTrainerData(loadedData.trainers);
    propagateSignatures(loadedData, stapleMoves);

    // Pre-write setup
    setupPokemonDataForWrite(loadedData.pokemon, loadedData.forms);

    await dataWrite("loadedData.json", loadedData);
    const keys = {
        pokemon: Object.keys(loadedData.pokemon),
        abilities: Object.keys(loadedData.abilities),
        moves: Object.keys(loadedData.moves),
        heldItems: Object.keys(loadedData.items).filter((k) => {
            if (dev) {
                return loadedData.items[k].pocket >= 9 && loadedData.items[k].pocket <= 13;
            }
            return loadedData.items[k].pocket === 5;
        }),
        types: Object.keys(loadedData.types),
    };

    // Write the poke party code mappings seperately as the file is maintained in the repo
    const mappings = await dataRead("pokePartyMappedEncodings.json");
    function addNewMappings(tectonicKeys: string[], mappingCategory: string) {
        const mapping: Record<string, number> = mappings[mappingCategory];

        let nextMappingId = Object.keys(mapping).length + 1; // Note - this means mapping ids start at 1, we can use a value of 0 to indicate undefined/null
        tectonicKeys.forEach((x) => {
            if (!(x in mapping)) mapping[x] = nextMappingId++;
        });
        mappings[mappingCategory] = mapping;
    }
    addNewMappings(keys.pokemon, "pokemon");
    addNewMappings(keys.abilities, "abilities");
    addNewMappings(keys.moves, "moves");
    addNewMappings(keys.heldItems, "heldItems");
    addNewMappings(keys.types, "types");
    await dataWrite("pokePartyMappedEncodings.json", mappings);
}

loadData(process.argv[2] === "dev").catch((e) => console.error(e));
