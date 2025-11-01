"use client";

import AbilityCapsule from "@/components/AbilityCapsule";
import { getTypeColorClass, getTypeGradient } from "@/components/colours";
import FilterOptionButton from "@/components/FilterOptionButton";
import {
    abilityNameFilter,
    allMovesFilter,
    AVAILABLE_FILTERS,
    heldItemFilter,
    PokemonFilterType,
    tribesFilter,
} from "@/components/filters";
import ImageFallback from "@/components/ImageFallback";
import PageHeader, { PageType } from "@/components/PageHeader";
import TribeCapsule from "@/components/TribeCapsule";
import TypeBadge, { TypeBadgeElementEnum } from "@/components/TypeBadge";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FilterInput } from "../../components/FilterInput";
import MoveTable from "../../components/MoveTable";
import PokemonModal from "../../components/PokemonModal";
import TabContent from "../../components/TabContent";
import TableCell from "../../components/TableCell";
import TableHeader from "../../components/TableHeader";
import TypeChartCell from "../../components/TypeChartCell";
import { ExtraTypeAbility } from "../data/abilities/ExtraTypeAbility";
import { TypeImmunityAbility } from "../data/abilities/TypeImmunityAbility";
import { TypeResistAbility } from "../data/abilities/TypeResistAbility";
import { Ability } from "../data/tectonic/Ability";
import { Item } from "../data/tectonic/Item";
import { Move } from "../data/tectonic/Move";
import { Pokemon } from "../data/tectonic/Pokemon";
import { PokemonType } from "../data/tectonic/PokemonType";
import { TectonicData } from "../data/tectonic/TectonicData";
import { Tribe } from "../data/tectonic/Tribe";
import { uniq } from "../data/util";

const tabNames = ["Pokemon", "Moves", "Abilities", "Items", "Tribes", "Type Chart"];

interface FilterableAbility {
    label: string;
    filter: (a: Ability) => boolean;
}
const filterableAbilities: FilterableAbility[][] = [
    [
        { label: "All Weather", filter: (a: Ability) => a.hasAllWeatherSynergy() },
        { label: "Sun", filter: (a: Ability) => a.hasSunSynergy() },
        { label: "Rain", filter: (a: Ability) => a.hasRainSynergy() },
        { label: "Hail", filter: (a: Ability) => a.hasHailSynergy() },
        { label: "Sand", filter: (a: Ability) => a.hasSandSynergy() },
        { label: "Eclipse", filter: (a: Ability) => a.hasEclipseSynergy() },
        { label: "Moonglow", filter: (a: Ability) => a.hasMoonglowSynergy() },
    ],
    [
        { label: "Extra Type", filter: (a: Ability) => a instanceof ExtraTypeAbility },
        { label: "Immunity", filter: (a: Ability) => a instanceof TypeImmunityAbility },
        { label: "Resists", filter: (a: Ability) => a instanceof TypeResistAbility },
    ],
];

const itemMons: Record<string, Array<Pokemon>> = {};
Object.values(TectonicData.pokemon).forEach((x) =>
    x.items.forEach(([i]) => {
        if (!(i.id in itemMons)) {
            itemMons[i.id] = [];
        }

        itemMons[i.id].push(x);
    })
);
const itemDisplayData = Object.values(TectonicData.items)
    .map((i) => {
        return {
            item: i,
            wildMons:
                i.id in itemMons
                    ? uniq(itemMons[i.id]).map((p) => {
                          return {
                              mon: p,
                              chance: p.items.find(([x]) => x == i)?.[1] ?? 0,
                          };
                      })
                    : [],
            moveData: i.isTM && i.move ? TectonicData.moves[i.move] : undefined,
        };
    })
    .filter((i) => i.item.isTM || i.item.isHeldItem || i.wildMons.length > 0);

const HomeContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pokedexAsCards, setPokedexAsCards] = useState<boolean>(true);
    const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
    const [filters, setFilters] = useState<PokemonFilterType[]>([]);
    const [activeTab, setActiveTab] = useState<string>("Pokemon");

    // Initialize selected Pokemon from URL
    useEffect(() => {
        const pokemonId = searchParams.get("pokemon");
        if (pokemonId && pokemonId in TectonicData.pokemon) {
            setSelectedPokemon(TectonicData.pokemon[pokemonId]);
        }
    }, [searchParams]);

    const updateSelectedPokemon = (pokemon: Pokemon | null) => {
        setSelectedPokemon(pokemon);
        const options = { replace: true, scroll: false };
        if (pokemon) {
            router.push(`?pokemon=${pokemon.id}`, options);
        } else {
            const currentParams = new URLSearchParams(searchParams);
            currentParams.delete("pokemon");
            const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : window.location.pathname;
            router.push(newUrl, options);
        }
    };
    const [currentFilter, setCurrentFilter] = useState<PokemonFilterType>(AVAILABLE_FILTERS[0]);
    const [itemFilter, setItemFilter] = useState<string | undefined>();
    const [typeChartAtkDualType, setTypeChartAtkDualType] = useState<PokemonType | undefined>();
    const [abilityTableFilter, setAbilityTableFilter] = useState<FilterableAbility>();

    const handleAddFilter = (filter: PokemonFilterType, value: string) => {
        setFilters((prev) => [...prev, { ...filter, value }]);
    };

    const removeFilter = (index: number) => {
        setFilters((prev) => prev.filter((_, i) => i !== index));
    };

    const filteredPokemon = useMemo(() => {
        const filtered = Object.values(TectonicData.pokemon).filter((mon) => {
            return filters.every((filter) => {
                return filter.apply(mon, filter.value);
            });
        });
        return filtered;
    }, [filters]);

    const handleMoveClick = (move: Move) => {
        handleAddFilter(allMovesFilter, move.name.toLowerCase());
        setActiveTab("Pokemon");
    };

    const handleAbilityClick = (ability: Ability) => {
        handleAddFilter(abilityNameFilter, ability.name.toLowerCase());
        setActiveTab("Pokemon");
    };

    const handleItemClick = (item: Item) => {
        handleAddFilter(heldItemFilter, item.name.toLowerCase());
        setActiveTab("Pokemon");
    };

    const handleTribeClick = (tribe: Tribe) => {
        handleAddFilter(tribesFilter, tribe.name.toLowerCase());
        setActiveTab("Pokemon");
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Head>
                <title>Pokémon Tectonic Online Pokédex</title>
                <meta name="description" content="View Pokémon data for the fangame Pokémon Tectonic" />
            </Head>
            <PageHeader currentPage={PageType.Pokedex}></PageHeader>

            <main className="container mx-auto py-2 px-4">
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {tabNames.map((n) => (
                        <FilterOptionButton key={n} isSelected={activeTab == n} onClick={() => setActiveTab(n)}>
                            <span className="text-2xl">{n}</span>
                        </FilterOptionButton>
                    ))}
                </div>

                <TabContent tab="Pokemon" activeTab={activeTab}>
                    <FilterInput
                        currentFilter={currentFilter}
                        filters={filters}
                        onAddFilter={handleAddFilter}
                        removeFilter={removeFilter}
                        setCurrentFilter={setCurrentFilter}
                    />
                    <div className="hidden md:flex justify-center gap-2">
                        <FilterOptionButton isSelected={pokedexAsCards} onClick={() => setPokedexAsCards(true)}>
                            Cards
                        </FilterOptionButton>
                        <FilterOptionButton isSelected={!pokedexAsCards} onClick={() => setPokedexAsCards(false)}>
                            Table
                        </FilterOptionButton>
                    </div>
                    {pokedexAsCards ? (
                        <table className="table-fixed mx-auto text-white">
                            <tbody>
                                {filteredPokemon.map((mon) => (
                                    <tr
                                        key={mon.id}
                                        onClick={() => updateSelectedPokemon(mon)}
                                        className={`flex rounded-md px-1 py-2 my-2 cursor-pointer border border-white ${getTypeGradient(
                                            mon
                                        )}`}
                                    >
                                        <td className="flex flex-col justify-between w-30 md:w-35 mr-2 text-base md:text-xl">
                                            <span className="invertIgnore w-fit px-3 py-1 rounded-full bg-black/65 border border-white/65">
                                                {mon.dex}
                                            </span>
                                            <ImageFallback
                                                src={mon.getImage()}
                                                alt={mon.name}
                                                title={mon.name}
                                                width={160}
                                                height={160}
                                                className="invertIgnore w-18 h-18 md:w-24 md:h-24 mx-auto"
                                            />
                                            <div className="invertIgnore text-center px-2 py-1 rounded-full bg-black/65 border border-white/65">
                                                {mon.name}
                                            </div>
                                        </td>
                                        <td className="invertIgnore flex flex-col justify-center gap-2 w-50 md:w-80 text-xs md:text-base">
                                            <TypeBadge
                                                key={mon.type1.id}
                                                element={TypeBadgeElementEnum.CAPSULE_ROW}
                                                types={[mon.type1, mon.type2]}
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {mon.abilities.map((a, i) => (
                                                    <AbilityCapsule key={i} ability={a} />
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {mon.tribes.map((t) => (
                                                    <TribeCapsule key={t.id} tribe={t} />
                                                ))}
                                            </div>
                                            <table className="border border-white/50">
                                                <thead>
                                                    <tr className="bg-gray-800 text-center">
                                                        <th className="p-1">HP</th>
                                                        <th>Atk</th>
                                                        <th>Def</th>
                                                        <th>SpA</th>
                                                        <th>SpD</th>
                                                        <th>Spe</th>
                                                        <th>BST</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="bg-gray-700 text-center">
                                                        <td>{mon.stats.hp}</td>
                                                        <td>{mon.stats.attack}</td>
                                                        <td>{mon.stats.defense}</td>
                                                        <td>{mon.stats.spatk}</td>
                                                        <td>{mon.stats.spdef}</td>
                                                        <td>{mon.stats.speed}</td>
                                                        <td>{mon.BST()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="mx-auto mt-2 divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <TableHeader>
                                        <></>
                                    </TableHeader>
                                    <TableHeader>#</TableHeader>
                                    <TableHeader>Name</TableHeader>
                                    <TableHeader>Type(s)</TableHeader>
                                    <TableHeader>Abilities</TableHeader>
                                    <TableHeader>Tribes</TableHeader>
                                    <TableHeader>HP</TableHeader>
                                    <TableHeader>Atk</TableHeader>
                                    <TableHeader>Def</TableHeader>
                                    <TableHeader>SpA</TableHeader>
                                    <TableHeader>SpD</TableHeader>
                                    <TableHeader>Spe</TableHeader>
                                    <TableHeader>BST</TableHeader>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredPokemon.map((pokemon) => (
                                    <tr
                                        key={pokemon.id}
                                        onClick={() => updateSelectedPokemon(pokemon)}
                                        className={`cursor-pointer ${getTypeGradient(pokemon)}`}
                                    >
                                        <TableCell>
                                            <ImageFallback
                                                src={pokemon.getImage()}
                                                alt={pokemon.name}
                                                title={pokemon.name}
                                                width={160}
                                                height={160}
                                                className="rounded-full invertIgnore w-22 h-22"
                                            />
                                        </TableCell>
                                        <TableCell>{pokemon.dex}</TableCell>
                                        <TableCell>{pokemon.name}</TableCell>
                                        <td className="invertIgnore ">
                                            <TypeBadge
                                                key={pokemon.type1.id}
                                                element={TypeBadgeElementEnum.CAPSULE_STACK}
                                                types={[pokemon.type1, pokemon.type2]}
                                            />
                                        </td>
                                        <TableCell>
                                            {pokemon.abilities.map((a) => (
                                                <div key={a.id}>{a.name}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            {pokemon.tribes.map((t) => (
                                                <div key={t.id}>{t.name}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell>{pokemon.stats.hp}</TableCell>
                                        <TableCell>{pokemon.stats.attack}</TableCell>
                                        <TableCell>{pokemon.stats.defense}</TableCell>
                                        <TableCell>{pokemon.stats.spatk}</TableCell>
                                        <TableCell>{pokemon.stats.spdef}</TableCell>
                                        <TableCell>{pokemon.stats.speed}</TableCell>
                                        <TableCell>{pokemon.BST()}</TableCell>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TabContent>
                <TabContent tab="Moves" activeTab={activeTab}>
                    <div className="w-175 mx-auto">
                        <MoveTable
                            moves={Object.values(TectonicData.moves).map((m) => [0, m])}
                            showLevel={false}
                            onMoveClick={handleMoveClick}
                        />
                    </div>
                </TabContent>
                <TabContent tab="Abilities" activeTab={activeTab}>
                    <div>
                        {filterableAbilities.map((group, index) => (
                            <div key={index} className="flex flex-wrap justify-center gap-2 my-2">
                                {group.map((a) => (
                                    <FilterOptionButton
                                        key={a.label}
                                        onClick={() => setAbilityTableFilter(abilityTableFilter === a ? undefined : a)}
                                        isSelected={abilityTableFilter === a}
                                    >
                                        {a.label}
                                    </FilterOptionButton>
                                ))}
                            </div>
                        ))}
                    </div>
                    <table className="mx-auto">
                        <thead className="bg-gray-800">
                            <tr>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Effect</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(TectonicData.abilities)
                                .filter((a) => (abilityTableFilter ? abilityTableFilter.filter(a) : true))
                                .map((a) => (
                                    <tr
                                        key={a.id}
                                        onClick={() => handleAbilityClick(a)}
                                        className={`hover:bg-blue-900 cursor-pointer`}
                                    >
                                        <TableCell>{a.name}</TableCell>
                                        <TableCell>{a.description}</TableCell>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </TabContent>
                <TabContent tab="Items" activeTab={activeTab}>
                    <div className="overflow-x-auto">
                        <table className="mx-auto">
                            <thead className="bg-gray-800">
                                <tr>
                                    <TableHeader>
                                        <FilterOptionButton
                                            isSelected={itemFilter == "Held"}
                                            padding="px-2 py-1"
                                            onClick={() => setItemFilter(itemFilter === "Held" ? undefined : "Held")}
                                        >
                                            Item{itemFilter === "Held" ? " (held)" : ""}
                                        </FilterOptionButton>
                                    </TableHeader>
                                    <TableHeader>Effect</TableHeader>
                                    <TableHeader>
                                        <FilterOptionButton
                                            isSelected={itemFilter == "Wild"}
                                            padding="px-2 py-1"
                                            onClick={() => setItemFilter(itemFilter === "Wild" ? undefined : "Wild")}
                                        >
                                            Wild Pokemon
                                        </FilterOptionButton>
                                    </TableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {itemDisplayData
                                    .filter((i) =>
                                        itemFilter === "Held"
                                            ? i.item.isHeldItem // i don't have the energy to test if this breaks anything, but we already load held items in TectonicData as an array
                                            : itemFilter == "Wild"
                                            ? i.wildMons.length > 0
                                            : true
                                    )
                                    .map((i) => (
                                        <tr
                                            key={i.item.id}
                                            onClick={() => (i.wildMons.length > 0 ? handleItemClick(i.item) : () => {})}
                                            className={`hover:bg-blue-900 ${
                                                i.wildMons.length > 0 ? "cursor-pointer" : "cursor-text"
                                            }`}
                                        >
                                            <td>
                                                <div className="flex flex-col justify-center items-center gap-2 text-center text-white">
                                                    <ImageFallback
                                                        src={i.item.image}
                                                        alt={i.item.name}
                                                        title={i.item.name}
                                                        width={48}
                                                        height={48}
                                                    />
                                                    {i.item.name}
                                                </div>
                                            </td>
                                            <TableCell>{i.item.description}</TableCell>
                                            <TableCell>
                                                <div className="w-50 whitespace-break-spaces">
                                                    {i.wildMons.map((x) => `${x.mon.name} - ${x.chance}%`).join("\n")}
                                                </div>
                                            </TableCell>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </TabContent>
                <TabContent tab="Tribes" activeTab={activeTab}>
                    <table className="mx-auto">
                        <thead className="bg-gray-800">
                            <tr>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Effect</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(TectonicData.tribes).map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => handleTribeClick(t)}
                                    className="hover:bg-blue-900 cursor-pointer"
                                >
                                    <TableCell>{t.name}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TabContent>
                <TabContent tab="Type Chart" activeTab={activeTab}>
                    <table className="mx-auto border border-gray-700 bg-gray-800">
                        <thead>
                            <tr onClick={() => setTypeChartAtkDualType(undefined)}>
                                {typeChartAtkDualType ? (
                                    <TypeBadge
                                        types={[typeChartAtkDualType]}
                                        element={TypeBadgeElementEnum.TABLE_HEADER}
                                    />
                                ) : (
                                    <th className="text-xs text-gray-300 whitespace-nowrap">
                                        Def ⇒
                                        <br />
                                        Atk ↴
                                    </th>
                                )}

                                {TectonicData.realTypes.map((def) => (
                                    <TypeBadge key={def.id} element={TypeBadgeElementEnum.TABLE_HEADER} types={[def]} />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TectonicData.realTypes.map((atk) => (
                                <tr
                                    key={atk.id}
                                    className={`${getTypeColorClass(atk, "hover:bg")} cursor-pointer`}
                                    onClick={() =>
                                        setTypeChartAtkDualType(typeChartAtkDualType == atk ? undefined : atk)
                                    }
                                >
                                    <TypeBadge element={TypeBadgeElementEnum.TABLE_ROW} types={[atk]} />
                                    {TectonicData.realTypes.map((def) => (
                                        <TypeChartCell
                                            key={def.index}
                                            atk={typeChartAtkDualType ?? atk}
                                            def={def}
                                            def2={typeChartAtkDualType ? atk : undefined}
                                        />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TabContent>

                {selectedPokemon && (
                    <PokemonModal pokemon={selectedPokemon} handlePokemonClick={updateSelectedPokemon} />
                )}
            </main>
        </div>
    );
};

const Home: NextPage = () => {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-xl">Loading...</div>
                </div>
            }
        >
            <HomeContent />
        </Suspense>
    );
};

export default Home;
