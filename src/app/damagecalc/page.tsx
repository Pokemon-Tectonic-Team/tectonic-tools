"use client";

import BasicButton from "@/components/BasicButton";
import Checkbox from "@/components/Checkbox";
import Column from "@/components/Column";
import ColumnHeader from "@/components/ColumnHeader";
import FilterOptionButton from "@/components/FilterOptionButton";
import ImageFallback from "@/components/ImageFallback";
import { MiniDexFilter } from "@/components/MiniDexFilter";
import PageHeader, { PageType } from "@/components/PageHeader";
import PokemonCardHorizontal from "@/components/PokemonCardHorizontal";
import PokemonModal from "@/components/PokemonModal";
import SavedTeamManager from "@/components/SavedTeamManager";
import type { NextPage } from "next";
import Head from "next/head";
import { Fragment, useEffect, useState } from "react";
import { CancelWeatherAbility } from "../data/abilities/CancelWeatherAbility";
import { BattleState, nullSideState, SideState } from "../data/battleState";
import { WeatherCondition, weatherConditions } from "../data/conditions";
import { Pokemon } from "../data/tectonic/Pokemon";
import { TectonicData } from "../data/tectonic/TectonicData";
import { Trainer } from "../data/tectonic/Trainer";
import { PartyPokemon } from "../data/types/PartyPokemon";
import MoveCard, { MoveData } from "./components/MoveCard";
import SideStateUI from "./components/SideStateUI";

enum SpeedOrderEnum {
    NoDisplay,
    Player,
    Opponent,
    Tie,
}

const sortedTrainers = Object.values(TectonicData.trainers).sort(
    (a, b) => Math.max(...a.pokemon.map((x) => x.level)) - Math.max(...b.pokemon.map((x) => x.level)),
);

