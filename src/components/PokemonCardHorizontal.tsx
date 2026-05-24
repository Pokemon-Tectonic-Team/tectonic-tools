"use client";

import { TwoItemAbility } from "@/app/data/abilities/TwoItemAbility";
import { nullBattleState } from "@/app/data/battleState";
import { StatusEffect, statusEffects, volatileStatusEffects } from "@/app/data/conditions";
import { FragileLocketItem } from "@/app/data/items/FragileLocketItem";
import { TypeChangingItem } from "@/app/data/items/TypeChangingItem";
import {
    MAX_LEVEL,
    MAX_SP,
    MAX_STEP,
    MIN_LEVEL,
    MIN_SP,
    MIN_STEP,
    STYLE_POINT_CAP,
    styleFromStat,
} from "@/app/data/teamExport";
import { Item } from "@/app/data/tectonic/Item";
import { Move } from "@/app/data/tectonic/Move";
import { blankStats, Pokemon, Stat, Stats, StylePoints, zeroStylePoints } from "@/app/data/tectonic/Pokemon";
import { TectonicData } from "@/app/data/tectonic/TectonicData";
import { PartyPokemon } from "@/app/data/types/PartyPokemon";
import { isNull, negativeMod, safeKeys } from "@/app/data/util";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import Checkbox from "./Checkbox";
import { getTypeColorClass } from "./colours";
import Dropdown from "./DropDown";
import ImageFallback from "./ImageFallback";
import LeftRightCycleButtons from "./LeftRightCycleButtons";
import PokemonModal from "./PokemonModal";
import CloseXButton from "./svg_icons/CloseXButton";
import TribeCapsule from "./TribeCapsule";
import TypeBadge, { TypeBadgeElementEnum } from "./TypeBadge";

const stylePointPresets: Record<string, StylePoints> = {
    Custom: zeroStylePoints,
    Flat: { hp: 10, attacks: 10, speed: 10, defense: 10, spdef: 10 },
    "Fast Atk": { hp: 10, attacks: 20, speed: 20, defense: 0, spdef: 0 },
    "Bulk Atk": { hp: 20, attacks: 20, speed: 10, defense: 0, spdef: 0 },
    "Phys Tank": { hp: 10, attacks: 20, speed: 0, defense: 20, spdef: 0 },
    "Sp Tank": { hp: 10, attacks: 20, speed: 0, defense: 0, spdef: 20 },
    "Phys Wall": { hp: 20, attacks: 0, speed: 0, defense: 20, spdef: 10 },
    "Sp Wall": { hp: 20, attacks: 0, speed: 0, defense: 10, spdef: 20 },
};

