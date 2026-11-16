import { GameBalanceConfig } from './balance';

const FNV_OFFSET_BASIS = -0x340d631b7bdddcdbn;
const FNV_PRIME = 0x100000001b3n;
const MIX_1 = -4658895280553007687n;
const MIX_2 = -7723592293110705685n;

function ushr64(value: bigint, shift: bigint): bigint {
  return BigInt.asUintN(64, value) >> shift;
}

export const DailySeed = {
  seedForDay(dayKey: string): string {
    const input = `blockestan-daily-v${GameBalanceConfig.DAILY_ALGORITHM_VERSION}-${dayKey}`;
    let hash = BigInt.asIntN(64, FNV_OFFSET_BASIS);
    for (let i = 0; i < input.length; i++) {
      hash = BigInt.asIntN(64, hash ^ BigInt(input.charCodeAt(i)));
      hash = BigInt.asIntN(64, hash * FNV_PRIME);
    }
    let z = hash;
    z = BigInt.asIntN(64, (z ^ ushr64(z, 30n)) * MIX_1);
    z = BigInt.asIntN(64, (z ^ ushr64(z, 27n)) * MIX_2);
    return BigInt.asIntN(64, z ^ ushr64(z, 31n)).toString();
  },
};
