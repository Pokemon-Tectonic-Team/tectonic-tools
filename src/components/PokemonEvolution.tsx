import { Pokemon } from "@/app/data/tectonic/Pokemon";
import { TectonicData } from "@/app/data/tectonic/TectonicData";
import { NTreeNode } from "@/app/data/types/NTreeNode";
import { PokemonEvolutionTerms } from "@/app/data/loadedDataClasses";
import ImageFallback from "./ImageFallback";

interface PokemonEvolutionProps {
    node: NTreeNode<PokemonEvolutionTerms>;
    index: number;
    onClick: (evo: Pokemon) => void;
}

class EvolutionDisplay {
    text: string;
    itemImg: string | null;

    constructor(text: string, itemImg: string | null = null) {
        this.text = text;
        this.itemImg = itemImg;
    }
}

const PokemonEvolution: React.FC<PokemonEvolutionProps> = ({ node, onClick }) => {
    function getEvoDisplay(evo: PokemonEvolutionTerms): EvolutionDisplay {
        switch (evo.method) {
            case "Level":
            case "Ninjask":
                return new EvolutionDisplay(`At level ${evo.condition}`);
            case "LevelMale":
                return new EvolutionDisplay(`At level ${evo.condition} if it's male`);
            case "LevelFemale":
                return new EvolutionDisplay(`At level ${evo.condition} if it's female`);
            case "LevelDay":
                return new EvolutionDisplay(`At level ${evo.condition} during the day`);
            case "LevelNight":
                return new EvolutionDisplay(`At level ${evo.condition} during nighttime`);
            case "LevelRain":
                return new EvolutionDisplay(`At level ${evo.condition} while raining`);
            case "LevelDarkInParty":
                return new EvolutionDisplay(`At level ${evo.condition} while a dark type is in the party`);
            case "AttackGreater":
                return new EvolutionDisplay(`At level ${evo.condition} if it has more attack than defense`);
            case "AtkDefEqual":
                return new EvolutionDisplay(`At level ${evo.condition} if it has attack equal to defense`);
            case "DefenseGreater":
                return new EvolutionDisplay(`At level ${evo.condition} if it has more defense than attack`);
            case "Silcoon":
                return new EvolutionDisplay(`At level ${evo.condition} half of the time`);
            case "Cascoon":
                return new EvolutionDisplay(`At level ${evo.condition} the other half of the time`);
            case "Ability0":
                return new EvolutionDisplay(`At level ${evo.condition} if it has its first ability`);
            case "Ability1":
                return new EvolutionDisplay(`At level ${evo.condition} if it has its second ability`);
            case "Happiness":
                return new EvolutionDisplay("Case leveled up while it has high happiness");
            case "MaxHappiness":
                return new EvolutionDisplay("Case leveled up while it has maximum happiness");
            case "Beauty":
                return new EvolutionDisplay("Case leveled up while it has maximum beauty");
            case "HasMove":
                return new EvolutionDisplay(
                    `Case leveled up while it knows the move ${TectonicData.moves[evo.condition].name}`
                );
            case "HasMoveType":
                return new EvolutionDisplay(`Case leveled up while it knows a move of the ${evo.condition} type`);
            case "Location":
                return new EvolutionDisplay("Case leveled up near a special location");
            case "Item":
                return new EvolutionDisplay(`${TectonicData.items[evo.condition].name}`, evo.condition);
            case "ItemMale":
                return new EvolutionDisplay(
                    `By using a ${TectonicData.items[evo.condition].name} if it's male`,
                    evo.condition
                );
            case "ItemFemale":
                return new EvolutionDisplay(
                    `By using a ${TectonicData.items[evo.condition].name} if it's female`,
                    evo.condition
                );
            case "Trade":
                return new EvolutionDisplay("Case traded");
            case "TradeItem":
                return new EvolutionDisplay(
                    `Case traded holding an ${TectonicData.items[evo.condition].name}`,
                    evo.condition
                );
            case "HasInParty":
                return new EvolutionDisplay(
                    `Case leveled up while a ${TectonicData.pokemon[evo.condition]} is also in the party`
                );
            case "Shedinja":
                return new EvolutionDisplay("Also if you have an empty Poké Ball and party slot");
            case "Originize":
                return new EvolutionDisplay(`At level ${evo.condition} via Origin Ore`, "ORIGINORE");
            default:
                return new EvolutionDisplay("Via a method the programmer was too lazy to describe");
        }
    }

    const evoDisplay = getEvoDisplay(node.getData());
    return (
        <>
            {node.isRoot() ? (
                <></>
            ) : (
                <div className="text-center">
                    <div>{node.isRoot() ? "" : "➡"}</div>
                    {evoDisplay.itemImg == null ? (
                        <></>
                    ) : (
                        <ImageFallback
                            src={TectonicData.items[evoDisplay.itemImg].image}
                            alt={evoDisplay.itemImg}
                            width={48}
                            height={48}
                            className="size-9 mr-1 inline"
                        />
                    )}
                    <span>{evoDisplay.text}</span>
                </div>
            )}
            <div
                className="text-center hover:bg-blue-900 cursor-pointer"
                onClick={() => onClick(TectonicData.pokemon[node.getData().pokemon])}
            >
                <ImageFallback
                    src={TectonicData.pokemon[node.getData().pokemon].getImage()}
                    alt={node.getData().pokemon}
                    width={160}
                    height={160}
                    className="w-24 h-24"
                />
                <span>{TectonicData.pokemon[node.getData().pokemon].name}</span>
            </div>
        </>
    );
};
export default PokemonEvolution;
