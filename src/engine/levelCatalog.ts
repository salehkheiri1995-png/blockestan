import rawCatalog from '../data/levels.json';
import { hydrateLevel, LevelCatalogFile, LevelDefinition } from './levelModels';

const catalog = rawCatalog as unknown as LevelCatalogFile;

const hydratedLevels: LevelDefinition[] = [...catalog.levels]
  .sort((a, b) => a.id - b.id)
  .map(hydrateLevel);

const byIdMap = new Map<number, LevelDefinition>(hydratedLevels.map((l) => [l.id, l]));

export const LevelCatalog = {
  levels: hydratedLevels,
  byId(id: number): LevelDefinition | undefined {
    return byIdMap.get(id);
  },
};