const PokemonDamageCalculator: NextPage = () => {
    const [showTeamLoad, setShowTeamLoad] = useState<boolean>(true);
    const [showTrainerLoad, setShowTrainerLoad] = useState<boolean>(true);
    const [showTeamSearch, setShowTeamSearch] = useState<boolean>(false);
    const [showOpponentSearch, setShowOpponentSearch] = useState<boolean>(false);
    const [loadedParty, setLoadedParty] = useState<PartyPokemon[]>([]);
    const [loadedOpponentParty, setLoadedOpponentParty] = useState<PartyPokemon[]>([]);
    const [trainerText, setTrainerText] = useState<string>("");
    const [trainer, setTrainer] = useState<Trainer>(Trainer.NULL);
    const [playerMon, setPlayerMon] = useState<PartyPokemon | null>(null);
    const [opponentMon, setOpponentMon] = useState<PartyPokemon | null>(null);
    const [modalMon, setModalMon] = useState<Pokemon | null>(null);
    const [weather, setWeather] = useState<WeatherCondition>("None");
    const [gravity, setGravity] = useState<boolean>(false);
    const [multiBattle, setMultiBattle] = useState<boolean>(false);
    const [playerSideState, setPlayerSideState] = useState<SideState>(nullSideState);
    const [opponentSideState, setOpponentSideState] = useState<SideState>(nullSideState);
    const [playerMoveData, setPlayerMoveData] = useState<MoveData[]>([]);
    const [opponentMoveData, setOpponentMoveData] = useState<MoveData[]>([]);

    const playerSpeed = playerMon?.getStats(undefined, undefined).speed;
    const oppSpeed = opponentMon?.getStats(undefined, undefined).speed;
    const speedOrder =
        !playerSpeed || !oppSpeed
            ? SpeedOrderEnum.NoDisplay
            : playerSpeed == oppSpeed
              ? SpeedOrderEnum.Tie
              : playerSpeed > oppSpeed
                ? SpeedOrderEnum.Player
                : SpeedOrderEnum.Opponent;

    const matchingTrainers = sortedTrainers.filter((x) =>
        x.displayName().toLowerCase().includes(trainerText.toLowerCase()),
    );

    function getBattleState(sideState: SideState): BattleState {
        const cancelWeather =
            playerMon?.ability instanceof CancelWeatherAbility || opponentMon?.ability instanceof CancelWeatherAbility;

        return {
            multiBattle: multiBattle,
            gravity: gravity,
            weather: cancelWeather ? "None" : weather,
            sideState,
        };
    }

    function handleMonUpdate(
        currentMon: PartyPokemon,
        party: PartyPokemon[],
        setMon: (mon: PartyPokemon) => void,
        setParty: (party: PartyPokemon[]) => void,
    ) {
        const newMon = new PartyPokemon(currentMon);
        const oldIndex = party.findIndex((x) => x == currentMon);
        const newParty = [...party];
        if (oldIndex == -1 && newParty.length < 6) {
            // Mon not yet in party and there's room — add it
            newParty.push(newMon);
        } else if (oldIndex > -1) {
            // Mon already in party — replace its entry to reflect changes made via the card
            newParty[oldIndex] = newMon;
        }
        // else: party is full and mon isn't in it; don't modify the party
        setMon(newMon);
        setParty(newParty);
    }

    useEffect(() => {
        function genMoveDataWithCarryOver(mon: PartyPokemon | null, moveData: MoveData[]): MoveData[] {
            return mon
                ? mon.moves
                      .filter((x) => x.isAttackingMove())
                      .map((x) => {
                          const oldMoveData = moveData.find((old) => old.move.id == x.id);
                          return {
                              move: x,
                              customVar: oldMoveData?.customVar,
                              criticalHit: oldMoveData?.criticalHit ?? false,
                          };
                      })
                : [];
        }

        setPlayerMoveData(genMoveDataWithCarryOver(playerMon, playerMoveData));
        setOpponentMoveData(genMoveDataWithCarryOver(opponentMon, opponentMoveData));
    }, [playerMon, opponentMon]); // eslint-disable-line react-hooks/exhaustive-deps -- We specifically don't want MoveData as a dep as that is an infinite loop.

    return (
        <div className="min-h-screen bg-gray-900 pb-5">
            <Head>
                <title>Pokémon Tectonic Damage Calculator</title>
                <meta
                    name="description"
                    content="A damage calculator using the modified mechanics of Pokémon Tectonic"
                />
            </Head>
            <PageHeader currentPage={PageType.Calc} />

            <main className="mx-auto mt-2 ">
                <Column>
                    <ColumnHeader colour="text-purple-400">Battle State</ColumnHeader>
                    <div className="flex items-center gap-2">
                        <select
                            className="px-4 py-2 rounded-md bg-gray-700 border border-gray-600"
                            value={weather}
                            onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                        >
                            <option value="None">Select Weather</option>
                            {weatherConditions.map((w) => (
                                <option key={w} value={w}>
                                    {w}
                                </option>
                            ))}
                        </select>
                        <Checkbox checked={gravity} onChange={() => setGravity(!gravity)}>
                            Gravity
                        </Checkbox>
                        <Checkbox checked={multiBattle} onChange={() => setMultiBattle(!multiBattle)}>
                            Multi Battle
                        </Checkbox>
                    </div>
                </Column>
                <div className="flex justify-center">
                    <Column>
                        <ColumnHeader colour="text-blue-400">Your Side</ColumnHeader>
                        <SideStateUI onUpdate={setPlayerSideState} />

                        {playerMon != null && (
                            <Fragment>
                                <PokemonCardHorizontal
                                    partyMon={playerMon}
                                    onUpdate={() =>
                                        handleMonUpdate(playerMon, loadedParty, setPlayerMon, setLoadedParty)
                                    }
                                    onRemove={() => {
                                        setLoadedParty(loadedParty.filter((r) => r != playerMon));
                                        setPlayerMon(null);
                                    }}
                                    showBattleConfig={true}
                                />
                                {speedOrder != SpeedOrderEnum.NoDisplay && (
                                    <div className="my-2 text-2xl text-white text-shadow-sm/50 font-bold px-2 rounded-xl bg-blue-500">
                                        {speedOrder == SpeedOrderEnum.Tie
                                            ? "Speed Tie"
                                            : `Moves ${speedOrder == SpeedOrderEnum.Player ? "First" : "Last"}`}
                                    </div>
                                )}
                                {opponentMon && (
                                    <div className="grid grid-rows-auto grid-cols-2 gap-2 mt-1">
                                        {playerMoveData
                                            .map((x) => {
                                                return {
                                                    moveData: x,
                                                    user: playerMon,
                                                    target: opponentMon,
                                                    battleState: getBattleState(opponentSideState),
                                                };
                                            })
                                            .map((x, i) => (
                                                <MoveCard key={i} {...x} />
                                            ))}
                                    </div>
                                )}
                            </Fragment>
                        )}
                        {playerMon != null &&
                            loadedParty.find((x) => x == playerMon) == undefined &&
                            loadedParty.length < 6 && (
                                <BasicButton
                                    onClick={() => {
                                        if (loadedParty.length < 6) {
                                            setLoadedParty([...loadedParty, playerMon]);
                                        }
                                    }}
                                >
                                    Add To Team
                                </BasicButton>
                            )}
                        <div className="w-fit h-fit overflow-auto mx-auto">
                            <div className="flex flex-wrap items-center mx-auto">
                                {loadedParty.map((x, index) => (
                                    <ImageFallback
                                        key={`${x.species.id}-${index}`}
                                        className="hover:bg-yellow-highlight cursor-pointer"
                                        src={x.species.getIcon()}
                                        alt={x.species.name}
                                        width={64}
                                        height={64}
                                        title={x.species.name}
                                        onClick={() => setPlayerMon(x)}
                                        onContextMenu={() => setModalMon(x.species)}
                                    />
                                ))}
                            </div>
                        </div>

                        <hr className="w-full my-3" />
                        <div className="flex gap-2">
                            <FilterOptionButton
                                isSelected={showTeamSearch}
                                onClick={() => {
                                    setShowTeamSearch(!showTeamSearch);
                                    setShowTeamLoad(false);
                                }}
                            >
                                Dex Search
                            </FilterOptionButton>
                            <FilterOptionButton
                                isSelected={showTeamLoad}
                                onClick={() => {
                                    setShowTeamSearch(false);
                                    setShowTeamLoad(!showTeamLoad);
                                }}
                            >
                                Team
                            </FilterOptionButton>
                        </div>
                        {showTeamSearch && (
                            <MiniDexFilter onMon={(mon) => setPlayerMon(new PartyPokemon({ species: mon }))} />
                        )}
                        {showTeamLoad && (
                            <SavedTeamManager
                                onLoad={(party) => {
                                    setLoadedParty(party);
                                    setPlayerMon(null);
                                }}
                                exportMons={loadedParty}
                            />
                        )}
                    </Column>

                    <Column>
                        <ColumnHeader colour="text-red-400">Opponent Side</ColumnHeader>
                        <SideStateUI onUpdate={setOpponentSideState} />

                        {opponentMon != null && (
                            <Fragment>
                                <PokemonCardHorizontal
                                    partyMon={opponentMon}
                                    onUpdate={() =>
                                        handleMonUpdate(
                                            opponentMon,
                                            loadedOpponentParty,
                                            setOpponentMon,
                                            setLoadedOpponentParty,
                                        )
                                    }
                                    onRemove={() => {
                                        setLoadedOpponentParty(loadedOpponentParty.filter((r) => r != opponentMon));
                                        setOpponentMon(null);
                                    }}
                                    showBattleConfig={true}
                                />
                                {speedOrder != SpeedOrderEnum.NoDisplay && (
                                    <div className="my-2 text-2xl text-white text-shadow-sm/50 font-bold px-2 rounded-xl bg-blue-500">
                                        {speedOrder == SpeedOrderEnum.Tie
                                            ? "Speed Tie"
                                            : `Moves ${speedOrder == SpeedOrderEnum.Opponent ? "First" : "Last"}`}
                                    </div>
                                )}
                                {playerMon && (
                                    <div className="grid grid-rows-auto grid-cols-2 gap-2 mt-1">
                                        {opponentMoveData
                                            .map((x) => {
                                                return {
                                                    moveData: x,
                                                    user: opponentMon,
                                                    target: playerMon,
                                                    battleState: getBattleState(playerSideState),
                                                };
                                            })
                                            .map((x, i) => (
                                                <MoveCard key={i} {...x} />
                                            ))}
                                    </div>
                                )}
                            </Fragment>
                        )}
                        {opponentMon != null &&
                            loadedOpponentParty.find((x) => x == opponentMon) == undefined &&
                            loadedOpponentParty.length < 6 && (
                                <BasicButton
                                    onClick={() => {
                                        if (loadedOpponentParty.length < 6) {
                                            setLoadedOpponentParty([...loadedOpponentParty, opponentMon]);
                                        }
                                    }}
                                >
                                    Add To Team
                                </BasicButton>
                            )}
                        <div className="w-fit h-fit overflow-auto mx-auto">
                            <div className="flex flex-wrap items-center mx-auto">
                                {loadedOpponentParty.map((x, index) => (
                                    <ImageFallback
                                        key={`${x.species.id}-${index}`}
                                        className="hover:bg-yellow-highlight cursor-pointer"
                                        src={x.species.getIcon()}
                                        alt={x.species.name}
                                        width={64}
                                        height={64}
                                        title={x.species.name}
                                        onClick={() => setOpponentMon(x)}
                                        onContextMenu={() => setModalMon(x.species)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="w-fit h-fit overflow-auto mx-auto">
                            <div className="flex flex-wrap items-center mx-auto">
                                {trainer != Trainer.NULL && (
                                    <div className="flex items-center">
                                        <ImageFallback
                                            src={trainer.getImageSrc()}
                                            alt={trainer.displayName()}
                                            title={trainer.displayName()}
                                            height={160}
                                            width={160}
                                            className="w-16 h-16 hover:bg-yellow-highlight cursor-pointer"
                                            onClick={() => setTrainer(Trainer.NULL)}
                                        />
                                        <span className="text-sm max-w-56 mt-4 text-center">
                                            {trainer.displayName()}
                                        </span>
                                    </div>
                                )}
                                {trainer.pokemon.map((x, index) => (
                                    <ImageFallback
                                        key={`${x.pokemon.id}-${index}`}
                                        className={`hover:bg-yellow-highlight cursor-pointer`}
                                        src={x.pokemon.getIcon()}
                                        alt={x.pokemon.name}
                                        width={64}
                                        height={64}
                                        title={x.nickname ?? x.pokemon.name}
                                        onClick={() =>
                                            setOpponentMon(
                                                new PartyPokemon({
                                                    species: x.pokemon,
                                                    level: x.level,
                                                    stylePoints: x.sp,
                                                    moves: [...x.moves],
                                                    items: [...x.items],
                                                    itemType: x.itemType,
                                                    ability: x.ability,
                                                    nickname: x.nickname,
                                                }),
                                            )
                                        }
                                        onContextMenu={() => setModalMon(x.pokemon)}
                                    />
                                ))}
                            </div>
                        </div>

                        <hr className="w-full my-3" />
                        <div className="flex items-center gap-2">
                            <FilterOptionButton
                                isSelected={showOpponentSearch}
                                onClick={() => {
                                    setShowOpponentSearch(!showOpponentSearch);
                                    setShowTrainerLoad(false);
                                }}
                            >
                                Dex Search
                            </FilterOptionButton>
                            <FilterOptionButton
                                isSelected={showTrainerLoad}
                                onClick={() => {
                                    setShowOpponentSearch(false);
                                    setShowTrainerLoad(!showTrainerLoad);
                                }}
                            >
                                Trainers
                            </FilterOptionButton>
                        </div>
                        {showTrainerLoad && (
                            <div className="flex flex-col items-center mt-2 text-white">
                                <input
                                    className="h-fit border rounded px-2 py-1 bg-gray-700 border-gray-600"
                                    value={trainerText}
                                    onChange={(e) => setTrainerText(e.target.value)}
                                    placeholder="In game trainer"
                                />
                                <div className="h-72 overflow-auto mx-auto mt-2">
                                    <div className="flex flex-wrap mx-auto">
                                        {matchingTrainers.map((x) => (
                                            <div
                                                key={x.id}
                                                className="flex flex-col items-center w-24"
                                                onClick={() => {
                                                    setTrainer(x);
                                                    setOpponentMon(null);
                                                }}
                                            >
                                                <ImageFallback
                                                    src={x.getImageSrc()}
                                                    alt={x.displayName()}
                                                    title={x.displayName()}
                                                    height={160}
                                                    width={160}
                                                    className={`w-18 h-18 hover:bg-yellow-highlight cursor-pointer ${
                                                        trainer == x ? "bg-yellow-highlight" : ""
                                                    }`}
                                                />
                                                <span className="text-sm text-center">{x.displayName()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {showOpponentSearch && (
                            <MiniDexFilter onMon={(mon) => setOpponentMon(new PartyPokemon({ species: mon }))} />
                        )}
                    </Column>
                </div>

                {modalMon && <PokemonModal pokemon={modalMon} handlePokemonClick={setModalMon} />}
            </main>
        </div>
    );
};

export default PokemonDamageCalculator;
