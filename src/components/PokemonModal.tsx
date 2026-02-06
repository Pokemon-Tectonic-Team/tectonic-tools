import { Ability } from "@/app/data/tectonic/Ability";
import { Move } from "@/app/data/tectonic/Move";
import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { TectonicData } from "@/app/data/tectonic/TectonicData";
import { calcTypeMatchup } from "@/app/data/typeChart";
import { negativeMod } from "@/app/data/util";
import AbilityCapsule from "@/components/AbilityCapsule";
import BasicButton from "@/components/BasicButton";
import ImageFallback from "@/components/ImageFallback";
import LeftRightCycleButtons from "@/components/LeftRightCycleButtons";
import CloseXButton from "@/components/svg_icons/CloseXButton";
import TribeCapsule from "@/components/TribeCapsule";
import TypeBadge, { TypeBadgeElementEnum } from "@/components/TypeBadge";
import { useEffect, useRef, useState } from "react";
import EncounterDisplay from "./EncounterDisplay";
import MoveTable from "./MoveTable";
import PokemonEvolution from "./PokemonEvolution";
import StatRow from "./StatRow";
import TabContent from "./TabContent";
import TypeChartCell from "./TypeChartCell";

export interface PokemonModalProps {
    pokemon: Pokemon | null;
    moveSelector?: ((m: Move) => void) | null;
    handlePokemonClick: (pokemon: Pokemon | null) => void;
    initialForm?: number;
}