export default function PokemonCardHorizontal({
    partyMon,
    onRemove,
    onUpdate,
    showBattleConfig = false,
}: {
    partyMon: PartyPokemon;
    onRemove: () => void;
    onUpdate: () => void;
    showBattleConfig?: boolean;
}) {
    const [modalMon, setModalMon] = useState<Pokemon | null>(null);
    const [moveIndex, setMoveIndex] = useState<number | null>(null);
    const [stylePreset, setStylePreset] = useState<string>("");
    const [statusEffect, setStatusEffect] = useState<StatusEffect>(partyMon.statusEffect ?? "None");

    useEffect(() => {
        // For some reason the status dropdown just refuses to update when changing mons unless it's wrapped in state and a useEffect
        setStatusEffect(partyMon.statusEffect ?? "None");
    }, [partyMon]);

    const getStylePresetCallback = useCallback(getStylePresetFromPartyMonSP, [partyMon]);
    useEffect(() => {
        setStylePreset(getStylePresetCallback());
    }, [partyMon, getStylePresetCallback]);

    function showInfoModal() {
        setMoveIndex(null);
        setModalMon(partyMon.species);
    }

    function showMoveModal(i: number) {
        setMoveIndex(i);
        setModalMon(partyMon.species);
    }

    function onMoveSelected(m: Move) {
        partyMon.moves[moveIndex!] = m;
        onUpdate();
        setMoveIndex(null);
        setModalMon(null);
    }

    function onSpUpdate(k: keyof Stats, e: ChangeEvent<HTMLInputElement>) {
        partyMon.stylePoints = {
            ...partyMon.stylePoints,
            [styleFromStat(k)]: e.target.value == "" ? 0 : parseInt(e.target.value),
        };

        setStylePreset(getStylePresetFromPartyMonSP());
        onUpdate();
    }

    function spDiffFromTotal(sp: StylePoints): number {
        return STYLE_POINT_CAP - Object.values(sp).reduce((total, x) => total + x, 0);
    }

    function getStylePresetFromPartyMonSP(): string {
        for (const preset in stylePointPresets) {
            const p = stylePointPresets[preset];
            const m = partyMon.stylePoints;

            // Do not use JSON stringify as since this is an interface it can be in a different order
            if (
                p.hp == m.hp &&
                p.attacks == m.attacks &&
                p.speed == m.speed &&
                p.defense == m.defense &&
                p.spdef == m.spdef
            ) {
                return preset;
            }
        }

        return "Custom";
    }

    function updateStatSteps(stat: Stat, value: number) {
        if (value >= MIN_STEP && value <= MAX_STEP) {
            partyMon.statSteps = { ...partyMon.statSteps, [stat]: value };
            onUpdate();
        }
    }

    return (
        <div className="w-fit h-fit m-1 rounded-lg p-1.5 text-white bg-gray-800 border-white/50 border-1">
            <div className="flex justify-between ml-1">
                <LeftRightCycleButtons
                    buttonsVisible={partyMon.species.forms.length > 0}
                    onPrevClick={() => {
                        partyMon.form = negativeMod(partyMon.form - 1, partyMon.species.forms.length);
                        onUpdate();
                    }}
                    onNextClick={() => {
                        partyMon.form = (partyMon.form + 1) % partyMon.species.forms.length;
                        onUpdate();
                    }}
                >
                    <span onClick={showInfoModal} className="text-xl cursor-pointer">{`${partyMon.species.name} ${
                        partyMon.nickname ?? partyMon.species.getFormName(partyMon.form)
                            ? `(${partyMon.species.getFormName(partyMon.form)})`
                            : ""
                    }`}</span>
                </LeftRightCycleButtons>
                <div className="flex justify-center space-x-2 text-sm">
                    {partyMon.species.tribes.map((t) => (
                        <TribeCapsule key={t.id} tribe={t} />
                    ))}
                </div>
                <CloseXButton className="-mt-3 -mr-1" onClick={onRemove} />
            </div>

            <table className="table-fixed mt-1">
                <tbody>
                    <tr>
                        <td className="cursor-pointer" onClick={showInfoModal}>
                            <div className="flex flex-col space-y-1 w-25 h-46">
                                <ImageFallback
                                    alt={partyMon.species.name}
                                    src={partyMon.species.getImage(partyMon.form)}
                                    width={160}
                                    height={160}
                                    className="w-25 h-25"
                                />
                                <TypeBadge
                                    types={[partyMon.types.type1, partyMon.types.type2]}
                                    element={TypeBadgeElementEnum.CAPSULE_STACK}
                                />
                            </div>
                        </td>
                        <td>
                            <div className="flex flex-col justify-center gap-1 ml-2 w-45 h-42 text-sm">
                                <Dropdown
                                    value={partyMon.ability.id}
                                    onChange={(e) => {
                                        partyMon.ability = TectonicData.abilities[e.target.value];
                                        onUpdate();
                                    }}
                                    title={partyMon.ability.description}
                                >
                                    {partyMon.species.getAbilities(partyMon.form).map((a) => (
                                        <option key={a.id} value={a.id} title={a.description}>
                                            {a.name}
                                        </option>
                                    ))}
                                </Dropdown>

                                {partyMon.items.some((i) => i instanceof FragileLocketItem) &&
                                    partyMon.getSecondaryAbility() && (
                                        <div
                                            className="text-sm text-gray-300 px-2 py-1 bg-gray-700 rounded select-none cursor-default text-center"
                                            title={partyMon.getSecondaryAbility()!.description}
                                        >
                                            + {partyMon.getSecondaryAbility()!.name}
                                        </div>
                                    )}

                                {Array.from({ length: partyMon.ability instanceof TwoItemAbility ? 2 : 1 }).map(
                                    (_, i) => (
                                        <div key={i}>
                                            <div className="flex items-center space-x-2">
                                                <Dropdown
                                                    value={partyMon.items[i].id}
                                                    onChange={(e) => {
                                                        partyMon.items[i] =
                                                            TectonicData.items[e.target.value] ?? Item.NULL;
                                                        onUpdate();
                                                    }}
                                                    title={partyMon.items[i].description}
                                                >
                                                    <option value="">Select Item</option>
                                                    {partyMon.legalItems(i).map((i) => (
                                                        <option key={i.id} value={i.id} title={i.description}>
                                                            {i.name}
                                                        </option>
                                                    ))}
                                                </Dropdown>
                                                {!isNull(partyMon.items[i]) && (
                                                    <ImageFallback
                                                        alt={partyMon.items[i].name}
                                                        src={partyMon.items[i].image}
                                                        title={partyMon.items[i].description}
                                                        width={48}
                                                        height={48}
                                                        className="w-8 h-8"
                                                    />
                                                )}
                                            </div>
                                            {partyMon.items[i] instanceof TypeChangingItem &&
                                                partyMon.items[i].canChangeType(partyMon) && (
                                                    <div className="flex items-center space-x-2">
                                                        <Dropdown
                                                            value={partyMon.itemType.id}
                                                            onChange={(e) => {
                                                                partyMon.itemType = TectonicData.types[e.target.value];
                                                                onUpdate();
                                                            }}
                                                        >
                                                            {Object.values(TectonicData.realTypes).map((t) => (
                                                                <option key={t.id} value={t.id}>
                                                                    {t.name}
                                                                </option>
                                                            ))}
                                                        </Dropdown>
                                                        <TypeBadge
                                                            types={[partyMon.itemType]}
                                                            element={TypeBadgeElementEnum.ICONS}
                                                        />
                                                    </div>
                                                )}
                                        </div>
                                    )
                                )}
                            </div>
                        </td>
                        <td>
                            <div className="grid grid-rows-4 ml-2 space-y-1 w-40 text-sm">
                                {partyMon.moves.map((m, i) => {
                                    if (m == Move.NULL) {
                                        return (
                                            <div
                                                key={i}
                                                className="flex flex-col justify-center items-center h-10 bg-gray-700 cursor-pointer hover:bg-gray-500"
                                                onClick={() => showMoveModal(i)}
                                            >
                                                <span>+ Add Move </span>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div
                                                key={i}
                                                className={`flex flex-col justify-center items-center h-10 cursor-pointer hover:bg-gray-500 border border-white/35 ${getTypeColorClass(
                                                    m.getType(partyMon, nullBattleState),
                                                    "bg",
                                                    "bg"
                                                )}`}
                                                onClick={() => {
                                                    partyMon.moves[i] = Move.NULL;
                                                    onUpdate();
                                                }}
                                                title={m.description}
                                            >
                                                <div className="flex w-full items-center space-x-1.5 ml-2">
                                                    <div className="flex justify-center space-x-1">
                                                        <TypeBadge
                                                            types={[m.getType(partyMon, nullBattleState)]}
                                                            element={TypeBadgeElementEnum.ICONS}
                                                        />
                                                        <ImageFallback
                                                            src={m.getCategoryImgSrc()}
                                                            alt={m.category}
                                                            title={m.category}
                                                            height={60}
                                                            width={51}
                                                            className="w-8 h-8"
                                                        />
                                                    </div>
                                                    <span className="overflow-hidden text-ellipsis">{m.name}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="table-fixed text-center text-white">
                <thead>
                    <tr className="bg-blue-900">
                        <th>Lvl</th>
                        <th>HP</th>
                        <th>Atk</th>
                        <th>Sp.A</th>
                        <th>Spe</th>
                        <th>Def</th>
                        <th>Sp.D</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-gray-900">
                        <td
                            className={`${
                                partyMon.level > MAX_LEVEL || partyMon.level < MIN_LEVEL
                                    ? "text-value-out-of-range"
                                    : ""
                            }`}
                        >
                            <input
                                className="w-36 text-center"
                                value={partyMon.level}
                                onChange={(e) => {
                                    partyMon.level = e.target.value == "" ? 0 : parseInt(e.target.value);
                                    onUpdate();
                                }}
                            />
                        </td>
                        {safeKeys(partyMon.getBaseStats()).map((k) => (
                            <td key={k} className="text-center">
                                {Math.round(partyMon.getStats()[k])}
                            </td>
                        ))}
                    </tr>
                    <tr className="bg-emerald-700">
                        <td
                            className={`bg-emerald-800 cursor-pointer ${
                                spDiffFromTotal(partyMon.stylePoints) < 0 ? "text-value-out-of-range" : ""
                            }`}
                        >
                            <select
                                className="w-23 mr-1 text-center"
                                value={stylePreset}
                                onChange={(e) => {
                                    const preset = e.target.value;
                                    setStylePreset(preset);

                                    partyMon.stylePoints = {
                                        ...stylePointPresets[preset],
                                    };
                                    onUpdate();
                                }}
                            >
                                {Object.keys(stylePointPresets).map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                            <span
                                className="pr-1"
                                onClick={() => {
                                    setStylePreset("Custom");
                                    partyMon.stylePoints = zeroStylePoints;
                                    onUpdate();
                                }}
                            >
                                SP {spDiffFromTotal(partyMon.stylePoints)}
                            </span>
                        </td>
                        {safeKeys(partyMon.getBaseStats()).map((k) => (
                            <td key={k}>
                                <input
                                    className={`w-13 text-center ${
                                        partyMon.stylePoints[styleFromStat(k)] < MIN_SP ||
                                        partyMon.stylePoints[styleFromStat(k)] > MAX_SP
                                            ? "text-value-out-of-range"
                                            : ""
                                    }`}
                                    value={partyMon.stylePoints[styleFromStat(k)]}
                                    onChange={(e) => onSpUpdate(k, e)}
                                />
                            </td>
                        ))}
                    </tr>
                    {showBattleConfig && (
                        <tr className="bg-fuchsia-700">
                            <td
                                className="bg-fuchsia-800 cursor-pointer"
                                onClick={() => {
                                    partyMon.statSteps = blankStats;
                                    onUpdate();
                                }}
                            >
                                Steps
                            </td>
                            <td></td>
                            {safeKeys(partyMon.getBaseStats())
                                .filter((k) => k != "hp")
                                .map((k) => (
                                    <td key={k}>
                                        <input
                                            type="number"
                                            className="w-13 text-center"
                                            min={MIN_STEP}
                                            max={MAX_STEP}
                                            value={partyMon.statSteps[k]}
                                            onChange={(e) => updateStatSteps(k, parseInt(e.target.value))}
                                        />
                                    </td>
                                ))}
                        </tr>
                    )}
                </tbody>
            </table>

            {showBattleConfig && (
                <div className="flex gap-2 mt-2">
                    <Dropdown
                        value={statusEffect}
                        onChange={(e) => {
                            partyMon.statusEffect = e.target.value as StatusEffect;
                            setStatusEffect(partyMon.statusEffect);
                            onUpdate();
                        }}
                    >
                        <option value="None" className="bg-gray-800">
                            Status Effect
                        </option>
                        {Object.values(statusEffects).map((s) => (
                            <option key={s} value={s} className="bg-gray-800">
                                {s}
                            </option>
                        ))}
                    </Dropdown>
                    {volatileStatusEffects.map((k) => (
                        <Checkbox
                            key={k}
                            checked={partyMon.volatileStatusEffects[k]}
                            onChange={() => {
                                partyMon.volatileStatusEffects[k] = !partyMon.volatileStatusEffects[k];
                                onUpdate();
                            }}
                        >
                            {k}
                        </Checkbox>
                    ))}
                </div>
            )}

            {modalMon && (
                <PokemonModal
                    pokemon={modalMon}
                    moveSelector={moveIndex != null ? onMoveSelected : null}
                    handlePokemonClick={setModalMon}
                    initialForm={partyMon.form}
                />
            )}
        </div>
    );
}
