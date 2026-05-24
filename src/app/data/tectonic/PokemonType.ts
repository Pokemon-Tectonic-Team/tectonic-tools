import { LoadedType } from "@/app/data/loadedDataClasses";

export class PokemonType {
    id: string = "";
    index: number = 0;
    name: string = "";
    weaknesses: string = "";
    resistances: string = "";
    immunities: string = "";
    isRealType: boolean = false;

    static NULL: PokemonType = new PokemonType();

    constructor(loaded?: LoadedType) {
        if (!loaded) return;

        this.id = loaded.key;
        this.index = loaded.index;
        this.name = loaded.name;
        this.weaknesses = loaded.weaknesses;
        this.resistances = loaded.resistances;
        this.immunities = loaded.immunities;
        this.isRealType = loaded.isRealType;
    }
}
