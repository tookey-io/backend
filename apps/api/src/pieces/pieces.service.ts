import { Injectable } from '@nestjs/common';
import { Piece, PieceRepository } from '@tookey/database';
import { PieceDto } from './pieces.dto';
import { Equal, IsNull, LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { inc, coerce, minVersion } from 'semver';

function findSearchOperation(version: string) {
  try {
    const coerced = coerce(version).raw as string;
    const min = minVersion(version).raw as string;
    const max = version.startsWith('^')
      ? increaseMajorVersion(coerced)
      : version.startsWith('~')
      ? increaseMinorVersion(coerced)
      : version;
    console.log({
      version,
      coerced,
      min,
      max,
    });
    if (version.startsWith('^')) {
      return [MoreThanOrEqual(min), LessThan(increaseMajorVersion(coerced))];
    }
    if (version.startsWith('~')) {
      return [MoreThanOrEqual(min), LessThan(increaseMinorVersion(coerced))];
    }
    return [Equal(version)];
  } catch (e) {
    return undefined;
  }
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

function increaseMinorVersion(version: string): string {
  const incrementedVersion = inc(version, 'minor');
  if (isNil(incrementedVersion)) {
    throw new Error(`Failed to increase minor version ${version}`);
  }
  return incrementedVersion;
}

function increaseMajorVersion(version: string): string {
  const incrementedVersion = inc(version, 'major');
  if (isNil(incrementedVersion)) {
    throw new Error(`Failed to increase major version ${version}`);
  }
  return incrementedVersion;
}

@Injectable()
export class PiecesService {
  constructor(private readonly repository: PieceRepository) {}

  createPiece(dto: Omit<PieceDto, 'id'>): Promise<Piece> {
    return this.repository.save(dto);
  }

  getAllPieces(release: string, summary: boolean = true): Promise<Piece[]> {
    const order = {
      name: 'ASC',
      version: 'DESC',
    } as const;
    return this.repository
      .createQueryBuilder()
      .where({
        minimumSupportedRelease: LessThanOrEqual(release),
        maximumSupportedRelease: MoreThanOrEqual(release),
      })
      .distinctOn(['name'])
      .orderBy(order)
      .getMany()
      .then((pieces) => {
        if (summary) {
          return pieces.map((p) => ({
            ...p,
            actions: Object.keys(p.actions).length,
            triggers: Object.keys(p.triggers).length,
          }));
        } else {
          return pieces;
        }
      });
  }

  getPiece(name: string, version?: string) {
    const findVersions = isNil(version) ? undefined : findSearchOperation(version);
    const query = this.repository.createQueryBuilder().where({ name });

    if (!isNil(findVersions)) {
      findVersions.forEach((version) => query.andWhere({ version }));
    }

    return query
      .distinctOn(['name'])
      .orderBy({
        name: 'ASC',
        version: 'DESC',
      } as const)
      .getOne()
  }
}
