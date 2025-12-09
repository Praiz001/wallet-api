import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/auth.entity";
import { Transaction } from "./transaction.entity";

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @Column({ unique: true, length: 13, name: "wallet_number" })
  wallet_number: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  balance: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
