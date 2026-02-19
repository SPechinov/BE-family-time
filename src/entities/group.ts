import { UUID } from 'node:crypto';

export class GroupEntity {
  readonly #id: UUID;
  readonly #name: string;
  readonly #description?: string;
  readonly #createdAt: Date;
  readonly #deleted: boolean;
  readonly #deletedAt?: Date;

  constructor(props: {
    id: UUID;
    name: string;
    description?: string;
    createdAt: Date;
    deleted: boolean;
    deletedAt?: Date;
  }) {
    this.#id = props.id;
    this.#name = props.name;
    this.#description = props.description;
    this.#createdAt = props.createdAt;
    this.#deleted = props.deleted;
    this.#deletedAt = props.deletedAt;
  }

  get id(): UUID {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get description(): string | undefined {
    return this.#description;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get deleted(): boolean {
    return this.#deleted;
  }

  get deletedAt(): Date | undefined {
    return this.#deletedAt;
  }
}
