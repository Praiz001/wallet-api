import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Wallet } from "./wallet.entity";

export enum TransactionType {
  DEPOSIT = "deposit",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "wallet_id" })
  wallet_id: string;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
  })
  amount: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
  })
  status: TransactionStatus;

  @Column({ unique: true })
  reference: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: "wallet_id" })
  wallet: Wallet;
}
