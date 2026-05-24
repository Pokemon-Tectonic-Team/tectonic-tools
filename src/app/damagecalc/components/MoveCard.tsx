import { BattleState } from "@/app/data/battleState";
import { Move } from "@/app/data/tectonic/Move";
import { PartyPokemon } from "@/app/data/types/PartyPokemon";
import Checkbox from "@/components/Checkbox";
import { getTypeColorClass } from "@/components/colours";
import ImageFallback from "@/components/ImageFallback";
import TypeBadge, { TypeBadgeElementEnum } from "@/components/TypeBadge";
import { getColourClassForMult, getEffectiveMessageForMult, getTextColourForMult } from "@/components/TypeChartCell";
import { Fragment, ReactNode, useEffect, useState } from "react";
import { calculateDamage } from "../damageCalc";

export interface MoveData {
    move: Move;
    customVar: unknown;
    criticalHit: boolean;
}

export interface MoveCardProps {
    moveData: MoveData;
    user: PartyPokemon;
    target: PartyPokemon;
    battleState: BattleState;
}

export default function MoveCard(props: MoveCardProps): ReactNode {
    const [crit, setCrit] = useState<boolean>(props.target.volatileStatusEffects.Jinx || props.moveData.criticalHit);
    const [customInput, setCustomInput] = useState<unknown>(props.moveData.customVar);

    const result = calculateDamage(props.moveData, props.user, props.target, props.battleState);
    useEffect(() => {
        setCrit(props.target.volatileStatusEffects.Jinx || props.moveData.criticalHit);
    }, [props]);

    function getDmgNode() {
        if (result.minTotal && result.minPercentage && result.maxTotal && result.maxPercentage) {
            return (
                <Fragment>
                    <span>
                        Dmg: {result.minTotal}-{result.maxTotal} ({result.damage})
                    </span>
                    <span>
                        {(result.minPercentage * 100).toFixed(2)} - {(result.maxPercentage * 100).toFixed(2)}%
                    </span>
                </Fragment>
            );
        } else {
            return (
                <Fragment>
                    <span>Dmg: {result.damage}</span>
                    <span>{(result.percentage * 100).toFixed(2)}%</span>
                </Fragment>
            );
        }
    }

    function getCustomVarInput(): ReactNode {
        if (props.moveData.move.customVarType === "number") {
            if (customInput === undefined) {
                setCustomInput(0);
                props.moveData.customVar = 0;
            }
            return (
                <div className="flex text-center">
                    {props.moveData.move.customVarName}
                    <input
                        type="number"
                        className="w-11 focus:ring-blue-500 focus:border-blue-500 text-center"
                        value={customInput as number}
                        onChange={(e) => {
                            const value = e.target.value == "" ? 0 : parseInt(e.target.value);

                            setCustomInput(value);
                            props.moveData.customVar = value;
                        }}
                    />
                </div>
            );
        }
        if (props.moveData.move.customVarType === "boolean") {
            if (customInput === undefined) {
                setCustomInput(false);
                props.moveData.customVar = false;
            }
            return (
                <Checkbox
                    checked={customInput as boolean}
                    onChange={() => {
                        const value = !(customInput as boolean);

                        setCustomInput(value);
                        props.moveData.customVar = value;
                    }}
                >
                    {props.moveData.move.customVarName}
                </Checkbox>
            );
        }
        return <span>Input for type {customInput === "number"} not yet implemented.</span>;
    }

    return (
        <div className="flex flex-col items-center w-100 bg-gray-700 rounded-2xl border-1 border-white/50">
            <div
                className={`flex w-full justify-between items-center p-1 rounded-2xl ${getTypeColorClass(
                    props.moveData.move.getType(props.user, props.battleState),
                    "bg",
                    "bg"
                )} ${props.moveData.move.isSTAB(props.user) ? "font-bold" : ""} ${
                    props.moveData.move.isSignature ? "text-yellow-300" : ""
                }`}
                title={props.moveData.move.description}
            >
                <div className="flex items-center gap-1">
                    <TypeBadge
                        types={[props.moveData.move.getType(props.user, props.battleState)]}
                        element={TypeBadgeElementEnum.ICONS}
                    />
                    <ImageFallback
                        src={Move.getMoveCategoryImgSrc(
                            props.moveData.move.getDamageCategory(props.moveData, props.user, props.target)
                        )}
                        alt={props.moveData.move.category}
                        title={props.moveData.move.category}
                        height={60}
                        width={51}
                        className="w-8 h-8"
                    />
                    {props.moveData.move.name}
                </div>
                <div
                    className={`p-1 whitespace-nowrap rounded-xl border-1 border-white/50 ${getColourClassForMult(
                        result.typeEffectMult,
                        "bg-gray-500"
                    )} ${getTextColourForMult(result.typeEffectMult)}`}
                >
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center w-full gap-1 text-sm">
                            {props.moveData.move.needsInput && getCustomVarInput()}
                            <div>
                                <span>Crit</span>
                                <input
                                    type="checkbox"
                                    checked={crit}
                                    className="form-checkbox ml-1"
                                    disabled={props.target.volatileStatusEffects.Jinx}
                                    onChange={() => {
                                        setCrit(!crit);
                                        props.moveData.criticalHit = !crit;
                                    }}
                                />
                            </div>
                        </div>
                        <span className="text-xl font-bold">| KO: {result.hits}</span>
                    </div>
                    <div className="text-sm text-center font-normal">
                        {getEffectiveMessageForMult(result.typeEffectMult)}
                    </div>
                </div>
            </div>
            <div className="flex w-full justify-between px-2 m-1">
                <div className="flex flex-col">
                    <span>{`Power: ${props.moveData.move.getPower(
                        props.user,
                        props.target,
                        props.battleState,
                        props.moveData.customVar
                    )}`}</span>
                    <span>{`Accuracy: ${props.moveData.move.accuracy}%`}</span>
                </div>
                <div className="flex flex-col">
                    <span>{`Priority: ${props.moveData.move.priority ?? "None"}`}</span>
                    <span>{`Flags: ${props.moveData.move.getDisplayFlags(", ")}`}</span>
                </div>
                <div
                    className={`flex flex-col items-end px-2 rounded-xl border-1 border-white/50 ${getColourClassForMult(
                        result.typeEffectMult,
                        "bg-gray-500"
                    )} ${getTextColourForMult(result.typeEffectMult)}`}
                >
                    {getDmgNode()}
                </div>
            </div>
            <hr className="w-full text-blue-500/75" />
            <div className="mx-2">{props.moveData.move.description}</div>
        </div>
    );
}
