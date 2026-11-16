const GOLDEN_GAMMA = -7046029254386353131n;
const MIX_1 = -4658895280553007687n;
const MIX_2 = -7723592293110705685n;

function ushr64(value: bigint, shift: bigint): bigint {
  return BigInt.asUintN(64, value) >> shift;
}

export class DeterministicRandom {
  public state: bigint;

  constructor(initialState: bigint | string | number) {
    this.state = BigInt.asIntN(64, BigInt(initialState));
  }

  nextLong(): bigint {
    this.state = BigInt.asIntN(64, this.state + GOLDEN_GAMMA);
    let z = this.state;
    z = BigInt.asIntN(64, (z ^ ushr64(z, 30n)) * MIX_1);
    z = BigInt.asIntN(64, (z ^ ushr64(z, 27n)) * MIX_2);
    return BigInt.asIntN(64, z ^ ushr64(z, 31n));
  }

  nextInt(bound: number): number {
    if (bound <= 0) throw new Error('bound must be positive');
    const val = ushr64(this.nextLong(), 1n) % BigInt(bound);
    return Number(val);
  }
}
