"use client";

import FilterOptionButton from "@/components/FilterOptionButton";
import ImageFallback from "@/components/ImageFallback";
import PageHeader, { PageType } from "@/components/PageHeader";
import PokemonModal from "@/components/PokemonModal";
import CloseXButton from "@/components/svg_icons/CloseXButton";
import { LoadedEncounterMap, LoadedEncounterTable } from "@/app/data/loadedDataClasses";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Fragment, ReactNode, useEffect, useState } from "react";
import { EncounterPick, Playthrough } from "../data/playthrough";
import { Item } from "../data/tectonic/Item";
import { Pokemon } from "../data/tectonic/Pokemon";
import { TectonicData } from "../data/tectonic/TectonicData";

const tableDisplayNameMap: Record<string, string> = {
    Special: "Special",
    Land: "Grass",
    LandTinted: "Secret Grass",
    FloweryGrass: "Yellow Flowers",
    LandTall: "Tall Grass",
    DarkCave: "Dark Ground",
    LandSparse: "Sparse Grass",
    Puddle: "Puddle",
    Mud: "Mud",
    FloweryGrass2: "Blue Flowers",
    SewerFloor: "Dirty Floor",
    SewerWater: "Sewage",
    Cloud: "Dark Clouds",
    ActiveWater: "Deep Water",
    FishingContest: "Surfing",
    WaterGrass: "Water Grass",
};

class EncounterMap {
    name: string;
    displayData: EncounterDisplayData[];
    minLevelCap: number = Number.MAX_SAFE_INTEGER;
    minEncounterLevel: number = Number.MAX_SAFE_INTEGER;

    constructor(map: LoadedEncounterMap) {
        this.name = map.name;
        this.displayData = map.tables.map((t) => new EncounterDisplayData(map, t));
        this.displayData.forEach((x) => {
            this.minLevelCap = Math.min(this.minLevelCap, x.levelCap);
        });
        this.displayData
            .filter((x) => !x.isSpecialEncounter())
            .forEach((x) => {
                this.minEncounterLevel = Math.min(this.minEncounterLevel, x.minLevel);
            });

        if (this.minEncounterLevel == Number.MAX_SAFE_INTEGER) {
            this.displayData.forEach((x) => {
                this.minEncounterLevel = Math.min(this.minEncounterLevel, x.minLevel);
            });
        }
    }

    filter(input: string, showIncompleteOnly: boolean, playthrough: Playthrough): boolean {
        const count = this.displayData.filter((x) => x.filter(input, showIncompleteOnly, playthrough)).length;
        return count > 0;
    }
}

class EncounterDisplayData {
    key: string;
    map: LoadedEncounterMap;
    tableDisplayName: string;
    maxLevel: number;
    minLevel: number;
    levelCap: number;
    items: Item[];
    displayMonData: [encounterMonId: string, mon: Pokemon, display: string][];

    constructor(map: LoadedEncounterMap, table: LoadedEncounterTable) {
        this.key = `${map.key} - ${table.type}`;
        this.map = map;
        this.tableDisplayName = tableDisplayNameMap[table.type] ?? "Unknown Table Type";
        this.minLevel = 10000;
        this.maxLevel = -1;
        this.levelCap = table.normalLevelCap;
        this.displayMonData = [];

        const itemsMap: Record<string, Item> = {};
        for (const e of table.encounters) {
            this.minLevel = Math.min(this.minLevel, e.minLevel);
            this.maxLevel = Math.max(this.maxLevel, e.maxLevel ?? e.minLevel);

            const mon = TectonicData.pokemon[e.pokemon];
            const monName = mon?.name ?? `Not Found - ${e.pokemon}`;
            const formName = mon == undefined ? undefined : mon.getFormName(e.form ?? 0);

            mon.items.forEach((item) => (itemsMap[item[0].id] = item[0]));
            this.displayMonData.push([e.pokemon, mon, `${monName}${formName ? ` - ${formName}` : ""}`]);
        }

        this.displayMonData = this.displayMonData.sort(([, displayA], [, displayB]) =>
            displayA.name.localeCompare(displayB.name),
        );
        this.items = Object.values(itemsMap);
    }

    getLevelDisplay(): string {
        return this.maxLevel == this.minLevel ? this.maxLevel.toString() : `${this.minLevel}-${this.maxLevel}`;
    }

    isSpecialEncounter(): boolean {
        return this.tableDisplayName == "Special";
    }