const PokemonModal: React.FC<PokemonModalProps> = ({ pokemon: mon, moveSelector, handlePokemonClick, initialForm }) => {
    const tabs = moveSelector
        ? ["Level Moves", "Tutor Moves", "All Moves"]
        : (["Info", "Evolutions & Locations", "Level Moves", "Tutor Moves"] as const);
    type PokemonTabName = (typeof tabs)[number];

    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [currentPokemon, setCurrentPokemon] = useState(mon);
    const [selectedDefAbility, setSelectedDefAbility] = useState<Ability>(currentPokemon?.abilities[0] ?? Ability.NULL);
    const [selectedStabAbility, setSelectedStabAbility] = useState<Ability>(
        currentPokemon?.abilities[0] ?? Ability.NULL,
    );
    const [activeTab, setActiveTab] = useState<PokemonTabName>(moveSelector ? "Level Moves" : "Info");
    const [currentForm, setCurrentForm] = useState<number>(initialForm ?? 0);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mon) {
            setCurrentPokemon(mon);
            setCurrentForm(initialForm ?? 0);
            setSelectedDefAbility(mon.abilities[0]);
            setSelectedStabAbility(mon.abilities[0]);
            setIsRendered(true);
            setTimeout(() => {
                setIsVisible(true);
                if (modalRef.current) {
                    modalRef.current.scrollTop = 0;
                }
            }, 10);
            document.body.style.overflow = "hidden"; // Disable scrolling
        }
    }, [mon, initialForm]);

    const handleClose = () => {
        document.body.style.overflow = ""; // Re-enable scrolling
        setIsVisible(false);
        setTimeout(() => {
            setIsRendered(false);
            handlePokemonClick(null);
        }, 300);
    };

    const handleTabChange = (tab: PokemonTabName) => {
        setActiveTab(tab);
    };

    if (!isRendered || !currentPokemon) return null;

    const stats = currentPokemon.getStats(currentForm);
    const defMatchupCalcs: Record<string, Record<string, number>> = {};
    const stabMatchupCalcs: Record<string, Record<string, number>> = {};
    let defMatchupDifferentForAbilities = false;
    let stabMatchupDifferentForAbilities = false;
    currentPokemon.abilities.forEach((a) => {
        const firstDefAbilityChart = Object.values(defMatchupCalcs).find(() => true);
        const firstStabAbilityChart = Object.values(stabMatchupCalcs).find(() => true);
        defMatchupCalcs[a.id] = {};
        stabMatchupCalcs[a.id] = {};
        TectonicData.realTypes.forEach((t) => {
            defMatchupCalcs[a.id][t.id] = calcTypeMatchup(
                { type: t },
                {
                    type1: currentPokemon.getType1(currentForm),
                    type2: currentPokemon.getType2(currentForm),
                    abilities: [a],
                },
            );

            stabMatchupCalcs[a.id][t.id] = Math.max(
                calcTypeMatchup({ type: currentPokemon.getType1(currentForm), abilities: [a] }, { type1: t }),
                calcTypeMatchup(
                    { type: currentPokemon.getType2(currentForm) || currentPokemon.getType1(currentForm), abilities: [a] },
                    { type1: t },
                ),
            );

            defMatchupDifferentForAbilities ||=
                firstDefAbilityChart != null && defMatchupCalcs[a.id][t.id] != firstDefAbilityChart[t.id];
            stabMatchupDifferentForAbilities ||=
                firstStabAbilityChart != null && stabMatchupCalcs[a.id][t.id] != firstStabAbilityChart[t.id];
        });
    });

    return (
        <div
            onClick={handleClose}
            className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className={`bg-gray-800 text-white rounded-lg shadow-xl max-w-2xl w-full max-h-[75vh] min-h-[75vh] overflow-y-auto transform transition-transform duration-300 ${
                    isVisible ? "scale-100" : "scale-95"
                }`}
            >
                <div className="px-4 py-2.5">
                    <div className="flex justify-between">
                        <h3 className="text-2xl font-bold">
                            {currentPokemon.dex}: {currentPokemon.name}{" "}
                            {currentPokemon.getFormName(currentForm) &&
                                "(" + currentPokemon.getFormName(currentForm) + ") "}
                            - {currentPokemon.kind} Pokémon
                        </h3>
                        <CloseXButton onClick={handleClose} />
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-4 border-b border-gray-400">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === tab
                                        ? "border-b-2 text-white border-white"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="table-fixed mt-2">
                        <TabContent tab="Info" activeTab={activeTab}>
                            <div>
                                <div className="flex space-x-3">
                                    <div className="flex flex-col items-center space-y-2 min-w-50">
                                        {currentPokemon.forms.length > 0 && (
                                            <LeftRightCycleButtons
                                                buttonsVisible={true}
                                                onPrevClick={() =>
                                                    setCurrentForm(
                                                        negativeMod(currentForm - 1, currentPokemon.forms.length),
                                                    )
                                                }
                                                onNextClick={() =>
                                                    setCurrentForm((currentForm + 1) % currentPokemon.forms.length)
                                                }
                                            >
                                                <span>Change Form</span>
                                            </LeftRightCycleButtons>
                                        )}
                                        <ImageFallback
                                            src={currentPokemon.getImage(currentForm)}
                                            alt={currentPokemon.name}
                                            width={160}
                                            height={160}
                                            className="min-w-40 max-w-40 h-40"
                                        />
                                        <TypeBadge
                                            key={currentPokemon.getType1(currentForm).id}
                                            types={[
                                                currentPokemon.getType1(currentForm),
                                                currentPokemon.getType2(currentForm),
                                            ]}
                                            element={TypeBadgeElementEnum.CAPSULE_ROW}
                                        />
                                    </div>
                                    <table className="mt-1">
                                        <tbody>
                                            <StatRow name="HP" value={stats.hp} />
                                            <StatRow name="Attack" value={stats.attack} />
                                            <StatRow name="Defense" value={stats.defense} />
                                            <StatRow name="Sp. Atk" value={stats.spatk} />
                                            <StatRow name="Sp. Def" value={stats.spdef} />
                                            <StatRow name="Speed" value={stats.speed} />
                                            <tr className="h-5">
                                                <td>
                                                    <hr />
                                                </td>
                                                <td>
                                                    <hr />
                                                </td>
                                                <td>
                                                    <hr />
                                                </td>
                                            </tr>
                                            <StatRow name="Total" value={currentPokemon.BST(currentForm)} scale={3.5} />
                                            <StatRow name="PEHP" value={currentPokemon.getPEHP(currentForm)} />
                                            <StatRow name="SEHP" value={currentPokemon.getSEHP(currentForm)} />
                                        </tbody>
                                    </table>
                                </div>
                                <p>
                                    {`${currentPokemon.getPokedex(currentForm)} ${currentPokemon.name} weighs ${
                                        currentPokemon.weight
                                    }kg and is ${currentPokemon.height}m tall.`}
                                </p>
                                <hr className="my-3" />
                                <h1 className="font-semibold text-2xl text-center">Abilties</h1>
                                <table className="border-spacing-y-2 border-separate w-full">
                                    <tbody>
                                        {currentPokemon.getAbilities(currentForm).map((a) => (
                                            <tr key={a.id} className="bg-emerald-300/10">
                                                <td className="whitespace-nowrap pl-1.5 pr-3 py-3 text-base text-right">
                                                    <AbilityCapsule ability={a} />
                                                </td>
                                                <td>
                                                    <p>{a.description}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h1 className="font-semibold text-2xl text-center mt-2">Tribes</h1>
                                <table className="border-spacing-y-2 border-separate w-full">
                                    <tbody>
                                        {currentPokemon.tribes.map((t) => (
                                            <tr key={t.id} className="bg-red-300/10">
                                                <td className="whitespace-nowrap pl-1.5 pr-3 py-3 text-base text-right">
                                                    <TribeCapsule tribe={t} />
                                                </td>
                                                <td>
                                                    <p>{t.description}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <hr className="my-3" />
                                <div className="flex justify-center space-x-3 mt-2">
                                    {defMatchupDifferentForAbilities && (
                                        <BasicButton
                                            onClick={() =>
                                                setSelectedDefAbility(
                                                    currentPokemon.abilities.find((a) => a != selectedDefAbility) ??
                                                        selectedDefAbility,
                                                )
                                            }
                                        >
                                            {selectedDefAbility.name}
                                        </BasicButton>
                                    )}
                                    <h1 className="font-semibold text-2xl my-auto">Defensive Matchups</h1>
                                </div>
                                <table className="my-2">
                                    <thead>
                                        <tr>
                                            {TectonicData.realTypes.map((t) => (
                                                <TypeBadge
                                                    key={t.id}
                                                    types={[t]}
                                                    element={TypeBadgeElementEnum.TABLE_HEADER}
                                                />
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {TectonicData.realTypes.map((t) => (
                                                <TypeChartCell
                                                    key={t.id}
                                                    mult={defMatchupCalcs[selectedDefAbility.id][t.id]}
                                                />
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="flex justify-center space-x-3">
                                    {stabMatchupDifferentForAbilities && (
                                        <BasicButton
                                            onClick={() =>
                                                setSelectedStabAbility(
                                                    currentPokemon.abilities.find((a) => a != selectedStabAbility) ??
                                                        selectedStabAbility,
                                                )
                                            }
                                        >
                                            {selectedStabAbility.name}
                                        </BasicButton>
                                    )}
                                    <h1 className="font-semibold text-2xl my-auto">STAB Matchups</h1>
                                </div>
                                <table className="my-2">
                                    <thead>
                                        <tr>
                                            {TectonicData.realTypes.map((t) => (
                                                <TypeBadge
                                                    key={t.id}
                                                    types={[t]}
                                                    element={TypeBadgeElementEnum.TABLE_HEADER}
                                                />
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {TectonicData.realTypes.map((t) => {
                                                return (
                                                    <TypeChartCell
                                                        key={t.id}
                                                        mult={stabMatchupCalcs[selectedStabAbility.id][t.id]}
                                                    />
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </TabContent>
                        <TabContent tab="Evolutions & Locations" activeTab={activeTab}>
                            <h1 className="font-semibold text-2xl text-center mb-2">Evolutions</h1>
                            <div className="mt-2 text-center">
                                {currentPokemon.evolutionTree.isLeaf() ? (
                                    <p>Does not evolve</p>
                                ) : (
                                    <div className="w-fit mx-auto">
                                        {currentPokemon.evolutionTree.asBranches().map((branch, index) => (
                                            <div
                                                key={index}
                                                className="flex"
                                                style={{ justifyContent: "space-around", alignItems: "center" }}
                                            >
                                                {branch.map((node, index) => (
                                                    <PokemonEvolution
                                                        key={index}
                                                        node={node}
                                                        index={index}
                                                        onClick={(evo) => {
                                                            setActiveTab("Info");
                                                            handlePokemonClick(evo);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <hr className="my-3" />
                            <h1 className="font-semibold text-2xl text-center mb-2">Locations</h1>
                            <EncounterDisplay pokemon={currentPokemon} />
                            <h1 className="font-semibold mt-3 text-2xl text-center mb-2">Wild Held Items</h1>
                            <table className="table-fixed w-full text-center">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className={"border w-25 py-2"}>Item</th>
                                        <th className={"border w-20 py-2"}>Chance</th>
                                        <th className={"border py-2"}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPokemon.items.map(([i, chance], index) => (
                                        <tr key={index}>
                                            <td className={"border p-2 font-semibold"}>
                                                <div>
                                                    <span className="flex justify-center">
                                                        <ImageFallback
                                                            alt={i.name}
                                                            src={i.image}
                                                            width={50}
                                                            height={50}
                                                        />
                                                    </span>
                                                    {i.name}
                                                </div>
                                            </td>
                                            <td className={"border"}>{`${chance}%`}</td>
                                            <td className={"border px-2"}>{i.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TabContent>
                        <TabContent tab="Level Moves" activeTab={activeTab}>
                            <MoveTable
                                moves={currentPokemon.getLevelMoves(currentForm)}
                                showLevel={true}
                                onMoveClick={(m) => {
                                    if (moveSelector) {
                                        moveSelector(m);
                                        handleClose();
                                    }
                                }}
                            />
                        </TabContent>
                        <TabContent tab="Tutor Moves" activeTab={activeTab}>
                            <MoveTable
                                moves={currentPokemon.tutorableMoves.map((x) => [0, x])}
                                showLevel={false}
                                onMoveClick={(m) => {
                                    if (moveSelector) {
                                        moveSelector(m);
                                        handleClose();
                                    }
                                }}
                            />
                        </TabContent>
                        <TabContent tab="All Moves" activeTab={activeTab}>
                            <MoveTable
                                moves={Object.values(TectonicData.moves).map((x) => [0, x])}
                                showLevel={false}
                                onMoveClick={(m) => {
                                    if (moveSelector) {
                                        moveSelector(m);
                                        handleClose();
                                    }
                                }}
                            />
                        </TabContent>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PokemonModal;
