import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Wallet } from "../../wallet/entities/wallet.entity";
import { ApiKey } from "../../api-keys/entities/api-key.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, name: "google_id" })
  google_id: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  api_keys: ApiKey[];
}
