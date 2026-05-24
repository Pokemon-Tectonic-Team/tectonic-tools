function styleValueMult(level: number): number {
    return 2.0 + level / 50.0;
}

const STAT_STEP_BOUND = 12;
const STEP_MULTIPLIERS = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
const STEP_DIVISORS = [8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

function statMultiplierAtStep(step: number): number {
    if (step < -STAT_STEP_BOUND || step > STAT_STEP_BOUND) {
        throw new Error(
            `Given stat step value ${step} is not valid! Must be between -${STAT_STEP_BOUND} and ${STAT_STEP_BOUND}, inclusive.`
        );
    }
    const shiftedStep = step + STAT_STEP_BOUND;
    const mult = STEP_MULTIPLIERS[shiftedStep] / STEP_DIVISORS[shiftedStep];
    return mult;
}

export function calculateHP(base: number, level: number, sv: number, stylish: boolean = false, accumulation: boolean = false): number {
    if (base === 1) return 1; // For Shedinja
    const pseudoDivisor = accumulation ? 1.0 : 2.0;
    const pseudoLevel = 15.0 + level / pseudoDivisor;
    const stylishMult = stylish ? 2.0 : 1.0;
    return Math.floor(
        ((base * 2.0 + sv * styleValueMult(level) * stylishMult) * pseudoLevel) / 100.0 + pseudoLevel + 10.0
    );
}

export function calculateStat(
    base: number,
    level: number,
    sv: number,
    statSteps: number = 0,
    stylish: boolean = false,
    accumulation: boolean = false
): number {
    const pseudoDivisor = accumulation ? 1.0 : 2.0;
    const pseudoLevel = 15.0 + level / pseudoDivisor;
    const stylishMult = stylish ? 2.0 : 1.0;
    
    const normalStat = Math.floor(
        ((base * 2.0 + sv * styleValueMult(level) * stylishMult) * pseudoLevel) / 100.0 + 5.0
    );
    const stepMult = statMultiplierAtStep(statSteps);
    return Math.floor(normalStat * stepMult);
}
