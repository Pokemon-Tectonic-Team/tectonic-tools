import { LoadedItem } from "@/app/data/loadedDataClasses";
import { Item } from "../tectonic/Item";
import { PartyPokemon } from "../types/PartyPokemon";

const typeChangingItems: Record<string, [string, string] | undefined> = {
    CRYSTALVEIL: undefined,
    PRISMATICPLATE: ["ARCEUS", "MULTITYPE"],
    MEMORYSET: ["SILVALLY", "RKSSYSTEM"],
};

// type is stored in state of relevant pages
export class TypeChangingItem extends Item {
    requiredPokemon: [string, string] | undefined;

    constructor(item: LoadedItem) {
        super(item);
        this.requiredPokemon = typeChangingItems[item.key];
    }

    public canChangeType(pokemon: PartyPokemon): boolean {
        return (
            this.requiredPokemon === undefined ||
            (pokemon.species.id === this.requiredPokemon[0] && pokemon.ability.id === this.requiredPokemon[1])
        );
    }

    static itemIds = Object.keys(typeChangingItems);
}