    filter(input: string, showIncompleteOnly: boolean, playthrough: Playthrough): boolean {
        const hasAnyPick = playthrough.hasAnyPick(this.key);
        const wasPickMissed = playthrough.wasPickMissed(this.key);
        const isOnlyNumeric = input.length > 0 && Number.isInteger(Number(input));

        if (isOnlyNumeric) {
            return this.levelCap <= Number(input);
        }

        return (
            (input.length > 0 || !showIncompleteOnly || (showIncompleteOnly && !hasAnyPick && !wasPickMissed)) &&
            (this.map.name.toLowerCase().includes(input) ||
                this.tableDisplayName.toLowerCase().includes(input) ||
                this.displayMonData.some((x) => x[2].toLowerCase().includes(input)) ||
                this.items.some((x) => x.name.toLowerCase().includes(input)))
        );
    }
}

const encounterMaps: EncounterMap[] = Object.values(TectonicData.encounters)
    .map((m) => new EncounterMap(m))
    .sort((a, b) => {
        // Special handling for the lab so that it's first
        if (a.name == "Impromptu Lab") return -1;
        else if (b.name == "Impromptu Lab") return 1;

        return a.minLevelCap == b.minLevelCap
            ? a.minEncounterLevel - b.minEncounterLevel
            : a.minLevelCap - b.minLevelCap;
    });

