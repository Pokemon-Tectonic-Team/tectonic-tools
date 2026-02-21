import { Playthrough } from "@/app/data/playthrough";
import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { PokemonType } from "@/app/data/tectonic/PokemonType";
import { TectonicData } from "@/app/data/tectonic/TectonicData";
import { JSX, useEffect, useState } from "react";
import FilterOptionButton from "./FilterOptionButton";
import ImageFallback from "./ImageFallback";
import PokemonModal from "./PokemonModal";
import TypeBadge, { TypeBadgeElementEnum } from "./TypeBadge";

enum EvolutionStageEnum {
    Any = "Any Evo",
    First = "First Evo",
    Final = "Final Evo",
}

export function MiniDexFilter({ onMon }: { onMon: (mon: Pokemon) => void }): JSX.Element {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [ability, setAbility] = useState<string>("");
    const [move, setMove] = useState<string>("");
    const [tribe, setTribe] = useState<string>("");
    const [playthrough, setPlaythrough] = useState<number>(-1);
    const [type1, setType1] = useState<PokemonType | undefined>(undefined);
    const [type2, setType2] = useState<PokemonType | undefined>(undefined);
    const [modalMon, setModalMon] = useState<Pokemon | null>(null);
    const [evoStage, setEvoStage] = useState<EvolutionStageEnum>(EvolutionStageEnum.Any);

    function filter(x: Pokemon, playthroughMonMap?: Record<string, Pokemon>): boolean {
        return (
            ((name.length <= 1 || x.name.toLowerCase().includes(name.toLowerCase())) &&
                (evoStage == EvolutionStageEnum.Any ||
                    (evoStage == EvolutionStageEnum.First && x.getEvoNode().isRoot()) ||
                    (evoStage == EvolutionStageEnum.Final && x.getEvoNode().isLeaf())) &&
                (ability.length <= 2 ||
                    x.abilities.find(
                        (a) =>
                            a.name.toLowerCase().includes(ability.toLowerCase()) ||
                            a.description.toLowerCase().includes(ability.toLowerCase())
                    )) &&
                (move.length <= 2 || x.allMoves().find((m) => m.name.toLowerCase().includes(move.toLowerCase()))) &&
                (tribe.length == 0 || x.tribes.find((t) => t.name.toLowerCase().includes(tribe.toLowerCase()))) &&
                (!type1 || x.type1 == type1 || x.type2 == type1) &&
                (!type2 || x.type1 == type2 || x.type2 == type2) &&
                (!playthroughMonMap || x.id in playthroughMonMap)) ??
            false
        );
    }

    useEffect(() => {
        if (!loaded) {
            Playthrough.loadLocalData();
            setPlaythrough(-1);
            setLoaded(true);
        }
    }, [loaded]);

    return (
        <div className="w-full">
            <div className="flex flex-wrap justify-center gap-2 py-2">
                <input
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    list="pokemonData"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Filter: Pokemon"
                />
                <datalist id="pokemonData">
                    {Object.values(TectonicData.pokemon).map((p) => (
                        <option key={p.id} value={p.name} />
                    ))}
                </datalist>
                <select
                    className="px-4 py-2 rounded-md bg-gray-700 border border-gray-600"
                    value={evoStage?.valueOf()}
                    onChange={(e) => setEvoStage(e.target.value as EvolutionStageEnum)}
                >
                    {Object.values(EvolutionStageEnum).map((x) => (
                        <option key={x} value={x}>
                            {x}
                        </option>
                    ))}
                </select>
                <input
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    list="abilitiesData"
                    value={ability}
                    onChange={(e) => setAbility(e.target.value)}
                    placeholder="Filter: Ability"
                />
                <datalist id="abilitiesData">
                    {Object.values(TectonicData.abilities).map((a) => (
                        <option key={a.id} value={a.name} />
                    ))}
                </datalist>
                <input
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    list="movesData"
                    value={move}
                    onChange={(e) => setMove(e.target.value)}
                    placeholder="Filter: Move"
                />
                <datalist id="movesData">
                    {Object.values(TectonicData.moves).map((n) => (
                        <option key={n.id} value={n.name} />
                    ))}
                </datalist>
                <input
                    className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                    list="tribesData"
                    value={tribe}
                    onChange={(e) => setTribe(e.target.value)}
                    placeholder="Filter: Tribe"
                />
                <datalist id="tribesData">
                    {Object.values(TectonicData.tribes).map((t) => (
                        <option key={t.id} value={t.name} />
                    ))}
                </datalist>
                <span className="flex gap-1">
                    <select
                        className="border rounded px-2 py-1 bg-gray-700 text-white border-gray-600"
                        value={playthrough}
                    >
                        <option key={-1} value="-1">
                            Filter: Tracker Encounters
                        </option>
                        {Object.values(Playthrough.getPlayThroughs()).map((x, i) => (
                            <option key={i} value={x}>
                                {Playthrough.getPlayThrough(x)!.getName()}
                            </option>
                        ))}
                    </select>
                    <span
                        className="text-2xl my-auto cursor-pointer text-white hover:text-yellow-highlight"
                        title="Refresh"
                        onClick={() => setLoaded(false)}
                    >
                        &#10227;
                    </span>
                </span>
            </div>
            <div className="grid grid-rows-2 grid-flow-col justify-center space-x-3 space-y-3">
                {Object.values(TectonicData.types).map((t) => (
                    <FilterOptionButton
                        key={t.id}
                        padding="p-2"
                        onClick={() => {
                            if (type1 == t) {
                                setType1(undefined);
                            } else if (type2 == t) {
                                setType2(undefined);
                            } else if (!type1) {
                                setType1(t);
                            } else {
                                setType2(t);
                            }
                        }}
                        isSelected={type1 == t || type2 == t}
                    >
                        <TypeBadge types={[t]} element={TypeBadgeElementEnum.ICONS} />
                    </FilterOptionButton>
                ))}
            </div>
            <div className="w-fit h-48 overflow-auto mx-auto">
                <div className="flex flex-wrap mx-auto">
                    {TectonicData.pokemonList
                        .filter((x) =>
                            filter(
                                x,
                                playthrough != -1
                                    ? Playthrough.getPlayThrough(playthrough)?.getPickedMonMapWithEvos()
                                    : undefined
                            )
                        )
                        .map((mon) => (
                            <ImageFallback
                                key={mon.id}
                                className="hover:bg-yellow-highlight cursor-pointer"
                                src={mon.getIcon()}
                                alt={mon.name}
                                width={64}
                                height={64}
                                title={mon.name}
                                onClick={() => onMon(mon)}
                                onContextMenu={() => setModalMon(mon)}
                            />
                        ))}
                </div>
            </div>

            {modalMon && <PokemonModal pokemon={modalMon} handlePokemonClick={setModalMon} />}
        </div>
    );
}
