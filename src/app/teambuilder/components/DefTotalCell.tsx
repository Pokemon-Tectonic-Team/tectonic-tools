import { PokemonType } from "@/app/data/tectonic/PokemonType";
import { calcTypeMatchup } from "@/app/data/typeChart";
import { PartyPokemon } from "@/app/data/types/PartyPokemon";

export enum CompareEnum {
    Weak,
    Resist,
    Immune,
}

function calcCompare(num: number, compare: CompareEnum): boolean {
    switch (compare) {
        case CompareEnum.Weak:
            return num > 1;
        case CompareEnum.Resist:
            return num < 1 && num != 0;
        case CompareEnum.Immune:
            return num == 0;
    }
}

export default function DefTotalCell({
    cards,
    type,
    compare,
}: {
    cards: PartyPokemon[];
    type: PokemonType;
    compare: CompareEnum;
}): React.ReactNode {
    const num = cards.filter((c) =>
        calcCompare(
            calcTypeMatchup({ type: type }, { type1: c.types.type1, type2: c.types.type2, abilities: c.getActiveAbilities() }),
            compare
        )
    ).length;

    return <td className="border border-gray-600 text-lg text-white text-center font-bold">{num > 0 ? num : ""}</td>;
}