const EncounterTracker: NextPage = () => {
    const [showIncompleteOnly, setShowIncompleteOnly] = useState<boolean>(false);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [selectedPlaythroughId, setselectedPlaythroughId] = useState<number | undefined>(undefined);
    const [playthroughName, setPlaythroughName] = useState<string>("New Playthrough");
    const [locationFilter, setLocationFilter] = useState<string>("");
    const [pickedMonMapWithEvos, setPickedMonMapWithEvos] = useState<Record<string, Pokemon>>();
    const [modalMon, setModalMon] = useState<Pokemon | null>(null);

    function EncounterDisplay({ data }: { data: EncounterDisplayData }): ReactNode {
        const flagMissing = Playthrough.getPlayThrough(selectedPlaythroughId)!.wasPickMissed(data.key);

        return (
            <div className="w-full mx-auto">
                <div>
                    <div className="flex justify-between items-center mt-2 pl-2 text-xl bg-white/10">
                        {data.tableDisplayName}
                        <div className="flex whitespace-nowrap gap-2 ">
                            <span className="text-sm rounded-full my-auto px-2 py-1 bg-emerald-700">
                                Lvl. Cap {data.levelCap}
                            </span>
                            <span className="text-sm rounded-full my-auto px-2 py-1 bg-blue-700">
                                Lvl. {data.getLevelDisplay()}
                            </span>
                            <FilterOptionButton
                                isSelected={flagMissing}
                                onClick={() => {
                                    Playthrough.getPlayThrough(selectedPlaythroughId)!.setPickMissed(
                                        data.key,
                                        !flagMissing,
                                    );
                                    setLoaded(false);
                                }}
                            >
                                Missed
                            </FilterOptionButton>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                    {data.displayMonData.map((eMon, index) => (
                        <EncounterDisplayMon key={index} encounterData={data} eMonId={eMon[0]} pokemon={eMon[1]} />
                    ))}
                </div>
            </div>
        );
    }

    function EncounterDisplayMon({
        encounterData,
        eMonId,
        pokemon,
    }: {
        encounterData: EncounterDisplayData;
        eMonId: string;
        pokemon: Pokemon;
    }): ReactNode {
        const encounterKey = encounterData.key;
        const pickedHere = Playthrough.getPlayThrough(selectedPlaythroughId)!.hasPick(encounterKey, eMonId);
        const isDuplicate = pokemon.id in (pickedMonMapWithEvos ?? {});

        return (
            <div className="flex flex-col items-center">
                <ImageFallback
                    src={pokemon.getIcon()}
                    className={`hover:bg-yellow-highlight cursor-pointer ${
                        pickedHere ? "bg-yellow-highlight" : isDuplicate ? "grayscale bg-gray-500" : ""
                    }`}
                    alt={pokemon.name}
                    width={64}
                    height={64}
                    title={pokemon.name}
                    onClick={() => {
                        const playthrough = Playthrough.getPlayThrough(selectedPlaythroughId)!;
                        if (playthrough.hasPick(encounterKey, eMonId)) {
                            playthrough.removePick(encounterKey, eMonId);
                        } else {
                            playthrough.addPick(encounterKey, new EncounterPick(eMonId, pokemon.id));
                        }
                        setPickedMonMapWithEvos(playthrough.getPickedMonMapWithEvos());
                    }}
                    onContextMenu={() => setModalMon(pokemon)}
                />
                {!encounterData.isSpecialEncounter() && (
                    <div className="flex flex-wrap justify-center">
                        {pokemon.uniqueItems.map((item) => (
                            <ImageFallback
                                key={item.id}
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                title={item.name}
                                className="w-8 h-8"
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    useEffect(() => {
        if (!loaded) {
            Playthrough.loadLocalData();
            setLoaded(true);
        }
    }, [loaded]);

    return (
        <Fragment>
            <Head>
                <title>Tectonic Encounter Tracker</title>
                <meta name="description" content="Pokémon encounter tracker for the fangame Pokémon Tectonic" />
            </Head>

            <div className="min-h-screen bg-gray-900 text-white">
                <PageHeader currentPage={PageType.Tracker} />

                {selectedPlaythroughId ? (
                    <main className="flex flex-col space-y-3 p-3">
                        <div className="flex justify-between space-x-5 w-full md:w-150 mx-auto pb-2">
                            <button
                                className="text-4xl hover:text-yellow-highlight cursor-pointer"
                                title="Back"
                                onClick={() => {
                                    setselectedPlaythroughId(undefined);
                                    setPlaythroughName("New Playthrough");
                                }}
                            >
                                {"\u21A2"}
                            </button>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="text"
                                placeholder="Playthrough Name"
                                value={playthroughName}
                                onChange={(e) => {
                                    setPlaythroughName(e.target.value);
                                    Playthrough.getPlayThrough(selectedPlaythroughId)?.setName(e.target.value);
                                }}
                            />
                            <FilterOptionButton
                                isSelected={showIncompleteOnly}
                                title="Toggle view"
                                onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                            >
                                <span className="text-3xl p-1">?</span>
                            </FilterOptionButton>
                            <CloseXButton
                                svgClassName="w-10 h-10"
                                onClick={() => {
                                    if (confirm("Delete playthrough?")) {
                                        Playthrough.getPlayThrough(selectedPlaythroughId)?.delete();
                                        setselectedPlaythroughId(undefined);
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-150 mx-auto ">
                            <input
                                className="w-full border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                placeholder="Location, Pokemon, Item, or Level Cap"
                            />
                            {encounterMaps
                                .filter((m) =>
                                    m.filter(
                                        locationFilter.toLocaleLowerCase(),
                                        showIncompleteOnly,
                                        Playthrough.getPlayThrough(selectedPlaythroughId)!,
                                    ),
                                )
                                .map((m) => (
                                    <div key={m.name} className="w-full md:w-150 border rounded-2xl p-2 mx-auto">
                                        <div className="text-2xl text-center">{m.name}</div>
                                        <hr className="mt-1 mb-3 text-blue-500/50" />
                                        {m.displayData.map((e) => (
                                            <EncounterDisplay key={e.key} data={e} />
                                        ))}
                                    </div>
                                ))}
                        </div>
                    </main>
                ) : (
                    <main className="p-3">
                        <div className="text-3xl text-center">
                            <Link className="hover:text-blue-400" href="../">
                                Tectonic Tracker
                            </Link>
                        </div>
                        <div className="flex w-fit mx-auto mt-2">
                            <input
                                className="px-4 py-2 mt-1.25 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="text"
                                value={playthroughName}
                                placeholder="New Playthrough"
                                onChange={(e) => setPlaythroughName(e.target.value)}
                            />
                            <button
                                className="text-5xl ml-2 hover:text-yellow-highlight"
                                onClick={() => {
                                    setselectedPlaythroughId(Playthrough.addNewPlaythrough(playthroughName));
                                }}
                            >
                                {"\u2295"}
                            </button>
                        </div>
                        <hr className="my-3" />
                        <div className="text-center text-2xl">Playthroughs</div>
                        {Playthrough.getPlayThroughs().map((x, index) => (
                            <div
                                key={index}
                                className="w-full md:w-150 text-center border rounded-2xl p-2 my-2 mx-auto hover:bg-yellow-highlight hover:text-black cursor-pointer"
                                onClick={() => {
                                    const playthrough = Playthrough.getPlayThrough(x)!;
                                    setPlaythroughName(playthrough.getName() ?? playthroughName);
                                    setPickedMonMapWithEvos(playthrough.getPickedMonMapWithEvos());
                                    setselectedPlaythroughId(x);
                                }}
                            >
                                {Playthrough.getPlayThrough(x)?.getName()}
                            </div>
                        ))}
                    </main>
                )}
            </div>

            {modalMon && <PokemonModal pokemon={modalMon} handlePokemonClick={setModalMon} />}
        </Fragment>
    );
};
export default EncounterTracker;
